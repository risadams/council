#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Rebuild, retag, and restart the Clarity Council Docker stack with MCP catalog import.

.DESCRIPTION
    Stops containers, rebuilds the image, retags it for Docker Desktop MCP (catalog/server),
    restarts the stack, waits for health, and optionally imports/enables the MCP server entry.

.EXAMPLE
    .\rebuild-docker.ps1 -ImageTag "risadams/clarity-council:1.0.0"
#>

param(
    [switch]$NoCache,
    [switch]$Verbose,
    [switch]$SkipMcp,
    [string]$ImageTag = "risadams/clarity-council:1.0.0",
    [string]$ServerName = "clarity-council",
    [string]$CatalogName = "clarity-council"
)

$ErrorActionPreference = "Stop"
$VerbosePreference = if ($Verbose) { "Continue" } else { "SilentlyContinue" }

$repoRoot = Split-Path -Parent $PSCommandPath
$serverYamlPath = Join-Path $repoRoot "servers/clarity-council/server.yaml"
$defaultProject = Split-Path -Leaf $repoRoot

function Get-ComposeInvoker {
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        return @{ Name = "docker-compose"; Invoke = { param([string[]]$CommandArgs) & docker-compose @CommandArgs } }
    }

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker CLI not found. Install Docker Desktop before running this script."
    }

    return @{ Name = "docker compose"; Invoke = { param([string[]]$CommandArgs) & docker compose @CommandArgs } }
}

$compose = Get-ComposeInvoker
Write-Host "== Clarity Council Docker Rebuild ==" -ForegroundColor Cyan
Write-Host "Using compose command: $($compose.Name)" -ForegroundColor DarkGray
Write-Host "Image tag target: $ImageTag" -ForegroundColor DarkGray

Write-Host "`n[1/6] Stopping containers..." -ForegroundColor Yellow
& $compose.Invoke @("down", "--remove-orphans")
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: compose down reported errors (continuing)" -ForegroundColor Yellow
}

Write-Host "`n[2/6] Removing old images..." -ForegroundColor Yellow
$candidateImages = @(
    $ImageTag,
    "clarity-council:latest",
    "clarity-council-mcp",
    "$defaultProject-clarity-council",
    "${defaultProject}_clarity-council"
)

foreach ($tag in $candidateImages | Select-Object -Unique | Where-Object { $_ -and (docker images -q $_) }) {
    docker image rm -f $tag | Out-Null
    Write-Host "Removed $tag" -ForegroundColor DarkGray
}

Write-Host "`n[3/6] Building Docker image..." -ForegroundColor Yellow
$buildArgs = @("build")
if ($NoCache) { $buildArgs += "--no-cache" }
& $compose.Invoke $buildArgs
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed" -ForegroundColor Red
    exit 1
}

$composeImages = (& $compose.Invoke @("config", "--images") 2>$null) | Where-Object { $_ }
$sourceImage = $composeImages | Where-Object { $_ -match "clarity-council" } | Select-Object -First 1
if (-not $sourceImage) { $sourceImage = "$defaultProject-clarity-council" }

if (docker images -q $sourceImage) {
    docker tag $sourceImage $ImageTag
    docker tag $sourceImage "clarity-council:latest"
    Write-Host "Retagged $sourceImage -> $ImageTag" -ForegroundColor Green
    Write-Host "Retagged $sourceImage -> clarity-council:latest" -ForegroundColor Green
} else {
    Write-Host "Warning: could not find built image '$sourceImage' to retag." -ForegroundColor Yellow
}

Write-Host "`n[4/6] Starting containers..." -ForegroundColor Yellow
& $compose.Invoke @("up", "-d", "--force-recreate")
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start containers" -ForegroundColor Red
    exit 1
}

Write-Host "`n[5/6] Waiting for server health (http://localhost:8080/health)..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$healthy = $false

while ($attempt -lt $maxAttempts -and -not $healthy) {
    Start-Sleep -Seconds 2
    $attempt++

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -Method GET -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $healthy = $true
            Write-Host "Health check passed on attempt $attempt" -ForegroundColor Green
        }
    } catch {
        Write-Host "." -NoNewline
    }
}

if (-not $healthy) {
    Write-Host "`nWarning: server did not respond healthy within 60 seconds." -ForegroundColor Yellow
    Write-Host "Check logs with: $($compose.Name) logs" -ForegroundColor Yellow
} else {
    Write-Host "Server is healthy." -ForegroundColor Green
}

if (-not $SkipMcp) {
    Write-Host "`n[6/6] Importing MCP catalog entry and enabling server..." -ForegroundColor Yellow
    $mcpAvailable = $false
    try {
        & docker @("mcp", "--help") *> $null
        if ($LASTEXITCODE -eq 0) { $mcpAvailable = $true }
    } catch {
        $mcpAvailable = $false
    }

    if ($mcpAvailable -and (Test-Path $serverYamlPath)) {
        # Ensure catalog exists
        $catalogs = @()
        try {
            $catalogs = (& docker @("mcp", "catalog", "ls") 2>$null) | Where-Object { $_ }
        } catch {
            $catalogs = @()
        }
        $catalogExists = $catalogs -and ($catalogs -match "^${CatalogName}:\s")
        if (-not $catalogExists) {
            & docker @("mcp", "catalog", "create", $CatalogName)
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Catalog created: $CatalogName" -ForegroundColor Green
            }
        }

        # Add/overwrite server entry into catalog
        & docker @("mcp", "catalog", "add", $CatalogName, $ServerName, $serverYamlPath, "--force")
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Catalog entry added: $CatalogName/$ServerName" -ForegroundColor Green
        } else {
            Write-Host "Warning: catalog add failed (check Docker Desktop MCP support)." -ForegroundColor Yellow
        }

        # Enable server
        & docker @("mcp", "server", "enable", $ServerName)
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Server enabled in MCP: $ServerName" -ForegroundColor Green
        } else {
            Write-Host "Warning: server enable failed. Check 'docker mcp catalog show $CatalogName' then enable manually with 'docker mcp server enable $ServerName'." -ForegroundColor Yellow
        }
    } elseif (-not $mcpAvailable) {
        Write-Host "MCP CLI not available. Skipping catalog import. (Install Docker Desktop with MCP Toolkit.)" -ForegroundColor Yellow
    } else {
        Write-Host "Catalog file not found: $serverYamlPath" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[6/6] Skipping MCP catalog/server steps (SkipMcp requested)." -ForegroundColor Yellow
}

Write-Host "`nClarity Council is ready." -ForegroundColor Cyan
Write-Host "HTTP:  http://localhost:8080" -ForegroundColor Cyan
Write-Host "HTTPS: https://localhost:8000" -ForegroundColor Cyan
Write-Host "Logs:  $($compose.Name) logs -f" -ForegroundColor DarkGray
