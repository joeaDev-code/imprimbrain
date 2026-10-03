import crypto from 'node:crypto';
import { isIP } from 'node:net';

export type RateLimitEntry = {
  count: number;
  resetAt: number;
  lastAttemptAt: number;
};

export interface RateLimitStore {
  get(key: string, now?: number): Promise<RateLimitEntry | null>;
  increment(key: string, windowMs: number, now?: number): Promise<RateLimitEntry>;
  delete(key: string): Promise<void>;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, RateLimitEntry>();
  private operations = 0;

  constructor(private readonly maxEntries = 10_000) {}

  async get(key: string, now = Date.now()) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.resetAt <= now) {
      this.entries.delete(key);
      return null;
    }
    return { ...entry };
  }

  async increment(key: string, windowMs: number, now = Date.now()) {
    this.prune(now);
    const current = this.entries.get(key);
    const existing = current && current.resetAt > now ? current : null;
    if (current && !existing) this.entries.delete(key);
    if (existing) this.entries.delete(key);
    if (!existing && this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) this.entries.delete(oldestKey);
    }
    const entry = existing
      ? { count: existing.count + 1, resetAt: existing.resetAt, lastAttemptAt: now }
      : { count: 1, resetAt: now + windowMs, lastAttemptAt: now };
    this.entries.set(key, entry);
    return { ...entry };
  }

  async delete(key: string) {
    this.entries.delete(key);
  }

  private prune(now: number) {
    if (this.entries.size < this.maxEntries && ++this.operations % 128 !== 0) return;
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key);
    }
  }
}

export function rateLimitKey(scope: 'ip' | 'account', value: string) {
  const digest = crypto.createHash('sha256').update(`${scope}:${value}`).digest('hex');
  return `${scope}:${digest}`;
}

export function trustedProxyClientIp(headers: Headers, configuredHeader = process.env.TRUSTED_PROXY_IP_HEADER) {
  if (configuredHeader !== 'x-real-ip' && configuredHeader !== 'x-forwarded-for') return null;
  const raw = headers.get(configuredHeader);
  const address = raw?.split(',')[0]?.trim();
  return address && isIP(address) ? address : null;
}

export function accountBackoffSeconds(failures: number) {
  if (failures < 5) return 0;
  return Math.min(15, failures - 4);
}
