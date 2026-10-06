"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Printer,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Receipt } from "./receipt";
import type { ReceiptData } from "./receipt.types";

type ReceiptModalProps = {
  open: boolean;
  onClose: () => void;
  data: ReceiptData;
  publicReceiptUrl?: string | null;
};

export function ReceiptModal({
  open,
  onClose,
  data,
  publicReceiptUrl,
}: ReceiptModalProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 10);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  function printReceipt() {
    window.print();
  }

  async function copyLink() {
    if (!publicReceiptUrl) {
      toast.error("Le lien public du reçu n'est pas disponible.");
      return;
    }

    try {
      await navigator.clipboard.writeText(publicReceiptUrl);

      setCopied(true);
      toast.success("Lien du reçu copié.");

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  }

  function shareWhatsApp() {
    if (!publicReceiptUrl) {
      toast.error("Le lien public du reçu n'est pas disponible.");
      return;
    }

    const message = `Bonjour, voici votre reçu : ${publicReceiptUrl}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openPublicReceipt() {
    if (!publicReceiptUrl) {
      toast.error("Le lien public du reçu n'est pas disponible.");
      return;
    }

    window.open(
      publicReceiptUrl,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div
      className={[
        "fixed inset-0 z-[100000] flex items-start justify-center overflow-y-auto",
        "bg-slate-950/60 p-4 backdrop-blur-sm sm:p-8",
        "transition-opacity duration-300 ease-out",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu du reçu"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={[
          "relative w-full max-w-[900px]",
          "transition-all duration-300 ease-out",
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-[0.97] opacity-0",
        ].join(" ")}
      >
        {/* Barre supérieure */}
        <div className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white shadow-xl print:hidden">
          <div>
            <p className="text-xs font-black">
              Aperçu du reçu
            </p>

            <p className="text-[10px] text-slate-400">
              Reçu prêt à imprimer
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={printReceipt}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-cyan-500 px-3 text-xs font-black text-white transition-all hover:bg-cyan-400 active:scale-95"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">
                Imprimer
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-lg text-slate-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
              aria-label="Fermer"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Actions verticales */}
        <div className="fixed right-3 top-1/2 z-[100010] flex -translate-y-1/2 flex-col gap-2 print:hidden sm:right-6">
          {/* WhatsApp */}
          <button
            type="button"
            onClick={shareWhatsApp}
            disabled={!publicReceiptUrl}
            aria-label="Envoyer par WhatsApp"
            title="Envoyer par WhatsApp"
            className="group grid size-11 place-items-center rounded-2xl border border-white/10 bg-white text-slate-700 shadow-xl backdrop-blur-md transition-all hover:-translate-x-1 hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="text-lg font-black text-[#25D366]">
              W
            </span>
          </button>

          {/* Copier */}
          <button
            type="button"
            onClick={copyLink}
            disabled={!publicReceiptUrl}
            aria-label="Copier le lien"
            title="Copier le lien"
            className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white text-slate-700 shadow-xl backdrop-blur-md transition-all hover:-translate-x-1 hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? (
              <Check
                size={18}
                className="text-emerald-500"
              />
            ) : (
              <Copy size={18} />
            )}
          </button>

          {/* Ouvrir */}
          <button
            type="button"
            onClick={openPublicReceipt}
            disabled={!publicReceiptUrl}
            aria-label="Ouvrir le reçu public"
            title="Ouvrir le reçu public"
            className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white text-slate-700 shadow-xl backdrop-blur-md transition-all hover:-translate-x-1 hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ExternalLink size={18} />
          </button>
        </div>

        {/* Reçu */}
        <Receipt data={data} />
      </div>
    </div>
  );
}