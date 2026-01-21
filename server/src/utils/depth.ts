export type Depth = "brief" | "standard" | "deep";

export function limits(depth: Depth) {
  if (depth === "brief") return { min: 2, max: 3 };
  if (depth === "standard") return { min: 5, max: 7 };
  return { min: 10, max: 999 };
}

export function clipByDepth<T>(items: T[], depth: Depth) {
  const { min, max } = limits(depth);
  const size = Math.max(min, Math.min(items.length, max));
  return items.slice(0, size);
}
