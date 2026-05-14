import type { Invoice, InvoiceItem } from "./types";

export const fmtGBP = (n: number | string | null | undefined): string => {
  const num = typeof n === "string" ? parseFloat(n) : n ?? 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(num || 0);
};

export const fmtDate = (d: string | Date | null | undefined): string => {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const addDaysISO = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const padNum = (n: number | string, width = 4): string =>
  String(n).padStart(width, "0");

export const invoiceSubtotal = (inv: Pick<Invoice, "items">): number =>
  (inv.items || []).reduce(
    (s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0),
    0
  );

export const invoiceVat = (inv: Pick<Invoice, "items" | "vat_enabled" | "vat_rate">): number => {
  const sub = invoiceSubtotal(inv);
  return inv.vat_enabled ? sub * ((Number(inv.vat_rate) || 0) / 100) : 0;
};

export const invoiceTotal = (
  inv: Pick<Invoice, "items" | "vat_enabled" | "vat_rate">
): number => invoiceSubtotal(inv) + invoiceVat(inv);

export const itemLineTotal = (item: Pick<InvoiceItem, "qty" | "price">): number =>
  (Number(item.qty) || 0) * (Number(item.price) || 0);
