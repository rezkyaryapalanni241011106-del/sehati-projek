export function logError(context: string, error: unknown, meta?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code;
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    context,
    message,
    ...(code !== undefined && { code }),
    ...meta,
  }));
}
