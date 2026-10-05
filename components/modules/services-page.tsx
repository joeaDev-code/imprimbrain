"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Archive,
  Boxes,
  Check,
  ChevronDown,
  Edit3,
  Filter,
  Link2,
  Loader2,
  PackagePlus,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { fcfa } from "@/lib/money";
import type { CTRole } from "@/lib/ct-access";

type Service = {
  id: string;
  name: string;
  category?: string | null;
  unit: string;
  price: number | string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Stock = {
  id: string;
  name: string;
  unit: string;
};

type Rule = {
  id: string;
  serviceName: string;
  stockItemName: string;
  qtyPerUnit: number | string;
  stockUnit: string;
};

type ServiceForm = {
  name: string;
  category: string;
  unit: string;
  price: string;
};

type SearchableSelectProps = {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
  onCreate?: (value: string) => void;
  required?: boolean;
};

const emptyForm: ServiceForm = {
  name: "",
  category: "Impression",
  unit: "feuille",
  price: "",
};

const emptyRule = {
  serviceId: "",
  stockItemId: "",
  qtyPerUnit: "1",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function uniqueSorted(values: string[]) {
  const map = new Map<string, string>();

  for (const value of values) {
    const clean = value.trim();

    if (!clean) continue;

    const key = normalize(clean);

    if (!map.has(key)) {
      map.set(key, clean);
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
}

function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  onCreate,
  required = false,
}: SearchableSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClick,
      );
    };
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query);

    if (!normalizedQuery) {
      return options.slice(0, 12);
    }

    return options
      .filter((option) =>
        normalize(option).includes(normalizedQuery),
      )
      .slice(0, 12);
  }, [options, query]);

  const exactMatch = options.some(
    (option) => normalize(option) === normalize(query),
  );

  function select(valueToSet: string) {
    onChange(valueToSet);
    setQuery(valueToSet);
    setOpen(false);
  }

  function handleBlurLikeCreate() {
    const clean = query.trim();

    if (!clean) {
      onChange("");
      setQuery("");
      return;
    }

    if (!exactMatch && onCreate) {
      onCreate(clean);
    }

    onChange(clean);
    setQuery(clean);
    setOpen(false);
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      <label className="label">
        {label}{" "}
        {required && (
          <span className="text-red-500">*</span>
        )}
      </label>

      <div
        className={[
          "relative flex h-10 items-center overflow-hidden rounded-xl",
          "border border-slate-200 bg-white transition-all",
          open
            ? "border-cyan-400 ring-4 ring-cyan-500/10"
            : "hover:border-slate-300",
        ].join(" ")}
      >
        <Search
          size={15}
          className="ml-3 shrink-0 text-slate-400"
        />

        <input
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
          value={query}
          placeholder={placeholder}
          required={required}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }

            if (event.key === "Enter") {
              event.preventDefault();

              if (filtered.length > 0) {
                select(filtered[0]);
              } else {
                handleBlurLikeCreate();
              }
            }
          }}
        />

        {query ? (
          <button
            type="button"
            className="mr-1 grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={() => {
              setQuery("");
              onChange("");
              setOpen(true);
            }}
            aria-label={`Effacer ${label.toLowerCase()}`}
          >
            <X size={14} />
          </button>
        ) : null}

        <button
          type="button"
          className="grid h-full w-9 place-items-center text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          onClick={() => setOpen((current) => !current)}
          aria-label={`Ouvrir ${label.toLowerCase()}`}
        >
          <ChevronDown
            size={16}
            className={open ? "rotate-180 transition-transform" : "transition-transform"}
          />
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
          <div className="max-h-60 overflow-y-auto p-1.5">
            {filtered.length > 0 ? (
              filtered.map((option) => {
                const selected =
                  normalize(option) === normalize(value);

                return (
                  <button
                    key={option}
                    type="button"
                    className={[
                      "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      selected
                        ? "bg-cyan-50 font-bold text-cyan-700"
                        : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                    onClick={() => select(option)}
                  >
                    <span className="truncate">
                      {option}
                    </span>

                    {selected && (
                      <Check
                        size={15}
                        className="shrink-0"
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-xs text-slate-400">
                Aucun élément correspondant.
              </div>
            )}

            {query.trim() &&
              !exactMatch &&
              onCreate && (
                <button
                  type="button"
                  className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-slate-100 px-3 py-3 text-left text-sm font-bold text-cyan-700 hover:bg-cyan-50"
                  onClick={handleBlurLikeCreate}
                >
                  <Plus size={15} />
                  Utiliser « {query.trim()} »
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceFormFields({
  form,
  setForm,
  categories,
  units,
}: {
  form: ServiceForm;
  setForm: React.Dispatch<
    React.SetStateAction<ServiceForm>
  >;
  categories: string[];
  units: string[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <div className="xl:col-span-2">
        <label className="label">
          Nom du service{" "}
          <span className="text-red-500">*</span>
        </label>

        <input
          className="input"
          placeholder="Ex. Impression couleur A4"
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          required
          maxLength={160}
        />
      </div>

      <SearchableSelect
        label="Catégorie"
        value={form.category}
        options={categories}
        placeholder="Rechercher ou saisir..."
        onChange={(value) =>
          setForm((current) => ({
            ...current,
            category: value,
          }))
        }
        onCreate={(value) =>
          setForm((current) => ({
            ...current,
            category: value,
          }))
        }
      />

      <SearchableSelect
        label="Unité"
        value={form.unit}
        options={units}
        placeholder="Rechercher ou saisir..."
        onChange={(value) =>
          setForm((current) => ({
            ...current,
            unit: value,
          }))
        }
        onCreate={(value) =>
          setForm((current) => ({
            ...current,
            unit: value,
          }))
        }
      />

      <div>
        <label className="label">
          Prix{" "}
          <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <input
            className="input pr-14"
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                price: event.target.value,
              }))
            }
            placeholder="0"
            required
          />

          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wide text-slate-400">
            FCFA
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Services({
  ctRole,
}: {
  ctRole: CTRole;
}) {
  const [rows, setRows] = useState<Service[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);

  const [form, setForm] =
    useState<ServiceForm>(emptyForm);

  const [ruleForm, setRuleForm] =
    useState(emptyRule);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ruleSaving, setRuleSaving] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [togglingId, setTogglingId] =
    useState<string | null>(null);

  const [editingRuleId, setEditingRuleId] =
    useState<string | null>(null);

  const [deletingRuleId, setDeletingRuleId] =
    useState<string | null>(null);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [serviceToDelete, setServiceToDelete] =
    useState<Service | null>(null);

  const [ruleSearch, setRuleSearch] =
    useState("");

  async function load() {
    try {
      setLoading(true);

      const [servicesResponse, stockResponse, rulesResponse] =
        await Promise.all([
          fetch("/api/services"),
          fetch("/api/stock"),
          fetch("/api/consumption-rules"),
        ]);

      if (
        !servicesResponse.ok ||
        !stockResponse.ok ||
        !rulesResponse.ok
      ) {
        throw new Error(
          "Impossible de charger le catalogue.",
        );
      }

      const [services, stockItems, consumptionRules] =
        await Promise.all([
          servicesResponse.json(),
          stockResponse.json(),
          rulesResponse.json(),
        ]);

      setRows(
        Array.isArray(services) ? services : [],
      );

      setStock(
        Array.isArray(stockItems)
          ? stockItems
          : [],
      );

      setRules(
        Array.isArray(consumptionRules)
          ? consumptionRules
          : [],
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger le catalogue.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const categories = useMemo(
    () =>
      uniqueSorted(
        rows
          .map((service) => service.category || "")
          .filter(Boolean),
      ),
    [rows],
  );

  const units = useMemo(
    () =>
      uniqueSorted(
        rows
          .map((service) => service.unit || "")
          .filter(Boolean),
      ),
    [rows],
  );

  const activeCount = useMemo(
    () => rows.filter((service) => service.active).length,
    [rows],
  );

  const inactiveCount = rows.length - activeCount;

  const average = useMemo(() => {
    const activeServices = rows.filter(
      (service) => service.active,
    );

    if (!activeServices.length) {
      return 0;
    }

    return (
      activeServices.reduce(
        (sum, service) =>
          sum + Number(service.price),
        0,
      ) / activeServices.length
    );
  }, [rows]);

  const filtered = useMemo(() => {
    const query = normalize(search);

    return rows.filter((service) => {
      const matchesSearch =
        !query ||
        normalize(
          [
            service.name,
            service.category || "",
            service.unit,
          ].join(" "),
        ).includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          service.active) ||
        (statusFilter === "INACTIVE" &&
          !service.active);

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const filteredRules = useMemo(() => {
    const query = normalize(ruleSearch);

    if (!query) {
      return rules;
    }

    return rules.filter((rule) =>
      normalize(
        [
          rule.serviceName,
          rule.stockItemName,
          rule.stockUnit,
        ].join(" "),
      ).includes(query),
    );
  }, [rules, ruleSearch]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function addService(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    const name = form.name.trim();
    const category = form.category.trim();
    const unit = form.unit.trim();
    const price = Number(form.price);

    if (!name) {
      toast.error("Le nom du service est requis.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      toast.error("Veuillez saisir un prix valide.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/services",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            name,
            category,
            unit,
            price,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Impossible de créer le service.",
        );
      }

      resetForm();
      await load();

      toast.success("Service ajouté au catalogue.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue.",
      );
    } finally {
      setSaving(false);
    }
  }

  function startEdit(service: Service) {
    setEditingId(service.id);

    setForm({
      name: service.name,
      category: service.category || "",
      unit: service.unit || "unité",
      price: String(service.price),
    });

    setShowEditModal(true);
  }

  function closeEditModal() {
    if (saving) return;

    setShowEditModal(false);
    resetForm();
  }

  async function updateService(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!editingId) return;

    const name = form.name.trim();
    const category = form.category.trim();
    const unit = form.unit.trim();
    const price = Number(form.price);

    if (!name) {
      toast.error("Le nom du service est requis.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      toast.error("Veuillez saisir un prix valide.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/services",
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            id: editingId,
            name,
            category: category || null,
            unit: unit || "unité",
            price,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Impossible de modifier le service.",
        );
      }

      setShowEditModal(false);
      resetForm();

      await load();

      toast.success("Service modifié.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de modifier le service.",
      );
    } finally {
      setSaving(false);
    }
  }

  function askDelete(service: Service) {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deletingId) return;

    setShowDeleteModal(false);
    setServiceToDelete(null);
  }

  async function archiveService() {
    if (!serviceToDelete) return;

    try {
      setDeletingId(serviceToDelete.id);

      const response = await fetch(
        `/api/services?id=${encodeURIComponent(
          serviceToDelete.id,
        )}`,
        {
          method: "DELETE",
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Impossible d'archiver le service.",
        );
      }

      setShowDeleteModal(false);
      setServiceToDelete(null);

      await load();

      toast.success(
        "Service archivé. Son historique est conservé.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d'archiver le service.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleService(service: Service) {
    try {
      setTogglingId(service.id);

      const response = await fetch(
        "/api/services",
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            id: service.id,
            active: !service.active,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Impossible de modifier l'état du service.",
        );
      }

      await load();

      toast.success(
        service.active
          ? "Service désactivé."
          : "Service réactivé.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de modifier l'état du service.",
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function saveRule(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (
      !ruleForm.serviceId ||
      !ruleForm.stockItemId
    ) {
      toast.error(
        "Sélectionnez un service et un consommable.",
      );
      return;
    }

    const quantity = Number(
      ruleForm.qtyPerUnit,
    );

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("La quantité doit être supérieure à 0.");
      return;
    }

    try {
      setRuleSaving(true);

      const response = await fetch(
        "/api/consumption-rules",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            ...ruleForm,
            qtyPerUnit: quantity,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Impossible d'enregistrer la règle.",
        );
      }

      setRuleForm(emptyRule);
      setEditingRuleId(null);

      await load();

      toast.success(
        "Règle de consommation enregistrée.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer la règle.",
      );
    } finally {
      setRuleSaving(false);
    }
  }

  function editRule(rule: Rule) {
    const service = rows.find(
      (item) =>
        item.name === rule.serviceName,
    );

    const stockItem = stock.find(
      (item) =>
        item.name === rule.stockItemName &&
        item.unit === rule.stockUnit,
    );

    if (!service || !stockItem) {
      toast.error(
        "Impossible de retrouver les éléments de cette règle.",
      );
      return;
    }

    setEditingRuleId(rule.id);

    setRuleForm({
      serviceId: service.id,
      stockItemId: stockItem.id,
      qtyPerUnit: String(rule.qtyPerUnit),
    });

    window.scrollTo({
      top:
        document.body.scrollHeight,
      behavior: "smooth",
    });
  }

  async function deleteRule(id: string) {
    try {
      setDeletingRuleId(id);

      const response = await fetch(
        `/api/consumption-rules?id=${encodeURIComponent(
          id,
        )}`,
        {
          method: "DELETE",
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Suppression impossible.",
        );
      }

      await load();

      toast.success("Règle supprimée.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Suppression impossible.",
      );
    } finally {
      setDeletingRuleId(null);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          ctRole={ctRole}
          title="Services"
          subtitle="Gérez votre catalogue, vos tarifs et la consommation automatique du stock."
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="card group p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Settings2 size={18} />
              </div>

              <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Catalogue
              </span>
            </div>

            <p className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              {rows.length}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Services au catalogue
            </p>
          </div>

          <div className="card group p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-green-50 text-green-600">
                <Check size={18} />
              </div>

              <span className="rounded-full bg-green-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-green-600">
                Actifs
              </span>
            </div>

            <p className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              {activeCount}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Services disponibles
            </p>
          </div>

          <div className="card group p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <Link2 size={18} />
              </div>

              <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-blue-600">
                Stock
              </span>
            </div>

            <p className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              {rules.length}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Règles de consommation
            </p>
          </div>

          <div className="card group p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-violet-50 text-violet-600">
                <PackagePlus size={18} />
              </div>

              <span className="rounded-full bg-violet-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-violet-600">
                Prix
              </span>
            </div>

            <p className="mt-4 truncate text-2xl font-black tracking-tight text-slate-900">
              {fcfa(average)}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Prix moyen des actifs
            </p>
          </div>
        </section>

        <section className="card overflow-visible">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                  <Plus size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-black text-slate-900">
                    Nouveau service
                  </h2>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Ajoutez une prestation vendue par l'imprimerie.
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-500">
                {categories.length} catégorie
                {categories.length > 1 ? "s" : ""} ·{" "}
                {units.length} unité
                {units.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <form
            onSubmit={addService}
            className="p-5"
          >
            <ServiceFormFields
              form={form}
              setForm={setForm}
              categories={categories}
              units={units}
            />

            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] leading-5 text-slate-500">
                Les catégories et unités déjà utilisées sont
                proposées automatiquement. Vous pouvez aussi
                saisir une nouvelle valeur.
              </p>

              <button
                type="submit"
                className="btn btn-primary inline-flex shrink-0 items-center justify-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Plus size={15} />
                )}

                {saving
                  ? "Ajout…"
                  : "Ajouter le service"}
              </button>
            </div>
          </form>
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-slate-900">
                    Catalogue
                  </h2>

                  {loading && (
                    <Loader2
                      size={14}
                      className="animate-spin text-cyan-500"
                    />
                  )}
                </div>

                <p className="mt-1 text-[11px] text-slate-400">
                  {filtered.length} résultat
                  {filtered.length > 1 ? "s" : ""} sur{" "}
                  {rows.length} service
                  {rows.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 sm:w-72">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    className="input pl-9"
                    placeholder="Rechercher un service..."
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                  />

                  {search && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => setSearch("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <Filter
                    size={14}
                    className="ml-2 mr-1 text-slate-400"
                  />

                  {(
                    [
                      ["ALL", "Tous"],
                      ["ACTIVE", "Actifs"],
                      ["INACTIVE", "Archivés"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={[
                        "rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all",
                        statusFilter === value
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-400 hover:text-slate-700",
                      ].join(" ")}
                      onClick={() =>
                        setStatusFilter(value)
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-56 items-center justify-center">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Loader2
                  size={17}
                  className="animate-spin text-cyan-500"
                />
                Chargement du catalogue…
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                <Search size={20} />
              </div>

              <h3 className="mt-4 text-sm font-black text-slate-800">
                Aucun service trouvé
              </h3>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                Modifiez votre recherche ou ajoutez un
                nouveau service au catalogue.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table min-w-[980px]">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Catégorie</th>
                    <th>Unité</th>
                    <th>Prix</th>
                    <th>État</th>
                    <th className="text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((service) => (
                    <tr
                      key={service.id}
                      className="group"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className={[
                              "grid size-9 shrink-0 place-items-center rounded-xl text-xs font-black",
                              service.active
                                ? "bg-cyan-50 text-cyan-700"
                                : "bg-slate-100 text-slate-400",
                            ].join(" ")}
                          >
                            {service.name
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p
                              className={[
                                "truncate font-bold",
                                service.active
                                  ? "text-slate-800"
                                  : "text-slate-400 line-through",
                              ].join(" ")}
                            >
                              {service.name}
                            </p>

                            {!service.active && (
                              <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                                Service archivé
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                          {service.category || "Sans catégorie"}
                        </span>
                      </td>

                      <td className="font-medium text-slate-600">
                        {service.unit}
                      </td>

                      <td className="font-black text-slate-800">
                        {fcfa(Number(service.price))}
                      </td>

                      <td>
                        <span
                          className={
                            service.active
                              ? "badge badge-ok"
                              : "badge"
                          }
                        >
                          {service.active
                            ? "Actif"
                            : "Archivé"}
                        </span>
                      </td>

                      <td>
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 transition-all hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                            onClick={() =>
                              startEdit(service)
                            }
                            title="Modifier"
                          >
                            <Edit3 size={13} />
                            Modifier
                          </button>

                          <button
                            type="button"
                            className={[
                              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-bold transition-all",
                              service.active
                                ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                : "border-green-200 bg-green-50 text-green-600 hover:bg-green-100",
                            ].join(" ")}
                            onClick={() =>
                              service.active
                                ? askDelete(service)
                                : toggleService(service)
                            }
                            disabled={
                              deletingId ===
                                service.id ||
                              togglingId ===
                                service.id
                            }
                            title={
                              service.active
                                ? "Archiver"
                                : "Réactiver"
                            }
                          >
                            {deletingId ===
                              service.id ||
                            togglingId ===
                              service.id ? (
                              <Loader2
                                size={13}
                                className="animate-spin"
                              />
                            ) : service.active ? (
                              <Archive size={13} />
                            ) : (
                              <RotateCcw size={13} />
                            )}

                            {service.active
                              ? "Archiver"
                              : "Réactiver"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {inactiveCount > 0 &&
            statusFilter === "ALL" && (
              <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                <p className="text-[10px] font-medium text-slate-400">
                  {inactiveCount} service
                  {inactiveCount > 1 ? "s" : ""} archivé
                  {inactiveCount > 1 ? "s" : ""} masqué
                  {inactiveCount > 1 ? "s" : ""} des
                  prestations actives. L'historique est
                  conservé.
                </p>
              </div>
            )}
        </section>

        <section className="space-y-4 pt-2">
          <PageHeader
            ctRole={ctRole}
            title="Règles de consommation"
            subtitle="Associez un service à un consommable pour automatiser la sortie de stock."
          />

          <form
            onSubmit={saveRule}
            className="card overflow-visible"
          >
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-green-50 text-green-600">
                  <Link2 size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-black text-slate-900">
                    {editingRuleId
                      ? "Modifier la règle"
                      : "Nouvelle règle"}
                  </h2>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Définissez la quantité de stock consommée
                    pour une unité de prestation.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_auto]">
              <div>
                <label className="label">
                  Service{" "}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  className="input"
                  value={ruleForm.serviceId}
                  onChange={(event) =>
                    setRuleForm((current) => ({
                      ...current,
                      serviceId:
                        event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">
                    Choisir un service
                  </option>

                  {rows
                    .filter((service) => service.active)
                    .map((service) => (
                      <option
                        key={service.id}
                        value={service.id}
                      >
                        {service.name} —{" "}
                        {fcfa(
                          Number(service.price),
                        )}
                        /{service.unit}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="label">
                  Consommable{" "}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  className="input"
                  value={ruleForm.stockItemId}
                  onChange={(event) =>
                    setRuleForm((current) => ({
                      ...current,
                      stockItemId:
                        event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">
                    Choisir un article
                  </option>

                  {stock.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name} ({item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  Quantité / unité{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  className="input"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={ruleForm.qtyPerUnit}
                  onChange={(event) =>
                    setRuleForm((current) => ({
                      ...current,
                      qtyPerUnit:
                        event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="btn btn-primary inline-flex h-10 flex-1 items-center justify-center gap-1.5"
                  disabled={ruleSaving}
                >
                  {ruleSaving ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  ) : editingRuleId ? (
                    <Check size={14} />
                  ) : (
                    <Plus size={14} />
                  )}

                  {ruleSaving
                    ? "Enregistrement…"
                    : editingRuleId
                      ? "Mettre à jour"
                      : "Enregistrer"}
                </button>

                {editingRuleId && (
                  <button
                    type="button"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    onClick={() => {
                      setEditingRuleId(null);
                      setRuleForm(emptyRule);
                    }}
                    title="Annuler"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
          </form>

          <section className="card overflow-hidden">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-900">
                    Règles actives
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Ces règles déterminent la consommation
                    automatique lors d'une prestation.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    className="input pl-9"
                    placeholder="Rechercher une règle..."
                    value={ruleSearch}
                    onChange={(event) =>
                      setRuleSearch(
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table min-w-[780px]">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Consommable</th>
                    <th>Consommation</th>
                    <th className="text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRules.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-12 text-center"
                      >
                        <div className="mx-auto flex max-w-sm flex-col items-center">
                          <div className="grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                            <Boxes size={19} />
                          </div>

                          <p className="mt-3 text-xs font-bold text-slate-700">
                            Aucune règle trouvée
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            Configurez une règle pour automatiser
                            la consommation du stock.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRules.map((rule) => (
                      <tr key={rule.id}>
                        <td className="font-bold text-slate-800">
                          {rule.serviceName}
                        </td>

                        <td>
                          <span className="inline-flex items-center gap-2">
                            <span className="grid size-7 place-items-center rounded-lg bg-slate-100 text-slate-500">
                              <Boxes size={13} />
                            </span>

                            {rule.stockItemName}
                          </span>
                        </td>

                        <td>
                          <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-[10px] font-bold text-cyan-700">
                            {rule.qtyPerUnit}{" "}
                            {rule.stockUnit}
                          </span>
                        </td>

                        <td>
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                              onClick={() =>
                                editRule(rule)
                              }
                            >
                              <Edit3 size={13} />
                              Modifier
                            </button>

                            <button
                              type="button"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[10px] font-bold text-red-600 hover:bg-red-100"
                              onClick={() =>
                                deleteRule(rule.id)
                              }
                              disabled={
                                deletingRuleId ===
                                rule.id
                              }
                            >
                              {deletingRuleId ===
                              rule.id ? (
                                <Loader2
                                  size={13}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={13} />
                              )}

                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>

      {showEditModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div className="w-full max-w-3xl overflow-visible rounded-3xl border border-white/60 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
                  <Edit3 size={18} />
                </div>

                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Modifier le service
                  </h2>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Modifiez les informations et le tarif de
                    cette prestation.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={closeEditModal}
                disabled={saving}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={updateService}
              className="p-5 sm:p-6"
            >
              <ServiceFormFields
                form={form}
                setForm={setForm}
                categories={categories}
                units={units}
              />

              <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="btn"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="btn btn-primary inline-flex items-center justify-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Check size={15} />
                  )}

                  {saving
                    ? "Enregistrement…"
                    : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal &&
        serviceToDelete && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeDeleteModal();
              }
            }}
          >
            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]">
              <div className="p-6">
                <div className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                  <Archive size={21} />
                </div>

                <h2 className="mt-5 text-lg font-black text-slate-900">
                  Archiver ce service ?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Le service{" "}
                  <strong className="text-slate-800">
                    {serviceToDelete.name}
                  </strong>{" "}
                  ne sera plus proposé pour les nouvelles
                  prestations.
                </p>

                <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3.5">
                  <p className="text-[11px] font-semibold leading-5 text-cyan-800">
                    Son historique et les anciennes commandes
                    restent conservés. Vous pourrez le réactiver
                    plus tard.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="btn"
                  onClick={closeDeleteModal}
                  disabled={Boolean(deletingId)}
                >
                  Annuler
                </button>

                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-sm shadow-red-600/20 transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={archiveService}
                  disabled={Boolean(deletingId)}
                >
                  {deletingId ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Archive size={15} />
                  )}

                  {deletingId
                    ? "Archivage…"
                    : "Archiver le service"}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}