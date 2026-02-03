#!/usr/bin/env node

/**
 * HTTPS Server for Clarity Council
 * 
 * Standalone HTTP/HTTPS server for the Clarity Council MCP service.
 * Supports both HTTP and HTTPS endpoints with configurable ports.
 * Implements:
 * 
 * - JSON-RPC 2.0 protocol for tool invocation
 * - TLS certificate validation
 * - Health check endpoint
 * - Comprehensive error handling
 * - Request logging and tracing
 */

import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import { getLogConfig, getRootLogger } from "./utils/logger.js";
import { loadConfig } from "./utils/config.js";
import { loadSchema } from "./utils/schemaLoader.js";
import { HealthChecker } from "./utils/healthCheck.js";
import { registerCouncilConsult } from "./tools/council.consult.js";
import { registerCouncilDiscuss } from "./tools/council.discuss.js";
import { registerPersonaConsult } from "./tools/persona.consult.js";
import { registerDefinePersonas } from "./tools/council.define_personas.js";
import { ToolDefinition, ToolRegistrar } from "./utils/mcpAdapter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = getRootLogger();
const logConfig = getLogConfig();
logger.info({ event: "logger.init", level: logConfig.level, format: logConfig.format }, "Logger initialized");

const config = loadConfig({ logger });

function ensureCertificates(certDir: string) {
  const certPath = path.join(certDir, "cert.pem");
  const keyPath = path.join(certDir, "key.pem");
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    throw new Error(`TLS certificates not found in ${certDir}. Expected cert.pem and key.pem.`);
  }
  return { certPath, keyPath };
}

type JsonRpcRequest = {
  jsonrpc?: string;
  method?: string;
  params?: any;
  id?: string | number | null;
};

/**
 * JSON-RPC 2.0 response format
 * 
 * Contains either a result (on success) or an error object (on failure).
 */
type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

async function startServer() {
  const servers: Array<{ close: (cb: () => void) => void }> = [];
  const tools: ToolDefinition[] = [];
  const healthChecker = new HealthChecker(config.httpPort, config.httpsPort, config.workspaceDir);

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
  await registerCouncilDiscuss(registrar, {
    config,
    schemas: {
      inputSchema: loadSchema("council.discuss.input.schema.json"),
      outputSchema: loadSchema("council.discuss.output.schema.json")
    }
  });
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
    const startTime = Date.now();

    logger.debug({ request: req }, "RPC request received");

    if (!req.method) {
      const errResponse = { jsonrpc: "2.0" as const, id, error: { code: -32600, message: "Invalid Request" } };
      logger.warn({ response: errResponse, method: req.method }, "Invalid RPC request");
      return errResponse;
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
          const errResponse = {
            jsonrpc: "2.0" as const,
            id,
            error: { code: -32602, message: "Tool name missing" }
          };
          logger.warn({ params }, "Tool name missing in request");
          return errResponse;
        }
        try {
          const argKeys = Object.keys(toolArgs);
          logger.info({ toolName, argKeys, numArgs: argKeys.length }, "Calling tool");
          const toolStartTime = Date.now();
          const result = await callTool(toolName, toolArgs);
          const toolDuration = Date.now() - toolStartTime;
          logger.info({ toolName, duration: toolDuration, resultType: typeof result }, "Tool completed successfully");
          const contentText = (result as any)?.formatted || JSON.stringify(result, null, 2);
          const response = { jsonrpc: "2.0" as const, id, result: { content: [{ type: "text", text: contentText }] } };
          logger.debug({ toolName, responseContentLength: contentText.length }, "Tool response content");
          return response;
        } catch (err: any) {
          const errorDuration = Date.now() - startTime;
          logger.error({
            toolName,
            duration: errorDuration,
            error: err?.message,
            stack: err?.stack,
            errorName: err?.name
          }, "Tool invocation failed");
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32000, message: err?.message || "Tool invocation failed", data: err?.stack }
          };
        }
      }
      default:
        const errResponse = { jsonrpc: "2.0" as const, id, error: { code: -32601, message: `Method not found: ${req.method}` } };
        logger.warn({ method: req.method }, "Unknown RPC method");
        return errResponse;
    }
  };

  // Shared request handler for health and JSON-RPC over HTTP/HTTPS
  const requestHandler: http.RequestListener = (req, res) => {
    try {
      if (req.url === "/health" && req.method === "GET") {
        logger.debug({ event: "request.health_check", path: req.url }, "Health check request");
        healthChecker.performHealthCheck().then((healthStatus) => {
          const statusCode = healthStatus.status === "healthy" ? 200 : 503;
          res.writeHead(statusCode, { "Content-Type": "application/json" });
          res.end(JSON.stringify(healthStatus));
        });
        return;
      }

      if (req.url === "/mcp-metadata" && req.method === "GET") {
        logger.debug({ event: "request.mcp_metadata", path: req.url }, "MCP metadata request");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            name: "Clarity Council",
            version: "0.1.0",
            description: "Multi-persona AI consultation tool for decision-making",
            endpoint: {
              protocol: config.httpsEnabled ? "https" : "http",
              host: "localhost",
              port: config.httpsEnabled ? config.httpsPort : config.httpPort
            },
            tools: [
              {
                name: "council_consult",
                description: "Consult multiple personas and produce a synthesis (agreements, conflicts, risks/tradeoffs, next_steps)."
              },
              {
                name: "persona_consult",
                description: "Consult a single persona returning structured advice, assumptions, questions, next_steps, and confidence."
              },
              {
                name: "council_define_personas",
                description: "Return current persona contracts and apply validated workspace-level overrides."
              }
            ]
          })
        );
        return;
      }

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
          const requestStartTime = Date.now();
          try {
            const parsed = body.length ? JSON.parse(body) : {};
            const requests = Array.isArray(parsed) ? parsed : [parsed];
            const methods = requests.map((r: any) => r.method);
            logger.info({
              requestCount: requests.length,
              methods,
              bodySize: body.length
            }, "HTTP POST received - Processing RPC requests");
            logger.debug({ requestBody: body }, "Full request body");
            const responses = await Promise.all(requests.map((r) => handleRpc(r)));
            const payload = Array.isArray(parsed) ? responses : responses[0];
            const payloadJson = JSON.stringify(payload);
            const requestDuration = Date.now() - requestStartTime;
            logger.info({
              requestDuration,
              responseCount: responses.length,
              payloadSize: payloadJson.length,
              hasErrors: Array.isArray(responses) ? responses.some((r: any) => r.error) : (payload as any)?.error
            }, "Sending HTTP response");
            logger.debug({ responseBody: payloadJson }, "Full response body");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(payloadJson);
            logger.info({ requestDuration, statusCode: 200 }, "HTTP response sent successfully");
          } catch (err: any) {
            const errorDuration = Date.now() - requestStartTime;
            logger.error({
              duration: errorDuration,
              error: err?.message,
              stack: err?.stack,
              errorName: err?.name,
              body: body.substring(0, 500)
            }, "POST handler error");
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

  if (config.httpsEnabled) {
    const { certPath, keyPath } = ensureCertificates(config.certDir);
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };

    const httpsServer = https.createServer(httpsOptions, requestHandler);
    httpsServer.on("error", (err) => {
      logger.error({ err }, "HTTPS server error");
    });
    httpsServer.listen(config.httpsPort, "0.0.0.0", () => {
      logger.info(
        { port: config.httpsPort, certPath, keyPath },
        `Clarity Council MCP HTTPS server started on https://localhost:${config.httpsPort}`
      );
    });
    servers.push(httpsServer);
  } else {
    logger.warn({ event: "https.disabled" }, "HTTPS server disabled by configuration");
  }

  if (config.httpEnabled) {
    const httpServer = http.createServer(requestHandler);
    httpServer.on("error", (err) => {
      logger.error({ err }, "HTTP server error");
    });
    httpServer.listen(config.httpPort, "0.0.0.0", () => {
      logger.info({ port: config.httpPort }, `Clarity Council MCP HTTP server started on http://localhost:${config.httpPort}`);
    });
    servers.push(httpServer);
  } else {
    logger.info({ event: "http.disabled" }, "HTTP server disabled by configuration");
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


