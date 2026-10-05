import { NextResponse } from 'next/server';
import { RequestBodyError } from '@/lib/request-json';

export function apiError(error: unknown, safeMessages: string[] = []) {
  if (error instanceof RequestBodyError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : '';
  if (message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  if (message === 'FORBIDDEN' || message === 'NO_ORGANIZATION' || message === 'ORGANIZATION_ARCHIVED') return NextResponse.json({ error: 'Interdit' }, { status: 403 });
  if (message === 'PASSWORD_CHANGE_REQUIRED') return NextResponse.json({ error: 'Changement de mot de passe requis.' }, { status: 403 });
  if (message === 'SUBSCRIPTION_EXPIRED') return NextResponse.json({ error: 'Abonnement expiré.' }, { status: 402 });
  if (message === 'ORGANIZATION_SUSPENDED') return NextResponse.json({ error: 'Organisation suspendue.' }, { status: 403 });
  if (safeMessages.some((safeMessage) => message === safeMessage || (safeMessage.endsWith(': ') && message.startsWith(safeMessage)))) {
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const errorCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined;
  console.error('[api-error]', {
    name: error instanceof Error ? error.name : 'UnknownError',
    code: errorCode,
    stack: error instanceof Error ? error.stack : undefined,
  });
  return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
}