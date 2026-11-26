import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppUser } from '../types/auth';
import type {
  BookingFinancialAllocation,
  CollectionRecord,
  FinancialPartyRole,
  FinancialSettlement,
  TransferTransaction,
  Wallet
} from '../types/finance';
import type { PersonProfile } from '../types/personProfile';
import type { LogAuditEventInput } from './useAuditLogStore';
import { formatAuditTimestamp } from '../types/audit';
import { fetchDomainStore, saveDomainStore } from '../services/serverStoreSync';
import { ensurePartyWallets } from '../utils/financialSettlementEngine';

interface PersistedFinanceState {
  wallets: Wallet[];
  collections: CollectionRecord[];
  transfers: TransferTransaction[];
  settlements: FinancialSettlement[];
  allocations: BookingFinancialAllocation[];
}

const FINANCE_STATE_STORAGE_KEY = 'zanoza_finance_state_v1';

function readLocalFinanceState(): PersistedFinanceState {
  if (typeof window === 'undefined') {
    return { wallets: [], collections: [], transfers: [], settlements: [], allocations: [] };
  }
  try {
    const raw = window.localStorage.getItem(FINANCE_STATE_STORAGE_KEY);
    if (!raw) {
      return { wallets: [], collections: [], transfers: [], settlements: [], allocations: [] };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedFinanceState>;
    return {
      wallets: Array.isArray(parsed.wallets) ? parsed.wallets : [],
      collections: Array.isArray(parsed.collections) ? parsed.collections : [],
      transfers: Array.isArray(parsed.transfers) ? parsed.transfers : [],
      settlements: Array.isArray(parsed.settlements) ? parsed.settlements : [],
      allocations: Array.isArray(parsed.allocations) ? parsed.allocations : []
    };
  } catch {
    return { wallets: [], collections: [], transfers: [], settlements: [], allocations: [] };
  }
}

export function useFinanceStore(
  currentUser?: AppUser,
  onAuditLog?: (input: LogAuditEventInput) => void
) {
  const initialLocal = readLocalFinanceState();
  const [wallets, setWallets] = useState<Wallet[]>(initialLocal.wallets);
  const [collections, setCollections] = useState<CollectionRecord[]>(initialLocal.collections);
  const [transfers, setTransfers] = useState<TransferTransaction[]>(initialLocal.transfers);
  const [settlements, setSettlements] = useState<FinancialSettlement[]>(initialLocal.settlements);
  const [allocations, setAllocations] = useState<BookingFinancialAllocation[]>(
    initialLocal.allocations
  );
  const hasHydratedServer = useRef(false);

  useEffect(() => {
    let active = true;
    fetchDomainStore<Partial<PersistedFinanceState>>('finance_state')
      .then((serverState) => {
        if (!active) return;
        if (serverState && typeof serverState === 'object') {
          if (Array.isArray(serverState.wallets)) setWallets(serverState.wallets);
          if (Array.isArray(serverState.collections)) setCollections(serverState.collections);
          if (Array.isArray(serverState.transfers)) setTransfers(serverState.transfers);
          if (Array.isArray(serverState.settlements)) setSettlements(serverState.settlements);
          if (Array.isArray(serverState.allocations)) setAllocations(serverState.allocations);
        }
        hasHydratedServer.current = true;
      })
      .catch(() => {
        if (active) hasHydratedServer.current = true;
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const payload: PersistedFinanceState = {
      wallets,
      collections,
      transfers,
      settlements,
      allocations
    };
    try {
      window.localStorage.setItem(FINANCE_STATE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
    if (hasHydratedServer.current) {
      void saveDomainStore('finance_state', payload);
    }
  }, [wallets, collections, transfers, settlements, allocations]);

  const ensureWalletsForParties = useCallback(
    (users: AppUser[], personProfiles: PersonProfile[]) => {
      setWallets((prev) => {
        const ensured = ensurePartyWallets({
          existingWallets: prev,
          users,
          personProfiles
        });
        return ensured.length === prev.length ? prev : ensured;
      });
    },
    []
  );

  const createManualWallet = useCallback(
    (input: {
      partyName: string;
      role: FinancialPartyRole;
      organization?: string;
      phone?: string;
      initialBalanceEUR?: number;
      creditLimitEUR?: number;
      minRequiredBalanceEUR?: number;
    }): Wallet => {
      const slug = Date.now().toString().slice(-6);
      const created: Wallet = {
        id: `wlt-man-${slug}`,
        partyId: `party-man-${slug}`,
        partyName: input.partyName.trim(),
        role: input.role,
        organization: input.organization?.trim() || 'منصة ZanoZa',
        phone: input.phone?.trim() || undefined,
        balanceEUR: Number(input.initialBalanceEUR || 0),
        cashOnHandEGP: 0,
        cashOnHandEUR: 0,
        pendingTransfersEUR: 0,
        creditLimitEUR: Math.max(0, Number(input.creditLimitEUR ?? 500)),
        minRequiredBalanceEUR: Math.max(0, Number(input.minRequiredBalanceEUR ?? 0)),
        warningThresholdEUR: 25,
        isBlockedDueToDeficit: false,
        qrToken: `ZN-WLT-MAN-${slug}`
      };
      setWallets((prev) => [created, ...prev]);
      if (currentUser) {
        onAuditLog?.({
          actor: currentUser,
          action: 'create',
          domain: 'finance',
          entityId: created.id,
          entityName: created.partyName,
          summary: `أنشأ ${currentUser.name} محفظة مالية جديدة لـ «${created.partyName}»`
        });
      }
      return created;
    },
    [currentUser, onAuditLog]
  );

  /**
   * Idempotently applies deltas between previous BookingFinancialAllocation and next Allocation
   * across Wallets and auto-CollectionRecord entries so repeated updates never double-credit.
   */
  const syncBookingFinance = useCallback(
    (nextAllocation: BookingFinancialAllocation) => {
      setAllocations((prevAllocs) => {
        const prevAllocation = prevAllocs.find(
          (a) => a.bookingId === nextAllocation.bookingId
        );

        // Compute per-wallet delta in EUR & cash on hand
        const prevByWallet = new Map<string, { eur: number; egp: number }>();
        if (prevAllocation) {
          for (const p of prevAllocation.payouts) {
            if (!p.walletId) continue;
            const cur = prevByWallet.get(p.walletId) || { eur: 0, egp: 0 };
            cur.eur += p.amountEUR;
            cur.egp += p.amountEGP;
            prevByWallet.set(p.walletId, cur);
          }
        }

        const nextByWallet = new Map<string, { eur: number; egp: number }>();
        for (const p of nextAllocation.payouts) {
          if (!p.walletId) continue;
          const cur = nextByWallet.get(p.walletId) || { eur: 0, egp: 0 };
          cur.eur += p.amountEUR;
          cur.egp += p.amountEGP;
          nextByWallet.set(p.walletId, cur);
        }

        const allWalletIds = new Set([...prevByWallet.keys(), ...nextByWallet.keys()]);
        if (allWalletIds.size > 0) {
          setWallets((prevWallets) =>
            prevWallets.map((w) => {
              if (!allWalletIds.has(w.id)) return w;
              const prevAmt = prevByWallet.get(w.id) || { eur: 0, egp: 0 };
              const nextAmt = nextByWallet.get(w.id) || { eur: 0, egp: 0 };
              const deltaEUR = Math.round((nextAmt.eur - prevAmt.eur) * 100) / 100;
              const deltaEGP = Math.round(nextAmt.egp - prevAmt.egp);
              if (deltaEUR === 0 && deltaEGP === 0) return w;
              const nextBalEUR = Math.round((w.balanceEUR + deltaEUR) * 100) / 100;
              return {
                ...w,
                balanceEUR: nextBalEUR,
                cashOnHandEGP:
                  nextAllocation.currency === 'EGP'
                    ? Math.max(0, Math.round(w.cashOnHandEGP + deltaEGP))
                    : w.cashOnHandEGP,
                cashOnHandEUR:
                  nextAllocation.currency === 'EUR'
                    ? Math.max(0, Math.round((w.cashOnHandEUR + deltaEUR) * 100) / 100)
                    : w.cashOnHandEUR
              };
            })
          );
        }

        // Upsert automatic CollectionRecord
        const colId = `auto-col-${nextAllocation.bookingId}`;
        const ts = formatAuditTimestamp();
        const isEgp = nextAllocation.currency === 'EGP';
        const receivedAmount = isEgp ? nextAllocation.paidNowEGP : nextAllocation.paidNowEUR;
        const planType =
          nextAllocation.paidNowEGP >= nextAllocation.grossTotalEGP - 1
            ? 'full'
            : 'deposit';

        setCollections((prevCols) => {
          const existingCol = prevCols.find((c) => c.id === colId);
          if (receivedAmount <= 0 && !existingCol) return prevCols;
          const nextStatus: CollectionRecord['status'] =
            receivedAmount <= 0 ? 'rejected' : 'confirmed';
          const upserted: CollectionRecord = {
            id: colId,
            bookingRef: nextAllocation.bookingCode,
            activityId: nextAllocation.entityId,
            activityTitle: nextAllocation.entityName,
            collectorName: nextAllocation.ownerName || 'بوابة الدفع / التشغيل',
            collectorRole: 'activity_owner',
            collectorOrg: 'منظومة الحجوزات التلقائية',
            receivedAmount: Math.max(0, Math.round(receivedAmount * 100) / 100),
            receivedCurrency: nextAllocation.currency,
            lockedExchangeRate: nextAllocation.eurToEgpRate,
            accountingValueEUR: nextAllocation.paidNowEUR,
            collectedAt: existingCol?.collectedAt || ts.formattedDateTime,
            status: nextStatus,
            planType,
            totalBookingCostEUR: nextAllocation.grossTotalEUR,
            totalPaidEUR: nextAllocation.paidNowEUR,
            remainingAmountEUR: Math.max(
              0,
              Math.round((nextAllocation.grossTotalEUR - nextAllocation.paidNowEUR) * 100) / 100
            ),
            notes:
              nextStatus === 'rejected'
                ? `تم إلغاء الحجز ورد المستحقات (${nextAllocation.refundedEGP.toLocaleString()} ج.م)`
                : `توزيع تلقائي: مالك (${nextAllocation.ownerNetEGP} ج.م) · منصة (${nextAllocation.platformFeeEGP} ج.م)`
          };
          if (existingCol) {
            return prevCols.map((c) => (c.id === colId ? upserted : c));
          }
          return [upserted, ...prevCols];
        });

        const exists = prevAllocs.some((a) => a.bookingId === nextAllocation.bookingId);
        if (exists) {
          return prevAllocs.map((a) =>
            a.bookingId === nextAllocation.bookingId ? nextAllocation : a
          );
        }
        return [nextAllocation, ...prevAllocs];
      });
    },
    []
  );

  const markAllocationRefundSettled = useCallback(
    (bookingId: string) => {
      setAllocations((prev) =>
        prev.map((a) =>
          a.bookingId === bookingId
            ? {
                ...a,
                status: 'refunded',
                payouts: a.payouts.map((p) => ({ ...p, status: 'reversed' })),
                updatedAt: new Date().toISOString()
              }
            : a
        )
      );
      if (currentUser) {
        onAuditLog?.({
          actor: currentUser,
          action: 'approve',
          domain: 'finance',
          entityId: bookingId,
          entityName: `تسوية استرداد حجز ${bookingId}`,
          summary: `أكّد ${currentUser.name} إتمام سداد الاسترداد المالي للعميل للحجز (${bookingId})`
        });
      }
    },
    [currentUser, onAuditLog]
  );

  const handleInitiateTransfer = (
    transferData: Omit<TransferTransaction, 'id' | 'createdAt' | 'status'>
  ) => {
    const ts = formatAuditTimestamp();
    const newTx: TransferTransaction = {
      ...transferData,
      id: `tr-${Date.now().toString().slice(-5)}`,
      status: 'waiting_recipient_approval',
      createdAt: ts.formattedDateTime
    };
    setTransfers((prev) => [newTx, ...prev]);
    if (currentUser) {
      onAuditLog?.({
        actor: currentUser,
        action: 'create',
        domain: 'finance',
        entityId: newTx.id,
        entityName: `تحويل ${newTx.amount} ${newTx.currency}`,
        summary: `أنشأ ${currentUser.name} طلب تحويل مالي بمبلغ ${newTx.amount} ${newTx.currency}`
      });
    }
  };

  const handleApproveTransfer = (transferId: string) => {
    const targetTx = transfers.find((t) => t.id === transferId);
    if (!targetTx) return;
    const ts = formatAuditTimestamp();

    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? { ...t, status: 'received', decidedAt: ts.formattedDateTime }
          : t
      )
    );

    setWallets((prev) =>
      prev.map((w) => {
        if (w.id === targetTx.recipientWalletId) {
          return {
            ...w,
            balanceEUR: w.balanceEUR + targetTx.accountingValueEUR,
            cashOnHandEGP:
              targetTx.currency === 'EGP' ? w.cashOnHandEGP + targetTx.amount : w.cashOnHandEGP,
            cashOnHandEUR:
              targetTx.currency === 'EUR' ? w.cashOnHandEUR + targetTx.amount : w.cashOnHandEUR
          };
        }
        if (w.id === targetTx.senderWalletId) {
          return {
            ...w,
            balanceEUR: w.balanceEUR - targetTx.accountingValueEUR,
            cashOnHandEGP:
              targetTx.currency === 'EGP'
                ? Math.max(0, w.cashOnHandEGP - targetTx.amount)
                : w.cashOnHandEGP,
            cashOnHandEUR:
              targetTx.currency === 'EUR'
                ? Math.max(0, w.cashOnHandEUR - targetTx.amount)
                : w.cashOnHandEUR
          };
        }
        return w;
      })
    );

    if (currentUser) {
      onAuditLog?.({
        actor: currentUser,
        action: 'approve',
        domain: 'finance',
        entityId: transferId,
        entityName: `تحويل ${targetTx.amount} ${targetTx.currency}`,
        summary: `اعتمد ${currentUser.name} استلام التحويل المالي (${targetTx.amount} ${targetTx.currency})`
      });
    }
  };

  const handleRejectTransfer = (transferId: string, reason: string) => {
    const ts = formatAuditTimestamp();
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? {
              ...t,
              status: 'rejected',
              rejectionReason: reason,
              refundedAutomatically: true,
              decidedAt: ts.formattedDateTime
            }
          : t
      )
    );
    if (currentUser) {
      onAuditLog?.({
        actor: currentUser,
        action: 'reject',
        domain: 'finance',
        entityId: transferId,
        entityName: `تحويل ${transferId}`,
        summary: `رفض ${currentUser.name} التحويل المالي (${transferId})`,
        details: reason ? `السبب: ${reason}` : undefined
      });
    }
  };

  const handleAddNewCollection = (
    record: Omit<CollectionRecord, 'id' | 'collectedAt' | 'status'>
  ) => {
    const ts = formatAuditTimestamp();
    const newCol: CollectionRecord = {
      ...record,
      id: `col-${Date.now().toString().slice(-4)}`,
      collectedAt: ts.formattedDateTime,
      status: 'confirmed'
    };
    setCollections((prev) => [newCol, ...prev]);

    setWallets((prev) =>
      prev.map((w) => {
        if (w.partyName.includes(record.collectorName.split(' ')[0])) {
          return {
            ...w,
            balanceEUR: Math.round((w.balanceEUR + record.accountingValueEUR) * 100) / 100,
            cashOnHandEGP:
              record.receivedCurrency === 'EGP'
                ? w.cashOnHandEGP + record.receivedAmount
                : w.cashOnHandEGP,
            cashOnHandEUR:
              record.receivedCurrency === 'EUR'
                ? w.cashOnHandEUR + record.receivedAmount
                : w.cashOnHandEUR
          };
        }
        return w;
      })
    );

    if (currentUser) {
      onAuditLog?.({
        actor: currentUser,
        action: 'create',
        domain: 'finance',
        entityId: newCol.id,
        entityName: record.activityTitle,
        summary: `سجّل ${currentUser.name} تحصيلاً نقدياً (${record.receivedAmount} ${record.receivedCurrency})`
      });
    }
  };

  const handleRequestSettlement = (
    settlement: Omit<FinancialSettlement, 'id' | 'createdAt' | 'status'>
  ) => {
    const ts = formatAuditTimestamp();
    const newStl: FinancialSettlement = {
      ...settlement,
      id: `stl-${Date.now().toString().slice(-3)}`,
      status: 'pending_siyahia_review',
      createdAt: ts.formattedDateTime
    };
    setSettlements((prev) => [newStl, ...prev]);
    if (currentUser) {
      onAuditLog?.({
        actor: currentUser,
        action: 'create',
        domain: 'finance',
        entityId: newStl.id,
        entityName: `تسوية ${newStl.id}`,
        summary: `رفع ${currentUser.name} طلب تسوية مالية (${newStl.id})`
      });
    }
  };

  const handleAuditSettlement = (settlementId: string, approved: boolean, notes: string) => {
    const ts = formatAuditTimestamp();
    setSettlements((prev) =>
      prev.map((s) => {
        if (s.id === settlementId) {
          return {
            ...s,
            status: approved ? 'approved_by_admin' : 'rejected_by_admin',
            siyahiaAuditorDecision: {
              auditorName: currentUser?.name || 'المدير المالي لمنصة Siyahia',
              decisionDate: ts.formattedDateTime,
              decisionNotes: notes,
              approved
            }
          };
        }
        return s;
      })
    );
    if (currentUser) {
      onAuditLog?.({
        actor: currentUser,
        action: approved ? 'approve' : 'reject',
        domain: 'finance',
        entityId: settlementId,
        entityName: `تسوية ${settlementId}`,
        summary: `${approved ? 'اعتمد' : 'رفض'} ${currentUser.name} التسوية المالية (${settlementId})`,
        details: notes || undefined
      });
    }
  };

  return {
    wallets,
    collections,
    transfers,
    settlements,
    allocations,
    ensureWalletsForParties,
    createManualWallet,
    syncBookingFinance,
    markAllocationRefundSettled,
    handleInitiateTransfer,
    handleApproveTransfer,
    handleRejectTransfer,
    handleAddNewCollection,
    handleRequestSettlement,
    handleAuditSettlement
  };
}
