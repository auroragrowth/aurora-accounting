"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Edit3, Trash2 } from "lucide-react";
import { PageHeader, EmptyState, Th, Td } from "./ui";
import { CustomerForm } from "./customer-form";
import { PayeeForm } from "./payee-form";
import type { Customer, Payee } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { useToast } from "./toast-provider";
import { deleteCustomer, deletePayee } from "@/app/(app)/contacts/actions";

export function ContactsView({
  customers,
  payees,
}: {
  customers: Customer[];
  payees: Payee[];
}) {
  const [tab, setTab] = useState<"customers" | "payees">("customers");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingPayee, setEditingPayee] = useState<Payee | null>(null);
  const [showCustForm, setShowCustForm] = useState(false);
  const [showPayeeForm, setShowPayeeForm] = useState(false);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (c) => !search || `${c.name} ${c.email ?? ""} ${c.city ?? ""}`.toLowerCase().includes(search.toLowerCase())
      ),
    [customers, search]
  );

  const filteredPayees = useMemo(
    () =>
      payees.filter(
        (p) => !search || `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())
      ),
    [payees, search]
  );

  async function handleDeleteCustomer(c: Customer) {
    if (!confirm(`Remove ${c.name} from your customers list?`)) return;
    const res = await deleteCustomer(c.id);
    if (res.error) showToast(res.error, "error");
    else showToast("Customer removed");
  }

  async function handleDeletePayee(p: Payee) {
    if (!confirm(`Remove ${p.name} from your payees list?`)) return;
    const res = await deletePayee(p.id);
    if (res.error) showToast(res.error, "error");
    else showToast("Payee removed");
  }

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle={`${customers.length} customers · ${payees.length} payees & suppliers`}
        action={
          <button
            className="btn-primary"
            onClick={() => {
              if (tab === "customers") { setEditingCustomer(null); setShowCustForm(true); }
              else { setEditingPayee(null); setShowPayeeForm(true); }
            }}
          >
            <Plus size={16} /> Add {tab === "customers" ? "customer" : "payee"}
          </button>
        }
      />

      <div className="flex gap-1 mb-5 border-b border-brand-line">
        <SubTab
          label={`Customers (${customers.length})`}
          active={tab === "customers"}
          onClick={() => setTab("customers")}
        />
        <SubTab
          label={`Payees & Suppliers (${payees.length})`}
          active={tab === "payees"}
          onClick={() => setTab("payees")}
        />
      </div>

      <div className="mb-5 relative">
        <Search size={16} className="absolute left-3.5 top-3.5 text-brand-ink-soft" />
        <input
          className="input pl-10"
          placeholder={`Search ${tab}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {tab === "customers" && (
        <div className="bg-white border border-brand-line rounded-2xl overflow-hidden overflow-x-auto">
          {filteredCustomers.length === 0 ? (
            <EmptyState text={customers.length === 0 ? "No customers yet. They'll be saved automatically when you create invoices, or add them manually." : "No customers match your search."} />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-brand-cream border-b border-brand-line">
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Location</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="border-b border-brand-line last:border-0 hover:bg-brand-cream/60">
                    <Td><strong>{c.name}</strong></Td>
                    <Td className="text-brand-ink-soft">{c.email || "—"}</Td>
                    <Td className="text-brand-ink-soft">
                      {[c.city, c.postcode].filter(Boolean).join(" ") || "—"}
                    </Td>
                    <Td>
                      <div className="flex gap-1 justify-end">
                        <button className="btn-ghost" onClick={() => { setEditingCustomer(c); setShowCustForm(true); }}>
                          <Edit3 size={14} />
                        </button>
                        <button className="btn-danger" onClick={() => handleDeleteCustomer(c)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "payees" && (
        <div className="bg-white border border-brand-line rounded-2xl overflow-hidden overflow-x-auto">
          {filteredPayees.length === 0 ? (
            <EmptyState text={payees.length === 0 ? "No payees yet. They'll be saved automatically when you log expenses, or add them manually." : "No payees match your search."} />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-brand-cream border-b border-brand-line">
                  <Th>Name</Th>
                  <Th>Default category</Th>
                  <Th>Notes</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {filteredPayees.map((p) => {
                  const cat = EXPENSE_CATEGORIES.find((c) => c.id === p.category);
                  return (
                    <tr key={p.id} className="border-b border-brand-line last:border-0 hover:bg-brand-cream/60">
                      <Td><strong>{p.name}</strong></Td>
                      <Td>
                        {cat ? (
                          <span className="pill" style={{ background: `${cat.color}15`, color: cat.color }}>
                            {cat.label}
                          </span>
                        ) : "—"}
                      </Td>
                      <Td className="text-brand-ink-soft">{p.notes || "—"}</Td>
                      <Td>
                        <div className="flex gap-1 justify-end">
                          <button className="btn-ghost" onClick={() => { setEditingPayee(p); setShowPayeeForm(true); }}>
                            <Edit3 size={14} />
                          </button>
                          <button className="btn-danger" onClick={() => handleDeletePayee(p)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCustForm && (
        <CustomerForm initial={editingCustomer} onClose={() => { setShowCustForm(false); setEditingCustomer(null); }} />
      )}
      {showPayeeForm && (
        <PayeeForm initial={editingPayee} onClose={() => { setShowPayeeForm(false); setEditingPayee(null); }} />
      )}
    </div>
  );
}

function SubTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-semibold -mb-px border-b-[3px] transition-colors ${
        active ? "text-brand-blue border-brand-orange" : "text-brand-ink-soft border-transparent hover:text-brand-ink"
      }`}
    >
      {label}
    </button>
  );
}
