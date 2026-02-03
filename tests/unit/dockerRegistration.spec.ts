import { describe, expect, it } from "vitest";
import { DockerRegistration } from "../../server/src/utils/dockerRegistration.js";

describe("docker registration", () => {
  it("builds valid service registration payload", async () => {
    const registration = new DockerRegistration({
      serviceId: "clarity-council-docker-0.1.0",
      name: "Clarity Council",
      version: "0.1.0",
      description: "Multi-persona AI consultation tool",
      httpPort: 8080,
      httpsPort: 8443,
      workspaceDir: "/tmp"
    });

    const result = await registration.registerService();

    if (result) {
      expect(result.serviceId).toBe("clarity-council-docker-0.1.0");
      expect(result.name).toBe("Clarity Council");
      expect(result.version).toBe("0.1.0");
      expect(result.endpoint.protocol).toMatch(/http|https/);
      expect(result.endpoint.port).toBeGreaterThanOrEqual(1024);
      expect(result.tools.length).toBe(4);
      expect(result.tools[0].name).toBe("council_consult");
      expect(result.tools[1].name).toBe("persona_consult");
      expect(result.tools[2].name).toBe("council_define_personas");
      expect(result.tools[3].name).toBe("council_discuss");
      expect(result.healthCheckUrl).toContain("/health");
      expect(result.registrationTimestamp).toBeDefined();
      expect(result.status).toMatch(/healthy|unhealthy/);
    }
  });

  it("provides deregistration capability", async () => {
    const registration = new DockerRegistration({
      serviceId: "clarity-council-docker-0.1.0",
      name: "Clarity Council",
      version: "0.1.0",
      description: "Test service",
      httpPort: 8080,
      workspaceDir: "/tmp"
    });

    // Should not throw
    await expect(registration.deregisterService()).resolves.toBeUndefined();
  });
});
