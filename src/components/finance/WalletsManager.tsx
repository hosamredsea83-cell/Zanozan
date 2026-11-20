import React, { useMemo, useState } from 'react';
import { Wallet, TransferTransaction, FinancialPartyRole } from '../../types/finance';
import { 
  Wallet as WalletIcon, QrCode, ArrowDownRight, ArrowUpLeft, ShieldAlert, 
  CheckCircle2, XCircle, Clock, RefreshCw, AlertTriangle, Smartphone, 
  Receipt, ArrowRightLeft, Send, Check, X, Search
} from 'lucide-react';
import {
  RegistryColumnFilterDropdown,
  RegistryFilterOption,
  RegistryFilterSummaryBar,
  RegistrySortIcon,
  useRegistryTableState
} from '../shared/RegistryTableControls';

type TransferColKey = 'id' | 'senderName' | 'recipientName' | 'amount' | 'accountingValueEUR' | 'transferMethod' | 'status';

const TRANSFER_COLUMNS: readonly TransferColKey[] = [
  'id',
  'senderName',
  'recipientName',
  'amount',
  'accountingValueEUR',
  'transferMethod',
  'status'
];

const WIDE_TRANSFER_COLS: readonly TransferColKey[] = ['senderName', 'recipientName', 'status'];

const TRANSFER_DROPDOWN_TITLES: Record<TransferColKey, string> = {
  id: 'تحديد متعدد لرقم العملية',
  senderName: 'تحديد متعدد للمرسل (المورّد)',
  recipientName: 'تحديد متعدد للمستقبل',
  amount: 'تحديد متعدد للمبلغ والعملة',
  accountingValueEUR: 'تحديد متعدد للقيمة باليورو (€)',
  transferMethod: 'تحديد متعدد لطريقة الإثبات',
  status: 'تحديد متعدد لحالة التحويل'
};

const METHOD_LABELS: Record<TransferTransaction['transferMethod'], string> = {
  qr_code: 'باركود QR',
  vodafone_cash: 'فودافون كاش',
  company_receipt: 'إيصال شركة'
};

const TX_STATUS_LABELS: Record<TransferTransaction['status'], string> = {
  received: 'تم الاستلام والاعتماد',
  waiting_recipient_approval: 'بانتظار موافقة المستلم',
  rejected: 'مرفوض (أعيد للمرسل)',
  cancelled: 'ملغي',
  needs_financial_admin_review: 'بانتظار مراجعة الإدارة المالية',
  sending: 'جاري الإرسال'
};

interface WalletsManagerProps {
  wallets: Wallet[];
  transfers: TransferTransaction[];
  onInitiateTransfer: (transfer: Omit<TransferTransaction, 'id' | 'createdAt' | 'status'>) => void;
  onApproveTransfer: (transferId: string) => void;
  onRejectTransfer: (transferId: string, reason: string) => void;
}

export const WalletsManager: React.FC<WalletsManagerProps> = ({
  wallets,
  transfers,
  onInitiateTransfer,
  onApproveTransfer,
  onRejectTransfer
}) => {
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || '');
  const [showQRModal, setShowQRModal] = useState<Wallet | null>(null);
  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [rejectingTransferId, setRejectingTransferId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [transferSearchQuery, setTransferSearchQuery] = useState('');
  const tableState = useRegistryTableState<TransferColKey>(TRANSFER_COLUMNS);

  // Transfer form state
  const [senderWalletId, setSenderWalletId] = useState(wallets[2]?.id || ''); // delegate default
  const [recipientWalletId, setRecipientWalletId] = useState(wallets[0]?.id || ''); // company default
  const [transferAmount, setTransferAmount] = useState<number>(2000);
  const [transferCurrency, setTransferCurrency] = useState<'EGP' | 'EUR'>('EGP');
  const [transferMethod, setTransferMethod] = useState<'qr_code' | 'company_receipt' | 'vodafone_cash'>('qr_code');
  const [vodafoneNumber, setVodafoneNumber] = useState('01099887766');
  const [vodafoneTxId, setVodafoneTxId] = useState('VF-771122');

  const activeWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];

  const getRoleArabic = (role: FinancialPartyRole) => {
    switch (role) {
      case 'company': return 'الشركة السياحية (الخزينة المركزية)';
      case 'activity_owner': return 'صاحب النشاط / المشغّل';
      case 'employee': return 'موظف مبيعات واستقبال';
      case 'delegate': return 'مندوب ميداني';
      case 'driver': return 'سائق نقل سياحي';
      case 'tour_guide': return 'مرافق سياحي / مرشد';
      case 'operator': return 'منفذ رحلات بالمارينا';
    }
  };

  const handleCreateTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sender = wallets.find((w) => w.id === senderWalletId);
    const recipient = wallets.find((w) => w.id === recipientWalletId);
    if (!sender || !recipient) return;

    const lockedRate = 50.0;
    const accountingEur = transferCurrency === 'EUR' ? transferAmount : transferAmount / lockedRate;

    onInitiateTransfer({
      senderWalletId: sender.id,
      senderName: sender.partyName,
      senderRole: sender.role,
      recipientWalletId: recipient.id,
      recipientName: recipient.partyName,
      recipientRole: recipient.role,
      amount: transferAmount,
      currency: transferCurrency,
      accountingValueEUR: accountingEur,
      transferMethod,
      vodafoneCashNumber: transferMethod === 'vodafone_cash' ? vodafoneNumber : undefined,
      vodafoneTransactionId: transferMethod === 'vodafone_cash' ? vodafoneTxId : undefined
    });

    setShowNewTransferModal(false);
  };

  const confirmRejection = () => {
    if (!rejectingTransferId) return;
    onRejectTransfer(rejectingTransferId, rejectReason || 'تم رفض الاستلام من قبل المستلم لعدم مطابقة الحساب');
    setRejectingTransferId(null);
    setRejectReason('');
  };

  const transferColumnOptions = useMemo<Record<TransferColKey, RegistryFilterOption[]>>(() => {
    const idMap = new Map<string, number>();
    const senderMap = new Map<string, number>();
    const recipientMap = new Map<string, number>();
    const amountMap = new Map<string, number>();
    const eurMap = new Map<string, number>();
    const methodMap = new Map<TransferTransaction['transferMethod'], number>();
    const statusMap = new Map<TransferTransaction['status'], number>();

    transfers.forEach((tx) => {
      idMap.set(tx.id, (idMap.get(tx.id) || 0) + 1);
      senderMap.set(tx.senderName, (senderMap.get(tx.senderName) || 0) + 1);
      recipientMap.set(tx.recipientName, (recipientMap.get(tx.recipientName) || 0) + 1);
      const amtKey = `${tx.amount.toLocaleString()} ${tx.currency}`;
      amountMap.set(amtKey, (amountMap.get(amtKey) || 0) + 1);
      const eurKey = tx.accountingValueEUR.toFixed(2);
      eurMap.set(eurKey, (eurMap.get(eurKey) || 0) + 1);
      methodMap.set(tx.transferMethod, (methodMap.get(tx.transferMethod) || 0) + 1);
      statusMap.set(tx.status, (statusMap.get(tx.status) || 0) + 1);
    });

    return {
      id: Array.from(idMap.entries()).map(([v, count]) => ({ value: v, label: v, dir: 'ltr', count })),
      senderName: Array.from(senderMap.entries()).map(([v, count]) => ({ value: v, label: v, count })),
      recipientName: Array.from(recipientMap.entries()).map(([v, count]) => ({ value: v, label: v, count })),
      amount: Array.from(amountMap.entries()).map(([v, count]) => ({ value: v, label: v, dir: 'ltr', count })),
      accountingValueEUR: Array.from(eurMap.entries()).map(([v, count]) => ({ value: v, label: `€${v}`, dir: 'ltr', count })),
      transferMethod: Array.from(methodMap.entries()).map(([m, count]) => ({ value: m, label: METHOD_LABELS[m], count })),
      status: Array.from(statusMap.entries()).map(([s, count]) => ({ value: s, label: TX_STATUS_LABELS[s], count }))
    };
  }, [transfers]);

  const filteredTransfers = useMemo(() => {
    const q = transferSearchQuery.trim().toLowerCase();
    const { columnFilters: cf, selectedColumnFilters: scf, sortColumn, sortDirection } = tableState;
    const fId = cf.id.trim().toLowerCase();
    const fSender = cf.senderName.trim().toLowerCase();
    const fRecip = cf.recipientName.trim().toLowerCase();
    const fAmt = cf.amount.trim().toLowerCase();
    const fEur = cf.accountingValueEUR.trim().toLowerCase();
    const fMethod = cf.transferMethod.trim().toLowerCase();
    const fStatus = cf.status.trim().toLowerCase();

    const out = transfers.filter((tx) => {
      const amtKey = `${tx.amount.toLocaleString()} ${tx.currency}`;
      const eurKey = tx.accountingValueEUR.toFixed(2);
      if (q) {
        const blob = `${tx.id} ${tx.senderName} ${tx.recipientName} ${amtKey} €${eurKey} ${METHOD_LABELS[tx.transferMethod]} ${TX_STATUS_LABELS[tx.status]}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      if (scf.id.length > 0 ? !scf.id.includes(tx.id) : fId && !tx.id.toLowerCase().includes(fId)) return false;
      if (scf.senderName.length > 0 ? !scf.senderName.includes(tx.senderName) : fSender && !tx.senderName.toLowerCase().includes(fSender)) return false;
      if (scf.recipientName.length > 0 ? !scf.recipientName.includes(tx.recipientName) : fRecip && !tx.recipientName.toLowerCase().includes(fRecip)) return false;
      if (scf.amount.length > 0 ? !scf.amount.includes(amtKey) : fAmt && !amtKey.toLowerCase().includes(fAmt)) return false;
      if (scf.accountingValueEUR.length > 0 ? !scf.accountingValueEUR.includes(eurKey) : fEur && !`€${eurKey}`.toLowerCase().includes(fEur)) return false;
      if (scf.transferMethod.length > 0 ? !scf.transferMethod.includes(tx.transferMethod) : fMethod && !METHOD_LABELS[tx.transferMethod].toLowerCase().includes(fMethod)) return false;
      if (scf.status.length > 0 ? !scf.status.includes(tx.status) : fStatus && !TX_STATUS_LABELS[tx.status].toLowerCase().includes(fStatus)) return false;
      return true;
    });

    if (!sortColumn) return out;
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...out].sort((a, b) => {
      switch (sortColumn) {
        case 'id': return a.id.localeCompare(b.id, 'en') * dir;
        case 'senderName': return a.senderName.localeCompare(b.senderName, 'ar') * dir;
        case 'recipientName': return a.recipientName.localeCompare(b.recipientName, 'ar') * dir;
        case 'amount': return (a.amount - b.amount) * dir;
        case 'accountingValueEUR': return (a.accountingValueEUR - b.accountingValueEUR) * dir;
        case 'transferMethod': return METHOD_LABELS[a.transferMethod].localeCompare(METHOD_LABELS[b.transferMethod], 'ar') * dir;
        case 'status': return TX_STATUS_LABELS[a.status].localeCompare(TX_STATUS_LABELS[b.status], 'ar') * dir;
      }
    });
  }, [transfers, transferSearchQuery, tableState.columnFilters, tableState.selectedColumnFilters, tableState.sortColumn, tableState.sortDirection]);

  const transferFilterColsConfig: Array<{
    col: TransferColKey;
    placeholder: string;
    minWidth: string;
    dir?: 'ltr' | 'rtl';
    extraClass?: string;
    getLabel?: (v: string) => string;
  }> = [
    { col: 'id', placeholder: 'رقم العملية...', minWidth: 'min-w-[90px]', dir: 'ltr', extraClass: 'font-mono' },
    { col: 'senderName', placeholder: 'المرسل...', minWidth: 'min-w-[115px]' },
    { col: 'recipientName', placeholder: 'المستقبل...', minWidth: 'min-w-[115px]' },
    { col: 'amount', placeholder: 'المبلغ...', minWidth: 'min-w-[95px]', dir: 'ltr', extraClass: 'text-left font-mono' },
    { col: 'accountingValueEUR', placeholder: 'اليورو...', minWidth: 'min-w-[85px]', dir: 'ltr', extraClass: 'text-left font-mono', getLabel: (v) => `€${v}` },
    { col: 'transferMethod', placeholder: 'الإثبات...', minWidth: 'min-w-[100px]', getLabel: (v) => METHOD_LABELS[v as TransferTransaction['transferMethod']] || v },
    { col: 'status', placeholder: 'الحالة...', minWidth: 'min-w-[120px]', getLabel: (v) => TX_STATUS_LABELS[v as TransferTransaction['status']] || v }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards: Reference Currency EUR & Cash on Hand */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1">الرصيد المرجعي الموحد للمنصة</div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            €{wallets.reduce((acc, w) => acc + w.balanceEUR, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            اليورو (€) العملة المرجعية الأساسية للمحاسبة
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1">إجمالي الكاش بالجنيه (عهدة نقدية)</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {wallets.reduce((acc, w) => acc + w.cashOnHandEGP, 0).toLocaleString()} ج.م
          </div>
          <div className="text-[11px] text-slate-400 mt-1">موزع في عهد الموظفين والمندوبين والسائقين</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1">إجمالي الكاش باليورو (عهدة نقدية)</div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            €{wallets.reduce((acc, w) => acc + w.cashOnHandEUR, 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">مقبوضات نقدية بالعملة الصعبة</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1">تحويلات بانتظار موافقة المستلم</div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {transfers.filter((t) => t.status === 'waiting_recipient_approval').length}
          </div>
          <div className="text-[11px] text-amber-500/80 mt-1">شرط الموافقة المتبادلة في الاتجاهين</div>
        </div>
      </div>

      {/* 7 Parties Wallets Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <WalletIcon className="w-4 h-4 text-cyan-400" />
              القسم 6: محافظ الأطراف الـ 7 والتوريد والائتمان
            </h3>
            <p className="text-xs text-slate-400">
              محفظة مالية مستقلة لكل من: الموظف، المندوب، السائق، المرافق، المنفذ، صاحب النشاط، والشركة.
            </p>
          </div>

          <button
            onClick={() => setShowNewTransferModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>+ تحويل مالي / توريد عهدة</span>
          </button>
        </div>

        {/* Horizontal Wallets Carousel / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {wallets.map((wallet) => {
            const isSelected = wallet.id === selectedWalletId;
            const isWarning = wallet.balanceEUR < wallet.warningThresholdEUR;

            return (
              <div
                key={wallet.id}
                onClick={() => setSelectedWalletId(wallet.id)}
                className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                  isSelected
                    ? 'bg-slate-800/80 border-cyan-500 shadow-md'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white line-clamp-1">{wallet.partyName}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQRModal(wallet);
                    }}
                    className="p-1 text-slate-400 hover:text-cyan-400"
                    title="عرض باركود المحفظة QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[11px] text-cyan-400 font-medium mb-2">
                  {getRoleArabic(wallet.role)}
                </div>

                <div className="flex items-baseline justify-between border-t border-slate-800/80 pt-2 font-mono">
                  <div className="text-xs text-slate-400">الرصيد (€):</div>
                  <div className="text-sm font-bold text-white">
                    €{wallet.balanceEUR.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>عهدة ج.م: {wallet.cashOnHandEGP.toLocaleString()}</span>
                  <span>كاش €: {wallet.cashOnHandEUR}</span>
                </div>

                {/* Minimum Balance and Negative Balance Warnings (Section 6 items 37, 38) */}
                {isWarning && (
                  <div className="mt-2 text-[10px] text-amber-400 flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>تنبيه: اقتراب من الحد الأدنى (€{wallet.minRequiredBalanceEUR})</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Wallet Detail View */}
        {activeWallet && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <div className="text-xs text-slate-400">تفاصيل المحفظة النشطة:</div>
                <div className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{activeWallet.partyName}</span>
                  <span className="text-xs font-normal text-cyan-400">({getRoleArabic(activeWallet.role)})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowQRModal(activeWallet)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>عرض رمز QR للتوريد</span>
                </button>
              </div>
            </div>

            {/* Financial Parameters: 37. Negative Credit Limit & 38. Minimum Required Balance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">
                  37. السقف الائتماني للرصيد السالب:
                </span>
                <span className="font-mono text-sm font-bold text-white">
                  - €{activeWallet.creditLimitEUR.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  تتوقف الطلبات الجديدة عند بلوغ هذا السقف حتى السداد
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">
                  38. الحد الأدنى المطلوب بالمحفظة:
                </span>
                <span className="font-mono text-sm font-bold text-amber-300">
                  €{activeWallet.minRequiredBalanceEUR.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  إيقاف الطلبات تلقائياً فور النزول عن الحد دون مهلة سماح
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">
                  رمز المصادقة المشفر (QR Token):
                </span>
                <span className="font-mono text-xs font-bold text-cyan-400 block truncate">
                  {activeWallet.qrToken}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  معتمد للتوريد عبر الماسح الضوئي
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transfers & Settlements Ledger with Mutual Confirmation Workflow */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
              33-36. سجل التحويلات والتوريدات والموافقة المتبادلة
            </h3>
            <p className="text-xs text-slate-400">
              التحويل يحتاج لموافقة المستلم في الاتجاهين. في حالة الرفض يعود المبلغ تلقائياً لمحفظة المرسل مع تسجيل السبب.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={transferSearchQuery}
                onChange={(e) => setTransferSearchQuery(e.target.value)}
                placeholder="بحث برقم العملية، المرسل، أو الحالة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <span className="text-xs font-mono text-slate-400 shrink-0">
              {transfers.length} عمليات مسجلة
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <RegistryFilterSummaryBar
            filteredCount={filteredTransfers.length}
            totalCount={transfers.length}
            itemNoun="عملية تحويل"
            sortColumn={tableState.sortColumn}
            sortDirection={tableState.sortDirection}
            hasActiveFilters={tableState.hasActiveFilters}
            onClearAll={tableState.handleClearAll}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">
                    <button type="button" onClick={() => tableState.handleToggleSort('id')} className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>رقم العملية</span>
                      <RegistrySortIcon column="id" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <button type="button" onClick={() => tableState.handleToggleSort('senderName')} className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>المرسل (المورّد)</span>
                      <RegistrySortIcon column="senderName" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <button type="button" onClick={() => tableState.handleToggleSort('recipientName')} className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>المستقبل</span>
                      <RegistrySortIcon column="recipientName" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-left">
                    <button type="button" onClick={() => tableState.handleToggleSort('amount')} className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>المبلغ والعملة</span>
                      <RegistrySortIcon column="amount" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-left">
                    <button type="button" onClick={() => tableState.handleToggleSort('accountingValueEUR')} className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>القيمة باليورو (€)</span>
                      <RegistrySortIcon column="accountingValueEUR" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <button type="button" onClick={() => tableState.handleToggleSort('transferMethod')} className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>طريقة الإثبات</span>
                      <RegistrySortIcon column="transferMethod" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <button type="button" onClick={() => tableState.handleToggleSort('status')} className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>حالة التحويل</span>
                      <RegistrySortIcon column="status" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">إجراءات المستلم</th>
                </tr>

                <tr className="bg-slate-900/90 border-t border-slate-800/80 font-normal normal-case">
                  {transferFilterColsConfig.map(({ col, placeholder, minWidth, dir, extraClass = '', getLabel }) => {
                    const hasSelected = tableState.selectedColumnFilters[col].length > 0;
                    return (
                      <th key={col} className="p-2">
                        <input
                          ref={(el) => {
                            tableState.filterInputRefs.current[col] = el;
                          }}
                          type="text"
                          dir={dir}
                          placeholder={tableState.getSelectedSummaryPlaceholder(col, placeholder, getLabel)}
                          value={tableState.columnFilters[col]}
                          onFocus={() => {
                            tableState.updateDropdownPosition(col, WIDE_TRANSFER_COLS);
                            tableState.setOpenDropdownCol(col);
                          }}
                          onClick={() => {
                            tableState.updateDropdownPosition(col, WIDE_TRANSFER_COLS);
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
                              tableState.updateDropdownPosition(col, WIDE_TRANSFER_COLS);
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
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-tajawal">
                      لا توجد عمليات تحويل مطابقة للبحث أو فلاتر الأعمدة المحددة.
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-cyan-400">{tx.id}</td>
                  <td className="py-3 px-4 font-tajawal text-slate-200">{tx.senderName}</td>
                  <td className="py-3 px-4 font-tajawal text-slate-200">{tx.recipientName}</td>
                  <td className="py-3 px-4 text-left font-bold text-white">
                    {tx.amount.toLocaleString()} {tx.currency}
                  </td>
                  <td className="py-3 px-4 text-left text-cyan-300 font-bold">
                    €{tx.accountingValueEUR.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-tajawal">
                    {tx.transferMethod === 'qr_code' && (
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <QrCode className="w-3.5 h-3.5 text-cyan-400" /> باركود QR
                      </span>
                    )}
                    {tx.transferMethod === 'vodafone_cash' && (
                      <span className="inline-flex items-center gap-1 text-red-400 font-medium">
                        <Smartphone className="w-3.5 h-3.5" /> فودافون كاش
                      </span>
                    )}
                    {tx.transferMethod === 'company_receipt' && (
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <Receipt className="w-3.5 h-3.5" /> إيصال شركة
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-tajawal">
                    {tx.status === 'received' && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> تم الاستلام والاعتماد
                      </span>
                    )}
                    {tx.status === 'waiting_recipient_approval' && (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> بانتظار موافقة المستلم
                      </span>
                    )}
                    {tx.status === 'rejected' && (
                      <div className="text-red-400 flex flex-col">
                        <span className="font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> مرفوض (أعيد للمرسل)
                        </span>
                        {tx.rejectionReason && (
                          <span className="text-[10px] text-slate-400">{tx.rejectionReason}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-tajawal">
                    {tx.status === 'waiting_recipient_approval' ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onApproveTransfer(tx.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px] transition-colors"
                          title="موافقة على استلام المبلغ"
                        >
                          <Check className="w-3 h-3" /> موافقة
                        </button>
                        <button
                          onClick={() => setRejectingTransferId(tx.id)}
                          className="flex items-center gap-1 px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded text-[11px] transition-colors"
                          title="رفض وإرجاع للمرسل"
                        >
                          <X className="w-3 h-3" /> رفض
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-mono">مكتملة</span>
                    )}
                  </td>
                </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {tableState.openDropdownCol && tableState.dropdownRect && (
            <RegistryColumnFilterDropdown
              activeCol={tableState.openDropdownCol}
              dropdownRect={tableState.dropdownRect}
              activeDropdownRef={tableState.activeDropdownRef}
              title={TRANSFER_DROPDOWN_TITLES[tableState.openDropdownCol]}
              options={transferColumnOptions[tableState.openDropdownCol] || []}
              filterText={tableState.columnFilters[tableState.openDropdownCol]}
              selectedValues={tableState.selectedColumnFilters[tableState.openDropdownCol]}
              onToggleValue={tableState.handleToggleColumnFilterValue}
              onClearCol={tableState.handleClearCol}
              onClose={() => tableState.setOpenDropdownCol(null)}
            />
          )}
        </div>
      </div>

      {/* Modal: QR Code Remittance Card */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-400">باركود التوريد المالي QR Code</span>
              <button onClick={() => setShowQRModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl inline-block shadow-inner mx-auto">
              {/* Simulated QR Pattern */}
              <div className="w-44 h-44 bg-slate-950 p-3 rounded-lg flex flex-col justify-between items-center text-cyan-400">
                <div className="flex justify-between w-full">
                  <div className="w-10 h-10 border-4 border-cyan-400" />
                  <div className="w-10 h-10 border-4 border-cyan-400" />
                </div>
                <div className="font-mono text-[10px] text-center text-slate-300 px-1 py-0.5 bg-slate-900 rounded">
                  {showQRModal.qrToken}
                </div>
                <div className="flex justify-between w-full">
                  <div className="w-10 h-10 border-4 border-cyan-400" />
                  <div className="w-4 h-4 bg-cyan-400" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-white text-sm">{showQRModal.partyName}</div>
              <div className="text-xs text-cyan-400">{getRoleArabic(showQRModal.role)}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                الرصيد: €{showQRModal.balanceEUR.toFixed(2)} | عهدة: {showQRModal.cashOnHandEGP} ج.م
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              امسح هذا الباركود بجهاز مسؤول الشركة أو الخزينة لتوريد العهدة النقدية مباشرة وتسجيلها فوراً.
            </p>

            <button
              onClick={() => setShowQRModal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg"
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      )}

      {/* Modal: New Transfer Initiation */}
      {showNewTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleCreateTransferSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white">إجراء تحويل مالي / توريد عهدة</h3>
              <button
                type="button"
                onClick={() => setShowNewTransferModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">الطرف المرسل (صاحب العهدة):</label>
                <select
                  value={senderWalletId}
                  onChange={(e) => setSenderWalletId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.partyName} ({getRoleArabic(w.role)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">الطرف المستلم (يحتاج لموافقته):</label>
                <select
                  value={recipientWalletId}
                  onChange={(e) => setRecipientWalletId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.partyName} ({getRoleArabic(w.role)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">المبلغ:</label>
                  <input
                    type="number"
                    min={1}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white text-center"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">العملة المستلمة:</label>
                  <select
                    value={transferCurrency}
                    onChange={(e) => setTransferCurrency(e.target.value as 'EGP' | 'EUR')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                  >
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="EUR">يورو (€ EUR)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">34. طريقة إثبات التحويل:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferMethod('qr_code')}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      transferMethod === 'qr_code'
                        ? 'border-cyan-500 bg-cyan-600/20 text-cyan-300 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    1. باركود QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferMethod('company_receipt')}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      transferMethod === 'company_receipt'
                        ? 'border-cyan-500 bg-cyan-600/20 text-cyan-300 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    2. إيصال شركة
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferMethod('vodafone_cash')}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      transferMethod === 'vodafone_cash'
                        ? 'border-cyan-500 bg-cyan-600/20 text-cyan-300 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    3. فودافون كاش
                  </button>
                </div>
              </div>

              {transferMethod === 'vodafone_cash' && (
                <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg space-y-2">
                  <div>
                    <label className="text-slate-400 block text-[10px] mb-1">رقم محفظة فودافون كاش:</label>
                    <input
                      type="text"
                      value={vodafoneNumber}
                      onChange={(e) => setVodafoneNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[10px] mb-1">رقم إشعار المعاملة (TX ID):</label>
                    <input
                      type="text"
                      value={vodafoneTxId}
                      onChange={(e) => setVodafoneTxId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewTransferModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg"
              >
                إرسال وبانتظار موافقة المستلم
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Rejection Reason (Section 6 item 36) */}
      {rejectingTransferId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-3">
            <h4 className="font-bold text-sm text-red-400 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              36. رفض استلام التحويل وإرجاعه للمرسل
            </h4>
            <p className="text-xs text-slate-400">
              عند الرفض سيعود المبلغ تلقائياً لمحفظة المرسل دون خصم، مع إخطار مسؤول Siyahia للمراجعة.
            </p>
            <div>
              <label className="text-[11px] text-slate-300 block mb-1">سبب الرفض المالي:</label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="مثال: لم يتم استلام المبلغ النقدي الفعلي، أو الرقم بالمعاملة غير مطابق..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingTransferId(null)}
                className="px-3 py-1.5 bg-slate-800 text-xs text-slate-300 rounded"
              >
                تراجع
              </button>
              <button
                onClick={confirmRejection}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-xs text-white font-bold rounded"
              >
                تأكيد الرفض والإرجاع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
