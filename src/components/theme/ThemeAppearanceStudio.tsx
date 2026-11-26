import React, { useState } from 'react';
import {
  Palette,
  Layout,
  Type,
  Check,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import type { AppUser } from '../../types/auth';
import {
  OwnerThemeSettings,
  THEME_COLOR_PRESETS,
  THEME_FONTS,
  THEME_TEMPLATES,
  ThemeFontScale,
  ThemeRadiusMode
} from '../../types/theme';

interface ThemeAppearanceStudioProps {
  currentUser: AppUser;
  currentTheme: OwnerThemeSettings;
  onUpdateTheme: (patch: Partial<OwnerThemeSettings>) => void;
  onResetTheme: () => void;
}

const FONT_SCALE_OPTIONS: Array<{ id: ThemeFontScale; label: string; desc: string }> = [
  { id: 'compact', label: 'مكثف (Compact)', desc: 'عرض صفوف وبيانات أكثر في الشاشة' },
  { id: 'standard', label: 'قياسي متوازن', desc: 'الحجم الافتراضي المريح للعمل اليومي' },
  { id: 'comfortable', label: 'مريح كبير', desc: 'وضوح إضافي للنصوص والعناوين' }
];

const RADIUS_OPTIONS: Array<{ id: ThemeRadiusMode; label: string }> = [
  { id: 'sharp', label: 'زوايا حادة عصرية' },
  { id: 'balanced', label: 'زوايا متوازنة' },
  { id: 'rounded', label: 'زوايا دائرية ناعمة' }
];

export const ThemeAppearanceStudio: React.FC<ThemeAppearanceStudioProps> = ({
  currentUser,
  currentTheme,
  onUpdateTheme,
  onResetTheme
}) => {
  const [savedBanner, setSavedBanner] = useState('');

  const notifySaved = (msg: string) => {
    setSavedBanner(msg);
    setTimeout(() => setSavedBanner(''), 2800);
  };

  const activeColorMeta =
    THEME_COLOR_PRESETS.find((c) => c.id === currentTheme.colorPreset) || THEME_COLOR_PRESETS[0];
  const activeTemplateMeta =
    THEME_TEMPLATES.find((t) => t.id === currentTheme.templateId) || THEME_TEMPLATES[0];

  return (
    <div className="space-y-6 text-right max-w-[1380px] mx-auto" dir="rtl">
      {/* Studio Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-1">
            <Palette className="w-4 h-4" />
            <span>استوديو الهوية البصرية · تخصيص التصميم المستقل لكل صاحب نشاط</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white flex flex-wrap items-center gap-2.5">
            <span>تخصيص القوالب والألوان والخطوط</span>
            <span className="inline-flex items-center gap-1.5 text-xs bg-cyan-950 text-cyan-300 border border-cyan-800/50 px-3 py-0.5 rounded-full">
              <UserCheck className="w-3.5 h-3.5" />
              <span>تصميم خاص بحساب: {currentUser.name}</span>
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            يُحفظ هذا التصميم تلقائياً على مستوى حساب صاحب النشاط ({currentUser.companyName}) بحيث يتميز كل شريك بقالب وألوان وخطوط مستقلة عند الدخول.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {savedBanner && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{savedBanner}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onResetTheme();
              notifySaved(`✓ تم استعادة التصميم الافتراضي لحساب ${currentUser.name}`);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>استعادة الافتراضي</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="xl:col-span-8 space-y-6">
          {/* 1. القوالب (Templates) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layout className="w-4 h-4 text-cyan-400" />
                <span>1. اختيار القالب العام للواجهة (Template)</span>
              </h3>
              <span className="text-[11px] text-slate-400">يغيّر الخلفية والبطاقات والحدود</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {THEME_TEMPLATES.map((tpl) => {
                const isSelected = currentTheme.templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      onUpdateTheme({
                        templateId: tpl.id,
                        ...(tpl.recommendedColorPreset
                          ? { colorPreset: tpl.recommendedColorPreset }
                          : {}),
                        ...(tpl.recommendedFontFamily
                          ? { fontFamily: tpl.recommendedFontFamily }
                          : {}),
                        ...(tpl.recommendedRadiusMode
                          ? { radiusMode: tpl.recommendedRadiusMode }
                          : {})
                      });
                      notifySaved(`✓ تم تفعيل «${tpl.name}» لحساب ${currentUser.name}`);
                    }}
                    className={`text-right p-3.5 rounded-xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-cyan-950/35 border-cyan-400 ring-1 ring-cyan-500/40'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {/* Visual Mini-Mockup */}
                    <div
                      className="h-20 rounded-lg border p-2.5 flex gap-2 overflow-hidden relative"
                      style={{
                        backgroundColor: tpl.previewBg,
                        borderColor: tpl.previewBorder
                      }}
                    >
                      {tpl.previewBrandBadge && (
                        <span
                          className="absolute left-2 top-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor:
                              tpl.recommendedColorPreset === 'e_and_red' ? '#e00800' : activeColorMeta.primaryHex
                          }}
                        >
                          {tpl.previewBrandBadge}
                        </span>
                      )}
                      <div
                        className="w-10 rounded border shrink-0"
                        style={{
                          backgroundColor: tpl.previewCard,
                          borderColor: tpl.previewBorder
                        }}
                      />
                      <div className="flex-1 space-y-1.5">
                        <div
                          className="h-3 w-2/3 rounded"
                          style={{
                            backgroundColor:
                              tpl.recommendedColorPreset === 'e_and_red'
                                ? '#e00800'
                                : activeColorMeta.primaryHex
                          }}
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <div
                            className="h-8 rounded border"
                            style={{
                              backgroundColor: tpl.previewCard,
                              borderColor: tpl.previewBorder
                            }}
                          />
                          <div
                            className="h-8 rounded border"
                            style={{
                              backgroundColor: tpl.previewCard,
                              borderColor: tpl.previewBorder
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{tpl.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({tpl.isLight ? 'فاتح' : 'داكن'})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{tpl.subtitle}</p>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. لوحة الألوان (Color Palette) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span>2. الألوان المميزة والأزرار (Accent Palette)</span>
              </h3>
              <span className="text-[11px] text-slate-400">ينعكس على الأزرار والمؤشرات النشطة</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {THEME_COLOR_PRESETS.map((preset) => {
                const isSelected = currentTheme.colorPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onUpdateTheme({ colorPreset: preset.id });
                      notifySaved(`✓ تم تطبيق اللون «${preset.name}»`);
                    }}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-slate-800/80 border-white/60 ring-1 ring-white/30'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="w-7 h-7 rounded-lg shadow-inner"
                        style={{ backgroundColor: preset.primaryHex }}
                      />
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-xs font-bold text-slate-100">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. الخطوط والمقاسات (Fonts & Scale) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Type className="w-4 h-4 text-cyan-400" />
                <span>3. الخطوط العربية وحجم النصوص (Typography)</span>
              </h3>
              <span className="text-[11px] text-slate-400">تطبيق فوري على كامل المنصة</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEME_FONTS.map((font) => {
                const isSelected = currentTheme.fontFamily === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => {
                      onUpdateTheme({ fontFamily: font.id });
                      notifySaved(`✓ تم تغيير الخط إلى «${font.name}»`);
                    }}
                    style={{ fontFamily: `'${font.id}', sans-serif` }}
                    className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-cyan-950/35 border-cyan-400 ring-1 ring-cyan-500/40'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-white">{font.name}</div>
                      <div className="text-xs text-cyan-300 mt-1">{font.sample}</div>
                      <p className="text-[10px] text-slate-400 mt-1">{font.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">حجم الخط العام:</span>
                <div className="grid grid-cols-3 gap-2">
                  {FONT_SCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onUpdateTheme({ fontScale: opt.id });
                        notifySaved(`✓ تم ضبط حجم الخط: ${opt.label}`);
                      }}
                      className={`p-2 rounded-lg border text-center text-[11px] font-bold transition-colors cursor-pointer ${
                        currentTheme.fontScale === opt.id
                          ? 'bg-cyan-600 text-white border-cyan-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                      title={opt.desc}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">استدارة البطاقات والأزرار:</span>
                <div className="grid grid-cols-3 gap-2">
                  {RADIUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onUpdateTheme({ radiusMode: opt.id });
                        notifySaved(`✓ تم تعديل شكل الزوايا: ${opt.label}`);
                      }}
                      className={`p-2 rounded-lg border text-center text-[11px] font-bold transition-colors cursor-pointer ${
                        currentTheme.radiusMode === opt.id
                          ? 'bg-cyan-600 text-white border-cyan-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>معاينة حية لتصميم {currentUser.name}</span>
              </h3>
            </div>

            <div
              className="p-4 border transition-all space-y-3"
              style={{
                backgroundColor: activeTemplateMeta.previewBg,
                borderColor: activeTemplateMeta.previewBorder,
                fontFamily: `'${currentTheme.fontFamily}', sans-serif`,
                borderRadius:
                  currentTheme.radiusMode === 'sharp'
                    ? '6px'
                    : currentTheme.radiusMode === 'rounded'
                    ? '20px'
                    : '14px',
                color: activeTemplateMeta.isLight ? '#0f172a' : '#f8fafc'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{currentUser.companyName}</span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: activeColorMeta.softHex,
                    color: activeTemplateMeta.isLight
                      ? activeColorMeta.primaryHex
                      : activeColorMeta.textHex,
                    border: `1px solid ${activeColorMeta.borderHex}`
                  }}
                >
                  {activeColorMeta.name}
                </span>
              </div>

              <div
                className="p-3 border space-y-2"
                style={{
                  backgroundColor: activeTemplateMeta.previewCard,
                  borderColor: activeTemplateMeta.previewBorder,
                  borderRadius:
                    currentTheme.radiusMode === 'sharp'
                      ? '4px'
                      : currentTheme.radiusMode === 'rounded'
                      ? '16px'
                      : '12px'
                }}
              >
                <div className="text-sm font-bold">رحلة يخت خاص VIP · جزيرة الجفتون</div>
                <p
                  className="text-[11px]"
                  style={{ color: activeTemplateMeta.isLight ? '#475569' : '#94a3b8' }}
                >
                  نموذج عرض البطاقة والعناوين والأزرار بالخط المختار ({currentTheme.fontFamily}).
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-mono text-xs font-bold">1,850 ج.م · €55</span>
                  <span
                    className="px-3 py-1 text-[11px] font-bold text-white"
                    style={{
                      backgroundColor: activeColorMeta.primaryHex,
                      borderRadius:
                        currentTheme.radiusMode === 'sharp'
                          ? '4px'
                          : currentTheme.radiusMode === 'rounded'
                          ? '999px'
                          : '8px'
                    }}
                  >
                    حجز وتأكيد
                  </span>
                </div>
              </div>

              <div
                className="text-[10px] flex flex-wrap items-center justify-between gap-2 pt-1"
                style={{ color: activeTemplateMeta.isLight ? '#64748b' : '#94a3b8' }}
              >
                <span>القالب: {activeTemplateMeta.name}</span>
                <span>الخط: {currentTheme.fontFamily}</span>
              </div>
            </div>

            {currentTheme.updatedAt && (
              <div className="text-[11px] text-slate-400 bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                آخر حفظ لتصميم هذا الحساب:{' '}
                <strong className="text-cyan-300 font-mono">{currentTheme.updatedAt}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
