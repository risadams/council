import { randomUUID } from "crypto";
import type { MessageTurn, Participant } from "../types/session.js";

export function createMessageTurn(options: {
  sessionId: string;
  sender: Participant;
  messageType: MessageTurn["messageType"];
  content: string;
  sequenceNumber: number;
  relatedCycleOrRound?: { cycleType: "clarification" | "debate"; number: number };
}): MessageTurn {
  return {
    turnId: randomUUID(),
    sessionId: options.sessionId,
    sender: options.sender,
    messageType: options.messageType,
    content: options.content,
    timestamp: new Date().toISOString(),
    sequenceNumber: options.sequenceNumber,
    relatedCycleOrRound: options.relatedCycleOrRound,
    metadata: {
      createdAt: Date.now()
    }
  };
}

/**
 * Performance tracking utilities for session operations
 */
export type PerformanceMetrics = {
  sessionId: string;
  operation: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

const performanceMetrics = new Map<string, PerformanceMetrics>();

/**
 * Start tracking performance for an operation
 */
export function startPerformanceTracking(sessionId: string, operation: string): string {
  const trackingId = `${sessionId}-${operation}-${Date.now()}`;
  performanceMetrics.set(trackingId, {
    sessionId,
    operation,
    startTime: Date.now()
  });
  return trackingId;
}

/**
 * End performance tracking and calculate duration
 */
export function endPerformanceTracking(
  trackingId: string,
  metadata?: Record<string, unknown>
): PerformanceMetrics | undefined {
  const metrics = performanceMetrics.get(trackingId);
  if (!metrics) return undefined;

  const endTime = Date.now();
  const updatedMetrics: PerformanceMetrics = {
    ...metrics,
    endTime,
    durationMs: endTime - metrics.startTime,
    metadata
  };

  performanceMetrics.set(trackingId, updatedMetrics);
  return updatedMetrics;
}

/**
 * Get all performance metrics for a session
 */
export function getSessionPerformanceMetrics(sessionId: string): PerformanceMetrics[] {
  const sessionMetrics: PerformanceMetrics[] = [];
  performanceMetrics.forEach((metrics) => {
    if (metrics.sessionId === sessionId) {
      sessionMetrics.push(metrics);
    }
  });
  return sessionMetrics;
}

/**
 * Clear performance metrics for a session
 */
export function clearSessionPerformanceMetrics(sessionId: string): void {
  const keysToDelete: string[] = [];
  performanceMetrics.forEach((metrics, key) => {
    if (metrics.sessionId === sessionId) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => performanceMetrics.delete(key));
}
