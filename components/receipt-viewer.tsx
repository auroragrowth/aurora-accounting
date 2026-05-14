"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Modal } from "./ui";
import { fmtGBP, fmtDate } from "@/lib/utils";
import { getReceiptUrl } from "@/app/(app)/expenses/actions";
import type { Expense } from "@/lib/types";

export function ReceiptViewer({
  expense,
  onClose,
}: {
  expense: Expense;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expense.receipt_path) return;
    (async () => {
      const res = await getReceiptUrl(expense.receipt_path!);
      if (res.error) setError(res.error);
      else setUrl(res.url);
      setLoading(false);
    })();
  }, [expense.receipt_path]);

  return (
    <Modal onClose={onClose} title={`Receipt — ${expense.vendor}`} wide>
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div className="text-sm text-brand-ink-soft">
          {fmtDate(expense.date)} · {fmtGBP(expense.amount)}
          {expense.receipt_name && <> · <span className="text-xs">{expense.receipt_name}</span></>}
        </div>
        {url && (
          <a className="btn-secondary" href={url} download={expense.receipt_name ?? `receipt-${expense.id}`} target="_blank" rel="noopener">
            <Download size={14} /> Download
          </a>
        )}
      </div>
      {loading && <div className="py-10 text-center text-brand-ink-soft text-sm">Loading…</div>}
      {error && <div className="py-10 text-center text-red-700 text-sm">{error}</div>}
      {!loading && !error && url && (
        expense.receipt_type === "pdf" ? (
          <iframe src={url} className="w-full h-[70vh] border border-brand-line rounded-lg" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Receipt" className="max-w-full max-h-[70vh] mx-auto border border-brand-line rounded-lg" />
        )
      )}
    </Modal>
  );
}
