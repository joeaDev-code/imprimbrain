import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { createSession } from '@/lib/security';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function clientKey(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}
function rateLimited(key: string) {
  const now = Date.now(); const current = attempts.get(key);
  if (!current || current.resetAt <= now) { attempts.set(key, { count: 1, resetAt: now + WINDOW_MS }); return false; }
  current.count += 1; return current.count > MAX_ATTEMPTS;
}
function clearRateLimit(key: string) { attempts.delete(key); }

export async function POST(req: Request) {
  const key = clientKey(req);
  if (rateLimited(key)) return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, { status: 429 });
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'E-mail et mot de passe requis' }, { status: 400 });
    const user = await db.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    clearRateLimit(key);
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, { status: 500 }); }
}
