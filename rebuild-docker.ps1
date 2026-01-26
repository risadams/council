#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Rebuild and restart Docker containers for Clarity Council MCP

.DESCRIPTION
    This script stops running containers, rebuilds the Docker image,
    and starts fresh containers.

.EXAMPLE
    .\rebuild-docker.ps1
#>

param(
    [switch]$NoCache,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$VerbosePreference = if ($Verbose) { "Continue" } else { "SilentlyContinue" }

Write-Host "🔄 Clarity Council Docker Rebuild" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Stop containers
Write-Host "`n📦 Stopping containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: docker-compose down failed" -ForegroundColor Yellow
}

# Remove old images (optional)
Write-Host "`n🗑️  Removing old images..." -ForegroundColor Yellow
$image = docker images | Select-String "clarity-council"
if ($image) {
    docker rmi "clarity-council-mcp" -f | Out-Null
    Write-Host "✓ Old image removed" -ForegroundColor Green
}

# Build
Write-Host "`n🔨 Building Docker image..." -ForegroundColor Yellow
$buildArgs = @("build")
if ($NoCache) {
    $buildArgs += "--no-cache"
}
docker-compose $buildArgs
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build complete" -ForegroundColor Green

# Start containers
Write-Host "`n🚀 Starting containers..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Containers started" -ForegroundColor Green

# Wait for health check
Write-Host "`n⏳ Waiting for server to be healthy..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$healthy = $false

while ($attempt -lt $maxAttempts -and -not $healthy) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method GET -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $healthy = $true
            Write-Host "✓ Server is healthy" -ForegroundColor Green
        }
    } catch {
        Write-Host "." -NoNewline
    }
}

if (-not $healthy) {
    Write-Host "`n⚠️  Warning: Server did not respond after 60 seconds" -ForegroundColor Yellow
    Write-Host "   Check logs with: docker-compose logs" -ForegroundColor Yellow
} else {
    Write-Host "`n✅ Clarity Council is ready!" -ForegroundColor Green
    Write-Host "   HTTP:  http://localhost:8080" -ForegroundColor Cyan
    Write-Host "   HTTPS: https://localhost:8000" -ForegroundColor Cyan
    Write-Host "`n📝 View logs: docker-compose logs -f" -ForegroundColor Gray
}
