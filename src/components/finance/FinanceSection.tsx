import React from 'react';
import type { Activity } from '../../types/activity';
import type { AppUser } from '../../types/auth';
import type {
  BookingFinancialAllocation,
  CollectionRecord,
  FinancialPartyRole,
  FinancialSettlement,
  TransferTransaction,
  Wallet
} from '../../types/finance';
import type { BilateralLedgerEntry, PersonProfile } from '../../types/personProfile';
import type { BookingRequest } from '../trips/BookingQueueModal';
import type { NavigationItemKey } from '../layout/Sidebar';
import { ManualCashier } from './ManualCashier';
import { PartnerEarningsPortalView } from './PartnerEarningsPortalView';
import { WalletsManager } from './WalletsManager';

interface FinanceSectionProps {
  currentNavKey: NavigationItemKey;
  currentUser: AppUser;
  wallets: Wallet[];
  collections: CollectionRecord[];
  transfers: TransferTransaction[];
  settlements: FinancialSettlement[];
  allocations?: BookingFinancialAllocation[];
  bilateralLedger?: BilateralLedgerEntry[];
  personProfiles?: PersonProfile[];
  activities?: Activity[];
  activityBookings?: BookingRequest[];
  onInitiateTransfer: (
    transferData: Omit<TransferTransaction, 'id' | 'createdAt' | 'status'>
  ) => void;
  onApproveTransfer: (transferId: string) => void;
  onRejectTransfer: (transferId: string, reason: string) => void;
  onCreateWallet?: (input: {
    partyName: string;
    role: FinancialPartyRole;
    organization?: string;
    phone?: string;
    initialBalanceEUR?: number;
    creditLimitEUR?: number;
    minRequiredBalanceEUR?: number;
  }) => Wallet;
  onAddNewCollection: (
    record: Omit<CollectionRecord, 'id' | 'collectedAt' | 'status'>
  ) => void;
  onRequestSettlement: (
    settlement: Omit<FinancialSettlement, 'id' | 'createdAt' | 'status'>
  ) => void;
  onAuditSettlement: (settlementId: string, approved: boolean, notes: string) => void;
  onNavigate?: (key: NavigationItemKey) => void;
}

export const FinanceSection: React.FC<FinanceSectionProps> = ({
  currentNavKey,
  currentUser,
  wallets,
  collections,
  transfers,
  settlements,
  allocations = [],
  bilateralLedger = [],
  personProfiles = [],
  activities = [],
  activityBookings = [],
  onInitiateTransfer,
  onApproveTransfer,
  onRejectTransfer,
  onCreateWallet,
  onAddNewCollection,
  onRequestSettlement,
  onAuditSettlement,
  onNavigate
}) => {
  return (
    <>
      {currentNavKey === 'partner_earnings' && (
        <PartnerEarningsPortalView
          currentUser={currentUser}
          wallets={wallets}
          allocations={allocations}
          bilateralLedger={bilateralLedger}
          personProfiles={personProfiles}
          settlements={settlements}
          onRequestSettlement={onRequestSettlement}
          onNavigate={onNavigate || (() => {})}
        />
      )}

      {currentNavKey === 'finance_wallets' && (
        <WalletsManager
          wallets={wallets}
          transfers={transfers}
          onInitiateTransfer={onInitiateTransfer}
          onApproveTransfer={onApproveTransfer}
          onRejectTransfer={onRejectTransfer}
          onCreateWallet={onCreateWallet}
        />
      )}

      {currentNavKey === 'finance_cashier' && (
        <ManualCashier
          collections={collections}
          settlements={settlements}
          activities={activities}
          activityBookings={activityBookings}
          onAddNewCollection={onAddNewCollection}
          onRequestSettlement={onRequestSettlement}
          onAuditSettlement={onAuditSettlement}
        />
      )}
    </>
  );
};
