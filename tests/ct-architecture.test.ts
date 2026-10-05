import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import test from 'node:test';

import { CTProvider } from '../components/ct/ct-provider';
import { filterCTNavigation } from '../components/ct/navigation';
import { PermissionGate } from '../components/ct/permission-gate';
import {
  authenticatedHomePath,
  decideCTRoute,
  decideSuperAdminRoute,
} from '../lib/ct-access';
import { hasPermission } from '../lib/ct-permissions';
import { permissions } from '../lib/permissions';
import { effectivePermissions } from '../lib/permissions-policy';
import { createCTStore } from '../lib/stores/ct-store';
import {
  ctDashboardLinks,
  dashboardTenantScopes,
} from '../lib/ct-dashboard';
import { ctPath } from '../lib/ct-paths';
import {
  hasSessionCookie,
  isPrivatePagePath,
  redirectPrivatePageWithoutSession,
  requiresSameOriginMutation,
} from '../lib/request-boundary';

const organizationId = 'org-test';

test(
  'ADMIN, OFFICER, and SECRETARY resolve only to their matching CT route',
  () => {
    assert.deepEqual(
      decideCTRoute(
        'ADMIN',
        organizationId,
        'admin',
      ),
      {
        kind: 'allow',
        role: 'ADMIN',
      },
    );

    assert.deepEqual(
      decideCTRoute(
        'OFFICER',
        organizationId,
        'officer',
      ),
      {
        kind: 'allow',
        role: 'OFFICER',
      },
    );

    assert.deepEqual(
      decideCTRoute(
        'SECRETARY',
        organizationId,
        'secretary',
      ),
      {
        kind: 'allow',
        role: 'SECRETARY',
      },
    );
  },
);

test(
  'a mismatched CT role segment redirects to the session role, not URL privileges',
  () => {
    assert.deepEqual(
      decideCTRoute(
        'SECRETARY',
        organizationId,
        'admin',
      ),
      {
        kind: 'redirect',
        href: '/ct/secretary',
      },
    );

    assert.deepEqual(
      decideCTRoute(
        'OFFICER',
        organizationId,
        'secretary',
      ),
      {
        kind: 'redirect',
        href: '/ct/officer',
      },
    );

    assert.deepEqual(
      decideCTRoute(
        'ADMIN',
        organizationId,
        'ADMIN',
      ),
      {
        kind: 'redirect',
        href: '/ct/admin',
      },
    );
  },
);

test(
  'every session role accepts only its canonical CT segment',
  () => {
    const roles = [
      'ADMIN',
      'OFFICER',
      'SECRETARY',
    ] as const;

    for (const sessionRole of roles) {
      for (const requestedRole of roles) {
        const decision = decideCTRoute(
          sessionRole,
          organizationId,
          requestedRole.toLowerCase(),
        );

        if (sessionRole === requestedRole) {
          assert.deepEqual(
            decision,
            {
              kind: 'allow',
              role: sessionRole,
            },
          );
        } else {
          assert.deepEqual(
            decision,
            {
              kind: 'redirect',
              href: `/ct/${sessionRole.toLowerCase()}`,
            },
          );
        }
      }
    }
  },
);

test(
  'authenticated landing route is derived from server role and organization',
  () => {
    assert.equal(
      authenticatedHomePath(
        'SUPER_ADMIN',
        null,
      ),
      '/ad/super-admin',
    );

    assert.equal(
      authenticatedHomePath(
        'ADMIN',
        organizationId,
      ),
      '/ct/admin',
    );

    assert.equal(
      authenticatedHomePath(
        'OFFICER',
        organizationId,
      ),
      '/ct/officer',
    );

    assert.equal(
      authenticatedHomePath(
        'SECRETARY',
        organizationId,
      ),
      '/ct/secretary',
    );

    assert.equal(
      authenticatedHomePath(
        'SECRETARY',
        null,
      ),
      '/login',
    );

    assert.equal(
      authenticatedHomePath(
        null,
        null,
      ),
      '/login',
    );
  },
);

test(
  'proxy boundary distinguishes public pages, private page families, and API mutations',
  () => {
    assert.equal(
      isPrivatePagePath(
        '/ct/secretary/stock',
      ),
      true,
    );

    assert.equal(
      isPrivatePagePath(
        '/admin/prestations',
      ),
      false,
    );

    assert.equal(
      isPrivatePagePath('/super-admin'),
      true,
    );

    assert.equal(
      isPrivatePagePath('/ad/super-admin'),
      true,
    );

    assert.equal(
      isPrivatePagePath('/login'),
      false,
    );

    assert.equal(
      isPrivatePagePath(
        '/recu/signed-token',
      ),
      false,
    );

    assert.equal(
      isPrivatePagePath('/api/health'),
      false,
    );

    assert.equal(
      requiresSameOriginMutation(
        'POST',
        '/api/auth/login',
      ),
      true,
    );

    assert.equal(
      requiresSameOriginMutation(
        'GET',
        '/api/auth/me',
      ),
      false,
    );

    assert.equal(
      requiresSameOriginMutation(
        'POST',
        '/ct/admin/prestations',
      ),
      false,
    );

    assert.equal(
      hasSessionCookie(
        'other=x; imprimbrain_session=abc',
        'imprimbrain_session',
      ),
      true,
    );

    assert.equal(
      hasSessionCookie(
        'imprimbrain_session_extra=abc',
        'imprimbrain_session',
      ),
      false,
    );

    assert.equal(
      hasSessionCookie(
        'imprimbrain_session=',
        'imprimbrain_session',
      ),
      false,
    );

    assert.equal(
      hasSessionCookie(
        null,
        'imprimbrain_session',
      ),
      false,
    );

    assert.equal(
      redirectPrivatePageWithoutSession(
        '/ct/admin',
        null,
        'imprimbrain_session',
      ),
      true,
    );

    assert.equal(
      redirectPrivatePageWithoutSession(
        '/admin',
        null,
        'imprimbrain_session',
      ),
      false,
    );

    assert.equal(
      redirectPrivatePageWithoutSession(
        '/super-admin',
        null,
        'imprimbrain_session',
      ),
      true,
    );

    assert.equal(
      redirectPrivatePageWithoutSession(
        '/ad/super-admin',
        null,
        'imprimbrain_session',
      ),
      true,
    );

    assert.equal(
      redirectPrivatePageWithoutSession(
        '/ct/admin',
        'imprimbrain_session=expired-or-invalid',
        'imprimbrain_session',
      ),
      false,
    );

    assert.equal(
      redirectPrivatePageWithoutSession(
        '/recu/public-token',
        null,
        'imprimbrain_session',
      ),
      false,
    );
  },
);

test(
  'Super Admin is redirected out of CT; CT users cannot enter Super Admin',
  () => {
    assert.deepEqual(
      decideCTRoute(
        'SUPER_ADMIN',
        null,
        'admin',
      ),
      {
        kind: 'redirect',
        href: '/ad/super-admin',
      },
    );

    assert.deepEqual(
      decideSuperAdminRoute(
        'SUPER_ADMIN',
      ),
      {
        kind: 'allow',
      },
    );

    assert.deepEqual(
      decideSuperAdminRoute(
        'SECRETARY',
      ),
      {
        kind: 'deny',
        href: '/ct/secretary',
      },
    );

    assert.deepEqual(
      decideSuperAdminRoute(
        'OFFICER',
      ),
      {
        kind: 'deny',
        href: '/ct/officer',
      },
    );

    assert.deepEqual(
      decideSuperAdminRoute(
        'ADMIN',
      ),
      {
        kind: 'deny',
        href: '/ct/admin',
      },
    );

    assert.deepEqual(
      decideSuperAdminRoute(null),
      {
        kind: 'deny',
        href: '/login',
      },
    );

    assert.equal(
      decideCTRoute(
        null,
        null,
        'admin',
      ).kind,
      'deny',
    );
  },
);

test(
  'CT access requires an organization and excludes unsupported roles',
  () => {
    assert.deepEqual(
      decideCTRoute(
        'ADMIN',
        null,
        'admin',
      ),
      {
        kind: 'deny',
        href: '/login',
      },
    );

    assert.deepEqual(
      decideCTRoute(
        'SUPER_ADMIN',
        organizationId,
        'secretary',
      ),
      {
        kind: 'redirect',
        href: '/ad/super-admin',
      },
    );
  },
);

test(
  'effective permissions preserve role defaults and user overrides',
  () => {
    const secretary = effectivePermissions(
      {
        role: 'SECRETARY',
      },
      permissions,
    );

    assert.equal(
      secretary.includes('CLIENTS_VIEW'),
      true,
    );

    assert.equal(
      secretary.includes('STOCK_VIEW'),
      false,
    );

    const secretaryWithStock =
      effectivePermissions(
        {
          role: 'SECRETARY',
          permissions: [
            {
              permission: 'STOCK_VIEW',
              allowed: true,
            },
          ],
        },
        permissions,
      );

    assert.equal(
      secretaryWithStock.includes(
        'STOCK_VIEW',
      ),
      true,
    );

    const adminWithExplicitDeny =
      effectivePermissions(
        {
          role: 'ADMIN',
          permissions: [
            {
              permission: 'STOCK_VIEW',
              allowed: false,
            },
          ],
        },
        permissions,
      );

    assert.equal(
      adminWithExplicitDeny.includes(
        'STOCK_VIEW',
      ),
      false,
    );

    const secretaryWithoutDashboard =
      effectivePermissions(
        {
          role: 'SECRETARY',
          permissions: [
            {
              permission: 'DASHBOARD_VIEW',
              allowed: false,
            },
          ],
        },
        permissions,
      );

    assert.equal(
      secretaryWithoutDashboard.includes(
        'DASHBOARD_VIEW',
      ),
      false,
    );
  },
);

test(
  'Dashboard tenant scopes bind every query to the organization from the server session',
  () => {
    const monthStart =
      new Date(
        '2026-10-01T00:00:00.000Z',
      );

    const monthEnd =
      new Date(
        '2026-11-01T00:00:00.000Z',
      );

    const todayStart =
      new Date(
        '2026-10-03T00:00:00.000Z',
      );

    const todayEnd =
      new Date(
        '2026-10-04T00:00:00.000Z',
      );

    const scopes = dashboardTenantScopes(
      'session-org',
      monthStart,
      monthEnd,
      todayStart,
      todayEnd,
    );

    assert.equal(
      scopes.payments.order.organizationId,
      'session-org',
    );

    assert.equal(
      scopes.expenses.organizationId,
      'session-org',
    );

    assert.equal(
      scopes.recentOrders.organizationId,
      'session-org',
    );

    assert.equal(
      scopes.monthOrders.organizationId,
      'session-org',
    );

    assert.equal(
      scopes.todayOrders.organizationId,
      'session-org',
    );

    assert.equal(
      scopes.stock.organizationId,
      'session-org',
    );

    assert.equal(
      scopes.clients.organizationId,
      'session-org',
    );

    assert.equal(
      scopes.services.organizationId,
      'session-org',
    );
  },
);

test(
  'Dashboard action links use the verified CT role context, never legacy admin links',
  () => {
    assert.deepEqual(
      ctDashboardLinks('ADMIN'),
      {
        prestations:
          '/ct/admin/prestations',
        stock:
          '/ct/admin/stock',
      },
    );

    assert.deepEqual(
      ctDashboardLinks('OFFICER'),
      {
        prestations:
          '/ct/officer/prestations',
        stock:
          '/ct/officer/stock',
      },
    );

    assert.deepEqual(
      ctDashboardLinks('SECRETARY'),
      {
        prestations:
          '/ct/secretary/prestations',
        stock:
          '/ct/secretary/stock',
      },
    );
  },
);

test(
  'shared CT paths preserve the verified role without authorization logic',
  () => {
    assert.equal(
      ctPath(
        'ADMIN',
        '/prestations',
      ),
      '/ct/admin/prestations',
    );

    assert.equal(
      ctPath(
        'OFFICER',
        '/prestations/nouveau',
      ),
      '/ct/officer/prestations/nouveau',
    );

    assert.equal(
      ctPath(
        'SECRETARY',
        'clients',
      ),
      '/ct/secretary/clients',
    );
  },
);

test(
  'active CT routing and shared modules contain no legacy admin route',
  () => {
    const files = [
      'app/ct/[role]/layout.tsx',
      'app/ct/[role]/prestations/page.tsx',
      'components/page-header.tsx',
      'components/modules/orders-page.tsx',
      'components/modules/order-receipt-page.tsx',
    ];

    for (const file of files) {
      assert.equal(
        readFileSync(
          file,
          'utf8',
        ).includes('/admin'),
        false,
        `${file} must not reference /admin`,
      );
    }
  },
);

test(
  'prestations server permissions distinguish view, create, and cancellation rights',
  () => {
    const officer =
      effectivePermissions(
        {
          role: 'OFFICER',
        },
        permissions,
      );

    assert.equal(
      officer.includes('ORDERS_VIEW'),
      true,
    );

    assert.equal(
      officer.includes('ORDERS_CREATE'),
      true,
    );

    assert.equal(
      officer.includes('ORDERS_CANCEL'),
      false,
    );

    const secretary =
      effectivePermissions(
        {
          role: 'SECRETARY',
        },
        permissions,
      );

    assert.equal(
      secretary.includes('ORDERS_VIEW'),
      true,
    );

    assert.equal(
      secretary.includes('ORDERS_CREATE'),
      true,
    );

    assert.equal(
      secretary.includes('ORDERS_CANCEL'),
      false,
    );

    const secretaryNoCreate =
      effectivePermissions(
        {
          role: 'SECRETARY',
          permissions: [
            {
              permission: 'ORDERS_CREATE',
              allowed: false,
            },
          ],
        },
        permissions,
      );

    assert.equal(
      secretaryNoCreate.includes(
        'ORDERS_CREATE',
      ),
      false,
    );
  },
);

test(
  'frontend hasPermission reads only the effective permission set',
  () => {
    assert.equal(
      hasPermission(
        [
          'CLIENTS_VIEW',
          'STOCK_VIEW',
        ],
        'STOCK_VIEW',
      ),
      true,
    );

    assert.equal(
      hasPermission(
        ['CLIENTS_VIEW'],
        'STOCK_VIEW',
      ),
      false,
    );
  },
);

test(
  'CT store contains safe UI identity, effective permissions, and sidebar state only',
  () => {
    const store = createCTStore({
      user: {
        id: 'u1',
        name: 'Secrétaire',
        email: 's@example.test',
        role: 'SECRETARY',
        organizationId,
        permissions: ['CLIENTS_VIEW'],
        mustChangePassword: false,
        onboardingCompleted: true,
      },

      organization: {
        id: organizationId,
        name: 'Imprimerie',
        logo: null,
      },
    });

    assert.equal(
      store
        .getState()
        .hasPermission(
          'CLIENTS_VIEW',
        ),
      true,
    );

    assert.equal(
      store
        .getState()
        .hasPermission(
          'STOCK_VIEW',
        ),
      false,
    );

    store
      .getState()
      .toggleSidebar();

    assert.equal(
      store
        .getState()
        .sidebarCollapsed,
      true,
    );

    store
      .getState()
      .clearAuth();

    assert.equal(
      store
        .getState()
        .permissions.length,
      0,
    );

    assert.equal(
      store
        .getState()
        .mustChangePassword,
      false,
    );

    assert.equal(
      store
        .getState()
        .onboardingCompleted,
      false,
    );

    assert.equal(
      'passwordHash' in store.getState(),
      false,
    );

    assert.equal(
      'sessionToken' in store.getState(),
      false,
    );
  },
);

test(
  'navigation is filtered by permission, not by a role-specific menu',
  () => {
    const secretaryEntries =
      filterCTNavigation([
        'DASHBOARD_VIEW',
        'CLIENTS_VIEW',
      ]);

    assert.deepEqual(
      secretaryEntries.map(
        (entry) => entry.href,
      ),
      ['', 'clients'],
    );

    const stockEntries =
      filterCTNavigation([
        'STOCK_VIEW',
      ]);

    assert.deepEqual(
      stockEntries.map(
        (entry) => entry.href,
      ),
      ['stock'],
    );
  },
);

test(
  'PermissionGate omits unauthorized content and renders authorized content',
  () => {
    const base = {
      user: {
        id: 'u1',
        name: 'User',
        email: 'u@example.test',
        role: 'SECRETARY' as const,
        organizationId,
        permissions:
          ['CLIENTS_VIEW'] as const,
        mustChangePassword: false,
        onboardingCompleted: true,
      },

      organization: {
        id: organizationId,
        name: 'Imprimerie',
        logo: null,
      },
    };

    const forbidden =
      renderToStaticMarkup(
        createElement(
          CTProvider,
          {
            initialState: base,
            children: createElement(
              PermissionGate,
              {
                permission:
                  'STOCK_VIEW',
                children:
                  createElement(
                    'span',
                    null,
                    'stock content',
                  ),
              },
            ),
          },
        ),
      );

    const allowed =
      renderToStaticMarkup(
        createElement(
          CTProvider,
          {
            initialState: base,
            children: createElement(
              PermissionGate,
              {
                permission:
                  'CLIENTS_VIEW',
                children:
                  createElement(
                    'span',
                    null,
                    'client content',
                  ),
              },
            ),
          },
        ),
      );

    assert.equal(
      forbidden.includes(
        'stock content',
      ),
      false,
    );

    assert.equal(
      allowed.includes(
        'client content',
      ),
      true,
    );
  },
);