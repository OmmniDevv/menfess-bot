import crypto from 'crypto';

/**
 * Hash user ID for safe logging (SHA-256, first 8 chars)
 */
export function hashUserId(userId: number): string {
  return crypto
    .createHash('sha256')
    .update(String(userId))
    .digest('hex')
    .slice(0, 8);
}

/**
 * Check if two dates are the same calendar day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

/**
 * Format remaining limit message
 */
export function formatLimitMessage(used: number, max: number): string {
  const remaining = Math.max(0, max - used);
  return `Sisa limit media hari ini: ${remaining}/${max} 📊\nReset: besok 00:00`;
}
