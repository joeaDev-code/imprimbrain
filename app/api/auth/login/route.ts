import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { createSession } from '@/lib/security';
import { accountBackoffSeconds, MemoryRateLimitStore, rateLimitKey, trustedProxyClientIp, type RateLimitStore } from '@/lib/rate-limit';
import { apiError } from '@/lib/api-error';
import { readJsonBody } from '@/lib/request-json';

const WINDOW_MS = 15 * 60 * 1000;
const IP_FAILURE_LIMIT = 60;
const ACCOUNT_STORE: RateLimitStore = new MemoryRateLimitStore();

function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: 'Trop de tentatives. Réessayez dans quelques instants.' },
    { status: 429, headers: { 'Retry-After': String(Math.max(1, retryAfter)) } },
  );
}

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req, 8 * 1024);
    const { email, password } = body as { email?: unknown; password?: unknown };
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password || email.length > 254 || password.length > 1024) {
      return NextResponse.json({ error: 'E-mail et mot de passe requis' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const accountLimitKey = rateLimitKey('account', normalizedEmail);
    const now = Date.now();
    const accountEntry = await ACCOUNT_STORE.get(accountLimitKey, now);
    const accountBackoff = accountEntry ? accountBackoffSeconds(accountEntry.count) : 0;
    const retryAfter = accountEntry
      ? Math.ceil((accountEntry.lastAttemptAt + accountBackoff * 1000 - now) / 1000)
      : 0;
    if (retryAfter > 0) return tooManyRequests(retryAfter);

    const trustedIp = trustedProxyClientIp(req.headers);
    const ipLimitKey = trustedIp ? rateLimitKey('ip', trustedIp) : null;
    if (ipLimitKey) {
      const ipEntry = await ACCOUNT_STORE.get(ipLimitKey, now);
      if (ipEntry && ipEntry.count >= IP_FAILURE_LIMIT) {
        return tooManyRequests(Math.ceil((ipEntry.resetAt - now) / 1000));
      }
    }

    const user = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
      await ACCOUNT_STORE.increment(accountLimitKey, WINDOW_MS, now);
      if (ipLimitKey) await ACCOUNT_STORE.increment(ipLimitKey, WINDOW_MS, now);
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    await ACCOUNT_STORE.delete(accountLimitKey);
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
