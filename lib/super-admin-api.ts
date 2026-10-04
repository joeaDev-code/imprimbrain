export type Organization = {
  id: string;
  name: string;
  slug: string;
  status?: string;
  createdAt: string;
  membersCount?: number;
  eventsCount?: number;
  auditLogsCount?: number;
  logoUrl?: string | null;
  subscriptionsCount?: number;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  users?: { id: string; name: string; email: string; role: string; active: boolean; createdAt: string }[];
  subscriptions?: { id: string; amount: string; currency: string; status: string; startsAt: string; expiresAt: string }[];
  payments?: { id: string; amount: string; currency: string; status: string; reference: string | null; method: string; paidAt: string }[];
};

export type CreatedOrganization = {
  organization: { id: string; name: string; slug: string; logoUrl: string; createdAt: string };
  administrator: { id: string; email: string; role: string };
  subscription: { id: string; amount: number; currency: string; status: string; startsAt: string; expiresAt: string };
  payment: { id: string; amount: number; currency: string; status: string; reference: string; paidAt: string };
  email: { status: 'sent' | 'failed' | 'not_configured' };
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  platformRole: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  organization: { id: string; name: string; slug: string } | null;
  membershipsCount: number;
};

export type SuperAdminAuditLog = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  user: { name: string; email: string } | null;
  organization: { name: string; slug: string } | null;
};

export type SuperAdminPayment = {
  id: string;
  amount: string;
  method: string;
  paidAt: string;
  status: string;
  currency: string;
  reference: string | null;
  order: { id: string; ref: string; organization: { id: string; name: string; slug: string } } | null;
  organization: { id: string; name: string; slug: string } | null;
  subscription: { id: string } | null;
};

export type Dashboard = {
  organizations: number;
  users: number;
  payments: number;
  activeSubscriptions: number;
  subscriptionRevenue: number;
  expiredSubscriptions: number;
  suspendedOrganizations: number;
  expiringSoon: number;
};

export type SuperAdminSubscription = {
  id: string;
  organization: { id: string; name: string; slug: string; status: string };
  amount: number;
  currency: string;
  status: string;
  startsAt: string;
  expiresAt: string;
  expired: boolean;
};

const BASE = "/api/super-admin";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData) && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "La requête a échoué.");
  return data as T;
}

export const superAdminApi = {
  dashboard: () => request<Dashboard>("/overview"),
  organizations: (query = "") => request<Organization[]>(`/organisations${query ? `?q=${encodeURIComponent(query)}` : ""}`),
  organization: (id: string) => request<Organization>(`/organisations/${encodeURIComponent(id)}`),
  createOrganization: (body: FormData) => request<CreatedOrganization>("/organisations", { method: "POST", body }),
  updateOrganization: (id: string, body: { name?: string; slug?: string; phone?: string; email?: string; address?: string }) =>
    request<{ ok: true }>(`/organisations/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) }),
  organizationAction: (
    id: string,
    action: "suspend" | "reactivate" | "archive" | "renew",
    body?: { months?: number; amount?: number; method?: string; reference?: string },
  ) =>
    request<{ ok: true; status?: string }>(`/organisations/${encodeURIComponent(id)}/actions`, {
      method: "POST",
      body: JSON.stringify({ action, ...body }),
    }),
  subscriptions: () => request<SuperAdminSubscription[]>("/abonnements"),
  users: () => request<AdminUser[]>("/utilisateurs"),
  payments: () => request<SuperAdminPayment[]>("/payments"),
  audit: () => request<SuperAdminAuditLog[]>("/audit-logs"),
};
