"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <label className="label">{label}</label>
      {children}
      {hint && <div className="text-xs text-brand-ink-soft mt-1">{hint}</div>}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="no-print fixed inset-0 z-50 bg-black/50 overflow-y-auto flex items-start justify-center p-4 sm:p-10"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl w-full ${wide ? "max-w-4xl" : "max-w-xl"} shadow-2xl`}
      >
        <div className="px-6 py-4 bg-brand-blue text-white rounded-t-2xl flex items-center justify-between">
          <h2 className="heading-display text-lg tracking-wide">{title}</h2>
          <button onClick={onClose} className="text-white/90 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-brand-line rounded-2xl p-6 ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-base font-bold text-brand-ink">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap justify-between items-end gap-4 mb-7">
      <div>
        <h1 className="heading-display text-3xl sm:text-4xl text-brand-blue leading-none">{title}</h1>
        {subtitle && <p className="text-brand-ink-soft mt-2 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-16 px-6 text-center text-brand-ink-soft text-sm">{text}</div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    draft: { bg: "#E2E8F0", fg: "#4A5568", label: "Draft" },
    sent: { bg: "#DBEAFE", fg: "#1E40AF", label: "Sent" },
    paid: { bg: "#D1FAE5", fg: "#065F46", label: "Paid" },
    overdue: { bg: "#FEE2E2", fg: "#991B1B", label: "Overdue" },
  };
  const s = map[status] || map.draft;
  return (
    <span className="pill" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}

export function Th({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-bold text-brand-ink-soft tracking-wide ${className}`}>
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3.5 text-sm ${className}`}>{children}</td>;
}
