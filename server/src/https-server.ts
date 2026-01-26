#!/usr/bin/env node

import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { createLogger } from "./utils/logger.js";
import { registerCouncilConsult } from "./tools/council.consult.js";
import { registerPersonaConsult } from "./tools/persona.consult.js";
import { registerDefinePersonas } from "./tools/council.define_personas.js";
import { ToolDefinition, ToolRegistrar } from "./utils/mcpAdapter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createLogger();

const PORT = parseInt(process.env.HTTPS_PORT || "8000", 10);
const HTTP_ENABLED = (process.env.HTTP_ENABLED || "true").toLowerCase() !== "false";
const HTTP_PORT = parseInt(process.env.HTTP_PORT || "8080", 10);
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

type JsonRpcRequest = {
  jsonrpc?: string;
  method?: string;
  params?: any;
  id?: string | number | null;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

async function startServer() {
  const servers: Array<{ close: (cb: () => void) => void }> = [];
  const tools: ToolDefinition[] = [];

  // Add global error handlers to prevent silent crashes
  process.on("unhandledRejection", (reason, promise) => {
    logger.error({ reason, promise }, "Unhandled promise rejection");
  });

  process.on("uncaughtException", (err) => {
    logger.error({ err }, "Uncaught exception");
    process.exit(1);
  });

  const registrar: ToolRegistrar = {
    registerTool: (tool) => {
      tools.push(tool);
    }
  };

  // Register all tools into our in-process registry
  await registerCouncilConsult(registrar);
  await registerPersonaConsult(registrar);
  await registerDefinePersonas(registrar);

  const listTools = () =>
    tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema ?? {},
      outputSchema: tool.outputSchema ?? {}
    }));

  const callTool = async (name: string, args: Record<string, unknown>) => {
    try {
      const tool = tools.find((t) => t.name === name);
      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }
      const result = await Promise.resolve(tool.handler(args || {}));
      return result;
    } catch (err: any) {
      logger.error({ tool: name, err, args }, "Tool execution error");
      throw err;
    }
  };

  const handleRpc = async (req: JsonRpcRequest): Promise<JsonRpcResponse> => {
    const id = req.id ?? null;

    if (!req.method) {
      return { jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid Request" } };
    }

    switch (req.method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: { list: true, call: true } },
            serverInfo: { name: "clarity-council-mcp", version: "0.1.0" }
          }
        };
      case "tools/list":
      case "list_tools":
        return { jsonrpc: "2.0", id, result: { tools: listTools() } };
      case "tools/call":
      case "call_tool": {
        const params = req.params ?? {};
        const toolName = params.name || params.tool || params.method;
        const toolArgs = params.arguments || params.args || params.input || {};
        if (typeof toolName !== "string") {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: "Tool name missing" }
          };
        }
        try {
          logger.info({ toolName, argsKeys: Object.keys(toolArgs) }, "Calling tool");
          const result = await callTool(toolName, toolArgs);
          logger.info({ toolName, resultType: typeof result }, "Tool completed successfully");
          return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] } };
        } catch (err: any) {
          logger.error({ toolName, err, message: err?.message }, "Tool invocation failed");
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32000, message: err?.message || "Tool invocation failed", data: err?.stack }
          };
        }
      }
      default:
        return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${req.method}` } };
    }
  };

  // Shared request handler for health and JSON-RPC over HTTP/HTTPS
  const requestHandler: http.RequestListener = (req, res) => {
    try {
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
        return;
      }

      if (req.url === "/" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("error", (err) => {
          logger.error({ err }, "Request error");
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Request error" }));
        });
        req.on("end", async () => {
          try {
            const parsed = body.length ? JSON.parse(body) : {};
            const requests = Array.isArray(parsed) ? parsed : [parsed];
            logger.info({ requestCount: requests.length, methods: requests.map((r: any) => r.method) }, "Processing requests");
            const responses = await Promise.all(requests.map((r) => handleRpc(r)));
            const payload = Array.isArray(parsed) ? responses : responses[0];
            logger.info({ responseCount: responses.length, payloadSize: JSON.stringify(payload).length }, "Sending response");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(payload));
            logger.info("Response sent successfully");
          } catch (err: any) {
            logger.error({ err, message: err?.message, stack: err?.stack }, "POST handler error");
            if (!res.headersSent) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  jsonrpc: "2.0",
                  id: null,
                  error: { code: -32700, message: "Parse error", data: err?.message }
                })
              );
            }
          }
        });
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    } catch (err: any) {
      logger.error({ err }, "Unhandled request handler error");
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    }
  };

  // Create HTTPS server
  const httpsServer = https.createServer(options, requestHandler);
  httpsServer.on("error", (err) => {
    logger.error({ err }, "HTTPS server error");
  });
  httpsServer.listen(PORT, "0.0.0.0", () => {
    logger.info(
      { port: PORT, certPath, keyPath },
      `Clarity Council MCP HTTPS server started on https://localhost:${PORT}`
    );
  });
  servers.push(httpsServer);

  // Optional HTTP server for local, non-TLS access
  if (HTTP_ENABLED) {
    const httpServer = http.createServer(requestHandler);
    httpServer.on("error", (err) => {
      logger.error({ err }, "HTTP server error");
    });
    httpServer.listen(HTTP_PORT, "0.0.0.0", () => {
      logger.info({ port: HTTP_PORT }, `Clarity Council MCP HTTP server started on http://localhost:${HTTP_PORT}`);
    });
    servers.push(httpServer);
  }

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    logger.info("Shutting down servers...");
    let remaining = servers.length;

    if (remaining === 0) {
      process.exit(0);
    }

    servers.forEach((srv) => {
      srv.close(() => {
        remaining -= 1;
        if (remaining === 0) {
          logger.info("All servers closed");
          process.exit(0);
        }
      });
    });
  });
}

startServer().catch((err) => {
  logger.error(err, "Failed to start HTTPS server");
  process.exit(1);
});

