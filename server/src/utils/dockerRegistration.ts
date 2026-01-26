import { ServiceRegistration, ServiceStatus } from "../types/docker.js";
import { getRootLogger } from "./logger.js";

/**
 * Stub implementation for Docker Desktop MCP registration.
 * Will be expanded with real gateway/catalog calls in later tasks.
 */
export class DockerRegistration {
  private logger = getRootLogger().child({ component: "dockerRegistration" });

  async registerService(_payload?: Partial<ServiceRegistration>): Promise<void> {
    this.logger.info({ event: "docker_registration.stub" }, "Docker registration not yet implemented");
  }

  async deregisterService(_serviceId?: string): Promise<void> {
    this.logger.info({ event: "docker_deregistration.stub" }, "Docker deregistration not yet implemented");
  }

  async updateServiceStatus(_status: ServiceStatus): Promise<void> {
    this.logger.debug({ event: "docker_status.stub", status: _status }, "Docker status update not yet implemented");
  }
}
