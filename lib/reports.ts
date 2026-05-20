import type { Expense, Invoice, Taking, DirectorLoan, Mileage } from "./types";
import { invoiceTotal } from "./utils";

export interface PeriodTotals {
  takings: number;
  paidInvoices: number;
  income: number;
  expensesByCategory: Record<string, number>;
  expensesTotal: number;
  cashTakings: number;
  cashExpenses: number;
  dlIn: number;
  dlOut: number;
  netProfit: number;
  bankFlow: number;
}

export function computeTotals({
  expenses,
  takings,
  invoices,
  loans,
  from,
  to,
}: {
  expenses: Expense[];
  takings: Taking[];
  invoices: Invoice[];
  loans: DirectorLoan[];
  from?: string;
  to?: string;
}): PeriodTotals {
  const inRange = (d: string) => (!from || d >= from) && (!to || d <= to);

  const tks = takings.filter((t) => inRange(t.date));
  const exps = expenses.filter((e) => inRange(e.date));
  const paidInvs = invoices.filter((i) => i.status === "paid" && inRange(i.date));
  const dls = loans.filter((l) => inRange(l.date));

  const takingsTotal = tks.reduce((s, t) => s + Number(t.amount), 0);
  const paidInvoicesTotal = paidInvs.reduce((s, i) => s + invoiceTotal(i), 0);
  const income = takingsTotal + paidInvoicesTotal;

  const expensesByCategory: Record<string, number> = {};
  for (const e of exps) {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + Number(e.amount);
  }
  const expensesTotal = exps.reduce((s, e) => s + Number(e.amount), 0);

  const cashTakings = tks.filter((t) => t.source === "cash").reduce((s, t) => s + Number(t.amount), 0);
  const cashExpenses = exps.filter((e) => e.payment_method === "cash").reduce((s, e) => s + Number(e.amount), 0);
  const dlIn = dls.filter((l) => l.direction === "in").reduce((s, l) => s + Number(l.amount), 0);
  const dlOut = dls.filter((l) => l.direction === "out").reduce((s, l) => s + Number(l.amount), 0);

  const netProfit = income - expensesTotal;
  const bankFlow = (income - cashTakings) + dlIn - (expensesTotal - cashExpenses) - dlOut;

  return {
    takings: takingsTotal,
    paidInvoices: paidInvoicesTotal,
    income,
    expensesByCategory,
    expensesTotal,
    cashTakings,
    cashExpenses,
    dlIn,
    dlOut,
    netProfit,
    bankFlow,
  };
}

export function estimateCorporationTax(profit: number, ratePct: number): number {
  if (profit <= 0) return 0;
  return profit * (ratePct / 100);
}

export function mileageClaim(mileage: Mileage[]): number {
  return mileage.reduce((s, m) => s + Number(m.miles) * Number(m.rate_used), 0);
}

export function vatPot(invoices: Invoice[]): number {
  // Output VAT collected on paid invoices. (Input VAT on expenses is not
  // tracked yet — when we add expenses.vat_amount, subtract it here.)
  return invoices
    .filter((i) => i.status === "paid" && i.vat_enabled)
    .reduce((s, i) => {
      const sub = (i.items ?? []).reduce((a, it) => a + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
      return s + sub * (Number(i.vat_rate) / 100);
    }, 0);
}

export interface EventRollup {
  name: string;
  takings: number;
  expenses: number;
  mileage: number;
  net: number;
  takingsCount: number;
  expensesCount: number;
  mileageMiles: number;
}

export function rollupByEvent({
  takings,
  expenses,
  mileage,
}: {
  takings: Taking[];
  expenses: Expense[];
  mileage: Mileage[];
}): { events: EventRollup[]; untagged: EventRollup } {
  const map = new Map<string, EventRollup>();
  const untagged: EventRollup = { name: "(untagged)", takings: 0, expenses: 0, mileage: 0, net: 0, takingsCount: 0, expensesCount: 0, mileageMiles: 0 };

  const getOrAdd = (name: string): EventRollup => {
    let r = map.get(name);
    if (!r) {
      r = { name, takings: 0, expenses: 0, mileage: 0, net: 0, takingsCount: 0, expensesCount: 0, mileageMiles: 0 };
      map.set(name, r);
    }
    return r;
  };

  for (const t of takings) {
    const row = t.event_name?.trim() ? getOrAdd(t.event_name.trim()) : untagged;
    row.takings += Number(t.amount);
    row.takingsCount += 1;
  }
  for (const e of expenses) {
    const row = e.event_name?.trim() ? getOrAdd(e.event_name.trim()) : untagged;
    row.expenses += Number(e.amount);
    row.expensesCount += 1;
  }
  for (const m of mileage) {
    const row = m.event_name?.trim() ? getOrAdd(m.event_name.trim()) : untagged;
    const claim = Number(m.miles) * Number(m.rate_used);
    row.mileage += claim;
    row.mileageMiles += Number(m.miles);
  }

  // Compute nets
  const events: EventRollup[] = [];
  for (const e of map.values()) {
    e.net = e.takings - e.expenses - e.mileage;
    events.push(e);
  }
  untagged.net = untagged.takings - untagged.expenses - untagged.mileage;
  events.sort((a, b) => b.net - a.net);

  return { events, untagged };
}
