import type { Activity } from '../types/activity';
import type { AppUser } from '../types/auth';
import type { EquipmentItem } from '../types/equipment';
import type {
  BookingFinancialAllocation,
  BookingPartnerPayoutItem,
  BookingPayoutPartnerRole,
  FinancialPartyRole,
  Wallet
} from '../types/finance';
import type { LogisticsVehicle } from '../types/logistics';
import {
  type ActivityCostProfile,
  computeLineItemCostEGP
} from '../types/operationalCost';
import type { PersonProfile } from '../types/personProfile';
import type { PlatformPricingSettings } from '../components/pricing/PricingToolManager';
import type { BookingRequest } from '../components/trips/BookingQueueModal';
import type { TripBooking } from '../components/bookings/BookingsManagerView';
import { calculateCustomerFeeAndTax } from './bookingPricing';

function mapUserRoleToWalletRole(user: AppUser): FinancialPartyRole {
  const rk = user.roleKey;
  if (rk === 'platform_admin') return 'company';
  if (rk === 'driver') return 'driver';
  if (rk === 'tour_guide') return 'tour_guide';
  if (rk === 'delegate') return 'delegate';
  if (rk === 'employee') return 'employee';
  if (rk === 'equipment_owner') return 'operator';
  return 'activity_owner';
}

function mapProfileRoleToWalletRole(profile: PersonProfile): FinancialPartyRole {
  if (profile.roles.includes('driver_vehicle_owner')) return 'driver';
  if (profile.roles.includes('crew_rep')) return 'delegate';
  if (profile.roles.includes('equipment_owner') || profile.roles.includes('quad_owner')) {
    return 'operator';
  }
  return 'activity_owner';
}

function makeWalletQrToken(partyId: string): string {
  const clean = partyId.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase().slice(0, 18);
  return `ZN-WLT-${clean || 'PARTY'}`;
}

export function ensurePartyWallets(params: {
  existingWallets: Wallet[];
  users: AppUser[];
  personProfiles: PersonProfile[];
}): Wallet[] {
  const { existingWallets, users, personProfiles } = params;
  const result = [...existingWallets];

  const hasWalletForParty = (partyId: string, name?: string) =>
    result.some(
      (w) =>
        w.partyId === partyId ||
        (name && w.partyName.trim().toLowerCase() === name.trim().toLowerCase())
    );

  // Always ensure Central Platform Treasury Wallet
  if (!result.some((w) => w.partyId === 'platform_treasury' || w.id === 'wlt-platform')) {
    result.push({
      id: 'wlt-platform',
      partyId: 'platform_treasury',
      partyName: 'خزينة منصة Siyahia المركزية',
      role: 'company',
      organization: 'ZanoZa / Siyahia Platform',
      balanceEUR: 0,
      cashOnHandEGP: 0,
      cashOnHandEUR: 0,
      pendingTransfersEUR: 0,
      creditLimitEUR: 5000,
      minRequiredBalanceEUR: 0,
      warningThresholdEUR: 50,
      isBlockedDueToDeficit: false,
      qrToken: 'ZN-WLT-PLATFORM-TREASURY'
    });
  }

  for (const user of users) {
    if (user.roleKey === 'customer') continue;
    if (hasWalletForParty(user.id, user.name)) continue;
    result.push({
      id: `wlt-${user.id}`,
      partyId: user.id,
      partyName: user.name,
      role: mapUserRoleToWalletRole(user),
      organization: user.companyName || 'منصة ZanoZa',
      balanceEUR: 0,
      cashOnHandEGP: 0,
      cashOnHandEUR: 0,
      pendingTransfersEUR: 0,
      creditLimitEUR: 500,
      minRequiredBalanceEUR: 0,
      warningThresholdEUR: 25,
      isBlockedDueToDeficit: false,
      qrToken: makeWalletQrToken(user.id),
      phone: user.phone
    });
  }

  for (const prof of personProfiles) {
    const pid = prof.linkedUserId || prof.id;
    if (hasWalletForParty(pid, prof.name) || hasWalletForParty(prof.id, prof.name)) continue;
    result.push({
      id: `wlt-${prof.id}`,
      partyId: pid,
      partyName: prof.name,
      role: mapProfileRoleToWalletRole(prof),
      organization: prof.companyName || 'شريك خارجي بالمنصة',
      balanceEUR: 0,
      cashOnHandEGP: 0,
      cashOnHandEUR: 0,
      pendingTransfersEUR: 0,
      creditLimitEUR: 300,
      minRequiredBalanceEUR: 0,
      warningThresholdEUR: 20,
      isBlockedDueToDeficit: false,
      qrToken: makeWalletQrToken(prof.id),
      phone: prof.phone
    });
  }

  return result;
}

export function findWalletForParty(
  wallets: Wallet[],
  partyUserId?: string,
  partyProfileId?: string,
  partyName?: string,
  fallbackRole?: FinancialPartyRole
): Wallet | undefined {
  if (partyUserId) {
    const byUid = wallets.find((w) => w.partyId === partyUserId || w.id === `wlt-${partyUserId}`);
    if (byUid) return byUid;
  }
  if (partyProfileId) {
    const byPid = wallets.find(
      (w) => w.partyId === partyProfileId || w.id === `wlt-${partyProfileId}`
    );
    if (byPid) return byPid;
  }
  if (partyName) {
    const norm = partyName.trim().toLowerCase();
    const byName = wallets.find((w) => w.partyName.trim().toLowerCase() === norm);
    if (byName) return byName;
  }
  if (fallbackRole) {
    return wallets.find((w) => w.role === fallbackRole);
  }
  return undefined;
}

function roundMoney(v: number): number {
  return Math.round(v * 100) / 100;
}

export function computeBookingPartnerAllocations(params: {
  booking: BookingRequest | TripBooking;
  bookingKind: 'activity_booking' | 'trip_booking';
  activity?: Activity;
  costProfile?: ActivityCostProfile;
  equipments?: EquipmentItem[];
  logisticsVehicles?: LogisticsVehicle[];
  personProfiles: PersonProfile[];
  users: AppUser[];
  wallets: Wallet[];
  platformPricingSettings: PlatformPricingSettings;
  eurRate?: number;
}): BookingFinancialAllocation {
  const {
    booking,
    bookingKind,
    activity,
    costProfile,
    equipments = [],
    logisticsVehicles = [],
    personProfiles,
    users,
    wallets,
    platformPricingSettings
  } = params;

  const rate = Math.max(1, costProfile?.eurToEgpRate || params.eurRate || 52);
  const isEgp = booking.customerType === 'egyptian';
  const currency: 'EGP' | 'EUR' = isEgp ? 'EGP' : 'EUR';

  const grossTotalEGP = isEgp
    ? Math.max(0, booking.totalPriceEGP || 0)
    : roundMoney((booking.totalPriceEUR || 0) * rate);
  const grossTotalEUR = isEgp
    ? roundMoney((booking.totalPriceEGP || 0) / rate)
    : Math.max(0, booking.totalPriceEUR || 0);

  // Determine how much of the booking is actually collected/earned
  let effectiveRatio = 0;
  const isCancelledOrRejected =
    booking.status === 'rejected' ||
    booking.status === 'auto_cancelled' ||
    booking.status === 'cancelled';

  if (isCancelledOrRejected) {
    // Refunded or forfeited portion handled via retained revenue if partial/no refund
    const refEGP = isEgp ? booking.refundAmountEGP || 0 : (booking.refundAmountEUR || 0) * rate;
    const paidBaseEGP =
      booking.paymentStatus === 'pending'
        ? 0
        : booking.paymentStatus === 'deposit'
          ? isEgp
            ? booking.depositAmountEGP || grossTotalEGP * 0.3
            : (booking.depositAmountEUR || grossTotalEUR * 0.3) * rate
          : grossTotalEGP;
    const retainedEGP = Math.max(0, paidBaseEGP - refEGP);
    effectiveRatio = grossTotalEGP > 0 ? Math.min(1, retainedEGP / grossTotalEGP) : 0;
  } else if (booking.status === 'completed' || booking.paymentStatus === 'paid') {
    effectiveRatio = 1;
  } else if (booking.paymentStatus === 'deposit') {
    if (isEgp) {
      const dep = booking.depositAmountEGP || grossTotalEGP * 0.3;
      effectiveRatio = grossTotalEGP > 0 ? Math.min(1, Math.max(0, dep / grossTotalEGP)) : 0.3;
    } else {
      const dep = booking.depositAmountEUR || grossTotalEUR * 0.3;
      effectiveRatio = grossTotalEUR > 0 ? Math.min(1, Math.max(0, dep / grossTotalEUR)) : 0.3;
    }
  }

  const paidNowEGP = roundMoney(grossTotalEGP * effectiveRatio);
  const paidNowEUR = roundMoney(grossTotalEUR * effectiveRatio);

  // Platform Fee + VAT using central pricing calculator
  const feeBreakdown = calculateCustomerFeeAndTax(
    isEgp ? paidNowEGP : paidNowEUR,
    platformPricingSettings,
    currency
  );
  const totalFeePlusTaxNative = feeBreakdown.fee + feeBreakdown.tax;
  const platformFeeEGP = isEgp
    ? roundMoney(totalFeePlusTaxNative)
    : roundMoney(totalFeePlusTaxNative * rate);
  const platformFeeEUR = isEgp
    ? roundMoney(totalFeePlusTaxNative / rate)
    : roundMoney(totalFeePlusTaxNative);

  const paxCount = Math.max(
    1,
    (booking.adultsCount || 0) + (booking.childrenCount || 0)
  );
  const ownerUserId = activity?.owner?.id || 'user-ahmed';
  const ownerName = activity?.owner?.name || 'صاحب النشاط';

  const payouts: BookingPartnerPayoutItem[] = [];
  const usedRoles = new Set<string>();

  if (paidNowEGP > 0) {
    // Platform Wallet Payout
    const platformWallet = findWalletForParty(
      wallets,
      'platform_treasury',
      undefined,
      undefined,
      'company'
    );
    if (platformFeeEGP > 0) {
      const feeDesc =
        platformPricingSettings.serviceFee.feeType === 'percentage'
          ? `${platformPricingSettings.serviceFee.percentage}%`
          : `${platformPricingSettings.serviceFee.fixedAmounts?.[currency] ?? platformPricingSettings.serviceFee.fixedAmount} ${currency}`;
      payouts.push({
        id: `po-${booking.id}-platform`,
        partnerKey: 'platform',
        partnerRole: 'platform',
        partyUserId: 'platform_treasury',
        partyName: 'عمولة منصة ZanoZa / Siyahia',
        walletId: platformWallet?.id || 'wlt-platform',
        amountEGP: platformFeeEGP,
        amountEUR: platformFeeEUR,
        calculationNote: `رسوم المنصة والضريبة المعتمدة (${feeDesc})`,
        status: 'credited'
      });
    }

    // 1. Primary: Cost Profile Partner Items
    if (costProfile && costProfile.items.length > 0) {
      for (const item of costProfile.items) {
        if (item.category === 'fuel' || item.category === 'other') continue;

        const baseImpactEGP = computeLineItemCostEGP(item, paxCount, grossTotalEGP, rate);
        const scaledEGP = roundMoney(baseImpactEGP * effectiveRatio);
        if (scaledEGP <= 0) continue;

        const profile = item.assignedProfileId
          ? personProfiles.find((p) => p.id === item.assignedProfileId)
          : undefined;

        let partnerRole: BookingPayoutPartnerRole = 'activity_owner';
        if (item.category === 'transport') {
          partnerRole = 'driver';
        } else if (item.category === 'reps') {
          partnerRole = 'delegate';
        } else if (item.category === 'crew' || item.category === 'external_crew') {
          if (profile?.roles.includes('equipment_owner') || profile?.roles.includes('quad_owner')) {
            partnerRole = 'equipment_owner';
          } else if (
            item.title.includes('معدة') ||
            item.title.includes('يخت') ||
            item.title.includes('باجي') ||
            item.title.includes('غوص')
          ) {
            partnerRole = 'equipment_owner';
          } else {
            partnerRole = 'tour_guide';
          }
        }

        // Resolve matching user/profile
        let targetUserId = profile?.linkedUserId;
        let targetName = profile?.name || item.title;
        if (!targetUserId) {
          if (partnerRole === 'driver') {
            const drv = users.find((u) => u.roleKey === 'driver');
            targetUserId = drv?.id || 'user-karim-driver';
            targetName = item.title || drv?.name || 'السائق الميداني';
          } else if (partnerRole === 'tour_guide') {
            const gd = users.find((u) => u.roleKey === 'tour_guide');
            targetUserId = gd?.id || 'user-hassan-guide';
            targetName = item.title || gd?.name || 'المرشد السياحي';
          } else if (partnerRole === 'delegate') {
            const del = users.find((u) => u.roleKey === 'delegate');
            targetUserId = del?.id || 'user-youssef-delegate';
            targetName = item.title || del?.name || 'مندوب المبيعات';
          } else if (partnerRole === 'equipment_owner') {
            const eqOwner = users.find((u) => u.roleKey === 'equipment_owner');
            targetUserId = eqOwner?.id || 'user-tarek';
            targetName = item.title || eqOwner?.name || 'صاحب المعدة';
          }
        }

        const matchedWallet = findWalletForParty(
          wallets,
          targetUserId,
          profile?.id,
          targetName,
          partnerRole === 'driver'
            ? 'driver'
            : partnerRole === 'tour_guide'
              ? 'tour_guide'
              : partnerRole === 'delegate'
                ? 'delegate'
                : 'operator'
        );

        usedRoles.add(partnerRole);
        payouts.push({
          id: `po-${booking.id}-${item.id}`,
          partnerKey: `${partnerRole}:${item.id}`,
          partnerRole,
          partyUserId: targetUserId,
          partyProfileId: profile?.id,
          partyName: targetName,
          walletId: matchedWallet?.id,
          amountEGP: scaledEGP,
          amountEUR: roundMoney(scaledEGP / rate),
          calculationNote: `${item.title} (${Math.round(effectiveRatio * 100)}% محصل)`,
          status: 'credited'
        });
      }
    }

    // 2. Fallback: Driver Transfer Fee if transfer is required & no transport item allocated
    const requiresTransfer =
      ('requiresPickup' in booking ? booking.requiresPickup : false) ||
      Boolean(activity?.logistics?.requiresTransfer);
    if (!usedRoles.has('driver') && requiresTransfer) {
      const assignedRef =
        ('assignedDriverName' in booking ? booking.assignedDriverName : undefined) ||
        activity?.logistics?.assignedDriverOrVehicle;
      const linkedVeh = logisticsVehicles.find(
        (v) =>
          (assignedRef &&
            (v.id === assignedRef || v.name === assignedRef || v.driverName === assignedRef)) ||
          (activity?.location?.city && v.city === activity.location.city)
      );
      const driverUser = users.find(
        (u) =>
          u.id === ('assignedDriverId' in booking ? booking.assignedDriverId : undefined) ||
          (linkedVeh && u.name.includes(linkedVeh.driverName.split(' ')[0])) ||
          u.roleKey === 'driver'
      );
      const feeBaseEGP =
        activity?.logistics?.separateTransferFeeEGP ||
        (activity?.logistics?.separateTransferFeeEUR
          ? activity.logistics.separateTransferFeeEUR * rate
          : 0) ||
        linkedVeh?.pricePerTripEGP ||
        250;
      const scaledDriverEGP = roundMoney(Math.min(paidNowEGP * 0.25, feeBaseEGP * effectiveRatio));
      if (scaledDriverEGP > 0) {
        const driverWallet = findWalletForParty(
          wallets,
          driverUser?.id || 'user-karim-driver',
          linkedVeh?.partnerId,
          driverUser?.name || linkedVeh?.driverName,
          'driver'
        );
        payouts.push({
          id: `po-${booking.id}-driver-auto`,
          partnerKey: 'driver:auto',
          partnerRole: 'driver',
          partyUserId: driverUser?.id || 'user-karim-driver',
          partyProfileId: linkedVeh?.personCustody?.personProfileId || 'prof-user-karim-driver',
          partyName: driverUser?.name || linkedVeh?.driverName || 'كريم عبد العزيز (السائق)',
          walletId: driverWallet?.id,
          amountEGP: scaledDriverEGP,
          amountEUR: roundMoney(scaledDriverEGP / rate),
          calculationNote: 'بدل توصيل ونقل سياحي تلقائي للحجز',
          status: 'credited'
        });
      }
    }

    // 3. Fallback: External Equipment Owner Share
    if (!usedRoles.has('equipment_owner') && activity?.equipmentIds?.length) {
      const partnerEquip = equipments.find(
        (eq) =>
          activity.equipmentIds?.includes(eq.id) &&
          eq.ownerId &&
          eq.ownerId !== ownerUserId
      );
      if (partnerEquip) {
        const equipUser = users.find((u) => u.id === partnerEquip.ownerId);
        const eqShareEGP = roundMoney(paidNowEGP * 0.15);
        if (eqShareEGP > 0) {
          const eqWallet = findWalletForParty(
            wallets,
            partnerEquip.ownerId,
            partnerEquip.personCustody?.personProfileId,
            partnerEquip.ownerName,
            'operator'
          );
          payouts.push({
            id: `po-${booking.id}-equip-auto`,
            partnerKey: 'equipment_owner:auto',
            partnerRole: 'equipment_owner',
            partyUserId: partnerEquip.ownerId,
            partyProfileId: partnerEquip.personCustody?.personProfileId || `prof-${partnerEquip.ownerId}`,
            partyName: equipUser?.name || partnerEquip.ownerName || 'صاحب المعدة',
            walletId: eqWallet?.id,
            amountEGP: eqShareEGP,
            amountEUR: roundMoney(eqShareEGP / rate),
            calculationNote: `حصة تشغيل المعدة «${partnerEquip.name}» (15%)`,
            status: 'credited'
          });
        }
      }
    }

    // 4. Fallback: Sales Delegate Commission if booking assigned to a delegate
    if (
      !usedRoles.has('delegate') &&
      ('delegateUserId' in booking && (booking.delegateUserId || booking.delegateName))
    ) {
      const delUser = users.find(
        (u) => u.id === booking.delegateUserId || u.roleKey === 'delegate'
      );
      const delShareEGP = roundMoney(paidNowEGP * 0.1);
      if (delShareEGP > 0) {
        const delWallet = findWalletForParty(
          wallets,
          delUser?.id || booking.delegateUserId || 'user-youssef-delegate',
          undefined,
          delUser?.name || booking.delegateName,
          'delegate'
        );
        payouts.push({
          id: `po-${booking.id}-delegate-auto`,
          partnerKey: 'delegate:auto',
          partnerRole: 'delegate',
          partyUserId: delUser?.id || booking.delegateUserId || 'user-youssef-delegate',
          partyProfileId: `prof-${delUser?.id || booking.delegateUserId || 'user-youssef-delegate'}`,
          partyName: delUser?.name || booking.delegateName || 'يوسف المنصور (مندوب مبيعات)',
          walletId: delWallet?.id,
          amountEGP: delShareEGP,
          amountEUR: roundMoney(delShareEGP / rate),
          calculationNote: 'عمولة مبيعات وحجز المندوب (10%)',
          status: 'credited'
        });
      }
    }
  }

  // Clamp partner payouts so total payouts + platformFee never exceed paidNowEGP
  const nonPlatformPayouts = payouts.filter((p) => p.partnerRole !== 'platform');
  const partnerSumEGP = nonPlatformPayouts.reduce((s, p) => s + p.amountEGP, 0);
  const availableAfterPlatformEGP = Math.max(0, paidNowEGP - platformFeeEGP);
  if (partnerSumEGP > availableAfterPlatformEGP && partnerSumEGP > 0) {
    const scaleFactor = availableAfterPlatformEGP / partnerSumEGP;
    nonPlatformPayouts.forEach((p) => {
      p.amountEGP = roundMoney(p.amountEGP * scaleFactor);
      p.amountEUR = roundMoney(p.amountEGP / rate);
    });
  }

  const finalPartnerSumEGP = payouts
    .filter((p) => p.partnerRole !== 'platform')
    .reduce((s, p) => s + p.amountEGP, 0);
  const ownerNetEGP = roundMoney(Math.max(0, paidNowEGP - platformFeeEGP - finalPartnerSumEGP));
  const ownerNetEUR = roundMoney(ownerNetEGP / rate);

  if (ownerNetEGP > 0) {
    const ownerWallet = findWalletForParty(
      wallets,
      ownerUserId,
      `prof-${ownerUserId}`,
      ownerName,
      'activity_owner'
    );
    payouts.push({
      id: `po-${booking.id}-owner`,
      partnerKey: 'activity_owner',
      partnerRole: 'activity_owner',
      partyUserId: ownerUserId,
      partyProfileId: `prof-${ownerUserId}`,
      partyName: ownerName,
      walletId: ownerWallet?.id,
      amountEGP: ownerNetEGP,
      amountEUR: ownerNetEUR,
      calculationNote: 'صافي عائد مالك النشاط بعد خصم عمولة المنصة وحصص الشركاء',
      status: 'credited'
    });
  }

  const refundedEGP = isEgp
    ? booking.refundAmountEGP || 0
    : roundMoney((booking.refundAmountEUR || 0) * rate);
  const refundedEUR = isEgp
    ? roundMoney((booking.refundAmountEGP || 0) / rate)
    : booking.refundAmountEUR || 0;

  let status: BookingFinancialAllocation['status'] = 'pending_payment';
  if (isCancelledOrRejected && refundedEGP > 0) {
    status = paidNowEGP > 0 ? 'partially_refunded' : 'refunded';
  } else if (paidNowEGP > 0) {
    status = 'posted';
  }

  const entityName =
    'activityName' in booking ? booking.activityName : booking.tripTitle;
  const entityId =
    'activityId' in booking && booking.activityId
      ? booking.activityId
      : activity?.id || booking.id;
  const tripDate =
    'tripDate' in booking ? booking.tripDate : booking.departureDate;

  return {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    bookingKind,
    entityId,
    entityName,
    tripDate,
    customerName: booking.customerName,
    currency,
    eurToEgpRate: rate,
    grossTotalEGP,
    grossTotalEUR,
    paidNowEGP,
    paidNowEUR,
    platformFeeEGP,
    platformFeeEUR,
    ownerUserId,
    ownerName,
    ownerNetEGP,
    ownerNetEUR,
    payouts,
    status,
    refundedEGP,
    refundedEUR,
    updatedAt: new Date().toISOString()
  };
}
