// Add a helper for generating a truly unique ID.
// Using a combination of timestamp and random base36 string is standard for React keys.
export function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}