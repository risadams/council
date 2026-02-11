#!/bin/bash
set -euo pipefail

##
# Rebuild, retag, and restart the Clarity Council Docker stack with MCP catalog import.
#
# Stops containers, rebuilds the image, retags it for Docker Desktop MCP (catalog/server),
# restarts the stack, waits for health, and optionally imports/enables the MCP server entry.
#
# Usage:
#   ./rebuild-docker.sh [OPTIONS]
#
# Options:
#   --no-cache           Build without using cache
#   --verbose            Enable verbose output
#   --skip-mcp           Skip MCP catalog/server steps
#   --skip-client        Skip Docker MCP client connection
#   --image-tag TAG      Docker image tag (default: risadams/clarity-council:1.0.0)
#   --server-name NAME   MCP server name (default: clarity-council)
#   --catalog-name NAME  MCP catalog name (default: risadams)
##

# Configuration
NO_CACHE=false
VERBOSE=false
SKIP_MCP=false
SKIP_CLIENT=false
IMAGE_TAG="risadams/clarity-council:1.0.0"
SERVER_NAME="clarity-council"
CATALOG_NAME="risadams"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --skip-mcp)
            SKIP_MCP=true
            shift
            ;;
        --skip-client)
            SKIP_CLIENT=true
            shift
            ;;
        --image-tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --server-name)
            SERVER_NAME="$2"
            shift 2
            ;;
        --catalog-name)
            CATALOG_NAME="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Determine repo root and paths
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_YAML_PATH="$REPO_ROOT/servers/clarity-council/server.yaml"
DEFAULT_PROJECT="$(basename "$REPO_ROOT")"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DARK_GRAY='\033[1;30m'
NC='\033[0m' # No Color

# Logging functions
log_header() {
    echo -e "${CYAN}$1${NC}"
}

log_step() {
    echo -e "\n${YELLOW}$1${NC}"
}

log_success() {
    echo -e "${GREEN}$1${NC}"
}

log_warning() {
    echo -e "${YELLOW}$1${NC}"
}

log_error() {
    echo -e "${RED}$1${NC}"
}

log_info() {
    echo -e "${DARK_GRAY}$1${NC}"
}

log_progress() {
    echo -n "."
}

# Determine compose command
get_compose_command() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    elif docker compose version &> /dev/null; then
        echo "docker compose"
    else
        log_error "Docker CLI not found. Install Docker Desktop before running this script."
        exit 1
    fi
}

COMPOSE_CMD=$(get_compose_command)

log_header "== Clarity Council Docker Rebuild =="
log_info "Using compose command: $COMPOSE_CMD"
log_info "Image tag target: $IMAGE_TAG"

# [1/6] Stop containers
log_step "[1/6] Stopping containers..."
if $COMPOSE_CMD down --remove-orphans 2>/dev/null || true; then
    :
else
    log_warning "Warning: compose down reported errors (continuing)"
fi

# [2/6] Remove old images
log_step "[2/6] Removing old images..."
CANDIDATE_IMAGES=(
    "$IMAGE_TAG"
    "clarity-council-mcp"
    "$DEFAULT_PROJECT-clarity-council"
    "${DEFAULT_PROJECT}_clarity-council"
)

for tag in "${CANDIDATE_IMAGES[@]}"; do
    if [[ -z "$tag" ]]; then continue; fi
    if docker images -q "$tag" &>/dev/null; then
        docker image rm -f "$tag" > /dev/null 2>&1 || true
        log_info "Removed $tag"
    fi
done

# [3/6] Build Docker image
log_step "[3/6] Building Docker image..."
BUILD_ARGS=("build")
if [[ "$NO_CACHE" == true ]]; then
    BUILD_ARGS+=("--no-cache")
fi
if ! $COMPOSE_CMD "${BUILD_ARGS[@]}"; then
    log_error "Docker build failed"
    exit 1
fi

# Determine source image and retag if needed
SOURCE_IMAGE=""
if SOURCE_IMAGES=$($COMPOSE_CMD config --images 2>/dev/null); then
    SOURCE_IMAGE=$(echo "$SOURCE_IMAGES" | grep -i "clarity-council" | head -1 || true)
fi
if [[ -z "$SOURCE_IMAGE" ]]; then
    SOURCE_IMAGE="$DEFAULT_PROJECT-clarity-council"
fi

if docker images -q "$SOURCE_IMAGE" &>/dev/null; then
    if [[ "$SOURCE_IMAGE" != "$IMAGE_TAG" ]]; then
        docker tag "$SOURCE_IMAGE" "$IMAGE_TAG"
        log_success "Retagged $SOURCE_IMAGE -> $IMAGE_TAG"
    else
        log_success "Image already tagged as $IMAGE_TAG"
    fi
else
    log_warning "Warning: could not find built image '$SOURCE_IMAGE' to retag."
fi

# [4/6] Start containers
log_step "[4/6] Starting containers..."
if ! $COMPOSE_CMD up -d --force-recreate; then
    log_error "Failed to start containers"
    exit 1
fi

# [5/6] Wait for health
log_step "[5/6] Waiting for server health (http://localhost:8080/health)..."
MAX_ATTEMPTS=30
ATTEMPT=0
HEALTHY=false

while [[ $ATTEMPT -lt $MAX_ATTEMPTS ]] && [[ "$HEALTHY" == false ]]; do
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))

    if response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/health" 2>/dev/null); then
        if [[ "$response" == "200" ]]; then
            HEALTHY=true
            log_success "Health check passed on attempt $ATTEMPT"
        fi
    else
        log_progress
    fi
done

if [[ "$HEALTHY" == false ]]; then
    log_warning "Warning: server did not respond healthy within 60 seconds."
    log_info "Check logs with: $COMPOSE_CMD logs"
else
    log_success "Server is healthy."
fi

# [6/6] MCP catalog import
if [[ "$SKIP_MCP" != true ]]; then
    log_step "[6/6] Importing MCP catalog entry and enabling server..."

    MCP_AVAILABLE=false
    if docker mcp --help &>/dev/null; then
        MCP_AVAILABLE=true
    fi

    if [[ "$MCP_AVAILABLE" == true ]] && [[ -f "$SERVER_YAML_PATH" ]]; then
        # Check if catalog exists
        CATALOG_EXISTS=false
        if catalogs=$(docker mcp catalog ls 2>/dev/null); then
            if echo "$catalogs" | grep -q "^${CATALOG_NAME}:"; then
                CATALOG_EXISTS=true
            fi
        fi

        if [[ "$CATALOG_EXISTS" != true ]]; then
            log_step "Creating catalog: $CATALOG_NAME"
            if docker mcp catalog create "$CATALOG_NAME"; then
                log_success "Catalog created: $CATALOG_NAME"
            else
                log_warning "Warning: failed to create catalog $CATALOG_NAME"
            fi
        else
            log_info "Catalog already exists: $CATALOG_NAME"
        fi

        # Add server to catalog
        log_step "Adding server to catalog: $CATALOG_NAME/$SERVER_NAME"
        if docker mcp catalog add "$CATALOG_NAME" "$SERVER_NAME" "$SERVER_YAML_PATH" --force; then
            log_success "Server added to catalog: $CATALOG_NAME/$SERVER_NAME"
        else
            log_error "Error: Failed to add server to catalog. Check 'docker mcp catalog show $CATALOG_NAME'"
        fi

        # Enable server
        log_step "Enabling server: $SERVER_NAME"
        if docker mcp server enable "$SERVER_NAME"; then
            log_success "Server enabled: $SERVER_NAME"
        else
            log_error "Error: Failed to enable server. Check 'docker mcp server ls' and enable manually with 'docker mcp server enable $SERVER_NAME'"
        fi

        # Connect client
        if [[ "$SKIP_CLIENT" != true ]]; then
            if docker mcp client connect vscode; then
                log_success "VS Code connected to Docker MCP Toolkit (restart VS Code if not detected)."
            else
                log_warning "Warning: failed to connect VS Code client. You can run: docker mcp client connect vscode"
            fi
        fi
    elif [[ "$MCP_AVAILABLE" != true ]]; then
        log_warning "MCP CLI not available. Skipping catalog import. (Install Docker Desktop with MCP Toolkit.)"
    else
        log_warning "Catalog file not found: $SERVER_YAML_PATH"
    fi
else
    log_step "[6/6] Skipping MCP catalog/server steps (SkipMcp requested)."
fi

log_header "Clarity Council is ready."
log_header "HTTP:  http://localhost:8080"
log_header "HTTPS: https://localhost:8000"
log_info "Logs:  $COMPOSE_CMD logs -f"
