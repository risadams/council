import { ServiceRegistration, ServiceStatus } from "../types/docker.js";
import { getRootLogger } from "./logger.js";
import { HealthChecker } from "./healthCheck.js";

export type ServiceState = "registering" | "healthy" | "unhealthy" | "stopped";

/**
 * Docker Desktop MCP service registration.
 * Handles registration, deregistration, status updates, periodic health checks, and recovery.
 */
export class DockerRegistration {
  private logger = getRootLogger().child({ component: "dockerRegistration" });
  private registeredServiceId?: string;
  private healthChecker: HealthChecker;
  private retryCount = 0;
  private maxRetries = 3;
  private lastHealthCheckTime?: string;
  private currentState: ServiceState = "registering";
  private consecutiveHealthCheckFailures = 0;
  private healthCheckIntervalMs = 30000; // 30 seconds
  private healthCheckIntervalId?: NodeJS.Timeout;
  private recoveryInProgress = false;

  constructor(
    private config: {
      serviceId: string;
      name: string;
      version: string;
      description: string;
      httpPort?: number;
      httpsPort?: number;
      workspaceDir: string;
    }
  ) {
    this.healthChecker = new HealthChecker(config.httpPort, config.httpsPort, config.workspaceDir);
  }

  private setState(newState: ServiceState): void {
    if (this.currentState !== newState) {
      this.logger.info(
        {
          event: "service.state.transition",
          fromState: this.currentState,
          toState: newState,
          timestamp: new Date().toISOString()
        },
        `Service state transition: ${this.currentState} → ${newState}`
      );
      this.currentState = newState;
    }
  }

  getState(): ServiceState {
    return this.currentState;
  }

  async registerService(): Promise<ServiceRegistration | null> {
    this.setState("registering");
    this.consecutiveHealthCheckFailures = 0;

    try {
      const healthCheck = await this.healthChecker.performHealthCheck();
      this.lastHealthCheckTime = healthCheck.timestamp;

      const protocol = this.config.httpsPort ? "https" : "http";
      const port = this.config.httpsPort || this.config.httpPort || 8080;

      const registration: ServiceRegistration = {
        serviceId: this.config.serviceId,
        name: this.config.name,
        version: this.config.version,
        description: this.config.description,
        endpoint: {
          protocol,
          host: "localhost",
          port,
          basePath: "/"
        },
        tools: [
          {
            name: "council_consult",
            description: "Consult multiple personas and produce a synthesis (agreements, conflicts, risks/tradeoffs, next_steps).",
            inputSchema: {} as unknown,
            outputSchema: {} as unknown
          },
          {
            name: "persona_consult",
            description: "Consult a single persona returning structured advice, assumptions, questions, next_steps, and confidence.",
            inputSchema: {} as unknown,
            outputSchema: {} as unknown
          },
          {
            name: "council_define_personas",
            description: "Return current persona contracts and apply validated workspace-level overrides.",
            inputSchema: {} as unknown,
            outputSchema: {} as unknown
          },
          {
            name: "council_discuss",
            description: "Interactive council session with clarifications, debate cycles, and consolidated final answer.",
            inputSchema: {} as unknown,
            outputSchema: {} as unknown
          }
        ],
        healthCheckUrl: `${protocol}://localhost:${port}/health`,
        registrationTimestamp: new Date().toISOString(),
        lastHealthCheckTime: this.lastHealthCheckTime,
        status: healthCheck.status as ServiceStatus
      };

      this.registeredServiceId = registration.serviceId;
      this.retryCount = 0;

      this.setState(healthCheck.status === "healthy" ? "healthy" : "unhealthy");

      this.logger.info(
        {
          event: "service.registration.success",
          serviceId: registration.serviceId,
          endpoint: registration.endpoint,
          status: registration.status,
          currentState: this.currentState
        },
        "Service registered with Docker Desktop MCP"
      );

      // Start background health check polling
      this.startHealthCheckPolling();

      return registration;
    } catch (err: any) {
      this.retryCount++;
      this.logger.error(
        {
          event: "service.registration.error",
          attempt: this.retryCount,
          maxRetries: this.maxRetries,
          error: err?.message
        },
        `Service registration failed (attempt ${this.retryCount}/${this.maxRetries})`
      );

      if (this.retryCount >= this.maxRetries) {
        this.setState("stopped");
        this.logger.error(
          { event: "service.registration.fatal", attempts: this.retryCount },
          "Service registration exhausted all retries"
        );
        return null;
      }

      // Exponential backoff: 100ms, 300ms, 900ms
      const delay = Math.pow(3, this.retryCount - 1) * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));

      return this.registerService(); // Recursive retry
    }
  }

  async deregisterService(): Promise<void> {
    this.setState("stopped");
    this.stopHealthCheckPolling();

    try {
      if (!this.registeredServiceId) {
        this.logger.debug({ event: "service.deregistration.skip" }, "No service registered to deregister");
        return;
      }

      this.logger.info(
        { event: "service.deregistration.start", serviceId: this.registeredServiceId },
        "Deregistering service from Docker Desktop MCP"
      );

      // Placeholder: actual Docker MCP API call would happen here
      this.registeredServiceId = undefined;

      this.logger.info(
        { event: "service.deregistration.success" },
        "Service deregistered successfully"
      );
    } catch (err: any) {
      this.logger.error(
        { event: "service.deregistration.error", error: err?.message },
        "Service deregistration failed"
      );
      throw err;
    }
  }

  async updateServiceStatus(status: ServiceStatus): Promise<void> {
    try {
      const healthCheck = await this.healthChecker.performHealthCheck();
      this.lastHealthCheckTime = healthCheck.timestamp;

      this.logger.debug(
        {
          event: "service.status.update",
          status,
          healthStatus: healthCheck.status,
          lastHealthCheck: this.lastHealthCheckTime
        },
        `Service status updated to ${status}`
      );
    } catch (err: any) {
      this.logger.error(
        { event: "service.status.update.error", error: err?.message },
        "Failed to update service status"
      );
    }
  }

  /**
   * Start background health check polling (every 30 seconds).
   * Updates service state and implements recovery logic on consecutive failures.
   */
  private startHealthCheckPolling(): void {
    if (this.healthCheckIntervalId) {
      this.logger.debug({ event: "health_check.polling.skip" }, "Health check polling already active");
      return;
    }

    this.logger.info(
      { event: "health_check.polling.start", intervalMs: this.healthCheckIntervalMs },
      "Starting periodic health check polling"
    );

    this.healthCheckIntervalId = setInterval(async () => {
      await this.performHealthCheckCycle();
    }, this.healthCheckIntervalMs);

    // Allow process to exit even with this interval running
    if (this.healthCheckIntervalId.unref) {
      this.healthCheckIntervalId.unref();
    }
  }

  /**
   * Stop background health check polling.
   */
  private stopHealthCheckPolling(): void {
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
      this.healthCheckIntervalId = undefined;
      this.logger.info(
        { event: "health_check.polling.stop" },
        "Stopped periodic health check polling"
      );
    }
  }

  /**
   * Single health check cycle: test health, update state, implement recovery if needed.
   */
  private async performHealthCheckCycle(): Promise<void> {
    try {
      const healthCheck = await this.healthChecker.performHealthCheck();
      this.lastHealthCheckTime = healthCheck.timestamp;

      if (healthCheck.status === "healthy") {
        this.consecutiveHealthCheckFailures = 0;
        if (this.currentState === "unhealthy") {
          this.setState("healthy");
          this.logger.info(
            { event: "service.recovery.success", healthCheckTime: healthCheck.timestamp },
            "Service recovered to healthy state"
          );
        }
      } else {
        this.consecutiveHealthCheckFailures++;
        this.logger.warn(
          {
            event: "service.health.failure",
            failures: this.consecutiveHealthCheckFailures,
            errorMessage: healthCheck.error_message
          },
          `Health check failed (${this.consecutiveHealthCheckFailures} consecutive)`
        );

        if (this.consecutiveHealthCheckFailures >= 2 && !this.recoveryInProgress) {
          this.setState("unhealthy");
          await this.attemptRecovery();
        }
      }
    } catch (err: any) {
      this.consecutiveHealthCheckFailures++;
      this.logger.error(
        {
          event: "health_check.cycle.error",
          failures: this.consecutiveHealthCheckFailures,
          error: err?.message
        },
        `Health check cycle error (${this.consecutiveHealthCheckFailures} consecutive)`
      );

      if (this.consecutiveHealthCheckFailures >= 2 && !this.recoveryInProgress) {
        this.setState("unhealthy");
        await this.attemptRecovery();
      }
    }
  }

  /**
   * Attempt recovery from stale registration: re-register service fresh (Option C from spec).
   */
  private async attemptRecovery(): Promise<void> {
    if (this.recoveryInProgress) {
      this.logger.debug({ event: "service.recovery.skip" }, "Recovery already in progress");
      return;
    }

    this.recoveryInProgress = true;
    this.logger.warn(
      {
        event: "service.recovery.start",
        consecutiveFailures: this.consecutiveHealthCheckFailures
      },
      "Starting service recovery: attempting fresh re-registration"
    );

    try {
      // Stop polling temporarily
      this.stopHealthCheckPolling();

      // Deregister current service
      if (this.registeredServiceId) {
        await this.deregisterService();
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before re-registering
      }

      // Re-register service fresh
      this.retryCount = 0;
      this.consecutiveHealthCheckFailures = 0;
      const newRegistration = await this.registerService();

      if (newRegistration) {
        this.logger.info(
          {
            event: "service.recovery.success",
            serviceId: newRegistration.serviceId,
            newState: this.currentState
          },
          "Service recovery completed successfully"
        );
      } else {
        this.logger.error(
          { event: "service.recovery.failed" },
          "Service recovery failed: could not re-register"
        );
        this.setState("stopped");
      }
    } catch (err: any) {
      this.logger.error(
        {
          event: "service.recovery.error",
          error: err?.message
        },
        "Service recovery encountered an error"
      );
      this.setState("stopped");
    } finally {
      this.recoveryInProgress = false;
    }
  }

  getConsecutiveHealthCheckFailures(): number {
    return this.consecutiveHealthCheckFailures;
  }

  getLastHealthCheckTime(): string | undefined {
    return this.lastHealthCheckTime;
  }
}
