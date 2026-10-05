import { BadgeCheck, FileText, Image as ImageIcon, Package, Printer, ScanLine, type LucideIcon } from "lucide-react";
import type { PublicPrintShop } from "@/lib/public-print-shop";

const icons: Record<string, LucideIcon> = { printer: Printer, file: FileText, image: ImageIcon, scan: ScanLine, package: Package };

type Props = { services: PublicPrintShop["services"] };

export function PrintShopServices({ services }: Props) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="mb-6 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-500"><BadgeCheck className="h-5 w-5" /></div><div><h2 className="text-xl font-extrabold text-slate-950">Nos services</h2><p className="text-sm text-slate-500">Les prestations proposées par cette imprimerie</p></div></div>{services.length ? <div className="grid gap-3 sm:grid-cols-2">{services.map((service) => { const key = (service.category ?? "").toLowerCase(); const Icon = key.includes("flyer") || key.includes("affiche") ? ImageIcon : key.includes("repro") || key.includes("scan") ? ScanLine : key.includes("reli") ? FileText : icons.printer; return <article key={service.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 transition hover:border-cyan-100 hover:bg-cyan-50/40"><div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm"><Icon className="h-5 w-5" /></div><div><h3 className="font-bold text-slate-900">{service.name}</h3>{service.category && <p className="mt-1.5 text-sm leading-5 text-slate-500">{service.category}</p>}</div></div></article>; })}</div> : <p className="text-sm text-slate-500">Aucun service public n’est renseigné.</p>}</section>;
}
