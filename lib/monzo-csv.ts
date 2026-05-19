// Minimal CSV parser + Monzo-row interpreter.
// Handles quoted fields, escaped quotes, CRLF.

export interface MonzoRow {
  transaction_id: string;
  date: string; // ISO yyyy-mm-dd
  type: string;
  name: string;
  category: string;
  notes: string;
  description: string;
  money_in: number;  // 0 if outgoing
  money_out: number; // 0 if incoming
}

export function parseCsv(text: string): string[][] {
  const cleaned = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuote = false;

  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (inQuote) {
      if (c === '"') {
        if (cleaned[i + 1] === '"') { cur += '"'; i++; }
        else { inQuote = false; }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuote = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
      else if (c === "\r") { /* skip */ }
      else cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

function ddmmyyyyToIso(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const dd = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  return `${m[3]}-${mm}-${dd}`;
}

export function parseMonzoCsv(text: string): { rows: MonzoRow[]; errors: string[] } {
  const grid = parseCsv(text);
  const errors: string[] = [];
  if (grid.length < 2) return { rows: [], errors: ["CSV looks empty"] };

  const headers = grid[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name.toLowerCase());

  const iId   = idx("transaction id");
  const iDate = idx("date");
  const iType = idx("type");
  const iName = idx("name");
  const iCat  = idx("category");
  const iNotes = idx("notes and #tags");
  const iDesc = idx("description");
  const iOut  = idx("money out");
  const iIn   = idx("money in");

  if (iDate < 0 || iName < 0 || (iOut < 0 && iIn < 0)) {
    return { rows: [], errors: ["CSV doesn't look like a Monzo export — missing Date / Name / Money In/Out columns"] };
  }

  const rows: MonzoRow[] = [];
  for (let r = 1; r < grid.length; r++) {
    const raw = grid[r];
    if (!raw || raw.every((v) => !v?.trim())) continue;

    const isoDate = ddmmyyyyToIso(raw[iDate] ?? "");
    if (!isoDate) {
      errors.push(`Row ${r + 1}: bad date "${raw[iDate]}"`);
      continue;
    }

    const inAmt = iIn >= 0 ? parseFloat(raw[iIn] ?? "") || 0 : 0;
    const outAmt = iOut >= 0 ? Math.abs(parseFloat(raw[iOut] ?? "") || 0) : 0;

    if (inAmt === 0 && outAmt === 0) continue;

    rows.push({
      transaction_id: (raw[iId] ?? "").trim(),
      date: isoDate,
      type: (raw[iType] ?? "").trim(),
      name: (raw[iName] ?? "").trim(),
      category: iCat >= 0 ? (raw[iCat] ?? "").trim() : "",
      notes: iNotes >= 0 ? (raw[iNotes] ?? "").trim() : "",
      description: iDesc >= 0 ? (raw[iDesc] ?? "").trim() : "",
      money_in: inAmt,
      money_out: outAmt,
    });
  }
  return { rows, errors };
}

export function shouldSkipMonzoRow(r: MonzoRow): string | null {
  const name = r.name.toLowerCase();
  const type = r.type.toLowerCase();
  if (type === "monzo-to-monzo" && name === "paul rudland") return "Personal transfer";
  if (name === "atm") return "ATM withdrawal";
  return null;
}

/** Guess a takings source from a Monzo row's Name / Type. */
export function guessTakingsSource(r: MonzoRow): "sumup" | "square" | "bank_transfer" | "card" | "cash" | "other" {
  const name = r.name.toLowerCase();
  if (name.includes("sumup")) return "sumup";
  if (name.includes("square")) return "square";
  if (r.type.toLowerCase().includes("bacs") || r.type.toLowerCase().includes("faster payment")) return "bank_transfer";
  if (r.type.toLowerCase().includes("card payment")) return "card";
  return "other";
}

/** Guess an expense payment_method from a Monzo row's Type. */
export function guessPaymentMethod(r: MonzoRow): string {
  const t = r.type.toLowerCase();
  if (t.includes("card payment")) return "card";
  if (t.includes("direct debit")) return "direct-debit";
  if (t.includes("faster payment") || t.includes("bacs")) return "bank";
  if (t.includes("monzo-to-monzo")) return "bank";
  return "";
}
