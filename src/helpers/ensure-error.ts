export function ensureError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === "string") {
    return new Error(value);
  }

  if (typeof value === "object" && value !== null) {
    if ("message" in value && typeof value.message === "string") {
      return new Error(value.message);
    }
    return new Error(JSON.stringify(value));
  }

  return new Error(String(value));
}
