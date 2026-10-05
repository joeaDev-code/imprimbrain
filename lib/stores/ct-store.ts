import { createStore } from 'zustand/vanilla';
import type { Permission } from '@/generated/prisma/client';
import type { CTRole } from '@/lib/ct-access';
import { hasPermission } from '@/lib/ct-permissions';

export type CTIdentity = {
  id: string;
  name: string;
  email: string;
  role: CTRole;
  organizationId: string;
  permissions: readonly Permission[];
  mustChangePassword: boolean;
  onboardingCompleted: boolean;
};

export type CTOrganization = {
  id: string;
  name: string;
  logo: string | null;
};

export type CTInitialState = {
  user: CTIdentity;
  organization: CTOrganization;
};

export type CTStoreState = {
  user: CTIdentity;
  role: CTRole;
  permissions: Permission[];
  organization: CTOrganization;
  mustChangePassword: boolean;
  onboardingCompleted: boolean;
  sidebarCollapsed: boolean;

  setAuth: (
    user: CTIdentity,
    organization: CTOrganization,
  ) => void;

  markPasswordChanged: () => void;

  completeOnboarding: () => void;

  clearAuth: () => void;

  hasPermission: (
    permission: Permission,
  ) => boolean;

  toggleSidebar: () => void;
};

export function createCTStore(initial: CTInitialState) {
  return createStore<CTStoreState>()((set, get) => ({
    user: initial.user,

    role: initial.user.role,

    permissions: [...initial.user.permissions],

    mustChangePassword:
      initial.user.mustChangePassword,

    onboardingCompleted:
      initial.user.onboardingCompleted,

    organization: initial.organization,

    sidebarCollapsed: false,

    setAuth: (user, organization) =>
      set({
        user,

        role: user.role,

        permissions: [...user.permissions],

        mustChangePassword:
          user.mustChangePassword,

        onboardingCompleted:
          user.onboardingCompleted,

        organization,
      }),

    markPasswordChanged: () =>
      set((state) => ({
        user: {
          ...state.user,
          mustChangePassword: false,
        },

        mustChangePassword: false,
      })),

    completeOnboarding: () =>
      set((state) => ({
        user: {
          ...state.user,
          onboardingCompleted: true,
        },

        onboardingCompleted: true,
      })),

    clearAuth: () =>
      set({
        user: {
          id: '',
          name: '',
          email: '',
          role: 'SECRETARY',
          organizationId: '',
          permissions: [],
          mustChangePassword: false,
          onboardingCompleted: false,
        },

        role: 'SECRETARY',

        permissions: [],

        organization: {
          id: '',
          name: '',
          logo: null,
        },

        mustChangePassword: false,

        onboardingCompleted: false,
      }),

    hasPermission: (permission) =>
      hasPermission(
        get().permissions,
        permission,
      ),

    toggleSidebar: () =>
      set((state) => ({
        sidebarCollapsed:
          !state.sidebarCollapsed,
      })),
  }));
}