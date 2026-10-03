'use client';

import type { ReactNode } from 'react';
import type { Permission } from '@/generated/prisma/client';
import { useCTStore } from '@/components/ct/ct-provider';

export function PermissionGate({ permission, children }: { permission: Permission; children: ReactNode }) {
  const allowed = useCTStore((state) => state.hasPermission(permission));
  if (!allowed) return null;
  return <>{children}</>;
}
