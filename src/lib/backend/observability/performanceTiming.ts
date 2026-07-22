import "server-only";

export function logBackendTiming(
  requestId: string,
  operation: string,
  startedAt: number,
  status: "ok" | "error",
  errorCode?: string
): void {
  console.info(JSON.stringify({
    kind: "backend_timing",
    requestId,
    operation,
    durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
    status,
    ...(errorCode ? { errorCode } : {}),
  }));
}
