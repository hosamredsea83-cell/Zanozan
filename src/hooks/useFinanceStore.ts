import { useState } from 'react';
import type { AppUser } from '../types/auth';
import type {
  CollectionRecord,
  FinancialSettlement,
  TransferTransaction,
  Wallet
} from '../types/finance';
import type { LogAuditEventInput } from './useAuditLogStore';
import { formatAuditTimestamp } from '../types/audit';

export function useFinanceStore(
  currentUser?: AppUser,
  onAuditLog?: (input: LogAuditEventInput) => void
) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [transfers, setTransfers] = useState<TransferTransaction[]>([]);
  const [settlements, setSettlements] = useState<FinancialSettlement[]>([]);

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
    handleInitiateTransfer,
    handleApproveTransfer,
    handleRejectTransfer,
    handleAddNewCollection,
    handleRequestSettlement,
    handleAuditSettlement
  };
}
