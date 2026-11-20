import React, { useMemo, useState } from 'react';
import {
  ShieldAlert,
  Clock,
  UserCheck,
  PlusCircle,
  Edit3,
  Trash2,
  RefreshCw,
  Eye,
  X,
  Building2,
  FileText
} from 'lucide-react';
import {
  AUDIT_ACTION_META,
  AUDIT_DOMAIN_META,
  AuditActionType,
  AuditDomainType,
  AuditLogEntry
} from '../../types/audit';
import {
  RegistryColumnFilterDropdown,
  RegistryFilterOption,
  RegistryFilterSummaryBar,
  RegistrySortIcon,
  useRegistryTableState
} from '../shared/RegistryTableControls';

interface PlatformAuditLogsViewProps {
  auditLogs: AuditLogEntry[];
}

type AuditColKey =
  | 'formattedDateTime'
  | 'actorName'
  | 'action'
  | 'domain'
  | 'entityName'
  | 'summary';

const AUDIT_COLUMNS: readonly AuditColKey[] = [
  'formattedDateTime',
  'actorName',
  'action',
  'domain',
  'entityName',
  'summary'
];

const AUDIT_COL_TITLES: Record<AuditColKey, string> = {
  formattedDateTime: 'تحديد متعدد للتاريخ والتوقيت',
  actorName: 'تحديد متعدد للمستخدم والشركة',
  action: 'تحديد متعدد لنوع العملية',
  domain: 'تحديد متعدد للقسم / النطاق',
  entityName: 'تحديد متعدد لاسم العنصر',
  summary: 'تحديد متعدد لوصف العملية'
};

type QuickDomainGroup =
  | 'all'
  | 'equipment'
  | 'activity'
  | 'logistics'
  | 'trips_bookings'
  | 'finance_pricing'
  | 'favorites';

export const PlatformAuditLogsView: React.FC<PlatformAuditLogsViewProps> = ({ auditLogs }) => {
  const [domainGroupFilter, setDomainGroupFilter] = useState<QuickDomainGroup>('all');
  const [actionQuickFilter, setActionQuickFilter] = useState<'all' | AuditActionType>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const table = useRegistryTableState<AuditColKey>(AUDIT_COLUMNS);

  const kpis = useMemo(() => {
    const creates = auditLogs.filter((l) => l.action === 'create').length;
    const updates = auditLogs.filter(
      (l) => l.action === 'update' || l.action === 'status_change' || l.action === 'approve'
    ).length;
    const deletes = auditLogs.filter(
      (l) => l.action === 'delete' || l.action === 'reject'
    ).length;
    const distinctActors = new Set(auditLogs.map((l) => l.actorName)).size;
    return {
      total: auditLogs.length,
      creates,
      updates,
      deletes,
      distinctActors
    };
  }, [auditLogs]);

  const scopeFilteredLogs = useMemo(() => {
    return auditLogs.filter((entry) => {
      if (domainGroupFilter !== 'all') {
        const grp = AUDIT_DOMAIN_META[entry.domain]?.group;
        if (grp !== domainGroupFilter) return false;
      }
      if (actionQuickFilter !== 'all' && entry.action !== actionQuickFilter) return false;
      return true;
    });
  }, [auditLogs, domainGroupFilter, actionQuickFilter]);

  const columnOptionsMap = useMemo<Record<AuditColKey, RegistryFilterOption[]>>(() => {
    const buildCounts = (
      extractor: (entry: AuditLogEntry) => {
        value: string;
        label: string;
        subLabel?: string;
        dir?: 'ltr' | 'rtl';
      }
    ): RegistryFilterOption[] => {
      const map = new Map<string, RegistryFilterOption>();
      scopeFilteredLogs.forEach((entry) => {
        const meta = extractor(entry);
        const existing = map.get(meta.value);
        if (existing) existing.count += 1;
        else map.set(meta.value, { ...meta, count: 1 });
      });
      return Array.from(map.values());
    };

    return {
      formattedDateTime: buildCounts((e) => ({
        value: e.formattedDate,
        label: e.formattedDate,
        subLabel: e.formattedTime,
        dir: 'ltr'
      })),
      actorName: buildCounts((e) => ({
        value: e.actorId,
        label: e.actorName,
        subLabel: e.actorCompanyName
      })),
      action: buildCounts((e) => ({
        value: e.action,
        label: AUDIT_ACTION_META[e.action].label
      })),
      domain: buildCounts((e) => ({
        value: e.domain,
        label: AUDIT_DOMAIN_META[e.domain]?.label || e.domain
      })),
      entityName: buildCounts((e) => ({
        value: e.entityName,
        label: e.entityName,
        subLabel: e.entityId
      })),
      summary: buildCounts((e) => ({
        value: e.summary,
        label: e.summary
      }))
    };
  }, [scopeFilteredLogs]);

  const filteredLogs = useMemo(() => {
    const f = table.columnFilters;
    const sel = table.selectedColumnFilters;

    const rows = scopeFilteredLogs.filter((e) => {
      const actionLabel = AUDIT_ACTION_META[e.action].label;
      const domainLabel = AUDIT_DOMAIN_META[e.domain]?.label || e.domain;

      if (sel.formattedDateTime.length > 0 && !sel.formattedDateTime.includes(e.formattedDate))
        return false;
      if (sel.actorName.length > 0 && !sel.actorName.includes(e.actorId)) return false;
      if (sel.action.length > 0 && !sel.action.includes(e.action)) return false;
      if (sel.domain.length > 0 && !sel.domain.includes(e.domain)) return false;
      if (sel.entityName.length > 0 && !sel.entityName.includes(e.entityName)) return false;
      if (sel.summary.length > 0 && !sel.summary.includes(e.summary)) return false;

      if (
        f.formattedDateTime.trim() &&
        !e.formattedDateTime.toLowerCase().includes(f.formattedDateTime.trim().toLowerCase())
      )
        return false;
      if (
        f.actorName.trim() &&
        !`${e.actorName} ${e.actorCompanyName}`.toLowerCase().includes(f.actorName.trim().toLowerCase())
      )
        return false;
      if (
        f.action.trim() &&
        !actionLabel.toLowerCase().includes(f.action.trim().toLowerCase())
      )
        return false;
      if (
        f.domain.trim() &&
        !domainLabel.toLowerCase().includes(f.domain.trim().toLowerCase())
      )
        return false;
      if (
        f.entityName.trim() &&
        !`${e.entityName} ${e.entityId}`.toLowerCase().includes(f.entityName.trim().toLowerCase())
      )
        return false;
      if (
        f.summary.trim() &&
        !`${e.summary} ${e.details || ''}`.toLowerCase().includes(f.summary.trim().toLowerCase())
      )
        return false;

      return true;
    });

    if (!table.sortColumn) return rows;
    const dir = table.sortDirection === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (table.sortColumn) {
        case 'formattedDateTime':
          return a.timestampIso.localeCompare(b.timestampIso) * dir;
        case 'actorName':
          return a.actorName.localeCompare(b.actorName, 'ar') * dir;
        case 'action':
          return (
            AUDIT_ACTION_META[a.action].label.localeCompare(
              AUDIT_ACTION_META[b.action].label,
              'ar'
            ) * dir
          );
        case 'domain':
          return (
            (AUDIT_DOMAIN_META[a.domain]?.label || '').localeCompare(
              AUDIT_DOMAIN_META[b.domain]?.label || '',
              'ar'
            ) * dir
          );
        case 'entityName':
          return a.entityName.localeCompare(b.entityName, 'ar') * dir;
        case 'summary':
          return a.summary.localeCompare(b.summary, 'ar') * dir;
        default:
          return 0;
      }
    });
  }, [
    scopeFilteredLogs,
    table.columnFilters,
    table.selectedColumnFilters,
    table.sortColumn,
    table.sortDirection
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-white">
                إدارة السجلات بالمنصة — الرقابة الكاملة والتوثيق الزمني
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-600/40 text-cyan-300 font-mono text-[11px] font-bold">
                {auditLogs.length} حركة مسجلة
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              توثيق لحظي ودائم لجميع عمليات الإضافة والتعديل والحذف وتغيير الحالة عبر المنصة بالكامل (المعدات، الأنشطة، الرحلات، وسائل النقل، الشركاء، الحجوزات، والمعاملات المالية) مع اسم المستخدم والشركة والتاريخ والساعة بالثانية.
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>إجمالي الحركات</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">{kpis.total}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>عمليات الإضافة</span>
            <PlusCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{kpis.creates}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>تعديل وتحديث</span>
            <Edit3 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{kpis.updates}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>عمليات الحذف</span>
            <Trash2 className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{kpis.deletes}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>المستخدمون النشطون</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            {kpis.distinctActors}
          </div>
        </div>
      </div>

      {/* Quick Domain & Action Filter Pills */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold ml-1">نطاق المراقبة:</span>
          {(
            [
              { id: 'all', label: 'الكل بالمنصة' },
              { id: 'equipment', label: 'المعدات والشركاء' },
              { id: 'activity', label: 'الأنشطة والتصنيفات' },
              { id: 'logistics', label: 'وسائل النقل (اللوجستيات)' },
              { id: 'trips_bookings', label: 'الرحلات والحجوزات' },
              { id: 'finance_pricing', label: 'المالية والتسعير' },
              { id: 'favorites', label: 'المفضلة والملفات' }
            ] as Array<{ id: QuickDomainGroup; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDomainGroupFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-colors cursor-pointer ${
                domainGroupFilter === tab.id
                  ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-slate-800/80">
          <span className="text-slate-400 font-semibold ml-1">نوع الإجراء:</span>
          {(
            [
              { id: 'all', label: 'جميع الإجراءات' },
              { id: 'create', label: 'إضافة / إنشاء' },
              { id: 'update', label: 'تعديل' },
              { id: 'delete', label: 'حذف' },
              { id: 'status_change', label: 'تغيير حالة' },
              { id: 'approve', label: 'اعتماد' },
              { id: 'reject', label: 'رفض' }
            ] as Array<{ id: 'all' | AuditActionType; label: string }>
          ).map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => setActionQuickFilter(act.id)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                actionQuickFilter === act.id
                  ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {act.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inline Selected Log Details Strip */}
      {selectedEntry && (
        <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                تفاصيل السجل التوثيقي · {selectedEntry.id}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEntry(null)}
              className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 mb-1">القائم بالعملية</div>
              <div className="font-bold text-white">{selectedEntry.actorName}</div>
              <div className="text-[11px] text-cyan-400 mt-0.5">
                {selectedEntry.actorCompanyName}
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 mb-1">التاريخ والتوقيت الدقيق</div>
              <div dir="ltr" className="font-mono font-bold text-emerald-300 text-right">
                {selectedEntry.formattedDateTime}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">توثيق زمني آلي</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 mb-1">القسم ونوع الإجراء</div>
              <div className="font-bold text-white">
                {AUDIT_DOMAIN_META[selectedEntry.domain]?.label}
              </div>
              <div className={`text-[11px] font-bold mt-0.5 ${AUDIT_ACTION_META[selectedEntry.action].textCls}`}>
                {AUDIT_ACTION_META[selectedEntry.action].label}
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 mb-1">العنصر المستهدف</div>
              <div className="font-bold text-white">{selectedEntry.entityName}</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                {selectedEntry.entityId}
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
            <div className="font-bold text-cyan-300">{selectedEntry.summary}</div>
            {selectedEntry.details && (
              <div className="text-slate-300 text-[11px] leading-relaxed">
                {selectedEntry.details}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Audit Logs Registry Table (Rule 1 Compliant) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <RegistryFilterSummaryBar
          filteredCount={filteredLogs.length}
          totalCount={scopeFilteredLogs.length}
          itemNoun="سجل حركة"
          sortColumn={table.sortColumn}
          sortDirection={table.sortDirection}
          hasActiveFilters={
            table.hasActiveFilters ||
            domainGroupFilter !== 'all' ||
            actionQuickFilter !== 'all'
          }
          onClearAll={() => {
            table.handleClearAll();
            setDomainGroupFilter('all');
            setActionQuickFilter('all');
          }}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-300">
              <tr>
                {[
                  { key: 'formattedDateTime' as AuditColKey, label: 'التاريخ والتوقيت' },
                  { key: 'actorName' as AuditColKey, label: 'المستخدم / الشركة' },
                  { key: 'action' as AuditColKey, label: 'الإجراء' },
                  { key: 'domain' as AuditColKey, label: 'القسم / النطاق' },
                  { key: 'entityName' as AuditColKey, label: 'العنصر والمعرف' },
                  { key: 'summary' as AuditColKey, label: 'ملخص التعديل / الحركة' }
                ].map((col) => (
                  <th key={col.key} className="px-3 py-3 font-bold whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => table.handleToggleSort(col.key)}
                      className="inline-flex items-center gap-1.5 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <span>{col.label}</span>
                      <RegistrySortIcon
                        column={col.key}
                        sortColumn={table.sortColumn}
                        sortDirection={table.sortDirection}
                      />
                    </button>
                  </th>
                ))}
                <th className="px-3 py-3 font-bold text-center whitespace-nowrap">معاينة</th>
              </tr>

              {/* Writable Filter Inputs + Multi-select Dropdown Triggers */}
              <tr className="bg-slate-950/50 border-b border-slate-800">
                {(
                  [
                    { key: 'formattedDateTime', placeholder: 'التاريخ / الوقت...' },
                    { key: 'actorName', placeholder: 'أحمد / محمد...' },
                    { key: 'action', placeholder: 'إضافة / حذف...' },
                    { key: 'domain', placeholder: 'معدات / نشاط...' },
                    { key: 'entityName', placeholder: 'اسم العنصر...' },
                    { key: 'summary', placeholder: 'بحث بالوصف...' }
                  ] as Array<{ key: AuditColKey; placeholder: string }>
                ).map((col) => (
                  <th key={col.key} className="px-2 py-2 font-normal">
                    <input
                      ref={(el) => {
                        table.filterInputRefs.current[col.key] = el;
                      }}
                      type="text"
                      value={table.columnFilters[col.key]}
                      onFocus={() => {
                        table.setOpenDropdownCol(col.key);
                        table.updateDropdownPosition(col.key, [
                          'actorName',
                          'entityName',
                          'summary'
                        ]);
                      }}
                      onClick={() => {
                        table.setOpenDropdownCol(col.key);
                        table.updateDropdownPosition(col.key, [
                          'actorName',
                          'entityName',
                          'summary'
                        ]);
                      }}
                      onChange={(e) =>
                        table.setColumnFilters((prev) => ({
                          ...prev,
                          [col.key]: e.target.value
                        }))
                      }
                      placeholder={table.getSelectedSummaryPlaceholder(
                        col.key,
                        col.placeholder
                      )}
                      className="w-full min-w-[110px] bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </th>
                ))}
                <th className="px-2 py-2" />
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/70">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400 space-y-2">
                    <RefreshCw className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-bold text-slate-300">
                      {auditLogs.length === 0
                        ? 'لم يتم تسجيل عمليات تعديل أو إضافة أو حذف بعد'
                        : 'لا توجد سجلات مطابقة للفلاتر المحددة'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      أي عملية إضافة أو تعديل أو حذف لمعدة أو نشاط أو رحلة أو وسيلة نقل سيتم توثيقها هنا فوراً باسم المستخدم والتوقيت الدقيق.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => {
                  const actionMeta = AUDIT_ACTION_META[entry.action];
                  const domainMeta = AUDIT_DOMAIN_META[entry.domain];
                  const isSelected = selectedEntry?.id === entry.id;

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedEntry(isSelected ? null : entry)}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? 'bg-cyan-950/30' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{entry.formattedDate}</span>
                        </div>
                        <div
                          dir="ltr"
                          className="text-[10px] font-mono text-cyan-400 text-right pr-5"
                        >
                          {entry.formattedTime}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {entry.actorInitials}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">
                              {entry.actorName}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                              <Building2 className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{entry.actorCompanyName}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${actionMeta.badgeCls}`}
                        >
                          {actionMeta.label}
                        </span>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-[11px] font-semibold">
                          {domainMeta?.label || entry.domain}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-bold text-white">{entry.entityName}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {entry.entityId}
                        </div>
                      </td>

                      <td className="px-3 py-3 max-w-xs">
                        <div className="text-slate-200 font-medium line-clamp-1">
                          {entry.summary}
                        </div>
                        {entry.details && (
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {entry.details}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setSelectedEntry(isSelected ? null : entry);
                          }}
                          className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-400 cursor-pointer"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {table.openDropdownCol && table.dropdownRect && (
          <RegistryColumnFilterDropdown
            activeCol={table.openDropdownCol}
            dropdownRect={table.dropdownRect}
            activeDropdownRef={table.activeDropdownRef}
            title={AUDIT_COL_TITLES[table.openDropdownCol]}
            options={columnOptionsMap[table.openDropdownCol]}
            filterText={table.columnFilters[table.openDropdownCol]}
            selectedValues={table.selectedColumnFilters[table.openDropdownCol]}
            onToggleValue={table.handleToggleColumnFilterValue}
            onClearCol={table.handleClearCol}
            onClose={() => table.setOpenDropdownCol(null)}
          />
        )}
      </div>
    </div>
  );
};
