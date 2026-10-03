import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { destroySession } from '@/lib/security';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}