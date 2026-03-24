/**
 * Structured logging utility for frontend
 * Format: [timestamp] [INFO] [component] [action] data
 */

export function logInfo(component: string, action: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data) : '{}';
  console.log(`[${timestamp}] [INFO] [${component}] [${action}] ${logData}`);
}

export function logError(component: string, action: string, error: Error | string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const errorMsg = error instanceof Error ? error.message : error;
  const logData = data ? JSON.stringify(data) : '{}';
  console.error(`[${timestamp}] [INFO] [${component}] [${action}] error="${errorMsg}" data=${logData}`);
}
