export function formatError(error: Error): string {
  return `Error: ${error.message}`;
}

export function formatApiError(statusCode: number, message: string): string {
  return `API Error (${statusCode}): ${message}`;
}
