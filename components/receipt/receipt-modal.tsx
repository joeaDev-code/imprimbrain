"use client";

import { useEffect } from "react";
import {
  Printer,
  X,
} from "lucide-react";
import { Receipt } from "./receipt";
import type { ReceiptData } from "./receipt.types";

type ReceiptModalProps = {
  open: boolean;
  onClose: () => void;
  data: ReceiptData;
};

export function ReceiptModal({
  open,
  onClose,
  data,
}: ReceiptModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open, onClose]);

  if (!open) return null;

  function printReceipt() {
    window.print();
  }

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu du reçu"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[900px]">
        <div className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white print:hidden">
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
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-cyan-500 px-3 text-xs font-black text-white transition hover:bg-cyan-400"
            >
              <Printer size={14} />
              Imprimer
            </button>

            <button
              type="button"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <Receipt data={data} />
      </div>
    </div>
  );
}