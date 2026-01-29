/**
 * Content Depth Module
 * 
 * Provides depth-based content filtering to adapt consultation responses
 * to different levels of detail. Controls how many advice items, assumptions,
 * questions, and next steps are included based on consultation depth.
 */

/**
 * Response depth levels
 * 
 * @property brief - Minimal, high-level summary (2-3 items per section)
 * @property standard - Standard detail level (5-7 items per section) - DEFAULT
 * @property deep - Comprehensive analysis (10+ items per section)
 */
export type Depth = "brief" | "standard" | "deep";

/**
 * Gets item count limits for a depth level
 * 
 * @param depth - The depth level
 * @returns Object with min and max item counts
 */
export function limits(depth: Depth) {
  // Adjust content limits based on requested depth
  if (depth === "brief") return { min: 2, max: 3 };
  if (depth === "standard") return { min: 5, max: 7 };
  // Deep returns essentially unlimited items
  return { min: 10, max: 999 };
}

/**
 * Filters array to depth-appropriate size
 * 
 * Returns a subset of items sized between min and max for the depth level,
 * preserving order and preferring the first N items.
 * 
 * @param items - Array of items to filter
 * @param depth - The depth level to filter for
 * @returns Depth-filtered subset of the input array
 */
export function clipByDepth<T>(items: T[], depth: Depth) {
  const { min, max } = limits(depth);
  // Clamp size between min and max, prefer earlier items
  const size = Math.max(min, Math.min(items.length, max));
  return items.slice(0, size);
}
