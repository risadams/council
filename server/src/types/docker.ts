/**
 * Docker Integration Type Definitions
 * 
 * Defines types for service registration, health checking, and container lifecycle
 * management in the Docker Desktop MCP integration.
 */

import type { PersonaOverride } from "./personaOverrides.js";

/**
 * Health status of a service
 * 
 * @property healthy - Service is fully operational
 * @property unhealthy - Service is running but not functioning properly
 * @property stopped - Service is not running
 * @property registering - Service is in the process of registering
 */
export type ServiceStatus = "healthy" | "unhealthy" | "stopped" | "registering";

/**
 * Service endpoint configuration
 * 
 * Defines how to reach a service endpoint (protocol, host, port, optional path prefix).
 */
export interface EndpointConfig {
  protocol: "http" | "https";
  host: string;
  port: number;
  basePath?: string;
}

/**
 * Tool capability descriptor
 * 
 * Describes a single tool/capability offered by a service including its
 * input and output schemas for validation.
 */
export interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: unknown;
  outputSchema: unknown;
}

/**
 * Service registration information
 * 
 * Complete metadata about a registered service including endpoints,
 * capabilities, and current health status.
 */
export interface ServiceRegistration {
  serviceId: string;
  name: string;
  version: string;
  description: string;
  endpoint: EndpointConfig;
  tools: ToolDescriptor[];
  healthCheckUrl: string;
  registrationTimestamp?: string;
  lastHealthCheckTime?: string;
  status: ServiceStatus;
}

export interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime_seconds: number;
  http_endpoint_ok: boolean;
  https_endpoint_ok: boolean;
  mcp_protocol_ok: boolean;
  schema_validation_ok: boolean;
  disk_space_free_mb: number;
  memory_usage_mb: number;
  error_message?: string;
}

// Re-export PersonaOverride from personaOverrides.ts
export type { PersonaOverride };

// PersonaOverrides type now uses imported PersonaOverride
export interface PersonaOverrides {
  version: "1.0";
  lastModified: string;
  overrides: Record<string, PersonaOverride>;
}
