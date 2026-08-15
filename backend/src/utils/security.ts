export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function isPlaceholderSecret(value: string): boolean {
  return ['dev_secret', 'replace-with-a-long-random-secret', 'change-me'].includes(value.trim());
}
