import React, { useMemo, useState } from 'react';
import {
  X,
  Printer,
  Copy,
  CheckCircle2,
  Download,
  Ticket,
  Phone,
  Calendar,
  MapPin
} from 'lucide-react';
import type { SelectedPaidAddonItem } from '../../types/finance';

export interface InvoiceVoucherData {
  documentKind: 'booking_ticket' | 'end_of_day_invoice';
  code: string;
  title: string;
  companyName: string;
  customerName: string;
  customerPhone: string;
  customerType: 'egyptian' | 'foreigner';
  tripDate: string;
  tripTime?: string;
  pickupLocation?: string;
  guestsSummary?: string;
  statusLabel: string;
  basePriceEGP: number;
  basePriceEUR: number;
  checkoutAddons?: SelectedPaidAddonItem[];
  duringTripAddons?: SelectedPaidAddonItem[];
  serviceFeeEGP?: number;
  serviceFeeEUR?: number;
  taxEGP?: number;
  taxEUR?: number;
  promoCode?: string;
  promoDiscountEGP?: number;
  promoDiscountEUR?: number;
  depositAmountEGP?: number;
  depositAmountEUR?: number;
  remainingAmountEGP?: number;
  remainingAmountEUR?: number;
  paymentMethodLabel?: string;
  refundSummary?: string;
  totalEGP: number;
  totalEUR: number;
  notes?: string;
}

interface InvoiceVoucherModalProps {
  voucher: InvoiceVoucherData | null;
  onClose: () => void;
}

function buildDeterministicQrGrid(seed: string): boolean[][] {
  const size = 11;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      // Corner finder patterns
      const inTopLeft = r < 3 && c < 3;
      const inTopRight = r < 3 && c >= size - 3;
      const inBottomLeft = r >= size - 3 && c < 3;
      if (inTopLeft || inTopRight || inBottomLeft) {
        const lr = r < 3 ? r : r - (size - 3);
        const lc = c < 3 ? c : c - (size - 3);
        grid[r][c] = lr === 0 || lr === 2 || lc === 0 || lc === 2 || (lr === 1 && lc === 1);
      } else {
        hash ^= (r * 31 + c * 17) & 0xff;
        hash = Math.imul(hash, 16777619);
        grid[r][c] = (hash >>> 0) % 2 === 0;
      }
    }
  }
  return grid;
}

export const InvoiceVoucherModal: React.FC<InvoiceVoucherModalProps> = ({
  voucher,
  onClose
}) => {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const qrGrid = useMemo(
    () => buildDeterministicQrGrid(voucher?.code || 'ZANOZA'),
    [voucher?.code]
  );

  if (!voucher) return null;

  const isEgp = voucher.customerType === 'egyptian';
  const formatAmount = (egp: number, eur: number) =>
    isEgp ? `${egp.toLocaleString()} ج.م` : `€ ${eur.toFixed(2)}`;

  const checkoutItems = voucher.checkoutAddons || [];
  const duringItems = voucher.duringTripAddons || [];

  const handleCopyWhatsAppText = async () => {
    const lines: string[] = [
      `*${voucher.companyName}*`,
      voucher.documentKind === 'end_of_day_invoice'
        ? `فاتورة نهاية اليوم رقم: ${voucher.code}`
        : `قسيمة حجز رقم: #${voucher.code}`,
      `العميل: ${voucher.customerName} (${voucher.customerPhone})`,
      `النشاط / الرحلة: ${voucher.title}`,
      `التاريخ: ${voucher.tripDate}${voucher.tripTime ? ` · ${voucher.tripTime}` : ''}`,
      voucher.pickupLocation ? `نقطة الالتقاء: ${voucher.pickupLocation}` : '',
      voucher.guestsSummary ? `الأفراد: ${voucher.guestsSummary}` : '',
      `-------------------------`,
      `السعر الأساسي: ${formatAmount(voucher.basePriceEGP, voucher.basePriceEUR)}`
    ];

    if (checkoutItems.length > 0) {
      lines.push(`إضافات الحجز:`);
      checkoutItems.forEach((it) => {
        lines.push(
          `- ${it.title} × ${it.quantity} = ${formatAmount(
            it.unitPriceEGP * it.quantity,
            it.unitPriceEUR * it.quantity
          )}`
        );
      });
    }

    if (duringItems.length > 0) {
      lines.push(`طلبات أثناء الرحلة / النشاط:`);
      duringItems.forEach((it) => {
        lines.push(
          `- ${it.title} × ${it.quantity} = ${formatAmount(
            it.unitPriceEGP * it.quantity,
            it.unitPriceEUR * it.quantity
          )}`
        );
      });
    }

    if (voucher.promoCode && ((voucher.promoDiscountEGP || 0) > 0 || (voucher.promoDiscountEUR || 0) > 0)) {
      lines.push(
        `خصم كود (${voucher.promoCode}): - ${formatAmount(
          voucher.promoDiscountEGP || 0,
          voucher.promoDiscountEUR || 0
        )}`
      );
    }

    if ((voucher.serviceFeeEGP || 0) > 0 || (voucher.serviceFeeEUR || 0) > 0) {
      lines.push(
        `رسوم الخدمة والضرائب: ${formatAmount(
          (voucher.serviceFeeEGP || 0) + (voucher.taxEGP || 0),
          (voucher.serviceFeeEUR || 0) + (voucher.taxEUR || 0)
        )}`
      );
    }

    lines.push(`-------------------------`);
    lines.push(`*الإجمالي النهائي: ${formatAmount(voucher.totalEGP, voucher.totalEUR)}*`);
    if (
      typeof voucher.depositAmountEGP === 'number' ||
      typeof voucher.depositAmountEUR === 'number'
    ) {
      lines.push(
        `المدفوع / العربون: ${formatAmount(
          voucher.depositAmountEGP || 0,
          voucher.depositAmountEUR || 0
        )} | المتبقي: ${formatAmount(
          voucher.remainingAmountEGP || 0,
          voucher.remainingAmountEUR || 0
        )}`
      );
    }
    if (voucher.refundSummary) {
      lines.push(`سياسة الاسترداد: ${voucher.refundSummary}`);
    }
    lines.push(`الحالة: ${voucher.statusLabel}`);

    const text = lines.filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2500);
    } catch {
      // Fallback ignored if clipboard denied
    }
  };

  const handleDownloadPrintableHtml = () => {
    const safeEscape = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const rowsHtml = [...checkoutItems, ...duringItems]
      .map(
        (it) =>
          `<tr><td>${safeEscape(it.title)}</td><td>${it.quantity}</td><td>${safeEscape(
            formatAmount(it.unitPriceEGP * it.quantity, it.unitPriceEUR * it.quantity)
          )}</td></tr>`
      )
      .join('');

    const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${safeEscape(voucher.code)} - ${safeEscape(voucher.customerName)}</title>
<style>
  body { font-family: Tahoma, Arial, sans-serif; background: #fff; color: #0f172a; padding: 24px; max-width: 720px; margin: auto; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
  th { background: #f1f5f9; }
  .total { margin-top: 16px; padding: 12px; background: #ecfdf5; border: 1px solid #10b981; font-size: 16px; font-weight: bold; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h2 style="margin:0">${safeEscape(voucher.companyName)}</h2>
      <div style="font-size:13px;color:#475569">${
        voucher.documentKind === 'end_of_day_invoice'
          ? 'فاتورة نهاية اليوم للعميل'
          : 'قسيمة تأكيد الحجز والتذكرة'
      }</div>
    </div>
    <div style="font-family:monospace;font-size:16px;font-weight:bold">#${safeEscape(voucher.code)}</div>
  </div>
  <div class="meta">
    <div><strong>العميل:</strong> ${safeEscape(voucher.customerName)}</div>
    <div><strong>رقم الهاتف:</strong> ${safeEscape(voucher.customerPhone)}</div>
    <div><strong>النشاط / الرحلة:</strong> ${safeEscape(voucher.title)}</div>
    <div><strong>التاريخ:</strong> ${safeEscape(voucher.tripDate)} ${safeEscape(voucher.tripTime || '')}</div>
    ${voucher.pickupLocation ? `<div><strong>نقطة الالتقاء:</strong> ${safeEscape(voucher.pickupLocation)}</div>` : ''}
    <div><strong>الحالة:</strong> ${safeEscape(voucher.statusLabel)}</div>
  </div>
  <table>
    <thead><tr><th>البند</th><th>العدد</th><th>القيمة</th></tr></thead>
    <tbody>
      <tr><td>السعر الأساسي (${safeEscape(voucher.title)})</td><td>1</td><td>${safeEscape(
      formatAmount(voucher.basePriceEGP, voucher.basePriceEUR)
    )}</td></tr>
      ${rowsHtml}
    </tbody>
  </table>
  <div class="total">
    <span>الإجمالي النهائي المستحق</span>
    <span>${safeEscape(formatAmount(voucher.totalEGP, voucher.totalEUR))}</span>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voucher-${voucher.code}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5 print:bg-white print:text-slate-900 print:border-0 print:shadow-none">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-cyan-400 shrink-0" />
            <h3 className="text-base font-bold text-white">
              {voucher.documentKind === 'end_of_day_invoice'
                ? 'فاتورة نهاية اليوم القابلة للطباعة والمشاركة'
                : 'تذكرة وفاتورة الحجز القابلة للطباعة'}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyWhatsAppText}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
            >
              {copiedWhatsApp ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم النسخ للواتساب</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ نص للواتساب</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadPrintableHtml}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل إيصال</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket / Invoice Surface */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5 print:bg-white print:text-slate-900 print:border-slate-300">
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="text-xs text-cyan-400 font-semibold">{voucher.companyName}</div>
              <h4 className="text-lg font-bold text-white print:text-slate-900">
                {voucher.title}
              </h4>
              <div className="text-xs text-slate-400 font-mono tabular-nums">
                كود المستند: #{voucher.code} · {voucher.statusLabel}
              </div>
            </div>

            {/* Verification QR SVG */}
            <div className="bg-white p-2 rounded-lg shrink-0">
              <svg
                width="56"
                height="56"
                viewBox="0 0 11 11"
                shapeRendering="crispEdges"
                aria-label={`رمز التحقق ${voucher.code}`}
              >
                {qrGrid.map((row, r) =>
                  row.map((filled, c) =>
                    filled ? (
                      <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0f172a" />
                    ) : null
                  )
                )}
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 block">بيانات العميل</span>
              <div className="font-bold text-white print:text-slate-900">
                {voucher.customerName}
              </div>
              <div className="text-slate-300 font-mono tabular-nums flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>{voucher.customerPhone}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 block">تفاصيل الموعد والتوصيل</span>
              <div className="text-slate-200 font-mono tabular-nums flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {voucher.tripDate}
                  {voucher.tripTime ? ` · ${voucher.tripTime}` : ''}
                </span>
              </div>
              {voucher.pickupLocation && (
                <div className="text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{voucher.pickupLocation}</span>
                </div>
              )}
              {voucher.guestsSummary && (
                <div className="text-slate-400">{voucher.guestsSummary}</div>
              )}
            </div>
          </div>

          {/* Itemized Breakdown */}
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-slate-400 text-[11px]">
                <tr>
                  <th className="py-2 px-3 font-medium">البند</th>
                  <th className="py-2 px-3 font-medium">المرحلة</th>
                  <th className="py-2 px-3 font-medium">العدد</th>
                  <th className="py-2 px-3 font-medium">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="py-2 px-3 font-semibold text-white">السعر الأساسي للحجز</td>
                  <td className="py-2 px-3 text-slate-400">أساسي</td>
                  <td className="py-2 px-3 font-mono tabular-nums text-slate-300">1</td>
                  <td className="py-2 px-3 font-mono tabular-nums font-bold text-slate-200">
                    {formatAmount(voucher.basePriceEGP, voucher.basePriceEUR)}
                  </td>
                </tr>

                {checkoutItems.map((it) => (
                  <tr key={`chk-${it.id}`}>
                    <td className="py-2 px-3 text-slate-200">{it.title}</td>
                    <td className="py-2 px-3 text-cyan-300">عند الحجز</td>
                    <td className="py-2 px-3 font-mono tabular-nums text-slate-300">
                      {it.quantity}
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums text-slate-200">
                      {formatAmount(
                        it.unitPriceEGP * it.quantity,
                        it.unitPriceEUR * it.quantity
                      )}
                    </td>
                  </tr>
                ))}

                {duringItems.map((it) => (
                  <tr key={`dur-${it.id}`}>
                    <td className="py-2 px-3 text-amber-200">{it.title}</td>
                    <td className="py-2 px-3 text-amber-300">أثناء الرحلة</td>
                    <td className="py-2 px-3 font-mono tabular-nums text-slate-300">
                      {it.quantity}
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums text-amber-300 font-bold">
                      {formatAmount(
                        it.unitPriceEGP * it.quantity,
                        it.unitPriceEUR * it.quantity
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
            <span className="text-sm font-bold text-emerald-200">الإجمالي النهائي المستحق</span>
            <span className="text-lg font-mono tabular-nums font-bold text-emerald-300">
              {formatAmount(voucher.totalEGP, voucher.totalEUR)}
            </span>
          </div>

          {((voucher.depositAmountEGP || 0) > 0 ||
            (voucher.depositAmountEUR || 0) > 0 ||
            (voucher.remainingAmountEGP || 0) > 0 ||
            (voucher.remainingAmountEUR || 0) > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div>
                <span className="text-slate-400 block">المبلغ المسدّد / العربون الآن</span>
                <span className="font-mono tabular-nums font-bold text-emerald-300">
                  {formatAmount(voucher.depositAmountEGP || 0, voucher.depositAmountEUR || 0)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">المتبقي للسداد عند التحرك</span>
                <span className="font-mono tabular-nums font-bold text-amber-300">
                  {formatAmount(voucher.remainingAmountEGP || 0, voucher.remainingAmountEUR || 0)}
                </span>
              </div>
            </div>
          )}

          {(voucher.promoCode || voucher.paymentMethodLabel || voucher.refundSummary) && (
            <div className="text-xs text-slate-300 space-y-1 bg-slate-900/70 border border-slate-800 rounded-xl p-3">
              {voucher.paymentMethodLabel && (
                <div>طريقة السداد: {voucher.paymentMethodLabel}</div>
              )}
              {voucher.promoCode &&
                ((voucher.promoDiscountEGP || 0) > 0 || (voucher.promoDiscountEUR || 0) > 0) && (
                  <div className="text-emerald-300">
                    تم تطبيق كود الخصم ({voucher.promoCode}): -{' '}
                    {formatAmount(voucher.promoDiscountEGP || 0, voucher.promoDiscountEUR || 0)}
                  </div>
                )}
              {voucher.refundSummary && (
                <div className="text-amber-300">حالة الاسترداد: {voucher.refundSummary}</div>
              )}
            </div>
          )}

          {voucher.notes && (
            <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
              ملاحظات: {voucher.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
