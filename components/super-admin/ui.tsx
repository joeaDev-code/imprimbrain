"use client";

import { useEffect, useState } from "react";
import { Search, RefreshCw, AlertCircle, Loader2 } from "lucide-react";

export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
      <div className="grid size-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
        <Loader2 className="size-6 animate-spin" strokeWidth={2.5} />
      </div>
      <p className="mt-3 text-sm font-bold text-slate-800">
        Chargement en cours…
      </p>
      <p className="mt-0.5 text-xs font-medium text-slate-400">
        Veuillez patienter un instant.
      </p>
    </div>
  );
}

export function ErrorBox({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-red-200/80 bg-red-50/60 p-5 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3.5">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-600">
          <AlertCircle size={20} strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-bold text-red-900">Une erreur est survenue</p>
          <p className="text-xs font-medium text-red-700/80">{message}</p>
        </div>
      </div>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-100 px-4 text-xs font-bold text-red-700 transition-all hover:bg-red-200 active:scale-95"
        >
          <RefreshCw size={14} strokeWidth={2.5} />
          <span>Réessayer</span>
        </button>
      )}
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Rechercher…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="group relative flex h-11 items-center rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3.5 transition-all focus-within:border-cyan-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-cyan-600">
      <Search
        size={18}
        strokeWidth={2.5}
        className="shrink-0 text-slate-400 transition-colors group-focus-within:text-cyan-600"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent pl-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

export function useApi<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError("");
    loader()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return { data, error, loading, reload: load };
}