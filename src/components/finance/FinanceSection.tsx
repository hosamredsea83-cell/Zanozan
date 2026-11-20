import React from 'react';
import type {
  CollectionRecord,
  FinancialSettlement,
  TransferTransaction,
  Wallet
} from '../../types/finance';
import type { NavigationItemKey } from '../layout/Sidebar';
import { ManualCashier } from './ManualCashier';
import { WalletsManager } from './WalletsManager';

interface FinanceSectionProps {
  currentNavKey: NavigationItemKey;
  wallets: Wallet[];
  collections: CollectionRecord[];
  transfers: TransferTransaction[];
  settlements: FinancialSettlement[];
  onInitiateTransfer: (
    transferData: Omit<TransferTransaction, 'id' | 'createdAt' | 'status'>
  ) => void;
  onApproveTransfer: (transferId: string) => void;
  onRejectTransfer: (transferId: string, reason: string) => void;
  onAddNewCollection: (
    record: Omit<CollectionRecord, 'id' | 'collectedAt' | 'status'>
  ) => void;
  onRequestSettlement: (
    settlement: Omit<FinancialSettlement, 'id' | 'createdAt' | 'status'>
  ) => void;
  onAuditSettlement: (settlementId: string, approved: boolean, notes: string) => void;
}

export const FinanceSection: React.FC<FinanceSectionProps> = ({
  currentNavKey,
  wallets,
  collections,
  transfers,
  settlements,
  onInitiateTransfer,
  onApproveTransfer,
  onRejectTransfer,
  onAddNewCollection,
  onRequestSettlement,
  onAuditSettlement
}) => {
  return (
    <>
      {currentNavKey === 'finance_wallets' && (
        <WalletsManager
          wallets={wallets}
          transfers={transfers}
          onInitiateTransfer={onInitiateTransfer}
          onApproveTransfer={onApproveTransfer}
          onRejectTransfer={onRejectTransfer}
        />
      )}

      {currentNavKey === 'finance_cashier' && (
        <ManualCashier
          collections={collections}
          settlements={settlements}
          onAddNewCollection={onAddNewCollection}
          onRequestSettlement={onRequestSettlement}
          onAuditSettlement={onAuditSettlement}
        />
      )}
    </>
  );
};
