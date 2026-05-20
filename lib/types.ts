export type ExpenseCategory =
  | "staff"
  | "suppliers"
  | "purchases"
  | "equipment"
  | "travel"
  | "marketing"
  | "other";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export type TakingSource = "cash" | "sumup" | "square" | "card" | "bank_transfer" | "other";

export type LoanDirection = "in" | "out";

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payee {
  id: string;
  user_id: string;
  name: string;
  category: ExpenseCategory;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  category: ExpenseCategory;
  vendor: string;
  description: string | null;
  amount: number;
  payment_method: string | null;
  reference: string | null;
  event_name: string | null;
  receipt_path: string | null;
  receipt_type: string | null;
  receipt_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Mileage {
  id: string;
  user_id: string;
  date: string;
  from_place: string;
  to_place: string;
  miles: number;
  purpose: string | null;
  event_name: string | null;
  rate_used: number;
  created_at: string;
  updated_at: string;
}

export type PotKind = "mileage" | "vat" | "tax";

export interface PotAllocation {
  id: string;
  user_id: string;
  pot: PotKind;
  date: string;
  amount: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface MileageRoute {
  id: string;
  user_id: string;
  name: string | null;
  from_place: string;
  to_place: string;
  miles: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  description: string;
  qty: number;
  price: number;
}

export interface LineItemPreset {
  id: string;
  user_id: string;
  description: string;
  default_price: number;
  default_qty: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerSnapshot {
  name: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  date: string;
  due_date: string;
  customer_id: string | null;
  customer_snapshot: CustomerSnapshot;
  items: InvoiceItem[];
  notes: string | null;
  payment_terms: string | null;
  vat_enabled: boolean;
  vat_rate: number;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  user_id: string;
  quote_number: string;
  date: string;
  valid_until: string;
  customer_id: string | null;
  customer_snapshot: CustomerSnapshot;
  items: InvoiceItem[];
  notes: string | null;
  terms: string | null;
  vat_enabled: boolean;
  vat_rate: number;
  status: QuoteStatus;
  converted_invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Taking {
  id: string;
  user_id: string;
  date: string;
  source: TakingSource;
  amount: number;
  event_name: string | null;
  description: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface DirectorLoan {
  id: string;
  user_id: string;
  date: string;
  direction: LoanDirection;
  amount: number;
  description: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  user_id: string;
  company_name: string;
  company_number: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
  website: string;
  vat_number: string;
  bank_name: string;
  bank_sort_code: string;
  bank_account: string;
  payment_terms: string;
  next_invoice_number: number;
  invoice_prefix: string;
  next_quote_number: number;
  quote_prefix: string;
  quote_terms: string;
  vat_rate: number;
  vat_enabled: boolean;
  mileage_rate_per_mile: number;
  corporation_tax_rate: number;
  created_at: string;
  updated_at: string;
}

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; color: string }[] = [
  { id: "staff",      label: "Staff",         color: "#173F87" },
  { id: "suppliers",  label: "Suppliers",     color: "#E8551C" },
  { id: "purchases",  label: "Purchases",     color: "#7A4DBF" },
  { id: "equipment",  label: "Equipment",     color: "#0F8A6B" },
  { id: "travel",     label: "Fuel / Travel", color: "#C9410B" },
  { id: "marketing",  label: "Marketing",     color: "#BD8B00" },
  { id: "other",      label: "Other",         color: "#4A5568" },
];

export function expenseCategoryLabel(id: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export const TAKINGS_SOURCES: { id: TakingSource; label: string; color: string }[] = [
  { id: "cash",          label: "Cash",          color: "#0F8A6B" },
  { id: "sumup",         label: "SumUp",         color: "#173F87" },
  { id: "square",        label: "Square",        color: "#4A5568" },
  { id: "card",          label: "Card terminal", color: "#7A4DBF" },
  { id: "bank_transfer", label: "Bank transfer", color: "#BD8B00" },
  { id: "other",         label: "Other",         color: "#E8551C" },
];

export function takingsSourceLabel(id: TakingSource): string {
  return TAKINGS_SOURCES.find((s) => s.id === id)?.label ?? id;
}
