import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api-error';
import { currentUser } from '@/lib/security';

export async function GET() {
  try {
    const user = await currentUser();
    return NextResponse.json({
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        mustChangePassword: user.mustChangePassword,
        onboardingCompleted: user.onboardingCompleted,
        permissions: user.permissions.map(({ permission, allowed }) => ({ permission, allowed })),
      } : null,
    });
  } catch (error) {
    return apiError(error);
  }
}