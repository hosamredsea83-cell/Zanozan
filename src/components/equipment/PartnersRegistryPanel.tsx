import React, { useMemo, useState } from 'react';
import type { EquipmentItem } from '../../types/equipment';
import type { PartnerRecord, PartnerType } from '../../types/partner';
import { PARTNER_TYPE_LABELS } from './equipmentHelpers';
import {
  RegistryColumnFilterDropdown,
  RegistryFilterOption,
  RegistryFilterSummaryBar,
  RegistrySortIcon,
  useRegistryTableState
} from '../shared/RegistryTableControls';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Phone,
  Building2,
  Check,
  X,
  ArrowRight
} from 'lucide-react';

interface PartnersRegistryPanelProps {
  partners: PartnerRecord[];
  equipments: EquipmentItem[];
  onCreatePartner: (
    payload: Omit<PartnerRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => PartnerRecord;
  onUpdatePartner: (updated: PartnerRecord) => void;
  onDeletePartner: (partnerId: string) => void;
  onSelectPartner?: (partner: PartnerRecord) => void;
  selectedPartnerId?: string;
  onReturnToForm?: () => void;
  returnFormLabel?: string;
}

type PartnerSortColumn =
  | 'name'
  | 'companyName'
  | 'partnerType'
  | 'phone'
  | 'shareOrContractNote'
  | 'linkedCount';

const PARTNER_COLUMNS: readonly PartnerSortColumn[] = [
  'name',
  'companyName',
  'partnerType',
  'phone',
  'shareOrContractNote',
  'linkedCount'
];

const WIDE_PARTNER_COLS: readonly PartnerSortColumn[] = [
  'name',
  'companyName',
  'shareOrContractNote'
];

const COLUMN_DROPDOWN_TITLES: Record<PartnerSortColumn, string> = {
  name: 'تحديد متعدد لاسم الشريك',
  companyName: 'تحديد متعدد للشركة والباقة',
  partnerType: 'تحديد متعدد لتصنيف العلاقة',
  phone: 'تحديد متعدد لأرقام الهواتف',
  shareOrContractNote: 'تحديد متعدد لمرجع التعاقد',
  linkedCount: 'تحديد متعدد لعدد المعدات المرتبطة'
};

const PARTNER_TIERS = [
  'باقة الشركاء المعتمدين',
  'باقة المحترفين الفضية',
  'باقة الشركاء الذهبية',
  'باقة كبار الشركاء VIP',
  'باقة المؤسسات الماسية'
];

export const PartnersRegistryPanel: React.FC<PartnersRegistryPanelProps> = ({
  partners,
  equipments,
  onCreatePartner,
  onUpdatePartner,
  onDeletePartner,
  onSelectPartner,
  selectedPartnerId,
  onReturnToForm,
  returnFormLabel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | PartnerType>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [nameInput, setNameInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [partnerTypeInput, setPartnerTypeInput] = useState<PartnerType>('operating_partner');
  const [tierInput, setTierInput] = useState(PARTNER_TIERS[0]);
  const [shareNoteInput, setShareNoteInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const tableState = useRegistryTableState<PartnerSortColumn>(PARTNER_COLUMNS);

  const resetForm = () => {
    setEditingPartnerId(null);
    setNameInput('');
    setCompanyInput('');
    setPhoneInput('');
    setEmailInput('');
    setPartnerTypeInput('operating_partner');
    setTierInput(PARTNER_TIERS[0]);
    setShareNoteInput('');
    setNotesInput('');
    setIsFormOpen(false);
  };

  const openEditForm = (partner: PartnerRecord) => {
    setEditingPartnerId(partner.id);
    setNameInput(partner.name);
    setCompanyInput(partner.companyName);
    setPhoneInput(partner.phone);
    setEmailInput(partner.email || '');
    setPartnerTypeInput(partner.partnerType);
    setTierInput(partner.tier || PARTNER_TIERS[0]);
    setShareNoteInput(partner.shareOrContractNote || '');
    setNotesInput(partner.notes || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !companyInput.trim()) return;

    if (editingPartnerId) {
      const existing = partners.find((p) => p.id === editingPartnerId);
      if (existing) {
        onUpdatePartner({
          ...existing,
          name: nameInput.trim(),
          companyName: companyInput.trim(),
          phone: phoneInput.trim(),
          email: emailInput.trim() || undefined,
          partnerType: partnerTypeInput,
          tier: tierInput,
          shareOrContractNote: shareNoteInput.trim() || undefined,
          notes: notesInput.trim() || undefined
        });
      }
    } else {
      const created = onCreatePartner({
        name: nameInput.trim(),
        companyName: companyInput.trim(),
        phone: phoneInput.trim(),
        email: emailInput.trim() || undefined,
        partnerType: partnerTypeInput,
        tier: tierInput,
        shareOrContractNote: shareNoteInput.trim() || undefined,
        notes: notesInput.trim() || undefined,
        isActive: true
      });
      if (onSelectPartner) {
        onSelectPartner(created);
      }
    }
    resetForm();
  };

  const linkedCountMap = useMemo(() => {
    const map = new Map<string, number>();
    equipments.forEach((eq) => {
      if (eq.partnerId) {
        map.set(eq.partnerId, (map.get(eq.partnerId) || 0) + 1);
      }
    });
    return map;
  }, [equipments]);

  const columnOptionsMap = useMemo<Record<PartnerSortColumn, RegistryFilterOption[]>>(() => {
    const nameCounts = new Map<string, { id: string; count: number }>();
    const companyCounts = new Map<string, { tier: string; count: number }>();
    const typeCounts = new Map<PartnerType, number>();
    const phoneCounts = new Map<string, number>();
    const noteCounts = new Map<string, number>();
    const linkedCounts = new Map<number, number>();

    partners.forEach((p) => {
      const prevName = nameCounts.get(p.name);
      nameCounts.set(p.name, { id: p.id, count: (prevName?.count || 0) + 1 });

      const prevComp = companyCounts.get(p.companyName);
      companyCounts.set(p.companyName, { tier: p.tier || '', count: (prevComp?.count || 0) + 1 });

      typeCounts.set(p.partnerType, (typeCounts.get(p.partnerType) || 0) + 1);

      const phoneVal = p.phone || '—';
      phoneCounts.set(phoneVal, (phoneCounts.get(phoneVal) || 0) + 1);

      const noteVal = p.shareOrContractNote || p.notes || '—';
      noteCounts.set(noteVal, (noteCounts.get(noteVal) || 0) + 1);

      const eqCount = linkedCountMap.get(p.id) || 0;
      linkedCounts.set(eqCount, (linkedCounts.get(eqCount) || 0) + 1);
    });

    return {
      name: Array.from(nameCounts.entries()).map(([val, meta]) => ({
        value: val,
        label: val,
        subLabel: meta.id,
        count: meta.count
      })),
      companyName: Array.from(companyCounts.entries()).map(([val, meta]) => ({
        value: val,
        label: val,
        subLabel: meta.tier,
        count: meta.count
      })),
      partnerType: (Object.keys(PARTNER_TYPE_LABELS) as PartnerType[]).map((tKey) => ({
        value: tKey,
        label: PARTNER_TYPE_LABELS[tKey],
        count: typeCounts.get(tKey) || 0
      })),
      phone: Array.from(phoneCounts.entries()).map(([val, count]) => ({
        value: val,
        label: val,
        dir: val === '—' ? 'rtl' : 'ltr',
        count
      })),
      shareOrContractNote: Array.from(noteCounts.entries()).map(([val, count]) => ({
        value: val,
        label: val,
        count
      })),
      linkedCount: Array.from(linkedCounts.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([cnt, total]) => ({
          value: String(cnt),
          label: `${cnt} معدة مرتبطة`,
          count: total
        }))
    };
  }, [partners, linkedCountMap]);

  const filteredPartners = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const {
      columnFilters: cf,
      selectedColumnFilters: scf,
      sortColumn,
      sortDirection
    } = tableState;

    const fName = cf.name.trim().toLowerCase();
    const fComp = cf.companyName.trim().toLowerCase();
    const fType = cf.partnerType.trim().toLowerCase();
    const fPhone = cf.phone.trim().toLowerCase();
    const fNote = cf.shareOrContractNote.trim().toLowerCase();
    const fLinked = cf.linkedCount.trim().toLowerCase();

    const filtered = partners.filter((p) => {
      if (typeFilter !== 'all' && p.partnerType !== typeFilter) return false;

      if (q) {
        const blob = `${p.id} ${p.name} ${p.companyName} ${PARTNER_TYPE_LABELS[p.partnerType]} ${
          p.phone
        } ${p.tier || ''} ${p.shareOrContractNote || ''} ${p.notes || ''}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }

      if (scf.name.length > 0) {
        if (!scf.name.includes(p.name)) return false;
      } else if (fName) {
        if (!`${p.name} ${p.id}`.toLowerCase().includes(fName)) return false;
      }

      if (scf.companyName.length > 0) {
        if (!scf.companyName.includes(p.companyName)) return false;
      } else if (fComp) {
        if (!`${p.companyName} ${p.tier || ''}`.toLowerCase().includes(fComp)) return false;
      }

      if (scf.partnerType.length > 0) {
        if (!scf.partnerType.includes(p.partnerType)) return false;
      } else if (fType) {
        if (!PARTNER_TYPE_LABELS[p.partnerType].toLowerCase().includes(fType)) return false;
      }

      const phoneVal = p.phone || '—';
      if (scf.phone.length > 0) {
        if (!scf.phone.includes(phoneVal)) return false;
      } else if (fPhone) {
        if (!phoneVal.toLowerCase().includes(fPhone)) return false;
      }

      const noteVal = p.shareOrContractNote || p.notes || '—';
      if (scf.shareOrContractNote.length > 0) {
        if (!scf.shareOrContractNote.includes(noteVal)) return false;
      } else if (fNote) {
        if (!noteVal.toLowerCase().includes(fNote)) return false;
      }

      const eqCount = linkedCountMap.get(p.id) || 0;
      if (scf.linkedCount.length > 0) {
        if (!scf.linkedCount.includes(String(eqCount))) return false;
      } else if (fLinked) {
        if (!`${eqCount} معدة`.toLowerCase().includes(fLinked)) return false;
      }

      return true;
    });

    if (!sortColumn) return filtered;

    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortColumn) {
        case 'name':
          return a.name.localeCompare(b.name, 'ar') * dir;
        case 'companyName':
          return a.companyName.localeCompare(b.companyName, 'ar') * dir;
        case 'partnerType':
          return (
            PARTNER_TYPE_LABELS[a.partnerType].localeCompare(
              PARTNER_TYPE_LABELS[b.partnerType],
              'ar'
            ) * dir
          );
        case 'phone':
          return (a.phone || '').localeCompare(b.phone || '', 'en') * dir;
        case 'shareOrContractNote':
          return (
            (a.shareOrContractNote || a.notes || '').localeCompare(
              b.shareOrContractNote || b.notes || '',
              'ar'
            ) * dir
          );
        case 'linkedCount': {
          const cA = linkedCountMap.get(a.id) || 0;
          const cB = linkedCountMap.get(b.id) || 0;
          return (cA - cB) * dir;
        }
      }
    });
  }, [
    partners,
    typeFilter,
    searchQuery,
    tableState.columnFilters,
    tableState.selectedColumnFilters,
    tableState.sortColumn,
    tableState.sortDirection,
    linkedCountMap
  ]);

  const filterColumnsConfig: Array<{
    col: PartnerSortColumn;
    placeholder: string;
    minWidth: string;
    dir?: 'ltr' | 'rtl';
    extraClass?: string;
    getLabel?: (val: string) => string;
  }> = [
    {
      col: 'name',
      placeholder: 'اختر أو اكتب الشريك...',
      minWidth: 'min-w-[130px]'
    },
    {
      col: 'companyName',
      placeholder: 'اختر أو اكتب الشركة...',
      minWidth: 'min-w-[130px]'
    },
    {
      col: 'partnerType',
      placeholder: 'اختر أو اكتب التصنيف...',
      minWidth: 'min-w-[120px]',
      getLabel: (v) => PARTNER_TYPE_LABELS[v as PartnerType] || v
    },
    {
      col: 'phone',
      placeholder: 'رقم الهاتف...',
      minWidth: 'min-w-[115px]',
      dir: 'ltr',
      extraClass: 'font-mono'
    },
    {
      col: 'shareOrContractNote',
      placeholder: 'مرجع التعاقد...',
      minWidth: 'min-w-[130px]'
    },
    {
      col: 'linkedCount',
      placeholder: 'عدد المعدات...',
      minWidth: 'min-w-[95px]',
      extraClass: 'text-center',
      getLabel: (v) => `${v} معدة`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base md:text-lg font-bold text-white">
              سجل الشركاء وموردي التشغيل
            </h2>
            <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-2.5 py-0.5 rounded-full font-mono">
              {partners.length} شريك
            </span>
          </div>
          <p className="text-xs text-slate-400">
            سجل مستقل للشركاء والمؤجرين يتم مزامنته تلقائياً عند اختيار «مشاركة تشغيل مع شريك» أو «مستأجرة بعقد تشغيل» في نماذج المعدات.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onReturnToForm && (
            <button
              type="button"
              onClick={onReturnToForm}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              <span>{returnFormLabel || 'العودة إلى نموذج المعدة'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (isFormOpen) {
                resetForm();
              } else {
                setEditingPartnerId(null);
                setIsFormOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isFormOpen ? 'إغلاق النموذج' : 'إضافة شريك جديد'}</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Partner Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 space-y-3 text-xs animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-300">
              {editingPartnerId ? 'تعديل بيانات الشريك في السجل' : 'إضافة شريك جديد إلى سجل الشركاء'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-300 block mb-1 font-semibold">اسم الشريك / المسؤول *</label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="مثال: كابتن حسام الصياد"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1 font-semibold">اسم الشركة / المنشأة *</label>
              <input
                type="text"
                required
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                placeholder="مثال: شركة مارينا البحر الأحمر"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1 font-semibold">رقم الهاتف / الواتساب</label>
              <input
                type="text"
                dir="ltr"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+201xxxxxxxxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-right focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1 font-semibold">تصنيف العلاقة</label>
              <select
                value={partnerTypeInput}
                onChange={(e) => setPartnerTypeInput(e.target.value as PartnerType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="operating_partner">شريك تشغيل</option>
                <option value="rental_supplier">مورد تأجير معدات</option>
                <option value="fleet_owner">مالك وحدات / أسطول</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1 font-semibold">باقة / مستوى الشريك</label>
              <select
                value={tierInput}
                onChange={(e) => setTierInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                {PARTNER_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1 font-semibold">مرجع التعاقد / نسبة المشاركة</label>
              <input
                type="text"
                value={shareNoteInput}
                onChange={(e) => setShareNoteInput(e.target.value)}
                placeholder="مثال: شراكة تشغيل 70% / 30% أو عقد رقم..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={resetForm}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold cursor-pointer"
            >
              {editingPartnerId ? 'حفظ التعديلات ومزامنة المعدات' : 'حفظ في سجل الشركاء'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Pills and Search Bar (Matching Equipment Properties design) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              typeFilter === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            الجميع ({partners.length})
          </button>
          {(Object.keys(PARTNER_TYPE_LABELS) as PartnerType[]).map((tKey) => {
            const count = partners.filter((p) => p.partnerType === tKey).length;
            return (
              <button
                key={tKey}
                type="button"
                onClick={() => setTypeFilter(tKey)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  typeFilter === tKey
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {PARTNER_TYPE_LABELS[tKey]} ({count})
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في سجل الشركاء والشركات..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Partners Registry Table with Per-Column Writable Filters, Multi-Select & Sort */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <RegistryFilterSummaryBar
          filteredCount={filteredPartners.length}
          totalCount={partners.length}
          itemNoun="شريك"
          sortColumn={tableState.sortColumn}
          sortDirection={tableState.sortDirection}
          hasActiveFilters={tableState.hasActiveFilters}
          onClearAll={tableState.handleClearAll}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => tableState.handleToggleSort('name')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>الشريك / المسؤول</span>
                    <RegistrySortIcon
                      column="name"
                      sortColumn={tableState.sortColumn}
                      sortDirection={tableState.sortDirection}
                    />
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => tableState.handleToggleSort('companyName')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>الشركة / المنشأة</span>
                    <RegistrySortIcon
                      column="companyName"
                      sortColumn={tableState.sortColumn}
                      sortDirection={tableState.sortDirection}
                    />
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => tableState.handleToggleSort('partnerType')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>التصنيف</span>
                    <RegistrySortIcon
                      column="partnerType"
                      sortColumn={tableState.sortColumn}
                      sortDirection={tableState.sortDirection}
                    />
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => tableState.handleToggleSort('phone')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>الهاتف</span>
                    <RegistrySortIcon
                      column="phone"
                      sortColumn={tableState.sortColumn}
                      sortDirection={tableState.sortDirection}
                    />
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => tableState.handleToggleSort('shareOrContractNote')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>مرجع التعاقد والمشاركة</span>
                    <RegistrySortIcon
                      column="shareOrContractNote"
                      sortColumn={tableState.sortColumn}
                      sortDirection={tableState.sortDirection}
                    />
                  </button>
                </th>
                <th className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => tableState.handleToggleSort('linkedCount')}
                    className="inline-flex items-center justify-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>معدات مرتبطة</span>
                    <RegistrySortIcon
                      column="linkedCount"
                      sortColumn={tableState.sortColumn}
                      sortDirection={tableState.sortDirection}
                    />
                  </button>
                </th>
                <th className="py-3 px-3 text-center">إجراءات</th>
              </tr>

              {/* Searchable Multi-Select Column Filter Row */}
              <tr className="bg-slate-900/90 border-t border-slate-800/80 font-normal normal-case">
                {filterColumnsConfig.map(({ col, placeholder, minWidth, dir, extraClass = '', getLabel }) => {
                  const hasSelected = tableState.selectedColumnFilters[col].length > 0;
                  return (
                    <th key={col} className="p-2">
                      <input
                        ref={(el) => {
                          tableState.filterInputRefs.current[col] = el;
                        }}
                        type="text"
                        dir={dir}
                        placeholder={tableState.getSelectedSummaryPlaceholder(
                          col,
                          placeholder,
                          getLabel
                        )}
                        value={tableState.columnFilters[col]}
                        onFocus={() => {
                          tableState.updateDropdownPosition(col, WIDE_PARTNER_COLS);
                          tableState.setOpenDropdownCol(col);
                        }}
                        onClick={() => {
                          tableState.updateDropdownPosition(col, WIDE_PARTNER_COLS);
                          tableState.setOpenDropdownCol(col);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') tableState.setOpenDropdownCol(null);
                        }}
                        onChange={(e) => {
                          tableState.setColumnFilters((prev) => ({
                            ...prev,
                            [col]: e.target.value
                          }));
                          if (tableState.openDropdownCol !== col) {
                            tableState.updateDropdownPosition(col, WIDE_PARTNER_COLS);
                            tableState.setOpenDropdownCol(col);
                          }
                        }}
                        className={`w-full ${minWidth} rounded-md px-2 py-1 text-[11px] focus:outline-none transition-colors ${extraClass} ${
                          hasSelected
                            ? 'bg-cyan-950/30 border border-cyan-500/70 text-cyan-100 placeholder-cyan-300 font-semibold'
                            : 'bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:border-cyan-500'
                        }`}
                      />
                    </th>
                  );
                })}
                <th className="p-2 text-center">
                  {tableState.hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={tableState.handleClearAll}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 text-[10px] font-semibold cursor-pointer"
                    >
                      مسح
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-600">—</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-tajawal text-slate-300">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <div>لا يوجد شركاء مطابقون للبحث أو الفلترة في السجل.</div>
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => {
                  const linkedEqCount = linkedCountMap.get(partner.id) || 0;
                  const isSelected = selectedPartnerId === partner.id;
                  return (
                    <tr
                      key={partner.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-cyan-950/30' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{partner.name}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">{partner.id}</div>
                        {(partner.createdByName || partner.updatedByName) && (
                          <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                            {partner.createdByName && (
                              <div>
                                أضافه: <span className="text-slate-300">{partner.createdByName}</span>
                                {partner.createdAtTime ? ` · ${partner.createdAtTime}` : ''}
                              </div>
                            )}
                            {partner.updatedByName && (
                              <div>
                                آخر تعديل: <span className="text-cyan-300">{partner.updatedByName}</span>
                                {partner.updatedAtTime ? ` · ${partner.updatedAtTime}` : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{partner.companyName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{partner.tier}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-cyan-300 font-semibold">
                          {PARTNER_TYPE_LABELS[partner.partnerType]}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <span className="inline-flex items-center gap-1" dir="ltr">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {partner.phone || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-[240px]">
                        <span className="line-clamp-2">
                          {partner.shareOrContractNote || partner.notes || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="text-emerald-300 font-bold">{linkedEqCount} معدة</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {onSelectPartner && (
                            <button
                              type="button"
                              onClick={() => onSelectPartner(partner)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                              <span>{isSelected ? 'مختار للمعدة' : 'اختيار للمعدة'}</span>
                            </button>
                          )}

                          {confirmDeleteId === partner.id ? (
                            <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-800/60 rounded-lg px-2 py-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeletePartner(partner.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded cursor-pointer"
                              >
                                حذف
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditForm(partner)}
                                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 cursor-pointer"
                                title="تعديل بيانات الشريك"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(partner.id)}
                                className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 cursor-pointer"
                                title="حذف الشريك"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {tableState.openDropdownCol && tableState.dropdownRect && (
          <RegistryColumnFilterDropdown
            activeCol={tableState.openDropdownCol}
            dropdownRect={tableState.dropdownRect}
            activeDropdownRef={tableState.activeDropdownRef}
            title={COLUMN_DROPDOWN_TITLES[tableState.openDropdownCol]}
            options={columnOptionsMap[tableState.openDropdownCol] || []}
            filterText={tableState.columnFilters[tableState.openDropdownCol]}
            selectedValues={tableState.selectedColumnFilters[tableState.openDropdownCol]}
            onToggleValue={tableState.handleToggleColumnFilterValue}
            onClearCol={tableState.handleClearCol}
            onClose={() => tableState.setOpenDropdownCol(null)}
          />
        )}
      </div>
    </div>
  );
};
