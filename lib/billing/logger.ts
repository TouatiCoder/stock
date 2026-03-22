type LogLevel = "info" | "warn" | "error";

export function logBilling(level: LogLevel, message: string, context: Record<string, unknown> = {}) {
  const payload = {
    scope: "billing",
    level,
    message,
    ...context,
    timestamp: new Date().toISOString(),
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}
