// Minimal CSV parser + Monzo-row interpreter.
// Supports both Monzo CSV layouts:
//   * Statement export: Transaction ID, Date, Time, Type, Name, …, Money Out, Money In, …
//   * Search export:    id, created, title, subtitle, amount, currency, categories

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
  // "19/05/2025" or "19/05/25" or "19/05/25, 14:06"
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[,\s]+\d{1,2}:\d{2}(?::\d{1,2})?)?$/);
  if (!m) return null;
  const dd = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  let yyyy: string;
  if (m[3].length === 4) {
    yyyy = m[3];
  } else {
    const yy = parseInt(m[3], 10);
    yyyy = (yy < 70 ? 2000 + yy : 1900 + yy).toString();
  }
  return `${yyyy}-${mm}-${dd}`;
}

function parseStatementFormat(grid: string[][], headers: string[]): { rows: MonzoRow[]; errors: string[] } {
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
    return { rows: [], errors: ["Missing required columns in statement-format CSV"] };
  }

  const rows: MonzoRow[] = [];
  const errors: string[] = [];
  for (let r = 1; r < grid.length; r++) {
    const raw = grid[r];
    if (!raw || raw.every((v) => !v?.trim())) continue;

    const isoDate = ddmmyyyyToIso(raw[iDate] ?? "");
    if (!isoDate) { errors.push(`Row ${r + 1}: bad date "${raw[iDate]}"`); continue; }

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

function parseSearchFormat(grid: string[][], headers: string[]): { rows: MonzoRow[]; errors: string[] } {
  const idx = (name: string) => headers.indexOf(name.toLowerCase());

  const iId    = idx("id");
  const iWhen  = idx("created");
  const iTitle = idx("title");
  const iSub   = idx("subtitle");
  const iAmt   = idx("amount");
  const iCat   = idx("categories");

  if (iWhen < 0 || iTitle < 0 || iAmt < 0) {
    return { rows: [], errors: ["Missing required columns in search-format CSV"] };
  }

  const rows: MonzoRow[] = [];
  const errors: string[] = [];
  for (let r = 1; r < grid.length; r++) {
    const raw = grid[r];
    if (!raw || raw.every((v) => !v?.trim())) continue;

    const isoDate = ddmmyyyyToIso(raw[iWhen] ?? "");
    if (!isoDate) { errors.push(`Row ${r + 1}: bad date "${raw[iWhen]}"`); continue; }

    const amt = parseFloat(raw[iAmt] ?? "") || 0;
    if (amt === 0) continue;

    rows.push({
      transaction_id: iId >= 0 ? (raw[iId] ?? "").trim() : "",
      date: isoDate,
      type: "",
      name: (raw[iTitle] ?? "").trim(),
      category: iCat >= 0 ? (raw[iCat] ?? "").trim() : "",
      notes: iSub >= 0 ? (raw[iSub] ?? "").trim() : "",
      description: "",
      money_in:  amt > 0 ? amt : 0,
      money_out: amt < 0 ? Math.abs(amt) : 0,
    });
  }
  return { rows, errors };
}

export function parseMonzoCsv(text: string): { rows: MonzoRow[]; errors: string[] } {
  const grid = parseCsv(text);
  if (grid.length < 2) return { rows: [], errors: ["CSV looks empty"] };

  const headers = grid[0].map((h) => h.trim().toLowerCase());

  const isStatementFormat = headers.includes("money in") || headers.includes("money out");
  const isSearchFormat = headers.includes("id") && headers.includes("created") && headers.includes("amount") && headers.includes("title");

  if (isStatementFormat) return parseStatementFormat(grid, headers);
  if (isSearchFormat) return parseSearchFormat(grid, headers);

  return {
    rows: [],
    errors: ["Unrecognised CSV format. Expected a Monzo statement export (Date / Money In / Money Out columns) or a Monzo search export (id / created / title / subtitle / amount / categories)."],
  };
}

export function shouldSkipMonzoRow(r: MonzoRow): string | null {
  const name = r.name.toLowerCase();
  const type = r.type.toLowerCase();
  const cat = r.category.toLowerCase();
  const notes = r.notes.toLowerCase();

  if (name === "atm") return "ATM withdrawal";

  // Personal self-transfers — works for both Monzo formats
  if (name === "paul rudland") {
    if (type === "monzo-to-monzo") return "Personal transfer";
    if (cat === "transfers") {
      if (notes === "" || notes === "paul rudland") return "Personal transfer";
      if (/\bloan\b|pay\s*back|^dl\b/i.test(r.notes)) return "Director's loan";
    }
  }

  return null;
}

/** Guess a takings source from a Monzo row's Name / Type. */
export function guessTakingsSource(r: MonzoRow): "sumup" | "square" | "bank_transfer" | "card" | "cash" | "other" {
  const name = r.name.toLowerCase();
  const type = r.type.toLowerCase();
  const cat = r.category.toLowerCase();
  if (name.includes("sumup")) return "sumup";
  if (name.includes("square")) return "square";
  if (type.includes("bacs") || type.includes("faster payment")) return "bank_transfer";
  if (type.includes("card payment")) return "card";
  // search-format has no Type — fall back to category
  if (cat === "income") return "bank_transfer";
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
