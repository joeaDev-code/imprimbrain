"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Save,
  ShieldCheck,
  UserPlus,
  Users,
  UserRoundCheck,
  UserRoundX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import type { CTRole } from "@/lib/ct-access";

type Permission =
  | "DASHBOARD_VIEW"
  | "CLIENTS_VIEW"
  | "CLIENTS_CREATE"
  | "CLIENTS_UPDATE"
  | "CLIENTS_DELETE"
  | "SERVICES_VIEW"
  | "SERVICES_CREATE"
  | "SERVICES_UPDATE"
  | "SERVICES_DELETE"
  | "ORDERS_VIEW"
  | "ORDERS_CREATE"
  | "ORDERS_UPDATE"
  | "ORDERS_CANCEL"
  | "PAYMENTS_VIEW"
  | "PAYMENTS_CREATE"
  | "EXPENSES_VIEW"
  | "EXPENSES_CREATE"
  | "EXPENSES_UPDATE"
  | "STOCK_VIEW"
  | "STOCK_CREATE"
  | "STOCK_UPDATE"
  | "STOCK_ADJUST"
  | "STOCK_RESTOCK"
  | "EMPLOYEES_VIEW"
  | "EMPLOYEES_CREATE"
  | "EMPLOYEES_UPDATE"
  | "EMPLOYEES_DISABLE"
  | "SETTINGS_VIEW"
  | "SETTINGS_UPDATE"
  | "AUDIT_VIEW";

type EmployeePermission = {
  permission: Permission;
  allowed: boolean;
};

type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  permissions?: EmployeePermission[];
};

type PermissionGroup = {
  label: string;
  permissions: {
    key: Permission;
    label: string;
  }[];
};

const empty = {
  name: "",
  email: "",
  password: "",
  role: "SECRETARY",
};

const roleLabel: Record<string, string> = {
  SECRETARY: "Secrétaire",
  OFFICER: "Officier",
  ADMIN: "Administrateur",
  SUPER_ADMIN: "Super administrateur",
};

const permissionGroups: PermissionGroup[] = [
  {
    label: "Tableau de bord",
    permissions: [
      {
        key: "DASHBOARD_VIEW",
        label: "Consulter le tableau de bord",
      },
    ],
  },
  {
    label: "Clients",
    permissions: [
      {
        key: "CLIENTS_VIEW",
        label: "Consulter les clients",
      },
      {
        key: "CLIENTS_CREATE",
        label: "Créer un client",
      },
      {
        key: "CLIENTS_UPDATE",
        label: "Modifier un client",
      },
      {
        key: "CLIENTS_DELETE",
        label: "Supprimer un client",
      },
    ],
  },
  {
    label: "Services",
    permissions: [
      {
        key: "SERVICES_VIEW",
        label: "Consulter les services",
      },
      {
        key: "SERVICES_CREATE",
        label: "Créer un service",
      },
      {
        key: "SERVICES_UPDATE",
        label: "Modifier un service",
      },
      {
        key: "SERVICES_DELETE",
        label: "Supprimer un service",
      },
    ],
  },
  {
    label: "Prestations",
    permissions: [
      {
        key: "ORDERS_VIEW",
        label: "Consulter les prestations",
      },
      {
        key: "ORDERS_CREATE",
        label: "Créer une prestation",
      },
      {
        key: "ORDERS_UPDATE",
        label: "Modifier une prestation",
      },
      {
        key: "ORDERS_CANCEL",
        label: "Annuler une prestation",
      },
    ],
  },
  {
    label: "Paiements",
    permissions: [
      {
        key: "PAYMENTS_VIEW",
        label: "Consulter les paiements",
      },
      {
        key: "PAYMENTS_CREATE",
        label: "Enregistrer un paiement",
      },
    ],
  },
  {
    label: "Stock",
    permissions: [
      {
        key: "STOCK_VIEW",
        label: "Consulter le stock",
      },
      {
        key: "STOCK_CREATE",
        label: "Créer un article",
      },
      {
        key: "STOCK_UPDATE",
        label: "Modifier le stock",
      },
      {
        key: "STOCK_ADJUST",
        label: "Ajuster le stock",
      },
      {
        key: "STOCK_RESTOCK",
        label: "Réapprovisionner",
      },
    ],
  },
  {
    label: "Dépenses",
    permissions: [
      {
        key: "EXPENSES_VIEW",
        label: "Consulter les dépenses",
      },
      {
        key: "EXPENSES_CREATE",
        label: "Créer une dépense",
      },
      {
        key: "EXPENSES_UPDATE",
        label: "Modifier une dépense",
      },
    ],
  },
  {
    label: "Employés",
    permissions: [
      {
        key: "EMPLOYEES_VIEW",
        label: "Consulter les employés",
      },
      {
        key: "EMPLOYEES_CREATE",
        label: "Créer un employé",
      },
      {
        key: "EMPLOYEES_UPDATE",
        label: "Modifier un employé",
      },
      {
        key: "EMPLOYEES_DISABLE",
        label: "Désactiver / réactiver un employé",
      },
    ],
  },
  {
    label: "Paramètres",
    permissions: [
      {
        key: "SETTINGS_VIEW",
        label: "Consulter les paramètres",
      },
      {
        key: "SETTINGS_UPDATE",
        label: "Modifier les paramètres",
      },
    ],
  },
  {
    label: "Audit",
    permissions: [
      {
        key: "AUDIT_VIEW",
        label: "Consulter le journal d'audit",
      },
    ],
  },
];

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "E"
  );
}

function getPermissionState(
  employee: Employee,
  permission: Permission,
) {
  return (
    employee.permissions?.find(
      (entry) => entry.permission === permission,
    )?.allowed ?? false
  );
}

function countPermissions(employee: Employee) {
  return (
    employee.permissions?.filter((permission) => permission.allowed)
      .length ?? 0
  );
}

export default function Employees({
  ctRole,
}: {
  ctRole: CTRole;
}) {
  const [rows, setRows] = useState<Employee[]>([]);
  const [f, setF] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [permissionEmployee, setPermissionEmployee] =
    useState<Employee | null>(null);

  const [permissionState, setPermissionState] = useState<
    Record<Permission, boolean>
  >({} as Record<Permission, boolean>);

  const [savingPermissions, setSavingPermissions] =
    useState(false);

  async function load() {
    try {
      setLoading(true);

      const r = await fetch("/api/employees", {
        cache: "no-store",
      });

      if (!r.ok) {
        throw new Error();
      }

      const d = await r.json();

      setRows(Array.isArray(d) ? d : []);
    } catch {
      toast.error("Impossible de charger les employés.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      setSaving(true);

      const r = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(f),
      });

      const d = await r.json().catch(() => null);

      if (!r.ok) {
        throw new Error(
          d?.error || "Impossible de créer le compte.",
        );
      }

      setF(empty);

      await load();

      toast.success("Compte employé créé.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Une erreur est survenue.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function patch(
    id: string,
    data: Record<string, unknown>,
    successMessage = "Employé mis à jour.",
  ) {
    try {
      const r = await fetch("/api/employees", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...data,
        }),
      });

      const d = await r.json().catch(() => null);

      if (!r.ok) {
        toast.error(
          d?.error || "Modification impossible.",
        );
        return false;
      }

      await load();

      toast.success(successMessage);

      return true;
    } catch {
      toast.error("Une erreur est survenue.");
      return false;
    }
  }

  function openPermissions(employee: Employee) {
    const state = {} as Record<Permission, boolean>;

    for (const group of permissionGroups) {
      for (const item of group.permissions) {
        state[item.key] = getPermissionState(
          employee,
          item.key,
        );
      }
    }

    setPermissionState(state);
    setPermissionEmployee(employee);
  }

  function togglePermission(permission: Permission) {
    setPermissionState((current) => ({
      ...current,
      [permission]: !current[permission],
    }));
  }

  function setGroupPermissions(
    group: PermissionGroup,
    value: boolean,
  ) {
    setPermissionState((current) => {
      const next = {
        ...current,
      };

      for (const item of group.permissions) {
        next[item.key] = value;
      }

      return next;
    });
  }

  async function savePermissions() {
    if (!permissionEmployee) {
      return;
    }

    try {
      setSavingPermissions(true);

      const permissions = Object.entries(permissionState).map(
        ([permission, allowed]) => ({
          permission,
          allowed,
        }),
      );

      const response = await fetch("/api/employees", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          id: permissionEmployee.id,
          permissions,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof data?.error === "string"
            ? data.error
            : "Impossible d'enregistrer les autorisations.";

        toast.error(message);
        return;
      }

      const savedPermissions: EmployeePermission[] = permissions.map(
        (item) => ({
          permission: item.permission as Permission,
          allowed: item.allowed,
        }),
      );

      setRows((current) =>
        current.map((employee) =>
          employee.id === permissionEmployee.id
            ? {
                ...employee,
                permissions: savedPermissions,
              }
            : employee,
        ),
      );

      toast.success("Autorisations mises à jour.");
      setPermissionEmployee(null);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des autorisations:", error);
      toast.error("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSavingPermissions(false);
    }
  }

  const active = rows.filter((r) => r.active).length;

  const permissionCount = useMemo(
    () =>
      permissionEmployee
        ? Object.values(permissionState).filter(Boolean).length
        : 0,
    [permissionEmployee, permissionState],
  );

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          ctRole={ctRole}
          title="Employés"
          subtitle="Gérez les comptes, les rôles et les autorisations de votre imprimerie."
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
              <Users size={17} />
            </div>

            <p className="mt-3 text-xl font-black">
              {rows.length}
            </p>

            <p className="text-[10px] text-slate-500">
              Comptes employés
            </p>
          </div>

          <div className="card p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-green-50 text-green-600">
              <UserRoundCheck size={17} />
            </div>

            <p className="mt-3 text-xl font-black">
              {active}
            </p>

            <p className="text-[10px] text-slate-500">
              Comptes actifs
            </p>
          </div>

          <div className="card p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-600">
              <ShieldCheck size={17} />
            </div>

            <p className="mt-3 text-xl font-black">
              {new Set(rows.map((r) => r.role)).size}
            </p>

            <p className="text-[10px] text-slate-500">
              Rôles utilisés
            </p>
          </div>
        </section>

        <form
          onSubmit={add}
          className="card overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
              <UserPlus size={17} />
            </div>

            <div>
              <h2 className="text-sm font-black">
                Nouveau compte
              </h2>

              <p className="text-[10px] text-slate-400">
                Créez un accès avec un rôle adapté.
              </p>
            </div>
          </div>

          <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="label">
                Nom complet{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                className="input"
                placeholder="Ex. Marie Kouassi"
                value={f.name}
                onChange={(e) =>
                  setF({
                    ...f,
                    name: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="label">
                E-mail{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                className="input"
                type="email"
                placeholder="marie@..."
                value={f.email}
                onChange={(e) =>
                  setF({
                    ...f,
                    email: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="label">
                Mot de passe temporaire{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                className="input"
                type="password"
                minLength={8}
                value={f.password}
                onChange={(e) =>
                  setF({
                    ...f,
                    password: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="label">
                Rôle{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                className="input"
                value={f.role}
                onChange={(e) =>
                  setF({
                    ...f,
                    role: e.target.value,
                  })
                }
              >
                <option value="SECRETARY">
                  Secrétaire
                </option>

                <option value="OFFICER">
                  Officier
                </option>

                <option value="ADMIN">
                  Administrateur
                </option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-3 md:col-span-2 xl:col-span-4">
              <p className="text-[10px] text-slate-400">
                Le mot de passe pourra être changé par
                l'utilisateur selon votre politique d'accès.
              </p>

              <button
                className="btn btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Création…"
                  : "Créer le compte"}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
  <div className="border-b border-slate-200/80 px-6 py-5">
    <h2 className="text-[15px] font-black text-slate-900">
      Comptes existants
    </h2>
    <p className="mt-1 text-xs font-medium text-slate-500">
      Gérez les rôles, les autorisations et l'état des comptes.
    </p>
  </div>

  <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
    <table className="w-full min-w-[980px] text-left">
      <thead className="bg-slate-50/50">
        <tr>
          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Employé</th>
          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Rôle</th>
          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Autorisations</th>
          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">État</th>
          <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100/80">
        {loading ? (
          <tr>
            <td
              colSpan={5}
              className="py-12 text-center text-sm font-medium text-slate-400"
            >
              Chargement…
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td
              colSpan={5}
              className="py-12 text-center text-sm font-medium text-slate-400"
            >
              Aucun employé.
            </td>
          </tr>
        ) : (
          rows.map((r) => (
            <tr key={r.id} className="transition-colors hover:bg-slate-50/40">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3.5">
                  <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-[13px] font-black text-white shadow-inner">
                    {getInitials(r.name)}
                  </div>

                  <div>
                    <p className="text-[13px] font-bold text-slate-900">
                      {r.name}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">
                      {r.email}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4">
                <select
                  className="h-10 w-full max-w-[180px] cursor-pointer rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 text-[13px] font-semibold text-slate-700 outline-none transition-all focus:border-[#173b68] focus:bg-white focus:ring-1 focus:ring-[#173b68]"
                  value={r.role}
                  onChange={(e) =>
                    patch(r.id, {
                      role: e.target.value,
                    })
                  }
                >
                  {Object.entries(roleLabel)
                    .filter(([k]) => k !== "SUPER_ADMIN")
                    .map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                </select>
              </td>

              <td className="px-6 py-4">
                <button
                  type="button"
                  onClick={() => openPermissions(r)}
                  className="group inline-flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-1.5 pr-3.5 transition-all hover:border-cyan-300 hover:bg-cyan-50/50 hover:shadow-sm active:scale-95"
                >
                  <span className="grid size-8 place-items-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-cyan-100 group-hover:text-cyan-700">
                    <ShieldCheck size={16} strokeWidth={2.5} />
                  </span>

                  <span className="text-left">
                    <span className="block text-[12px] font-bold text-slate-800">
                      {countPermissions(r)} autorisation
                      {countPermissions(r) > 1 ? "s" : ""}
                    </span>

                    <span className="block text-[10px] font-semibold text-slate-400">
                      Gérer les accès
                    </span>
                  </span>

                  <ChevronDown
                    size={14}
                    strokeWidth={3}
                    className="ml-2 text-slate-300 transition-transform group-hover:text-cyan-600"
                  />
                </button>
              </td>

              <td className="px-6 py-4">
                {r.active ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    <UserRoundCheck size={13} strokeWidth={2.5} />
                    Actif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                    <UserRoundX size={13} strokeWidth={2.5} />
                    Désactivé
                  </span>
                )}
              </td>

              <td className="px-6 py-4 text-right">
                <button
                  type="button"
                  className={`inline-flex h-9 items-center justify-center rounded-xl px-4 text-[12px] font-bold transition-all active:scale-95 ${
                    r.active
                      ? "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
                  }`}
                  onClick={() =>
                    patch(r.id, {
                      active: !r.active,
                    })
                  }
                >
                  {r.active ? "Désactiver" : "Réactiver"}
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</section>
      </div>

      {permissionEmployee && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPermissionEmployee(null);
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-black text-white">
                  {getInitials(permissionEmployee.name)}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-sm font-black text-slate-900">
                    Autorisations
                  </h2>

                  <p className="truncate text-[10px] text-slate-400">
                    {permissionEmployee.name} ·{" "}
                    {
                      roleLabel[
                        permissionEmployee.role
                      ]
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPermissionEmployee(null)
                }
                className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-slate-700">
                    Permissions effectives
                  </p>

                  <p className="text-[10px] text-slate-400">
                    Les autorisations sont enregistrées
                    pour cet employé.
                  </p>
                </div>

                <span className="rounded-full bg-cyan-100 px-3 py-1 text-[10px] font-black text-cyan-700">
                  {permissionCount} active
                  {permissionCount > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="space-y-3">
                {permissionGroups.map((group) => {
                  const enabledCount =
                    group.permissions.filter(
                      (item) =>
                        permissionState[item.key],
                    ).length;

                  const allEnabled =
                    enabledCount ===
                    group.permissions.length;

                  return (
                    <div
                      key={group.label}
                      className="overflow-hidden rounded-2xl border border-slate-200"
                    >
                      <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-xs font-black text-slate-800">
                            {group.label}
                          </p>

                          <p className="text-[9px] text-slate-400">
                            {enabledCount}/
                            {group.permissions.length}{" "}
                            autorisations
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setGroupPermissions(
                              group,
                              !allEnabled,
                            )
                          }
                          className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700"
                        >
                          {allEnabled
                            ? "Tout désactiver"
                            : "Tout activer"}
                        </button>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {group.permissions.map(
                          (item) => {
                            const checked =
                              !!permissionState[
                                item.key
                              ];

                            return (
                              <label
                                key={item.key}
                                className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 transition hover:bg-slate-50"
                              >
                                <span className="min-w-0">
                                  <span className="block text-xs font-semibold text-slate-700">
                                    {item.label}
                                  </span>

                                  <span className="mt-0.5 block text-[9px] text-slate-400">
                                    {item.key}
                                  </span>
                                </span>

                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    togglePermission(
                                      item.key,
                                    )
                                  }
                                  className="peer sr-only"
                                />

                                <span
                                  className={`grid size-6 shrink-0 place-items-center rounded-lg border transition ${
                                    checked
                                      ? "border-cyan-500 bg-cyan-500 text-white"
                                      : "border-slate-300 bg-white text-transparent"
                                  }`}
                                >
                                  <Check size={14} />
                                </span>
                              </label>
                            );
                          },
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4">
              <button
                type="button"
                className="btn"
                onClick={() =>
                  setPermissionEmployee(null)
                }
                disabled={savingPermissions}
              >
                Annuler
              </button>

              <button
                type="button"
                className="btn btn-primary inline-flex items-center gap-2"
                onClick={savePermissions}
                disabled={savingPermissions}
              >
                <Save size={15} />

                {savingPermissions
                  ? "Enregistrement…"
                  : "Enregistrer les autorisations"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}