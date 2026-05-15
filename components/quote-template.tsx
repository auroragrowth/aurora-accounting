import type { Quote, Settings } from "@/lib/types";
import { fmtGBP, fmtDate, invoiceSubtotal, invoiceVat, invoiceTotal, itemLineTotal } from "@/lib/utils";

export function QuoteTemplate({
  quote,
  settings,
}: {
  quote: Quote;
  settings: Settings;
}) {
  const sub = invoiceSubtotal(quote);
  const vat = invoiceVat(quote);
  const total = invoiceTotal(quote);
  const cust = quote.customer_snapshot;

  return (
    <div
      className="bg-white mx-auto border border-brand-line text-brand-ink"
      style={{
        padding: "50px 60px",
        minHeight: "297mm",
        width: "100%",
        maxWidth: "210mm",
        boxSizing: "border-box",
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}
    >
      <div
        className="bg-brand-blue text-white flex justify-between items-center"
        style={{
          margin: "-50px -60px 30px",
          padding: "24px 60px",
        }}
      >
        <div>
          <div className="heading-display" style={{ fontSize: 32, letterSpacing: 1, lineHeight: 1 }}>
            AURORA
          </div>
          <div
            className="bg-brand-orange inline-block"
            style={{
              padding: "4px 10px",
              marginTop: 6,
              fontFamily: 'Bowlby One SC, sans-serif',
              fontSize: 20,
              letterSpacing: 0.5,
              lineHeight: 1,
            }}
          >
            EVENTS
          </div>
        </div>
        <div className="text-right">
          <div className="heading-display" style={{ fontSize: 24, lineHeight: 1 }}>QUOTE</div>
          <div className="text-sm opacity-90 mt-1.5">{quote.quote_number}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-7">
        <div>
          <div className="text-[10px] tracking-[1.5px] text-brand-ink-soft font-bold mb-2">FROM</div>
          <div className="font-bold mb-1">{settings.company_name}</div>
          <div className="text-sm text-brand-ink-soft leading-relaxed">
            {settings.address}<br />
            {settings.city} {settings.postcode}<br />
            {settings.country}<br />
            <br />
            {settings.email}<br />
            {settings.phone}<br />
            {settings.website}
          </div>
          <div className="text-[11px] text-brand-ink-soft mt-2.5">
            Company No. {settings.company_number}
            {settings.vat_number && <> · VAT {settings.vat_number}</>}
          </div>
        </div>
        <div>
          <div className="text-[10px] tracking-[1.5px] text-brand-ink-soft font-bold mb-2">PREPARED FOR</div>
          <div className="font-bold mb-1">{cust.name}</div>
          <div className="text-sm text-brand-ink-soft leading-relaxed">
            {cust.address && <>{cust.address}<br /></>}
            {(cust.city || cust.postcode) && <>{cust.city} {cust.postcode}<br /></>}
            {cust.country && <>{cust.country}<br /></>}
            {cust.email && <><br />{cust.email}</>}
          </div>

          <div className="mt-5 p-3.5 bg-brand-cream rounded-lg text-sm">
            <div className="flex justify-between mb-1.5">
              <span className="text-brand-ink-soft">Quote date</span>
              <strong>{fmtDate(quote.date)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-ink-soft">Valid until</span>
              <strong>{fmtDate(quote.valid_until)}</strong>
            </div>
          </div>
        </div>
      </div>

      <table className="w-full mb-5" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr className="bg-brand-blue text-white">
            <th className="text-left py-3 px-3.5 text-xs tracking-wide">DESCRIPTION</th>
            <th className="text-right py-3 px-3.5 text-xs tracking-wide" style={{ width: 80 }}>QTY</th>
            <th className="text-right py-3 px-3.5 text-xs tracking-wide" style={{ width: 110 }}>UNIT</th>
            <th className="text-right py-3 px-3.5 text-xs tracking-wide" style={{ width: 110 }}>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {(quote.items || []).map((it, i) => (
            <tr key={i} className="border-b border-brand-line">
              <td className="py-3.5 px-3.5 text-sm">{it.description}</td>
              <td className="py-3.5 px-3.5 text-right text-sm">{it.qty}</td>
              <td className="py-3.5 px-3.5 text-right text-sm">{fmtGBP(it.price)}</td>
              <td className="py-3.5 px-3.5 text-right text-sm font-semibold">{fmtGBP(itemLineTotal(it))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-7">
        <div style={{ width: 280 }}>
          <div className="flex justify-between py-1.5 text-sm">
            <span className="text-brand-ink-soft">Subtotal</span>
            <span>{fmtGBP(sub)}</span>
          </div>
          {quote.vat_enabled && (
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-brand-ink-soft">VAT ({quote.vat_rate}%)</span>
              <span>{fmtGBP(vat)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3.5 pb-1.5 border-t-2 border-brand-blue mt-2">
            <span className="heading-display text-base text-brand-blue">TOTAL</span>
            <span className="heading-display text-xl text-brand-orange">{fmtGBP(total)}</span>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="mb-5 p-4 bg-brand-orange-soft rounded-lg border-l-4 border-brand-orange">
          <div className="text-[11px] tracking-wider font-bold text-brand-orange mb-1">NOTES</div>
          <div className="text-sm leading-relaxed">{quote.notes}</div>
        </div>
      )}

      {quote.terms && (
        <div className="text-[11px] text-brand-ink-soft leading-relaxed pt-4 border-t border-brand-line">
          {quote.terms}
        </div>
      )}

      <div className="mt-7 pt-4 border-t border-brand-line text-center text-[11px] text-brand-ink-soft tracking-wider">
        {settings.company_name} · Company No. {settings.company_number} · {settings.website}
      </div>
    </div>
  );
}
