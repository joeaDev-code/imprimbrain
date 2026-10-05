import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { PublicPrintShop } from "@/lib/public-print-shop";

type Props = { shop: PublicPrintShop };

export function PrintShopContact({ shop }: Props) {
  const whatsappNumber = shop.whatsapp?.replace(/\D/g, "") ?? "";
  return (
    <section id="contact" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-[var(--sidebar)] p-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Contact</p><h2 className="mt-2 text-2xl font-extrabold">Besoin d’un devis ?</h2><p className="mt-2 text-sm leading-6 text-slate-300">Contactez directement {shop.name} pour présenter votre projet.</p></div>
      <div className="space-y-1 p-4">
        {shop.phone && <a href={`tel:${shop.phone}`} className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-slate-50"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600"><Phone className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-xs font-semibold text-slate-400">Téléphone</span><span className="block truncate text-sm font-bold text-slate-800">{shop.phone}</span></span></a>}
        {shop.whatsapp && whatsappNumber && <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-slate-50"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><MessageCircle className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-xs font-semibold text-slate-400">WhatsApp</span><span className="block truncate text-sm font-bold text-slate-800">{shop.whatsapp}</span></span></a>}
        {shop.email && <a href={`mailto:${shop.email}`} className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-slate-50"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Mail className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-xs font-semibold text-slate-400">Email</span><span className="block truncate text-sm font-bold text-slate-800">{shop.email}</span></span></a>}
        {shop.address && <div className="flex items-start gap-3 rounded-2xl p-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-500"><MapPin className="h-4 w-4" /></span><span><span className="block text-xs font-semibold text-slate-400">Adresse</span><span className="mt-0.5 block text-sm font-bold leading-5 text-slate-800">{shop.address}</span></span></div>}
        <div className="flex items-start gap-3 rounded-2xl p-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600"><Clock3 className="h-4 w-4" /></span><span><span className="block text-xs font-semibold text-slate-400">Aujourd’hui</span><span className="mt-0.5 block text-sm font-bold text-slate-800">{shop.todayHours ?? "Fermé"}</span></span></div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-4">{shop.phone && <a href={`tel:${shop.phone}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-50 px-3 py-3 text-sm font-bold text-cyan-700 transition hover:bg-cyan-100"><Phone className="h-4 w-4" /> Appeler</a>}{shop.whatsapp && whatsappNumber && <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}</div>
    </section>
  );
}
