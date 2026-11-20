import React, { useEffect, useState } from 'react';
import {
  Calculator,
  Percent,
  Coins,
  Receipt,
  CheckCircle2,
  Save,
  RotateCcw
} from 'lucide-react';

export type TaxCalculationMode = 'inclusive' | 'exclusive';
export type ServiceFeeMode = 'fixed' | 'percentage';

export interface PlatformPricingSettings {
  serviceFee: {
    isEnabled: boolean;
    feeType: ServiceFeeMode;
    fixedAmount: number;
    fixedAmounts?: {
      EGP: number;
      EUR: number;
      USD: number;
    };
    currency: 'EGP' | 'EUR' | 'USD';
    percentage: number;
  };
  tax: {
    isEnabled: boolean;
    centralRatePercent: number;
    calculationMode?: TaxCalculationMode;
  };
  updatedAt: string;
}

export const DEFAULT_PLATFORM_PRICING_SETTINGS: PlatformPricingSettings = {
  serviceFee: {
    isEnabled: true,
    feeType: 'percentage',
    fixedAmount: 0,
    fixedAmounts: {
      EGP: 0,
      EUR: 0,
      USD: 0
    },
    currency: 'EGP',
    percentage: 0
  },
  tax: {
    isEnabled: false,
    centralRatePercent: 0,
    calculationMode: 'exclusive'
  },
  updatedAt: ''
};

export function computePlatformServiceFee(
  basePrice: number,
  serviceFee: PlatformPricingSettings['serviceFee'],
  priceCurrency: 'EGP' | 'EUR' | 'USD' = 'EGP'
): number {
  const base = Math.max(0, Number(basePrice) || 0);
  if (!serviceFee.isEnabled || base <= 0) return 0;
  const mode: ServiceFeeMode = serviceFee.feeType || 'percentage';
  if (mode === 'fixed') {
    if (serviceFee.fixedAmounts && typeof serviceFee.fixedAmounts[priceCurrency] === 'number') {
      return Math.max(0, Number(serviceFee.fixedAmounts[priceCurrency]) || 0);
    }
    if (serviceFee.currency !== priceCurrency) return 0;
    return Math.max(0, Number(serviceFee.fixedAmount) || 0);
  }
  const pct = Math.min(100, Math.max(0, Number(serviceFee.percentage) || 0));
  return (base * pct) / 100;
}

export function computePlatformTax(
  basePrice: number,
  tax: PlatformPricingSettings['tax']
): number {
  const base = Math.max(0, Number(basePrice) || 0);
  if (!tax.isEnabled || base <= 0) return 0;
  const rate = Math.min(100, Math.max(0, Number(tax.centralRatePercent) || 0));
  return (base * rate) / 100;
}

export function computeCustomerFinalPrice(
  basePrice: number,
  settings?: PlatformPricingSettings,
  priceCurrency: 'EGP' | 'EUR' | 'USD' = 'EGP'
): { base: number; fee: number; tax: number; total: number } {
  const base = Math.max(0, Number(basePrice) || 0);
  if (!settings || base <= 0) {
    return { base, fee: 0, tax: 0, total: base };
  }
  const fee = computePlatformServiceFee(base, settings.serviceFee, priceCurrency);
  const tax = computePlatformTax(base, settings.tax);
  return {
    base,
    fee,
    tax,
    total: Number((base + fee + tax).toFixed(2))
  };
}

interface PricingToolManagerProps {
  settings: PlatformPricingSettings;
  onSaveSettings: (next: PlatformPricingSettings) => Promise<void> | void;
}

export const PricingToolManager: React.FC<PricingToolManagerProps> = ({
  settings,
  onSaveSettings
}) => {
  const normalizeSettings = (src: PlatformPricingSettings): PlatformPricingSettings => {
    const legacyAmount = Math.max(0, Number(src.serviceFee?.fixedAmount) || 0);
    const legacyCurrency = src.serviceFee?.currency || 'EGP';
    const fixedAmounts = {
      EGP: Math.max(
        0,
        Number(src.serviceFee?.fixedAmounts?.EGP ?? (legacyCurrency === 'EGP' ? legacyAmount : 0)) || 0
      ),
      EUR: Math.max(
        0,
        Number(src.serviceFee?.fixedAmounts?.EUR ?? (legacyCurrency === 'EUR' ? legacyAmount : 0)) || 0
      ),
      USD: Math.max(
        0,
        Number(src.serviceFee?.fixedAmounts?.USD ?? (legacyCurrency === 'USD' ? legacyAmount : 0)) || 0
      )
    };

    return {
      serviceFee: {
        isEnabled: src.serviceFee?.isEnabled ?? true,
        feeType: src.serviceFee?.feeType === 'fixed' ? 'fixed' : 'percentage',
        fixedAmount: fixedAmounts.EGP,
        fixedAmounts,
        currency: legacyCurrency,
        percentage: Math.min(100, Math.max(0, Number(src.serviceFee?.percentage) || 0))
      },
      tax: {
        isEnabled: src.tax?.isEnabled ?? false,
        centralRatePercent: Math.min(100, Math.max(0, Number(src.tax?.centralRatePercent) || 0)),
        calculationMode: 'exclusive'
      },
      updatedAt: src.updatedAt || ''
    };
  };

  const [draft, setDraft] = useState<PlatformPricingSettings>(() => normalizeSettings(settings));
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setDraft(normalizeSettings(settings));
  }, [settings]);

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((prev) => (prev === msg ? null : prev)), 3500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const normalized: PlatformPricingSettings = {
        ...normalizeSettings(draft),
        updatedAt: new Date().toISOString()
      };
      await onSaveSettings(normalized);
      notify('✓ تم حفظ إعدادات أداة التسعير وتطبيقها على جميع الأنشطة بنجاح');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setDraft(normalizeSettings(settings));
  };

  const activeFeeType: ServiceFeeMode = draft.serviceFee.feeType || 'percentage';
  const samplePrice = 1000;
  const fixedAmounts = draft.serviceFee.fixedAmounts || {
    EGP: draft.serviceFee.currency === 'EGP' ? draft.serviceFee.fixedAmount : 0,
    EUR: draft.serviceFee.currency === 'EUR' ? draft.serviceFee.fixedAmount : 0,
    USD: draft.serviceFee.currency === 'USD' ? draft.serviceFee.fixedAmount : 0
  };
  const totalServiceFeePct = computePlatformServiceFee(samplePrice, draft.serviceFee, 'EGP');

  const fmt = (val: number) =>
    Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {toastMsg && (
        <div className="px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-2 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <span>أداة التسعير</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ضبط رسوم خدمة المنصة المحصّلة من العميل والضريبة المركزية المطبّقة على جميع الأنشطة.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إلغاء التغييرات</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات التسعير'}</span>
          </button>
        </div>
      </div>

      {/* Two Required Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Block 1: إدارة رسوم خدمة المنصة */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span>1. إدارة رسوم خدمة المنصة</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                اختر أحد النوعين فقط (مبلغ ثابت أو نسبة مئوية) ليُطبّق على جميع الأنشطة ويظهر في السعر النهائي للعميل.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer text-xs select-none shrink-0">
              <input
                type="checkbox"
                checked={draft.serviceFee.isEnabled}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    serviceFee: { ...prev.serviceFee, isEnabled: e.target.checked }
                  }))
                }
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className={draft.serviceFee.isEnabled ? 'text-emerald-300 font-bold' : 'text-slate-500'}>
                {draft.serviceFee.isEnabled ? 'مفعّل' : 'معطّل'}
              </span>
            </label>
          </div>

          <div className={`space-y-4 transition-opacity ${draft.serviceFee.isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            {/* Option A: Fixed Fee (3 Currency Inputs: EGP, EUR, USD) */}
            <div
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  serviceFee: { ...prev.serviceFee, feeType: 'fixed' }
                }))
              }
              className={`rounded-xl p-4 space-y-2.5 border cursor-pointer transition-all ${
                activeFeeType === 'fixed'
                  ? 'bg-emerald-950/25 border-emerald-500/60 shadow-sm'
                  : 'bg-slate-950/50 border-slate-800 opacity-65 hover:opacity-90'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-100 cursor-pointer">
                  <input
                    type="radio"
                    name="serviceFeeType"
                    checked={activeFeeType === 'fixed'}
                    onChange={() =>
                      setDraft((prev) => ({
                        ...prev,
                        serviceFee: { ...prev.serviceFee, feeType: 'fixed' }
                      }))
                    }
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span>المبلغ الثابت لرسوم الخدمة (Fixed Fee)</span>
                </label>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    activeFeeType === 'fixed'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {activeFeeType === 'fixed' ? 'مطبّق على جميع الأنشطة' : 'غير مختار'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                مبلغ ثابت لكل عملة يُضاف على سعر كل نشاط حسب عملته (مثال: نشاط بسعر 1000 + مبلغ ثابت 30 = يظهر للعميل 1030).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1" onClick={(e) => e.stopPropagation()}>
                {(
                  [
                    { code: 'EGP', label: 'المصري (ج.م)', symbol: 'EGP' },
                    { code: 'EUR', label: 'اليورو (€)', symbol: 'EUR' },
                    { code: 'USD', label: 'الدولار ($)', symbol: 'USD' }
                  ] as const
                ).map((curr) => (
                  <div key={curr.code} className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-300">
                      {curr.label}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        disabled={activeFeeType !== 'fixed'}
                        value={fixedAmounts[curr.code]}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setDraft((prev) => {
                            const prevMap = prev.serviceFee.fixedAmounts || {
                              EGP: prev.serviceFee.currency === 'EGP' ? prev.serviceFee.fixedAmount : 0,
                              EUR: prev.serviceFee.currency === 'EUR' ? prev.serviceFee.fixedAmount : 0,
                              USD: prev.serviceFee.currency === 'USD' ? prev.serviceFee.fixedAmount : 0
                            };
                            const nextMap = { ...prevMap, [curr.code]: val };
                            return {
                              ...prev,
                              serviceFee: {
                                ...prev.serviceFee,
                                feeType: 'fixed',
                                fixedAmount: nextMap.EGP,
                                fixedAmounts: nextMap
                              }
                            };
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 disabled:opacity-50 rounded-lg pr-3 pl-12 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                        placeholder="0"
                      />
                      <span className="text-[10px] font-mono font-bold text-emerald-300 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        {curr.symbol}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Option B: Percentage Fee */}
            <div
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  serviceFee: { ...prev.serviceFee, feeType: 'percentage' }
                }))
              }
              className={`rounded-xl p-4 space-y-2 border cursor-pointer transition-all ${
                activeFeeType === 'percentage'
                  ? 'bg-emerald-950/25 border-emerald-500/60 shadow-sm'
                  : 'bg-slate-950/50 border-slate-800 opacity-65 hover:opacity-90'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-100 cursor-pointer">
                  <input
                    type="radio"
                    name="serviceFeeType"
                    checked={activeFeeType === 'percentage'}
                    onChange={() =>
                      setDraft((prev) => ({
                        ...prev,
                        serviceFee: { ...prev.serviceFee, feeType: 'percentage' }
                      }))
                    }
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span>النسبة المئوية لرسوم الخدمة (Percentage Fee %)</span>
                </label>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    activeFeeType === 'percentage'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {activeFeeType === 'percentage' ? 'مطبّق على جميع الأنشطة' : 'غير مختار'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                نسبة مئوية تُضاف على سعر كل نشاط (مثال: نشاط بسعر 1000 + نسبة 10% = يظهر للعميل 1100).
              </p>
              <div className="relative pt-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  disabled={activeFeeType !== 'percentage'}
                  value={draft.serviceFee.percentage}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      serviceFee: {
                        ...prev.serviceFee,
                        feeType: 'percentage',
                        percentage: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                      }
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-700 disabled:opacity-50 rounded-lg pr-3 pl-10 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  placeholder="10"
                />
                <Percent className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 mt-0.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-300">
              {activeFeeType === 'fixed'
                ? 'رسوم المنصة الثابتة المطبّقة حسب العملة:'
                : `رسوم المنصة المطبّقة (نسبة مئوية) على (${samplePrice}):`}
            </span>
            {activeFeeType === 'fixed' ? (
              <span className="font-mono font-bold text-emerald-300">
                {fmt(fixedAmounts.EGP)} ج.م · €{fmt(fixedAmounts.EUR)} · ${fmt(fixedAmounts.USD)}
              </span>
            ) : (
              <span className="font-mono font-bold text-emerald-300">
                {fmt(totalServiceFeePct)} ({draft.serviceFee.percentage}%)
              </span>
            )}
          </div>
        </div>

        {/* Block 2: إدارة الضرائب */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-cyan-400" />
                  <span>2. إدارة الضرائب</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تحديد نسبة الضريبة المركزية التي تطبق على جميع الأنشطة.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer text-xs select-none shrink-0">
                <input
                  type="checkbox"
                  checked={draft.tax.isEnabled}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      tax: { ...prev.tax, isEnabled: e.target.checked }
                    }))
                  }
                  className="w-4 h-4 accent-cyan-500 rounded"
                />
                <span className={draft.tax.isEnabled ? 'text-cyan-300 font-bold' : 'text-slate-500'}>
                  {draft.tax.isEnabled ? 'مفعّل' : 'معطّل'}
                </span>
              </label>
            </div>

            <div className={`space-y-4 transition-opacity ${draft.tax.isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              {/* Central Tax Percentage */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                <label className="block text-xs font-bold text-slate-200">
                  نسبة الضريبة المركزية (Central Tax Rate %)
                </label>
                <p className="text-[11px] text-slate-400">
                  تُطبق هذه النسبة مركزياً على جميع الأنشطة المدرجة في المنصة.
                </p>
                <div className="relative pt-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={draft.tax.centralRatePercent}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        tax: {
                          ...prev.tax,
                          centralRatePercent: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                        }
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pr-3 pl-10 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                    placeholder="0"
                  />
                  <Percent className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 mt-0.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
