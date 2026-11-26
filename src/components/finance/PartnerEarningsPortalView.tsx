import React, { useMemo, useState } from 'react';
import {
  Wallet as WalletIcon,
  Coins,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Send,
  Search,
  FileSpreadsheet,
  X,
  RotateCcw
} from 'lucide-react';
import type { AppUser } from '../../types/auth';
import { resolveUserRoleKey, USER_ROLE_LABELS } from '../../types/auth';
import type {
  BookingFinancialAllocation,
  BookingPayoutPartnerRole,
  FinancialSettlement,
  Wallet
} from '../../types/finance';
import type { BilateralLedgerEntry, PersonProfile } from '../../types/personProfile';
import type { NavigationItemKey } from '../layout/Sidebar';

interface PartnerEarningsPortalViewProps {
  currentUser: AppUser;
  wallets: Wallet[];
  allocations: BookingFinancialAllocation[];
  bilateralLedger: BilateralLedgerEntry[];
  personProfiles: PersonProfile[];
  settlements: FinancialSettlement[];
  onRequestSettlement: (
    settlement: Omit<FinancialSettlement, 'id' | 'createdAt' | 'status'>
  ) => void;
  onNavigate: (key: NavigationItemKey) => void;
}

const PARTNER_ROLE_LABELS: Record<BookingPayoutPartnerRole, string> = {
  activity_owner: 'عائد مالك النشاط',
  driver: 'مستحق توصيل / سائق',
  equipment_owner: 'حصة مالك المعدة',
  tour_guide: 'مستحق إرشاد سياحي',
  delegate: 'عمولة مندوب مبيعات',
  platform: 'عمولة المنصة'
};

export const PartnerEarningsPortalView: React.FC<PartnerEarningsPortalViewProps> = ({
  currentUser,
  wallets,
  allocations,
  bilateralLedger,
  personProfiles,
  settlements,
  onRequestSettlement,
  onNavigate
}) => {
  const roleKey = resolveUserRoleKey(currentUser);
  const isAdmin = roleKey === 'platform_admin';

  const [activeTab, setActiveTab] = useState<'payouts' | 'ledger' | 'settlements'>('payouts');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementAmountEUR, setSettlementAmountEUR] = useState<number>(20);
  const [settlementReason, setSettlementReason] = useState(
    'طلب سحب وتصفية مستحقات الحجوزات والأنشطة المنفذة'
  );
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const myProfile = useMemo(
    () =>
      personProfiles.find(
        (p) => p.linkedUserId === currentUser.id || p.id === `prof-${currentUser.id}`
      ),
    [personProfiles, currentUser.id]
  );

  const myWallet = useMemo(() => {
    const byParty = wallets.find(
      (w) =>
        w.partyId === currentUser.id ||
        w.id === `wlt-${currentUser.id}` ||
        (myProfile && w.partyId === myProfile.id)
    );
    if (byParty) return byParty;
    const normName = currentUser.name.trim().toLowerCase();
    return wallets.find((w) => w.partyName.trim().toLowerCase() === normName);
  }, [wallets, currentUser.id, currentUser.name, myProfile]);

  // All booking payout rows matching this partner (or all if platform_admin)
  const myPayoutRows = useMemo(() => {
    const rows: Array<{
      id: string;
      bookingId: string;
      bookingCode: string;
      bookingKind: 'activity_booking' | 'trip_booking';
      entityName: string;
      tripDate: string;
      customerName: string;
      partnerName: string;
      partnerRole: BookingPayoutPartnerRole;
      currency: 'EGP' | 'EUR';
      amountEGP: number;
      amountEUR: number;
      calculationNote: string;
      payoutStatus: 'credited' | 'settled' | 'reversed';
      allocationStatus: BookingFinancialAllocation['status'];
    }> = [];

    for (const alloc of allocations) {
      for (const po of alloc.payouts) {
        const belongsToMe =
          po.partyUserId === currentUser.id ||
          (myProfile && po.partyProfileId === myProfile.id) ||
          (myWallet && po.walletId === myWallet.id) ||
          po.partyName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();

        if (!isAdmin && !belongsToMe) continue;

        rows.push({
          id: `${alloc.bookingId}-${po.id}`,
          bookingId: alloc.bookingId,
          bookingCode: alloc.bookingCode,
          bookingKind: alloc.bookingKind,
          entityName: alloc.entityName,
          tripDate: alloc.tripDate,
          customerName: alloc.customerName,
          partnerName: po.partyName,
          partnerRole: po.partnerRole,
          currency: alloc.currency,
          amountEGP: po.amountEGP,
          amountEUR: po.amountEUR,
          calculationNote: po.calculationNote,
          payoutStatus: po.status,
          allocationStatus: alloc.status
        });
      }
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.bookingCode.toLowerCase().includes(q) ||
        r.entityName.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.partnerName.toLowerCase().includes(q)
    );
  }, [allocations, currentUser.id, currentUser.name, isAdmin, myProfile, myWallet, searchQuery]);

  // Bilateral ledger rows related to this partner
  const myLedgerRows = useMemo(() => {
    const filtered = bilateralLedger.filter((entry) => {
      if (isAdmin) return true;
      return (
        entry.claimedUserId === currentUser.id ||
        entry.profileId === `prof-${currentUser.id}` ||
        (myProfile && entry.profileId === myProfile.id) ||
        entry.counterpartyUserId === currentUser.id
      );
    });
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(
      (e) =>
        e.profileName.toLowerCase().includes(q) ||
        (e.entityName || '').toLowerCase().includes(q) ||
        (e.notes || '').toLowerCase().includes(q)
    );
  }, [bilateralLedger, currentUser.id, isAdmin, myProfile, searchQuery]);

  const mySettlements = useMemo(() => {
    if (isAdmin) return settlements;
    return settlements.filter(
      (s) => s.requestedByOwnerId === currentUser.id || s.ownerName === currentUser.name
    );
  }, [settlements, isAdmin, currentUser.id, currentUser.name]);

  const summary = useMemo(() => {
    const activePayouts = myPayoutRows.filter(
      (r) => r.payoutStatus !== 'reversed' && r.allocationStatus !== 'refunded'
    );
    const totalCreditedEGP = activePayouts.reduce((s, r) => s + r.amountEGP, 0);
    const totalCreditedEUR = activePayouts.reduce((s, r) => s + r.amountEUR, 0);

    const creditTotalEGP = myLedgerRows
      .filter((e) => e.entryType === 'credit_payable_to_person')
      .reduce((s, e) => s + e.amountEGP, 0);
    const debitTotalEGP = myLedgerRows
      .filter((e) => e.entryType === 'debit_paid_to_person')
      .reduce((s, e) => s + e.amountEGP, 0);

    return {
      totalCreditedEGP: Math.round(totalCreditedEGP),
      totalCreditedEUR: Math.round(totalCreditedEUR * 100) / 100,
      netLedgerEGP: Math.round(creditTotalEGP - debitTotalEGP),
      activeCount: activePayouts.length
    };
  }, [myPayoutRows, myLedgerRows]);

  const handleSubmitSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (settlementAmountEUR <= 0) return;
    onRequestSettlement({
      requestedByOwnerId: currentUser.id,
      ownerName: currentUser.name,
      amountEUR: settlementAmountEUR,
      reason: settlementReason.trim() || 'طلب تسوية مستحقات شريك بالمنصة'
    });
    setShowSettlementModal(false);
    setFeedbackMsg('تم إرسال طلب التسوية المالية بنجاح للمراجعة والاعتماد.');
    window.setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">
              مستحقاتي وأرباحي المالية — {currentUser.name}
            </h1>
            <p className="text-xs text-slate-400">
              {USER_ROLE_LABELS[roleKey]} · متابعة لحظية لكل المبالغ المحولة من الحجوزات، العمولات، وحساب «ما له وما عليه»
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('finance_wallets')}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <WalletIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>محافظ وتوريد QR</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSettlementAmountEUR(
                myWallet && myWallet.balanceEUR > 0 ? Math.round(myWallet.balanceEUR * 100) / 100 : 20
              );
              setShowSettlementModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>طلب تسوية مستحقات</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-xl px-4 py-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">رصيد المحفظة المرجعي (€)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-cyan-300 mt-1">
            €{(myWallet?.balanceEUR ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
            {myWallet ? myWallet.qrToken : 'محفظة قيد التهيئة'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">عهدة / رصيد محصّل بالعملة المحلية</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            {(myWallet?.cashOnHandEGP ?? 0).toLocaleString('en-US')} ج.م
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
            وكاش باليورو: €{(myWallet?.cashOnHandEUR ?? 0).toLocaleString('en-US')}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">إجمالي حصصي من الحجوزات الفعالة</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {summary.totalCreditedEGP.toLocaleString('en-US')} ج.م
          </div>
          <div className="text-[11px] text-cyan-300 mt-1 font-mono tabular-nums">
            {summary.activeCount} عملية · يعادل €{summary.totalCreditedEUR.toFixed(2)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">صافي الرصيد بكشف الحساب «ما له وما عليه»</div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
              summary.netLedgerEGP >= 0 ? 'text-amber-300' : 'text-rose-400'
            }`}
          >
            {summary.netLedgerEGP.toLocaleString('en-US')} ج.م
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary.netLedgerEGP >= 0 ? 'مستحقات لك تحت الحساب' : 'مبالغ مستحقة عليك'}
          </div>
        </div>
      </div>

      {/* Tabs + Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'payouts', label: `مستحقات الحجوزات (${myPayoutRows.length})` },
              { id: 'ledger', label: `كشف الحساب المشترك (${myLedgerRows.length})` },
              { id: 'settlements', label: `طلبات التسوية (${mySettlements.length})` }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as 'payouts' | 'ledger' | 'settlements')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الحجز، النشاط، أو العميل..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Tab 1: Booking Payouts */}
        {activeTab === 'payouts' && (
          <div className="overflow-x-auto">
            {myPayoutRows.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 space-y-2">
                <FileSpreadsheet className="w-7 h-7 text-slate-600 mx-auto" />
                <p>
                  لا توجد مستحقات مسجلة من الحجوزات حتى الآن. بمجرد دفع أو إتمام أي حجز مرتبط بدورك سيتم إيداع حصتك هنا وفي محفظتك تلقائياً.
                </p>
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 whitespace-nowrap">كود الحجز</th>
                    <th className="py-3 px-4 whitespace-nowrap">النشاط / الرحلة</th>
                    <th className="py-3 px-4 whitespace-nowrap">تاريخ التشغيل</th>
                    {isAdmin && <th className="py-3 px-4 whitespace-nowrap">الطرف المستفيد</th>}
                    <th className="py-3 px-4 whitespace-nowrap">بند الاستحقاق</th>
                    <th className="py-3 px-4 whitespace-nowrap">القيمة (ج.م)</th>
                    <th className="py-3 px-4 whitespace-nowrap">المعادل (€)</th>
                    <th className="py-3 px-4 whitespace-nowrap">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {myPayoutRows.map((row) => {
                    const isReversed =
                      row.payoutStatus === 'reversed' ||
                      row.allocationStatus === 'refunded' ||
                      row.amountEGP <= 0;
                    return (
                      <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-cyan-300 font-bold whitespace-nowrap">
                          #{row.bookingCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{row.entityName}</div>
                          <div className="text-[11px] text-slate-400">
                            العميل: {row.customerName}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-300 whitespace-nowrap">
                          {row.tripDate}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-slate-200 whitespace-nowrap">
                            {row.partnerName}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <div className="text-slate-200 font-medium">
                            {PARTNER_ROLE_LABELS[row.partnerRole]}
                          </div>
                          <div className="text-[11px] text-slate-400">{row.calculationNote}</div>
                        </td>
                        <td
                          className={`py-3 px-4 font-mono tabular-nums font-bold whitespace-nowrap ${
                            isReversed ? 'text-slate-500 line-through' : 'text-emerald-400'
                          }`}
                        >
                          {row.amountEGP.toLocaleString('en-US')} ج.م
                        </td>
                        <td
                          className={`py-3 px-4 font-mono tabular-nums font-bold whitespace-nowrap ${
                            isReversed ? 'text-slate-500 line-through' : 'text-cyan-300'
                          }`}
                        >
                          €{row.amountEUR.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isReversed ? (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                              <RotateCcw className="w-3.5 h-3.5" />
                              تم عكس القيد (ملغي)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              مقيد بالمحفظة
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Bilateral Ledger */}
        {activeTab === 'ledger' && (
          <div className="overflow-x-auto">
            {myLedgerRows.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                لا توجد قيود مالية في كشف الحساب المشترك حتى الآن.
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 whitespace-nowrap">التاريخ</th>
                    <th className="py-3 px-4 whitespace-nowrap">نوع الحركة</th>
                    <th className="py-3 px-4 whitespace-nowrap">النشاط / البيان</th>
                    <th className="py-3 px-4 whitespace-nowrap">الطرف المقابل</th>
                    <th className="py-3 px-4 whitespace-nowrap">القيمة (ج.م)</th>
                    <th className="py-3 px-4 whitespace-nowrap">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {myLedgerRows.map((entry) => {
                    const isCredit = entry.entryType === 'credit_payable_to_person';
                    return (
                      <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                          {entry.date}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`font-bold ${
                              isCredit ? 'text-emerald-400' : 'text-amber-300'
                            }`}
                          >
                            {isCredit ? 'مستحق له (إيراد)' : 'سداد / تحويل عليه'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white font-semibold">
                          {entry.entityName || entry.profileName}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{entry.counterpartyUserName}</td>
                        <td
                          className={`py-3 px-4 font-mono tabular-nums font-bold whitespace-nowrap ${
                            isCredit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isCredit ? '+' : '-'} {entry.amountEGP.toLocaleString('en-US')} ج.م
                        </td>
                        <td className="py-3 px-4 text-slate-400">{entry.notes || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Settlements */}
        {activeTab === 'settlements' && (
          <div className="divide-y divide-slate-800/70">
            {mySettlements.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                لم يتم رفع أي طلبات تسوية مالية حتى الآن.
              </div>
            ) : (
              mySettlements.map((stl) => (
                <div
                  key={stl.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-cyan-400">#{stl.id}</span>
                      <span>{stl.ownerName}</span>
                    </div>
                    <p className="text-slate-400 mt-0.5">{stl.reason}</p>
                    <span className="text-[11px] text-slate-500 font-mono">{stl.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-mono tabular-nums text-base font-bold text-emerald-400">
                      €{stl.amountEUR.toFixed(2)}
                    </div>
                    <div className="font-semibold">
                      {stl.status === 'approved_by_admin' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> معتمدة
                        </span>
                      ) : stl.status === 'rejected_by_admin' ? (
                        <span className="inline-flex items-center gap-1 text-rose-400">
                          <ArrowRightLeft className="w-3.5 h-3.5" /> مرفوضة
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-300">
                          <Clock className="w-3.5 h-3.5" /> قيد المراجعة
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Request Settlement Modal */}
      {showSettlementModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitSettlement}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">طلب تسوية وصرف مستحقات</h3>
              <button
                type="button"
                onClick={() => setShowSettlementModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  المبلغ المطلوب تسويته (باليورو المرجعي €):
                </label>
                <input
                  type="number"
                  min={1}
                  step="0.5"
                  value={settlementAmountEUR}
                  onChange={(e) => setSettlementAmountEUR(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  ملاحظات وبيان الصرف:
                </label>
                <textarea
                  rows={3}
                  value={settlementReason}
                  onChange={(e) => setSettlementReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSettlementModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                إرسال طلب التسوية
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
