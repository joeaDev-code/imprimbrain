"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  ClipboardCheck,
  PackagePlus,
  Search,
  TriangleAlert,
  Warehouse,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { fcfa } from "@/lib/money";

type StockItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number | string;
  minThreshold: number | string;
  unitCost: number | string;
  barcode?: string | null;
};

const empty = {
  name: "",
  unit: "feuille",
  quantity: "",
  minThreshold: "",
  unitCost: "",
  barcode: "",
};

type ModalType = "restock" | "adjust" | null;

export default function Stock() {
  const [rows, setRows] = useState<StockItem[]>([]);
  const [f, setF] = useState(empty);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] =
    useState<StockItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState("");

  async function load() {
    try {
      setLoading(true);

      const r = await fetch("/api/stock");

      if (!r.ok) {
        throw new Error();
      }

      const d = await r.json();
      setRows(Array.isArray(d) ? d : []);
    } catch {
      toast.error("Impossible de charger le stock.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();

    if (!f.name.trim()) {
      toast.error("Le nom de l'article est obligatoire.");
      return;
    }

    try {
      setSaving(true);

      const r = await fetch("/api/stock", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...f,
          name: f.name.trim(),
          quantity: Number(f.quantity || 0),
          minThreshold: Number(f.minThreshold || 0),
          unitCost: Number(f.unitCost || 0),
        }),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => null);

        throw new Error(
          data?.error || "Impossible d'ajouter l'article.",
        );
      }

      setF(empty);
      await load();

      toast.success("Article ajouté au stock.");
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Une erreur est survenue.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openRestock(item: StockItem) {
    setSelectedItem(item);
    setModal("restock");
    setModalQuantity("");
  }

  function openAdjust(item: StockItem) {
    setSelectedItem(item);
    setModal("adjust");
    setModalQuantity(String(Number(item.quantity)));
  }

  function closeModal() {
    if (saving) return;

    setModal(null);
    setSelectedItem(null);
    setModalQuantity("");
  }

  async function submitStockAction(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    if (!selectedItem) return;

    const quantity = Number(modalQuantity);

    if (!Number.isFinite(quantity)) {
      toast.error("Veuillez saisir une quantité valide.");
      return;
    }

    if (modal === "restock" && quantity <= 0) {
      toast.error("La quantité doit être supérieure à 0.");
      return;
    }

    if (modal === "adjust" && quantity < 0) {
      toast.error("La quantité ne peut pas être négative.");
      return;
    }

    try {
      setSaving(true);

      const endpoint =
        modal === "restock"
          ? "/api/stock/restock"
          : "/api/stock/adjust";

      const body =
        modal === "restock"
          ? {
              itemId: selectedItem.id,
              quantity,
            }
          : {
              itemId: selectedItem.id,
              quantity,
              reason: "Inventaire manuel",
            };

      const r = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => null);

        throw new Error(
          data?.error ||
            (modal === "restock"
              ? "Approvisionnement impossible."
              : "Ajustement impossible."),
        );
      }

      await load();

      toast.success(
        modal === "restock"
          ? "Stock approvisionné avec succès."
          : "Inventaire ajusté avec succès.",
      );

      closeModal();
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

  const filtered = rows.filter((r) =>
    `${r.name} ${r.unit} ${r.barcode || ""}`
      .toLowerCase()
      .includes(search.toLowerCase().trim()),
  );

  const low = rows.filter(
    (r) => Number(r.quantity) <= Number(r.minThreshold),
  );

  const value = useMemo(
    () =>
      rows.reduce(
        (s, r) =>
          s + Number(r.quantity) * Number(r.unitCost),
        0,
      ),
    [rows],
  );

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Stock"
          subtitle="Suivez les niveaux, les seuils d'alerte et les approvisionnements."
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
              <Boxes size={17} />
            </div>

            <p className="mt-3 text-xl font-black">
              {rows.length}
            </p>

            <p className="text-[10px] text-slate-500">
              Articles en stock
            </p>
          </div>

          <div className="card p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <TriangleAlert size={17} />
            </div>

            <p className="mt-3 text-xl font-black">
              {low.length}
            </p>

            <p className="text-[10px] text-slate-500">
              Sous le seuil
            </p>
          </div>

          <div className="card p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Warehouse size={17} />
            </div>

            <p className="mt-3 text-xl font-black">
              {fcfa(value)}
            </p>

            <p className="text-[10px] text-slate-500">
              Valeur théorique du stock
            </p>
          </div>
        </section>

        <form
          onSubmit={add}
          className="card overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
              <PackagePlus size={17} />
            </div>

            <div>
              <h2 className="text-sm font-black">
                Nouvel article
              </h2>

              <p className="text-[10px] text-slate-400">
                Ajoutez un consommable ou une fourniture.
              </p>
            </div>
          </div>

          <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="label">
                Article{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                className="input"
                placeholder="Ex. Papier A4 80g"
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
              <label className="label">Unité</label>

              <input
                className="input"
                placeholder="feuille"
                value={f.unit}
                onChange={(e) =>
                  setF({
                    ...f,
                    unit: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="label">
                Qté initiale
              </label>

              <input
                className="input"
                type="number"
                min="0"
                value={f.quantity}
                onChange={(e) =>
                  setF({
                    ...f,
                    quantity: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="label">Seuil</label>

              <input
                className="input"
                type="number"
                min="0"
                value={f.minThreshold}
                onChange={(e) =>
                  setF({
                    ...f,
                    minThreshold: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="label">
                Coût unitaire
              </label>

              <input
                className="input"
                type="number"
                min="0"
                value={f.unitCost}
                onChange={(e) =>
                  setF({
                    ...f,
                    unitCost: e.target.value,
                  })
                }
              />
            </div>

            <div className="xl:col-span-5">
              <label className="label">
                Code-barres{" "}
                <span className="text-slate-400">
                  (facultatif)
                </span>
              </label>

              <input
                className="input"
                value={f.barcode}
                onChange={(e) =>
                  setF({
                    ...f,
                    barcode: e.target.value,
                  })
                }
                placeholder="Code interne ou EAN"
              />
            </div>

            <button
              className="btn btn-primary self-end"
              disabled={saving}
            >
              {saving
                ? "Ajout…"
                : "Ajouter l'article"}
            </button>
          </div>
        </form>

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div>
              <h2 className="text-sm font-black">
                Inventaire
              </h2>

              <p className="text-[10px] text-slate-400">
                {filtered.length} article
                {filtered.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                className="input pl-9"
                placeholder="Rechercher…"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table min-w-[900px]">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Stock</th>
                  <th>Seuil</th>
                  <th>Coût unitaire</th>
                  <th>Valeur</th>
                  <th className="text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-slate-400"
                    >
                      Chargement…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-slate-400"
                    >
                      Aucun article trouvé.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const isLow =
                      Number(r.quantity) <=
                      Number(r.minThreshold);

                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="grid size-8 place-items-center rounded-lg bg-slate-50 text-slate-500">
                              <Boxes size={14} />
                            </div>

                            <div>
                              <p className="font-bold text-slate-800">
                                {r.name}
                              </p>

                              {r.barcode && (
                                <p className="font-mono text-[9px] text-slate-400">
                                  {r.barcode}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              isLow
                                ? "font-black text-amber-600"
                                : "font-black text-slate-800"
                            }
                          >
                            {Number(r.quantity)}{" "}
                            {r.unit}
                          </span>

                          {isLow && (
                            <span className="ml-2 badge badge-low">
                              Faible
                            </span>
                          )}
                        </td>

                        <td>
                          {Number(r.minThreshold)}{" "}
                          {r.unit}
                        </td>

                        <td>
                          {fcfa(Number(r.unitCost))}
                        </td>

                        <td className="font-semibold">
                          {fcfa(
                            Number(r.quantity) *
                              Number(r.unitCost),
                          )}
                        </td>

                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="btn"
                              onClick={() =>
                                openRestock(r)
                              }
                            >
                              Approvisionner
                            </button>

                            <button
                              type="button"
                              className="btn"
                              onClick={() =>
                                openAdjust(r)
                              }
                            >
                              <ClipboardCheck size={14} />
                              Inventaire
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modal && selectedItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stock-modal-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="grid size-9 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
                    {modal === "restock" ? (
                      <PackagePlus size={17} />
                    ) : (
                      <ClipboardCheck size={17} />
                    )}
                  </div>

                  <div>
                    <h2
                      id="stock-modal-title"
                      className="text-sm font-black text-slate-900"
                    >
                      {modal === "restock"
                        ? "Approvisionner le stock"
                        : "Ajuster l'inventaire"}
                    </h2>

                    <p className="text-[10px] text-slate-400">
                      {selectedItem.name}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Fermer"
              >
                <X size={17} />
              </button>
            </div>

            <form
              onSubmit={submitStockAction}
              className="p-5"
            >
              <div className="mb-5 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Stock actuel
                    </p>

                    <p className="mt-1 text-lg font-black text-slate-900">
                      {Number(selectedItem.quantity)}{" "}
                      {selectedItem.unit}
                    </p>
                  </div>

                  <Boxes
                    size={22}
                    className="text-cyan-500"
                  />
                </div>
              </div>

              <label
                htmlFor="stock-quantity"
                className="label"
              >
                {modal === "restock"
                  ? `Quantité à ajouter (${selectedItem.unit})`
                  : `Quantité réellement comptée (${selectedItem.unit})`}
              </label>

              <input
                id="stock-quantity"
                className="input h-12 text-base font-semibold"
                type="number"
                min={modal === "restock" ? "1" : "0"}
                step="any"
                value={modalQuantity}
                onChange={(e) =>
                  setModalQuantity(e.target.value)
                }
                autoFocus
                required
              />

              {modal === "restock" && (
                <p className="mt-2 text-[10px] text-slate-400">
                  Cette quantité sera ajoutée au stock
                  actuel.
                </p>
              )}

              {modal === "adjust" && (
                <p className="mt-2 text-[10px] text-slate-400">
                  Cette valeur remplacera la quantité
                  actuelle après l'inventaire.
                </p>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="btn"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary min-w-[130px]"
                >
                  {saving
                    ? "Enregistrement…"
                    : modal === "restock"
                      ? "Approvisionner"
                      : "Ajuster"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}