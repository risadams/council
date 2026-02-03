export type DebateLimitConfig = {
  defaultLimit: number;
  extendedLimit: number;
};

export function resolveDebateLimit(config: DebateLimitConfig, extendedDebateRequested: boolean): number {
  return extendedDebateRequested ? config.extendedLimit : config.defaultLimit;
}

export function hasReachedDebateLimit(currentCycles: number, limit: number): boolean {
  return currentCycles >= limit;
}
