# Docker Deployment Quickstart

## 🚀 Get Started in 2 Minutes

### 1. Start the Container

```bash
docker-compose up -d
```

This will:
- Build the Docker image
- Generate self-signed HTTPS certificates
- Start the Clarity Council MCP server on `https://localhost:8000`

### 2. Verify It's Running

```bash
# Check container status
docker ps | grep clarity-council

# Check health
curl -k https://localhost:8000/
# Expected: {"status": "healthy", "service": "clarity-council-mcp", ...}

# View logs
docker-compose logs -f clarity-council
```

### 3. Configure VS Code

Add to VS Code `settings.json`:

```json
{
  "mcpServers": {
    "clarity-council": {
      "url": "https://localhost:8000",
      "options": {
        "rejectUnauthorized": false
      }
    }
  }
}
```

### 4. Use in VS Code

In Claude/Chat:
```
@clarity-council /council.consult user_problem:"Grow MRR by 30%"
```

Or via MCP Command Palette:
```
/council.consult user_problem:"Migrate to Kubernetes" depth:deep
```

---

## 📋 Common Commands

### View Logs

```bash
# Real-time logs
docker-compose logs -f clarity-council

# Last 100 lines
docker-compose logs -n 100 clarity-council
```

### Stop Container

```bash
docker-compose down
```

### Rebuild Image

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Shell Access

```bash
docker-compose exec clarity-council sh
```

### Check Certificate Details

```bash
openssl x509 -in certs/cert.pem -text -noout
```

---

## 🔐 HTTPS & Certificates

### Self-Signed Certificates

The container automatically generates certificates on first run:
```
./certs/
├── cert.pem
└── key.pem
```

These are valid for **365 days** and safe for local development.

### Use Custom Certificates

```bash
# Copy your certificates
cp /path/to/your/cert.pem ./certs/
cp /path/to/your/key.pem ./certs/

# Restart container
docker-compose restart clarity-council
```

### Trust Self-Signed Certs (macOS)

```bash
# Add certificate to Keychain
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/cert.pem

# Verify
security find-certificate -c localhost
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs clarity-council

# Common issues:
# - Port 8000 already in use: Change in docker-compose.yml
# - Certificate generation failed: Delete certs/ and restart
```

### VS Code Can't Connect

1. Ensure container is running: `docker ps | grep clarity-council`
2. Check firewall: `lsof -i :8000`
3. Verify settings.json has correct URL and `rejectUnauthorized: false`
4. Restart VS Code

### Certificate Errors

```bash
# Regenerate certificates
rm -rf certs/
docker-compose restart clarity-council

# Wait 5-10 seconds for container to generate new certs
```

### Performance Issues

```bash
# Check CPU/Memory usage
docker stats clarity-council

# Increase Docker resource limits in settings if needed
```

---

## 📦 Environment Variables

You can customize the container via `docker-compose.yml`:

```yaml
environment:
  NODE_ENV: production      # development | production
  LOG_LEVEL: info           # debug | info | warn | error
  HTTPS_PORT: 8000          # Port for HTTPS server
```

Example with custom environment:

```bash
# Create .env file
cat > .env << EOF
LOG_LEVEL=debug
NODE_ENV=development
EOF

# docker-compose will automatically load .env
docker-compose up -d
```

---

## 🔗 Next Steps

- **Read Full README**: [README.md](../README.md)
- **API Reference**: [README.md#api-reference](../README.md#api-reference)
- **Customize Personas**: [README.md#custom-personas](../README.md#custom-personas)
- **Add New Tools**: [README.md#adding-a-new-tool](../README.md#adding-a-new-tool)

---

## 💬 Support

**Issue**: Container exits immediately
```bash
docker-compose logs clarity-council
# Check error output
```

**Issue**: HTTPS errors in browser
```bash
# Use -k flag to ignore self-signed cert warnings
curl -k https://localhost:8000/
```

**Issue**: VS Code won't find the MCP server
```bash
# Make sure 'rejectUnauthorized': false is set in VS Code settings
```
