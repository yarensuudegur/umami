import type { PantryItem } from './types';

export const EXPIRING_SOON_DAYS = 3;

export function toISODate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from today (local) until the expiry date; negative if past. */
export function daysUntilExpiry(item: PantryItem, now = new Date()): number | null {
  if (!item.expiryDate) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = parseISODate(item.expiryDate).getTime() - today.getTime();
  return Math.round(diff / 86_400_000);
}

export function isExpired(item: PantryItem, now = new Date()): boolean {
  const days = daysUntilExpiry(item, now);
  return days !== null && days < 0;
}

export function isExpiringSoon(item: PantryItem, now = new Date()): boolean {
  const days = daysUntilExpiry(item, now);
  return days !== null && days >= 0 && days <= EXPIRING_SOON_DAYS;
}

export function isLow(item: PantryItem): boolean {
  return item.lowThreshold > 0 && item.quantity <= item.lowThreshold;
}

/** Lower is more urgent; used to sort the list. */
export function urgency(item: PantryItem, now = new Date()): number {
  if (isExpired(item, now)) return 0;
  if (isExpiringSoon(item, now)) return 1;
  if (isLow(item)) return 2;
  return 3;
}
