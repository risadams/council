#!/bin/bash

# Script to generate self-signed HTTPS certificates for Clarity Council

set -e

CERT_DIR="${1:-.}/certs"
DAYS="${2:-365}"

echo "Generating self-signed HTTPS certificates..."
echo "Certificate directory: $CERT_DIR"
echo "Validity: $DAYS days"

mkdir -p "$CERT_DIR"

openssl req -x509 \
  -newkey rsa:2048 \
  -keyout "$CERT_DIR/key.pem" \
  -out "$CERT_DIR/cert.pem" \
  -days "$DAYS" \
  -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo ""
echo "✓ Certificates generated successfully!"
echo "  Certificate: $CERT_DIR/cert.pem"
echo "  Private Key: $CERT_DIR/key.pem"
echo ""
echo "To use with Docker:"
echo "  docker-compose up -d"
echo ""
echo "To verify certificate:"
echo "  openssl x509 -in $CERT_DIR/cert.pem -text -noout"
