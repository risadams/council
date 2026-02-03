import { describe, it, expect } from "vitest";
import { resolveDebateLimit, hasReachedDebateLimit } from "../../server/src/services/debateLimiter.js";
import type { DebateLimitConfig } from "../../server/src/services/debateLimiter.js";

describe("DebateLimiter - cycle enforcement", () => {
  const config: DebateLimitConfig = {
    defaultLimit: 10,
    extendedLimit: 20
  };

  describe("resolveDebateLimit", () => {
    it("should return default limit when extended debate not requested", () => {
      const limit = resolveDebateLimit(config, false);
      expect(limit).toBe(10);
    });

    it("should return extended limit when extended debate requested", () => {
      const limit = resolveDebateLimit(config, true);
      expect(limit).toBe(20);
    });

    it("should handle zero limits", () => {
      const zeroConfig: DebateLimitConfig = { defaultLimit: 0, extendedLimit: 0 };
      expect(resolveDebateLimit(zeroConfig, false)).toBe(0);
      expect(resolveDebateLimit(zeroConfig, true)).toBe(0);
    });

    it("should handle custom limits", () => {
      const customConfig: DebateLimitConfig = { defaultLimit: 5, extendedLimit: 15 };
      expect(resolveDebateLimit(customConfig, false)).toBe(5);
      expect(resolveDebateLimit(customConfig, true)).toBe(15);
    });
  });

  describe("hasReachedDebateLimit", () => {
    it("should return false when under limit", () => {
      expect(hasReachedDebateLimit(5, 10)).toBe(false);
      expect(hasReachedDebateLimit(0, 10)).toBe(false);
    });

    it("should return true when at limit", () => {
      expect(hasReachedDebateLimit(10, 10)).toBe(true);
    });

    it("should return true when over limit", () => {
      expect(hasReachedDebateLimit(11, 10)).toBe(true);
      expect(hasReachedDebateLimit(100, 10)).toBe(true);
    });

    it("should handle zero limit", () => {
      expect(hasReachedDebateLimit(0, 0)).toBe(true);
      expect(hasReachedDebateLimit(1, 0)).toBe(true);
    });

    it("should handle extended debate scenario", () => {
      // After default 10 cycles, still under extended limit
      expect(hasReachedDebateLimit(10, 20)).toBe(false);
      expect(hasReachedDebateLimit(19, 20)).toBe(false);
      expect(hasReachedDebateLimit(20, 20)).toBe(true);
    });
  });

  describe("integration scenarios", () => {
    it("should enforce default limit lifecycle", () => {
      const limit = resolveDebateLimit(config, false);
      expect(hasReachedDebateLimit(0, limit)).toBe(false);
      expect(hasReachedDebateLimit(9, limit)).toBe(false);
      expect(hasReachedDebateLimit(10, limit)).toBe(true);
    });

    it("should enforce extended limit lifecycle", () => {
      const limit = resolveDebateLimit(config, true);
      expect(hasReachedDebateLimit(0, limit)).toBe(false);
      expect(hasReachedDebateLimit(10, limit)).toBe(false);
      expect(hasReachedDebateLimit(19, limit)).toBe(false);
      expect(hasReachedDebateLimit(20, limit)).toBe(true);
    });
  });
});
