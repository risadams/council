export type ServiceStatus = "healthy" | "unhealthy" | "stopped" | "registering";

export interface EndpointConfig {
  protocol: "http" | "https";
  host: string;
  port: number;
  basePath?: string;
}

export interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: unknown;
  outputSchema: unknown;
}

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

export interface PersonaOverride {
  enabled: boolean;
  customSoul?: string;
  customFocus?: string[];
  customConstraints?: string[];
}

export interface PersonaOverrides {
  version: "1.0";
  lastModified: string;
  overrides: Record<string, PersonaOverride>;
}
