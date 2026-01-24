#!/usr/bin/env node

import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createLogger } from "./utils/logger.js";
import { registerCouncilConsult } from "./tools/council.consult.js";
import { registerPersonaConsult } from "./tools/persona.consult.js";
import { registerDefinePersonas } from "./tools/council.define_personas.js";
import { createMcpToolRegistrar } from "./utils/mcpAdapter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createLogger();

const PORT = parseInt(process.env.HTTPS_PORT || "8000", 10);
const CERT_DIR = process.env.CERT_DIR || path.join(__dirname, "..", "certs");

function ensureCertificates() {
  fs.mkdirSync(CERT_DIR, { recursive: true });

  const certPath = path.join(CERT_DIR, "cert.pem");
  const keyPath = path.join(CERT_DIR, "key.pem");

  const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

  if (!hasCerts) {
    logger.warn({ certPath, keyPath }, "HTTPS certificates not found. Generating self-signed certificates.");

    const result = spawnSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-keyout",
        keyPath,
        "-out",
        certPath,
        "-days",
        "365",
        "-nodes",
        "-subj",
        "/CN=localhost"
      ],
      { stdio: "inherit" }
    );

    if (result.status !== 0) {
      throw new Error(`Failed to generate self-signed certificates with openssl (exit code ${result.status ?? "unknown"}).`);
    }
  }

  return { certPath, keyPath };
}

const { certPath, keyPath } = ensureCertificates();

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

async function startServer() {
  const server = new McpServer({
    name: "clarity-council-mcp",
    version: "0.1.0"
  });

  const registrar = createMcpToolRegistrar(server);

  // Register all tools
  await registerCouncilConsult(registrar);
  await registerPersonaConsult(registrar);
  await registerDefinePersonas(registrar);

  // Create HTTPS server
  const httpsServer = https.createServer(options, (req, res) => {
    // Simple health check endpoint
    if (req.url === "/" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "healthy",
          service: "clarity-council-mcp",
          version: "0.1.0",
          message: "Connect via MCP client to access tools"
        })
      );
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    }
  });

  httpsServer.listen(PORT, "0.0.0.0", () => {
    logger.info(
      { port: PORT, certPath, keyPath },
      `Clarity Council MCP HTTPS server started on https://localhost:${PORT}`
    );
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    logger.info("Shutting down HTTPS server...");
    httpsServer.close(() => {
      logger.info("HTTPS server closed");
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  logger.error(err, "Failed to start HTTPS server");
  process.exit(1);
});
