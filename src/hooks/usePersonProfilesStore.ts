import { useEffect, useMemo, useState } from 'react';
import { AppUser, SYSTEM_USERS } from '../types/auth';
import type { Activity } from '../types/activity';
import type { TripRecord } from '../types/trip';
import type { EquipmentItem } from '../types/equipment';
import type { LogisticsVehicle, LogisticsVehicleCategory } from '../types/logistics';
import type { PartnerRecord } from '../types/partner';
import type { RegisteredSupplierRecord } from '../types/supplierJournal';
import type { OperationalCostLineItem } from '../types/operationalCost';
import type { BookingFinancialAllocation } from '../types/finance';
import {
  type AssetPersonCustodyMeta,
  type BilateralLedgerEntry,
  type BilateralLedgerEntryType,
  type BilateralLedgerSourceType,
  type PersonProfile,
  type PersonProfileRole,
  normalizePhoneNumber
} from '../types/personProfile';
import {
  deleteBilateralLedgerEntryFromDb,
  loadBilateralLedgerFromDb,
  loadPersonProfilesFromDb,
  saveBilateralLedgerEntryToDb,
  savePersonProfileToDb
} from '../db/localPersonProfilesDb';
import {
  loadSubscribedUsersFromDb,
  saveSubscribedUserToDb
} from '../db/localSupplierJournalsDb';
import { saveActivityToDb } from '../db/localActivitiesDb';
import { saveTripToDb } from '../db/localTripsDb';
import type { LogAuditEventInput } from './useAuditLogStore';

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'م';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0] || ''}${parts[1][0] || ''}`;
}

export interface CreateOrUpdateProfileInput {
  id?: string;
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  tier?: string;
  roles: PersonProfileRole[];
  notes?: string;
}

export interface PhoneSignupClaimInput {
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  roles: PersonProfileRole[];
  tier?: string;
}

export interface CreateEquipmentForProfileInput {
  name: string;
  isQuadBuggy: boolean;
  classification?: string;
  serialOrRegistrationNo?: string;
  capacityOrUnitLabel?: string;
  ownershipType: 'owned' | 'rented' | 'partner_shared';
  dailyCostNote?: string;
}

export interface CreateVehicleForProfileInput {
  name: string;
  category: LogisticsVehicleCategory;
  plateOrCode: string;
  city: string;
  passengerCapacity: number;
  pricePerTripEGP: number;
  pricePerTripEUR: number;
}

export function usePersonProfilesStore(params: {
  currentUser: AppUser;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  trips: TripRecord[];
  setTrips: React.Dispatch<React.SetStateAction<TripRecord[]>>;
  equipments: EquipmentItem[];
  onCreateEquipment: (item: EquipmentItem) => void;
  onUpdateEquipment: (updated: EquipmentItem) => void;
  logisticsVehicles: LogisticsVehicle[];
  onCreateVehicle: (vehicle: LogisticsVehicle) => void;
  onUpdateVehicle: (updated: LogisticsVehicle) => void;
  partners: PartnerRecord[];
  registeredSuppliers: RegisteredSupplierRecord[];
  onAuditLog?: (input: LogAuditEventInput) => void;
}) {
  const {
    currentUser,
    activities,
    setActivities,
    trips,
    setTrips,
    equipments,
    onCreateEquipment,
    onUpdateEquipment,
    logisticsVehicles,
    onCreateVehicle,
    onUpdateVehicle,
    partners,
    registeredSuppliers,
    onAuditLog
  } = params;

  const [personProfiles, setPersonProfiles] = useState<PersonProfile[]>([]);
  const [bilateralLedger, setBilateralLedger] = useState<BilateralLedgerEntry[]>([]);
  const [subscribedUsers, setSubscribedUsers] = useState<AppUser[]>([]);
  const [hasLoadedProfiles, setHasLoadedProfiles] = useState(false);

  // Initial load from IndexedDB / localStorage
  useEffect(() => {
    let active = true;
    Promise.all([
      loadPersonProfilesFromDb(),
      loadBilateralLedgerFromDb(),
      loadSubscribedUsersFromDb()
    ])
      .then(async ([storedProfiles, storedLedger, storedUsers]) => {
        if (!active) return;

        const todayIso = new Date().toISOString().split('T')[0];
        let nextProfiles = [...storedProfiles];
        const existingIds = new Set(nextProfiles.map((p) => p.id));
        const existingLinkedUserIds = new Set(
          nextProfiles.map((p) => p.linkedUserId).filter(Boolean) as string[]
        );

        // Seed native SYSTEM_USERS profiles + field/sales partners if missing
        const defaultPartnerSeeds: Array<{
          id: string;
          name: string;
          companyName: string;
          phone: string;
          email: string;
          tier: string;
          roles: PersonProfileRole[];
          notes: string;
        }> = [
          ...SYSTEM_USERS.map((u) => ({
            id: u.id,
            name: u.name,
            companyName: u.companyName,
            phone: u.phone,
            email: u.email,
            tier: u.tier,
            roles: (u.roleKey === 'equipment_owner'
              ? ['platform_member', 'equipment_owner', 'activity_owner']
              : ['platform_member', 'activity_owner']) as PersonProfileRole[],
            notes: 'حساب مشترك أساسي بالمنصة'
          })),
          {
            id: 'user-karim-driver',
            name: 'كريم عبد العزيز',
            companyName: 'أسطول النقل السياحي',
            phone: '+201144556677',
            email: 'karim.driver@zanoza.com',
            tier: 'سائق نقل سياحي',
            roles: ['platform_member', 'driver_vehicle_owner'],
            notes: 'سائق توصيل سياحي معتمد'
          },
          {
            id: 'user-hassan-guide',
            name: 'حسن الشاذلي (مرشد سياحي)',
            companyName: 'فريق الإرشاد السياحي المعتمد',
            phone: '+201033445566',
            email: 'hassan.guide@zanoza.com',
            tier: 'مرشد ومرافق سياحي',
            roles: ['platform_member', 'crew_rep'],
            notes: 'مرشد سياحي معتمد للأنشطة والرحلات'
          },
          {
            id: 'user-youssef-delegate',
            name: 'يوسف المنصور (مندوب مبيعات)',
            companyName: 'شبكة مندوبي المبيعات والحجز',
            phone: '+201066778899',
            email: 'youssef.sales@zanoza.com',
            tier: 'مندوب مبيعات وعمولات',
            roles: ['platform_member', 'crew_rep'],
            notes: 'مندوب مبيعات وحجز ميداني'
          }
        ];

        for (const seedUser of defaultPartnerSeeds) {
          const profileId = `prof-${seedUser.id}`;
          if (!existingIds.has(profileId) && !existingLinkedUserIds.has(seedUser.id)) {
            const seeded: PersonProfile = {
              id: profileId,
              name: seedUser.name,
              companyName: seedUser.companyName,
              phone: seedUser.phone,
              email: seedUser.email,
              tier: seedUser.tier,
              roles: seedUser.roles,
              subscriptionStatus: 'native_member',
              linkedUserId: seedUser.id,
              addedByUserId: seedUser.id,
              addedByUserName: seedUser.name,
              addedByCompanyName: seedUser.companyName,
              notes: seedUser.notes,
              createdAt: todayIso,
              updatedAt: todayIso
            };
            await savePersonProfileToDb(seeded);
            nextProfiles.push(seeded);
            existingIds.add(profileId);
            existingLinkedUserIds.add(seedUser.id);
          }
        }

        if (!active) return;
        setPersonProfiles(nextProfiles);
        setBilateralLedger(
          [...storedLedger].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        );
        setSubscribedUsers(storedUsers);
        setHasLoadedProfiles(true);
      })
      .catch((err) => {
        console.error('Failed loading person profiles store:', err);
        if (active) setHasLoadedProfiles(true);
      });

    return () => {
      active = false;
    };
  }, []);

  // One-time incremental import of legacy partners & registeredSuppliers into unified personProfiles
  useEffect(() => {
    if (!hasLoadedProfiles) return;
    let active = true;

    const syncLegacyRecords = async () => {
      const todayIso = new Date().toISOString().split('T')[0];
      const byId = new Set(personProfiles.map((p) => p.id));
      const byPhone = new Set(
        personProfiles.map((p) => normalizePhoneNumber(p.phone)).filter(Boolean)
      );
      const newlyAdded: PersonProfile[] = [];

      for (const sup of registeredSuppliers) {
        const normPhone = normalizePhoneNumber(sup.phone);
        if (byId.has(sup.id) || (normPhone && byPhone.has(normPhone))) continue;
        const imported: PersonProfile = {
          id: sup.id,
          name: sup.name,
          companyName: sup.companyName,
          phone: sup.phone,
          tier: sup.tier || 'مورد خارجي',
          roles: ['activity_owner'],
          subscriptionStatus:
            sup.platformStatus === 'subscribed' ? 'subscribed_isolated' : 'external_pending',
          linkedUserId: sup.linkedPlatformUserId,
          addedByUserId: sup.addedByUserId === 'system' ? currentUser.id : sup.addedByUserId,
          addedByUserName:
            sup.addedByUserId === 'system' ? currentUser.name : sup.addedByUserName,
          createdAt: sup.createdAt || todayIso,
          updatedAt: todayIso
        };
        await savePersonProfileToDb(imported);
        newlyAdded.push(imported);
        byId.add(imported.id);
        if (normPhone) byPhone.add(normPhone);
      }

      for (const prt of partners) {
        const normPhone = normalizePhoneNumber(prt.phone);
        if (byId.has(prt.id) || (normPhone && byPhone.has(normPhone))) continue;
        const roles: PersonProfileRole[] =
          prt.partnerType === 'rental_supplier'
            ? ['equipment_owner']
            : ['equipment_owner', 'activity_owner'];
        const imported: PersonProfile = {
          id: prt.id,
          name: prt.name,
          companyName: prt.companyName,
          phone: prt.phone || '+201000000000',
          tier: prt.shareOrContractNote || 'شريك / مالك معدة',
          roles,
          subscriptionStatus: 'external_pending',
          addedByUserId: prt.ownerId === 'global' ? currentUser.id : prt.ownerId,
          addedByUserName: currentUser.name,
          notes: prt.notes || prt.shareOrContractNote,
          createdAt: prt.createdAt || todayIso,
          updatedAt: prt.updatedAt || todayIso
        };
        await savePersonProfileToDb(imported);
        newlyAdded.push(imported);
        byId.add(imported.id);
        if (normPhone) byPhone.add(normPhone);
      }

      if (active && newlyAdded.length > 0) {
        setPersonProfiles((prev) => {
          const prevIds = new Set(prev.map((p) => p.id));
          const uniqueNew = newlyAdded.filter((n) => !prevIds.has(n.id));
          return uniqueNew.length > 0 ? [...prev, ...uniqueNew] : prev;
        });
      }
    };

    if (registeredSuppliers.length > 0 || partners.length > 0) {
      void syncLegacyRecords();
    }

    return () => {
      active = false;
    };
  }, [hasLoadedProfiles, partners, registeredSuppliers]);

  // Combined subscribed users generated via phone-signup claims
  const allClaimedUsers = useMemo<AppUser[]>(() => {
    const map = new Map<string, AppUser>();
    SYSTEM_USERS.forEach((u) => map.set(u.id, u));
    subscribedUsers.forEach((u) => map.set(u.id, u));
    return Array.from(map.values());
  }, [subscribedUsers]);

  // Pending claims awaiting THIS currentUser's approval (original subscriber)
  const pendingClaimsForCurrentUser = useMemo(
    () =>
      personProfiles.filter(
        (p) =>
          p.subscriptionStatus === 'claim_requested' &&
          p.addedByUserId === currentUser.id &&
          Boolean(p.pendingClaim)
      ),
    [personProfiles, currentUser.id]
  );

  // Outgoing pending claims submitted by currentUser (waiting on original subscriber approval)
  const outgoingClaimsForCurrentUser = useMemo(
    () =>
      personProfiles.filter(
        (p) =>
          p.subscriptionStatus === 'claim_requested' &&
          p.pendingClaim?.requestedUserId === currentUser.id
      ),
    [personProfiles, currentUser.id]
  );

  const createOrUpdatePersonProfile = async (
    input: CreateOrUpdateProfileInput
  ): Promise<PersonProfile> => {
    const todayIso = new Date().toISOString().split('T')[0];
    const existing = input.id
      ? personProfiles.find((p) => p.id === input.id)
      : undefined;

    if (existing) {
      const updated: PersonProfile = {
        ...existing,
        name: input.name.trim(),
        companyName: input.companyName.trim() || existing.companyName,
        phone: input.phone.trim(),
        email: input.email?.trim() || existing.email,
        tier: input.tier?.trim() || existing.tier,
        roles: input.roles.length > 0 ? input.roles : existing.roles,
        notes: input.notes?.trim() ?? existing.notes,
        updatedAt: todayIso
      };
      await savePersonProfileToDb(updated);
      setPersonProfiles((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      onAuditLog?.({
        actor: currentUser,
        action: 'update',
        domain: 'partner',
        entityId: updated.id,
        entityName: updated.name,
        summary: `عدّل ${currentUser.name} بيانات الملف الشخصي لـ «${updated.name}»`
      });
      return updated;
    }

    const cleanPhone = normalizePhoneNumber(input.phone);
    const matchedUser = allClaimedUsers.find(
      (u) => cleanPhone && normalizePhoneNumber(u.phone) === cleanPhone
    );

    const created: PersonProfile = {
      id: input.id || `prof-${Date.now().toString().slice(-6)}`,
      name: input.name.trim(),
      companyName: input.companyName.trim() || 'حساب شخصي / مورد',
      phone: input.phone.trim(),
      email: input.email?.trim(),
      tier: input.tier?.trim() || 'شريك / مورد مسجل',
      roles: input.roles.length > 0 ? input.roles : ['activity_owner'],
      subscriptionStatus: matchedUser ? 'claim_requested' : 'external_pending',
      addedByUserId: currentUser.id,
      addedByUserName: currentUser.name,
      addedByCompanyName: currentUser.companyName,
      pendingClaim: matchedUser
        ? {
            requestedUserId: matchedUser.id,
            requestedUserName: matchedUser.name,
            requestedCompany: matchedUser.companyName,
            requestedPhone: matchedUser.phone,
            requestedAt: new Date().toISOString(),
            message: `تم رصد تطابق رقم الهاتف (${input.phone}) مع المشترك «${matchedUser.name}» بالمنصة.`
          }
        : undefined,
      notes: input.notes?.trim(),
      createdAt: todayIso,
      updatedAt: todayIso
    };

    await savePersonProfileToDb(created);
    setPersonProfiles((prev) => [created, ...prev]);
    onAuditLog?.({
      actor: currentUser,
      action: 'create',
      domain: 'partner',
      entityId: created.id,
      entityName: created.name,
      summary: `أنشأ ${currentUser.name} ملفاً شخصياً لـ «${created.name}» (${created.phone})`
    });
    return created;
  };

  /**
   * Simulates / executes a new person signing up on the platform with their phone number.
   * Matches any existing `external_pending` profile by phone and sends a verification message
   * (`claim_requested`) to the original subscriber (`addedByUserId`) rather than auto-isolating!
   */
  const requestPlatformSignupAndMatchPhone = async (
    input: PhoneSignupClaimInput
  ): Promise<{
    outcome: 'claim_requested' | 'new_member' | 'already_subscribed';
    profile: PersonProfile;
    user: AppUser;
  }> => {
    const cleanPhone = normalizePhoneNumber(input.phone);
    const nowIso = new Date().toISOString();
    const todayIso = nowIso.split('T')[0];

    // Check if an AppUser with this phone already exists
    let platformUser = allClaimedUsers.find(
      (u) => cleanPhone && normalizePhoneNumber(u.phone) === cleanPhone
    );

    if (!platformUser) {
      const safeSlug = (cleanPhone || Date.now().toString()).replace(/[^a-zA-Z0-9]/g, '');
      platformUser = {
        id: `user-phone-${safeSlug}-${Date.now().toString().slice(-4)}`,
        name: input.name.trim(),
        email: input.email?.trim() || `${safeSlug}@zanoza.com`,
        companyName: input.companyName.trim() || `${input.name.trim()} للأنشطة والنقل`,
        phone: input.phone.trim(),
        role: 'مشترك بالمنصة (تم التحقق بالهاتف)',
        tier: input.tier?.trim() || 'باقة الشركاء المعتمدين',
        avatarColor: 'bg-cyan-600',
        initials: buildInitials(input.name),
        avatarInitials: buildInitials(input.name)
      };
      await saveSubscribedUserToDb(platformUser);
      setSubscribedUsers((prev) =>
        prev.some((u) => u.id === platformUser!.id) ? prev : [...prev, platformUser!]
      );
    }

    // Look for an existing profile matching this normalized phone
    const matchedProfile = personProfiles.find(
      (p) => cleanPhone && normalizePhoneNumber(p.phone) === cleanPhone
    );

    if (matchedProfile) {
      if (
        matchedProfile.subscriptionStatus === 'subscribed_isolated' ||
        matchedProfile.subscriptionStatus === 'native_member'
      ) {
        return {
          outcome: 'already_subscribed',
          profile: matchedProfile,
          user: platformUser
        };
      }

      const updatedProfile: PersonProfile = {
        ...matchedProfile,
        roles:
          input.roles.length > 0
            ? Array.from(new Set([...matchedProfile.roles, ...input.roles]))
            : matchedProfile.roles,
        subscriptionStatus: 'claim_requested',
        pendingClaim: {
          requestedUserId: platformUser.id,
          requestedUserName: platformUser.name,
          requestedCompany: platformUser.companyName,
          requestedPhone: platformUser.phone,
          requestedAt: nowIso,
          message: `قام «${platformUser.name}» بالاشتراك في المنصة برقم الهاتف المطابق (${platformUser.phone}). يرجى التأكد والموافقة لعزل وحدات التحكم (البيانات، الأسعار، الأنشطة، المعدات، والسيارات) مع الإبقاء على كشف الحساب المشترك «ما له وما عليه».`
        },
        updatedAt: todayIso
      };
      await savePersonProfileToDb(updatedProfile);
      setPersonProfiles((prev) =>
        prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
      );

      // Mark linked assets as claim_requested (original subscriber still retains control until approval)
      for (const act of activities) {
        const matchesAct =
          act.supplierCustody?.supplierId === matchedProfile.id ||
          act.owner?.id === matchedProfile.id ||
          (cleanPhone && normalizePhoneNumber(act.owner?.phone) === cleanPhone);
        if (matchesAct) {
          const nextAct: Activity = {
            ...act,
            supplierCustody: {
              isExternalSupplier: true,
              supplierId: matchedProfile.id,
              supplierStatus: 'claim_requested',
              addedByUserId: act.supplierCustody?.addedByUserId || matchedProfile.addedByUserId,
              addedByUserName:
                act.supplierCustody?.addedByUserName || matchedProfile.addedByUserName,
              addedByCompanyName: act.supplierCustody?.addedByCompanyName,
              claimedUserId: platformUser.id
            }
          };
          await saveActivityToDb(nextAct);
          setActivities((prev) => prev.map((a) => (a.id === nextAct.id ? nextAct : a)));
        }
      }

      for (const tr of trips) {
        const matchesTrip =
          tr.supplierCustody?.supplierId === matchedProfile.id ||
          tr.owner?.id === matchedProfile.id ||
          (cleanPhone && normalizePhoneNumber(tr.owner?.phone) === cleanPhone);
        if (matchesTrip) {
          const nextTrip: TripRecord = {
            ...tr,
            supplierCustody: {
              isExternalSupplier: true,
              supplierId: matchedProfile.id,
              supplierStatus: 'claim_requested',
              addedByUserId: tr.supplierCustody?.addedByUserId || matchedProfile.addedByUserId,
              addedByUserName:
                tr.supplierCustody?.addedByUserName || matchedProfile.addedByUserName,
              addedByCompanyName: tr.supplierCustody?.addedByCompanyName,
              claimedUserId: platformUser.id
            }
          };
          await saveTripToDb(nextTrip);
          setTrips((prev) => prev.map((t) => (t.id === nextTrip.id ? nextTrip : t)));
        }
      }

      equipments.forEach((eq) => {
        if (
          eq.personCustody?.personProfileId === matchedProfile.id ||
          eq.partnerId === matchedProfile.id
        ) {
          onUpdateEquipment({
            ...eq,
            personCustody: {
              personProfileId: matchedProfile.id,
              personName: matchedProfile.name,
              personStatus: 'claim_requested',
              addedByUserId: eq.personCustody?.addedByUserId || matchedProfile.addedByUserId,
              addedByUserName:
                eq.personCustody?.addedByUserName || matchedProfile.addedByUserName,
              claimedUserId: platformUser.id
            }
          });
        }
      });

      logisticsVehicles.forEach((veh) => {
        const matchesVeh =
          veh.personCustody?.personProfileId === matchedProfile.id ||
          veh.partnerId === matchedProfile.id ||
          (cleanPhone && normalizePhoneNumber(veh.driverPhone) === cleanPhone);
        if (matchesVeh) {
          onUpdateVehicle({
            ...veh,
            personCustody: {
              personProfileId: matchedProfile.id,
              personName: matchedProfile.name,
              personStatus: 'claim_requested',
              addedByUserId: veh.personCustody?.addedByUserId || matchedProfile.addedByUserId,
              addedByUserName:
                veh.personCustody?.addedByUserName || matchedProfile.addedByUserName,
              claimedUserId: platformUser.id
            }
          });
        }
      });

      onAuditLog?.({
        actor: platformUser,
        action: 'create',
        domain: 'partner',
        entityId: updatedProfile.id,
        entityName: updatedProfile.name,
        summary: `طابق النظام رقم هاتف «${platformUser.name}» (${platformUser.phone}) وأرسل إشعار تحقق إلى «${matchedProfile.addedByUserName}» لاعتماد عزل وحدات التحكم`
      });

      return {
        outcome: 'claim_requested',
        profile: updatedProfile,
        user: platformUser
      };
    }

    // No pre-existing pending profile found -> create clean native_member profile
    const newProfile: PersonProfile = {
      id: `prof-${platformUser.id}`,
      name: platformUser.name,
      companyName: platformUser.companyName,
      phone: platformUser.phone,
      email: platformUser.email,
      tier: platformUser.tier,
      roles: input.roles.length > 0 ? input.roles : ['platform_member'],
      subscriptionStatus: 'native_member',
      linkedUserId: platformUser.id,
      addedByUserId: platformUser.id,
      addedByUserName: platformUser.name,
      addedByCompanyName: platformUser.companyName,
      notes: 'انضم مباشرة إلى المنصة عبر التسجيل برقم الهاتف',
      createdAt: todayIso,
      updatedAt: todayIso
    };
    await savePersonProfileToDb(newProfile);
    setPersonProfiles((prev) => [newProfile, ...prev]);

    onAuditLog?.({
      actor: platformUser,
      action: 'create',
      domain: 'partner',
      entityId: newProfile.id,
      entityName: newProfile.name,
      summary: `اشترك «${platformUser.name}» بالمنصة برقم الهاتف ${platformUser.phone} وأنشأ ملفه الشخصي`
    });

    return {
      outcome: 'new_member',
      profile: newProfile,
      user: platformUser
    };
  };

  /**
   * Approved by the original subscriber (`addedByUserId`):
   * 1. Isolates control units (edit, delete, pricing, activities, trips, equipment/quads, vehicles) to the new subscriber.
   * 2. NEVER separates bilateral financial operations («ما له وما عليه») — stamps `claimedUserId` on all ledger entries so both accounts share the live ledger!
   */
  const approveClaimAndIsolateControls = async (profileId: string): Promise<{
    profile: PersonProfile;
    user: AppUser;
    isolatedCounts: {
      activities: number;
      trips: number;
      equipments: number;
      vehicles: number;
      sharedLedgerEntries: number;
    };
  } | null> => {
    const target = personProfiles.find((p) => p.id === profileId);
    if (!target || !target.pendingClaim) return null;

    const claim = target.pendingClaim;
    const nowIso = new Date().toISOString();
    const todayIso = nowIso.split('T')[0];

    let platformUser = allClaimedUsers.find((u) => u.id === claim.requestedUserId);
    if (!platformUser) {
      platformUser = {
        id: claim.requestedUserId,
        name: claim.requestedUserName,
        email: target.email || `${claim.requestedUserId}@zanoza.com`,
        companyName: claim.requestedCompany || target.companyName,
        phone: claim.requestedPhone || target.phone,
        role: 'مشترك بالمنصة (تم اعتماد عزل التحكم)',
        tier: target.tier || 'باقة الشركاء المعتمدين',
        avatarColor: 'bg-cyan-600',
        initials: buildInitials(claim.requestedUserName),
        avatarInitials: buildInitials(claim.requestedUserName)
      };
      await saveSubscribedUserToDb(platformUser);
      setSubscribedUsers((prev) =>
        prev.some((u) => u.id === platformUser!.id) ? prev : [...prev, platformUser!]
      );
    }

    const updatedProfile: PersonProfile = {
      ...target,
      name: claim.requestedUserName || target.name,
      companyName: claim.requestedCompany || target.companyName,
      phone: claim.requestedPhone || target.phone,
      subscriptionStatus: 'subscribed_isolated',
      linkedUserId: platformUser.id,
      approvedByOriginalAt: nowIso,
      pendingClaim: undefined,
      updatedAt: todayIso
    };
    await savePersonProfileToDb(updatedProfile);
    setPersonProfiles((prev) =>
      prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
    );

    const cleanPhone = normalizePhoneNumber(target.phone);

    // 1. Isolate Activities
    let isolatedActivitiesCount = 0;
    const nextActivities: Activity[] = [];
    for (const act of activities) {
      const matchesAct =
        act.supplierCustody?.supplierId === target.id ||
        act.owner?.id === target.id ||
        (cleanPhone && normalizePhoneNumber(act.owner?.phone) === cleanPhone);
      if (matchesAct) {
        isolatedActivitiesCount++;
        const migrated: Activity = {
          ...act,
          owner: {
            id: platformUser.id,
            name: platformUser.name,
            companyName: platformUser.companyName,
            phone: platformUser.phone,
            tier: platformUser.tier
          },
          supplierCustody: {
            isExternalSupplier: true,
            supplierId: updatedProfile.id,
            supplierStatus: 'subscribed',
            addedByUserId: act.supplierCustody?.addedByUserId || target.addedByUserId,
            addedByUserName: act.supplierCustody?.addedByUserName || target.addedByUserName,
            addedByCompanyName: act.supplierCustody?.addedByCompanyName || target.addedByCompanyName,
            claimedUserId: platformUser.id,
            claimedAt: nowIso
          }
        };
        await saveActivityToDb(migrated);
        nextActivities.push(migrated);
      } else {
        nextActivities.push(act);
      }
    }
    if (isolatedActivitiesCount > 0) setActivities(nextActivities);

    // 2. Isolate Trips
    let isolatedTripsCount = 0;
    const nextTrips: TripRecord[] = [];
    for (const tr of trips) {
      const matchesTrip =
        tr.supplierCustody?.supplierId === target.id ||
        tr.owner?.id === target.id ||
        (cleanPhone && normalizePhoneNumber(tr.owner?.phone) === cleanPhone);
      if (matchesTrip) {
        isolatedTripsCount++;
        const migrated: TripRecord = {
          ...tr,
          owner: {
            id: platformUser.id,
            name: platformUser.name,
            companyName: platformUser.companyName,
            phone: platformUser.phone,
            tier: platformUser.tier
          },
          supplierCustody: {
            isExternalSupplier: true,
            supplierId: updatedProfile.id,
            supplierStatus: 'subscribed',
            addedByUserId: tr.supplierCustody?.addedByUserId || target.addedByUserId,
            addedByUserName: tr.supplierCustody?.addedByUserName || target.addedByUserName,
            addedByCompanyName: tr.supplierCustody?.addedByCompanyName || target.addedByCompanyName,
            claimedUserId: platformUser.id,
            claimedAt: nowIso
          }
        };
        await saveTripToDb(migrated);
        nextTrips.push(migrated);
      } else {
        nextTrips.push(tr);
      }
    }
    if (isolatedTripsCount > 0) setTrips(nextTrips);

    // 3. Isolate Equipments & Batch Buggies
    let isolatedEquipmentsCount = 0;
    equipments.forEach((eq) => {
      const matchesEq =
        eq.personCustody?.personProfileId === target.id ||
        eq.partnerId === target.id ||
        eq.ownerId === target.id;
      if (matchesEq) {
        isolatedEquipmentsCount++;
        const isolatedCustody: AssetPersonCustodyMeta = {
          personProfileId: updatedProfile.id,
          personName: updatedProfile.name,
          personStatus: 'subscribed_isolated',
          addedByUserId: eq.personCustody?.addedByUserId || target.addedByUserId,
          addedByUserName: eq.personCustody?.addedByUserName || target.addedByUserName,
          claimedUserId: platformUser.id,
          claimedAt: nowIso
        };
        onUpdateEquipment({
          ...eq,
          ownerId: platformUser.id,
          ownerName: platformUser.name,
          ownerCompanyName: platformUser.companyName,
          personCustody: isolatedCustody,
          updatedAt: todayIso
        });
      }
    });

    // 4. Isolate Logistics Vehicles
    let isolatedVehiclesCount = 0;
    logisticsVehicles.forEach((veh) => {
      const matchesVeh =
        veh.personCustody?.personProfileId === target.id ||
        veh.partnerId === target.id ||
        (cleanPhone && normalizePhoneNumber(veh.driverPhone) === cleanPhone);
      if (matchesVeh) {
        isolatedVehiclesCount++;
        const isolatedCustody: AssetPersonCustodyMeta = {
          personProfileId: updatedProfile.id,
          personName: updatedProfile.name,
          personStatus: 'subscribed_isolated',
          addedByUserId: veh.personCustody?.addedByUserId || target.addedByUserId,
          addedByUserName: veh.personCustody?.addedByUserName || target.addedByUserName,
          claimedUserId: platformUser.id,
          claimedAt: nowIso
        };
        onUpdateVehicle({
          ...veh,
          ownerId: platformUser.id,
          ownerName: platformUser.name,
          ownerCompanyName: platformUser.companyName,
          personCustody: isolatedCustody,
          updatedAt: todayIso
        });
      }
    });

    // 5. PRESERVE & SHARE Bilateral Ledger («ما له وما عليه») between original subscriber and new subscriber
    let sharedLedgerEntriesCount = 0;
    const updatedLedger: BilateralLedgerEntry[] = [];
    for (const entry of bilateralLedger) {
      if (entry.profileId === updatedProfile.id) {
        sharedLedgerEntriesCount++;
        const linked: BilateralLedgerEntry = {
          ...entry,
          claimedUserId: platformUser.id,
          profileName: updatedProfile.name,
          profilePhone: updatedProfile.phone
        };
        await saveBilateralLedgerEntryToDb(linked);
        updatedLedger.push(linked);
      } else {
        updatedLedger.push(entry);
      }
    }
    setBilateralLedger(updatedLedger);

    onAuditLog?.({
      actor: currentUser,
      action: 'approve',
      domain: 'partner',
      entityId: updatedProfile.id,
      entityName: updatedProfile.name,
      summary: `وافق ${currentUser.name} على مطابقة وعزل وحدات التحكم للمشترك الجديد «${updatedProfile.name}» مع الإبقاء على كشف الحساب المشترك «ما له وما عليه»`,
      details: `أنشطة معزولة: ${isolatedActivitiesCount} · رحلات: ${isolatedTripsCount} · معدات وباتش باجي: ${isolatedEquipmentsCount} · سيارات: ${isolatedVehiclesCount} · قيود حساب مشترك: ${sharedLedgerEntriesCount}`
    });

    return {
      profile: updatedProfile,
      user: platformUser,
      isolatedCounts: {
        activities: isolatedActivitiesCount,
        trips: isolatedTripsCount,
        equipments: isolatedEquipmentsCount,
        vehicles: isolatedVehiclesCount,
        sharedLedgerEntries: sharedLedgerEntriesCount
      }
    };
  };

  const rejectClaimRequest = async (profileId: string): Promise<void> => {
    const target = personProfiles.find((p) => p.id === profileId);
    if (!target) return;
    const todayIso = new Date().toISOString().split('T')[0];

    const reverted: PersonProfile = {
      ...target,
      subscriptionStatus: 'external_pending',
      pendingClaim: undefined,
      updatedAt: todayIso
    };
    await savePersonProfileToDb(reverted);
    setPersonProfiles((prev) =>
      prev.map((p) => (p.id === reverted.id ? reverted : p))
    );

    // Revert asset custody flags from claim_requested to external_pending
    for (const act of activities) {
      if (act.supplierCustody?.supplierId === target.id && act.supplierCustody.supplierStatus === 'claim_requested') {
        const nextAct: Activity = {
          ...act,
          supplierCustody: {
            ...act.supplierCustody,
            supplierStatus: 'pending_signup',
            claimedUserId: undefined
          }
        };
        await saveActivityToDb(nextAct);
        setActivities((prev) => prev.map((a) => (a.id === nextAct.id ? nextAct : a)));
      }
    }

    for (const tr of trips) {
      if (tr.supplierCustody?.supplierId === target.id && tr.supplierCustody.supplierStatus === 'claim_requested') {
        const nextTrip: TripRecord = {
          ...tr,
          supplierCustody: {
            ...tr.supplierCustody,
            supplierStatus: 'pending_signup',
            claimedUserId: undefined
          }
        };
        await saveTripToDb(nextTrip);
        setTrips((prev) => prev.map((t) => (t.id === nextTrip.id ? nextTrip : t)));
      }
    }

    equipments.forEach((eq) => {
      if (eq.personCustody?.personProfileId === target.id && eq.personCustody.personStatus === 'claim_requested') {
        onUpdateEquipment({
          ...eq,
          personCustody: {
            ...eq.personCustody,
            personStatus: 'external_pending',
            claimedUserId: undefined
          }
        });
      }
    });

    logisticsVehicles.forEach((veh) => {
      if (veh.personCustody?.personProfileId === target.id && veh.personCustody.personStatus === 'claim_requested') {
        onUpdateVehicle({
          ...veh,
          personCustody: {
            ...veh.personCustody,
            personStatus: 'external_pending',
            claimedUserId: undefined
          }
        });
      }
    });

    onAuditLog?.({
      actor: currentUser,
      action: 'reject',
      domain: 'partner',
      entityId: target.id,
      entityName: target.name,
      summary: `رفض ${currentUser.name} طلب ربط وعزل ملف «${target.name}» لعدم التطابق`
    });
  };

  /**
   * Automatically posts / updates bilateral ledger payable ("له") entries
   * whenever an operational cost profile is saved with items assigned to a PersonProfile.
   */
  const syncOperationalCostItemsToLedger = async (input: {
    entityId: string;
    entityName: string;
    computedItems: Array<{ item: OperationalCostLineItem; impactEGP: number }>;
  }): Promise<number> => {
    const nowIso = new Date().toISOString();
    const todayIso = nowIso.split('T')[0];
    let syncedCount = 0;

    let nextLedger = [...bilateralLedger];
    const itemsWithAssignee = input.computedItems.filter(
      ({ item, impactEGP }) => Boolean(item.assignedProfileId) && impactEGP > 0
    );

    for (const { item, impactEGP } of itemsWithAssignee) {
      const profile = personProfiles.find((p) => p.id === item.assignedProfileId);
      if (!profile) continue;

      const sourceId = `${input.entityId}:${item.id}`;
      const existing = nextLedger.find(
        (e) => e.sourceType === 'operational_cost' && e.sourceId === sourceId && e.profileId === profile.id
      );

      const counterpartyUserId =
        profile.addedByUserId && profile.addedByUserId !== profile.linkedUserId
          ? profile.addedByUserId
          : currentUser.id;
      const counterpartyUserName =
        profile.addedByUserId && profile.addedByUserId !== profile.linkedUserId
          ? profile.addedByUserName
          : currentUser.name;

      const entry: BilateralLedgerEntry = {
        id: existing?.id || `bl-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
        profileId: profile.id,
        profileName: profile.name,
        profilePhone: profile.phone,
        counterpartyUserId,
        counterpartyUserName,
        claimedUserId: profile.linkedUserId,
        entryType: 'credit_payable_to_person',
        sourceType: 'operational_cost',
        sourceId,
        entityId: input.entityId,
        entityName: input.entityName,
        amountEGP: Math.round(impactEGP),
        currency: item.currency,
        originalAmount: item.unitAmount * (item.quantity || 1),
        date: existing?.date || todayIso,
        notes: item.title || item.notes || 'مستحق تشغيلي محول من التكلفة التشغيلية',
        recordedByUserId: currentUser.id,
        recordedByUserName: currentUser.name,
        createdAt: existing?.createdAt || nowIso
      };

      await saveBilateralLedgerEntryToDb(entry);
      if (existing) {
        nextLedger = nextLedger.map((e) => (e.id === entry.id ? entry : e));
      } else {
        nextLedger = [entry, ...nextLedger];
      }
      syncedCount++;
    }

    if (syncedCount > 0) {
      setBilateralLedger(nextLedger);
    }
    return syncedCount;
  };

  const addManualBilateralLedgerEntry = async (input: {
    profile: PersonProfile;
    entryType: BilateralLedgerEntryType;
    sourceType: BilateralLedgerSourceType;
    amountEGP: number;
    currency: 'EGP' | 'EUR';
    originalAmount: number;
    entityName?: string;
    date?: string;
    notes?: string;
  }): Promise<BilateralLedgerEntry> => {
    const nowIso = new Date().toISOString();
    const todayIso = nowIso.split('T')[0];

    const counterpartyUserId =
      input.profile.addedByUserId && input.profile.addedByUserId !== input.profile.linkedUserId
        ? input.profile.addedByUserId
        : currentUser.id;
    const counterpartyUserName =
      input.profile.addedByUserId && input.profile.addedByUserId !== input.profile.linkedUserId
        ? input.profile.addedByUserName
        : currentUser.name;

    const entry: BilateralLedgerEntry = {
      id: `bl-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
      profileId: input.profile.id,
      profileName: input.profile.name,
      profilePhone: input.profile.phone,
      counterpartyUserId,
      counterpartyUserName,
      claimedUserId: input.profile.linkedUserId,
      entryType: input.entryType,
      sourceType: input.sourceType,
      entityName: input.entityName?.trim() || undefined,
      amountEGP: Math.round(Math.max(0, input.amountEGP)),
      currency: input.currency,
      originalAmount: Math.max(0, input.originalAmount),
      date: input.date || todayIso,
      notes: input.notes?.trim() || undefined,
      recordedByUserId: currentUser.id,
      recordedByUserName: currentUser.name,
      createdAt: nowIso
    };

    await saveBilateralLedgerEntryToDb(entry);
    setBilateralLedger((prev) => [entry, ...prev]);

    onAuditLog?.({
      actor: currentUser,
      action: 'create',
      domain: 'finance',
      entityId: entry.id,
      entityName: input.profile.name,
      summary: `سجّل ${currentUser.name} حركة مالية (${
        input.entryType === 'debit_paid_to_person' ? 'سداد عليه' : 'مستحق له'
      }) بقيمة ${entry.amountEGP} ج.م في كشف حساب «${input.profile.name}»`
    });

    return entry;
  };

  const deleteBilateralLedgerEntry = async (entryId: string): Promise<void> => {
    await deleteBilateralLedgerEntryFromDb(entryId);
    setBilateralLedger((prev) => prev.filter((e) => e.id !== entryId));
  };

  /**
   * Idempotently posts/updates partner bilateral ledger entries («ما له وما عليه»)
   * from a computed BookingFinancialAllocation.
   */
  const syncBookingPartnerLedgerEntries = async (
    allocation: BookingFinancialAllocation
  ): Promise<void> => {
    const nowIso = new Date().toISOString();
    const todayIso = nowIso.split('T')[0];
    let nextLedger = [...bilateralLedger];
    let changed = false;

    const partnerPayouts = allocation.payouts.filter(
      (p) => p.partnerRole !== 'platform' && p.partnerRole !== 'activity_owner'
    );

    // Match existing entries for this booking
    const bookingPrefix = `booking:${allocation.bookingId}:`;
    const activeSourceIds = new Set(
      partnerPayouts.map((p) => `${bookingPrefix}${p.partnerKey}`)
    );

    // If a payout shrank to 0 (e.g., full refund), mark existing booking_payout entries as reversed/0
    for (const existingEntry of nextLedger) {
      if (
        existingEntry.sourceType === 'booking_payout' &&
        existingEntry.sourceId?.startsWith(bookingPrefix) &&
        !activeSourceIds.has(existingEntry.sourceId) &&
        existingEntry.amountEGP > 0
      ) {
        const zeroed: BilateralLedgerEntry = {
          ...existingEntry,
          amountEGP: 0,
          originalAmount: 0,
          notes: `${existingEntry.notes || 'مستحق حجز'} — تم التراجع بعد الاسترداد/الإلغاء`
        };
        await saveBilateralLedgerEntryToDb(zeroed);
        nextLedger = nextLedger.map((e) => (e.id === zeroed.id ? zeroed : e));
        changed = true;
      }
    }

    for (const payout of partnerPayouts) {
      const sourceId = `${bookingPrefix}${payout.partnerKey}`;
      const matchedProfile = personProfiles.find(
        (pr) =>
          (payout.partyProfileId && pr.id === payout.partyProfileId) ||
          (payout.partyUserId && (pr.linkedUserId === payout.partyUserId || pr.id === `prof-${payout.partyUserId}`)) ||
          pr.name.trim() === payout.partyName.trim()
      );
      if (!matchedProfile) continue;

      const existing = nextLedger.find(
        (e) => e.sourceType === 'booking_payout' && e.sourceId === sourceId
      );

      const entry: BilateralLedgerEntry = {
        id:
          existing?.id ||
          `bl-bk-${allocation.bookingId}-${payout.partnerKey.replace(/[^a-zA-Z0-9_-]/g, '')}`,
        profileId: matchedProfile.id,
        profileName: matchedProfile.name,
        profilePhone: matchedProfile.phone,
        counterpartyUserId: allocation.ownerUserId || currentUser.id,
        counterpartyUserName: allocation.ownerName || currentUser.name,
        claimedUserId: matchedProfile.linkedUserId || payout.partyUserId,
        entryType: 'credit_payable_to_person',
        sourceType: 'booking_payout',
        sourceId,
        entityId: allocation.entityId,
        entityName: `${allocation.entityName} (#${allocation.bookingCode})`,
        amountEGP: Math.round(payout.amountEGP),
        currency: allocation.currency,
        originalAmount:
          allocation.currency === 'EUR' ? payout.amountEUR : Math.round(payout.amountEGP),
        date: existing?.date || todayIso,
        notes: `${payout.calculationNote} — حجز #${allocation.bookingCode}`,
        recordedByUserId: currentUser.id,
        recordedByUserName: currentUser.name,
        createdAt: existing?.createdAt || nowIso
      };

      if (
        !existing ||
        existing.amountEGP !== entry.amountEGP ||
        existing.notes !== entry.notes
      ) {
        await saveBilateralLedgerEntryToDb(entry);
        if (existing) {
          nextLedger = nextLedger.map((e) => (e.id === entry.id ? entry : e));
        } else {
          nextLedger = [entry, ...nextLedger];
        }
        changed = true;
      }
    }

    if (changed) {
      setBilateralLedger(nextLedger);
    }
  };

  const reverseBookingPartnerLedgerEntries = async (
    bookingId: string,
    reason: string
  ): Promise<void> => {
    const bookingPrefix = `booking:${bookingId}:`;
    let nextLedger = [...bilateralLedger];
    let changed = false;
    for (const entry of nextLedger) {
      if (
        entry.sourceType === 'booking_payout' &&
        entry.sourceId?.startsWith(bookingPrefix) &&
        entry.amountEGP > 0
      ) {
        const updated: BilateralLedgerEntry = {
          ...entry,
          amountEGP: 0,
          originalAmount: 0,
          notes: `تم رد المستحق بسبب الإلغاء (${reason})`
        };
        await saveBilateralLedgerEntryToDb(updated);
        nextLedger = nextLedger.map((e) => (e.id === updated.id ? updated : e));
        changed = true;
      }
    }
    if (changed) {
      setBilateralLedger(nextLedger);
    }
  };

  /**
   * Quick action inside a PersonProfile to create either standard equipment or a Batch Buggy (Quad).
   */
  const createEquipmentForProfile = (
    profile: PersonProfile,
    draft: CreateEquipmentForProfileInput
  ): EquipmentItem => {
    const today = new Date().toISOString().split('T')[0];
    const isIsolated =
      profile.subscriptionStatus === 'subscribed_isolated' ||
      profile.subscriptionStatus === 'native_member';
    const targetOwnerId =
      isIsolated && profile.linkedUserId ? profile.linkedUserId : currentUser.id;
    const targetOwnerName =
      isIsolated && profile.linkedUserId ? profile.name : currentUser.name;
    const targetOwnerCompany =
      isIsolated && profile.linkedUserId ? profile.companyName : currentUser.companyName;

    const eq: EquipmentItem = {
      id: `EQ-${draft.isQuadBuggy ? 'QUAD-' : ''}${Date.now().toString().slice(-4)}`,
      ownerId: targetOwnerId,
      ownerName: targetOwnerName,
      ownerCompanyName: targetOwnerCompany,
      name: draft.name.trim(),
      typeId: draft.isQuadBuggy ? 'eqt-safari_vehicle' : 'eqt-yacht',
      linkedCategoryIds: draft.isQuadBuggy ? ['cat-safari-quad'] : ['cat-marine'],
      classification:
        draft.classification?.trim() ||
        (draft.isQuadBuggy ? 'باتش باجي / كواد سفاري' : 'معدة تشغيلية مخصصة'),
      description: draft.dailyCostNote?.trim() || `${draft.name.trim()} — تابعة لـ ${profile.name}`,
      translations: {
        en: {
          name: draft.name.trim(),
          description: draft.dailyCostNote?.trim() || ''
        }
      },
      media: [
        {
          id: `eq-med-${Date.now()}`,
          url: '/src/assets/images/zanoza_yacht_hurghada_1794046061468.jpg',
          title: 'الصورة الرئيسية',
          type: 'image',
          isCover: true,
          isPublicForClient: true
        }
      ],
      operationalData: {
        serialOrRegistrationNo: draft.serialOrRegistrationNo?.trim() || '',
        modelYear: String(new Date().getFullYear()),
        capacityOrUnitLabel: draft.capacityOrUnitLabel?.trim() || (draft.isQuadBuggy ? '2 راكب' : ''),
        maintenanceStatus: 'ready',
        lastInspectionDate: today,
        internalNotes: draft.dailyCostNote?.trim() || ''
      },
      status: 'available',
      ownershipType: draft.ownershipType,
      partnerId: profile.id,
      partnerName: profile.name,
      partnerCompanyName: profile.companyName,
      ownershipDetails: `${
        draft.isQuadBuggy ? 'باتش باجي' : 'معدة'
      } تابعة للملف الشخصي: ${profile.name} — ${profile.companyName}`,
      personCustody: {
        personProfileId: profile.id,
        personName: profile.name,
        personStatus: isIsolated ? 'subscribed_isolated' : 'external_pending',
        addedByUserId: profile.addedByUserId || currentUser.id,
        addedByUserName: profile.addedByUserName || currentUser.name,
        claimedUserId: isIsolated ? profile.linkedUserId : undefined,
        claimedAt: isIsolated ? new Date().toISOString() : undefined
      },
      dynamicSpecs: [],
      extraData: [],
      showToClientDefault: true,
      createdAt: today,
      updatedAt: today
    };

    onCreateEquipment(eq);
    return eq;
  };

  /**
   * Quick action inside a PersonProfile to create a LogisticsVehicle (سيارة / وسيلة نقل).
   */
  const createVehicleForProfile = (
    profile: PersonProfile,
    draft: CreateVehicleForProfileInput
  ): LogisticsVehicle => {
    const today = new Date().toISOString().split('T')[0];
    const isIsolated =
      profile.subscriptionStatus === 'subscribed_isolated' ||
      profile.subscriptionStatus === 'native_member';
    const targetOwnerId =
      isIsolated && profile.linkedUserId ? profile.linkedUserId : currentUser.id;
    const targetOwnerName =
      isIsolated && profile.linkedUserId ? profile.name : currentUser.name;
    const targetOwnerCompany =
      isIsolated && profile.linkedUserId ? profile.companyName : currentUser.companyName;

    const vehicle: LogisticsVehicle = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      ownerId: targetOwnerId,
      ownerName: targetOwnerName,
      ownerCompanyName: targetOwnerCompany,
      name: draft.name.trim(),
      category: draft.category,
      plateOrCode: draft.plateOrCode.trim() || 'LOG-DRV',
      modelYear: String(new Date().getFullYear()),
      city: draft.city.trim() || 'الغردقة',
      zone: 'جميع المناطق السياحية',
      passengerCapacity: Math.max(1, draft.passengerCapacity || 4),
      driverName: profile.name,
      driverPhone: profile.phone,
      ownershipType: isIsolated ? 'owned' : 'partner_shared',
      partnerId: profile.id,
      partnerName: profile.name,
      partnerCompanyName: profile.companyName,
      personCustody: {
        personProfileId: profile.id,
        personName: profile.name,
        personStatus: isIsolated ? 'subscribed_isolated' : 'external_pending',
        addedByUserId: profile.addedByUserId || currentUser.id,
        addedByUserName: profile.addedByUserName || currentUser.name,
        claimedUserId: isIsolated ? profile.linkedUserId : undefined,
        claimedAt: isIsolated ? new Date().toISOString() : undefined
      },
      pricePerTripEGP: Math.max(0, draft.pricePerTripEGP),
      pricePerTripEUR: Math.max(0, draft.pricePerTripEUR),
      status: 'available',
      hasAC: true,
      hasGPS: true,
      notes: `مسجلة من الملف الشخصي لـ ${profile.name}`,
      media: [],
      createdAt: today,
      updatedAt: today
    };

    onCreateVehicle(vehicle);
    return vehicle;
  };

  return {
    personProfiles,
    bilateralLedger,
    subscribedUsersFromProfiles: subscribedUsers,
    pendingClaimsForCurrentUser,
    outgoingClaimsForCurrentUser,
    createOrUpdatePersonProfile,
    requestPlatformSignupAndMatchPhone,
    approveClaimAndIsolateControls,
    rejectClaimRequest,
    syncOperationalCostItemsToLedger,
    syncBookingPartnerLedgerEntries,
    reverseBookingPartnerLedgerEntries,
    addManualBilateralLedgerEntry,
    deleteBilateralLedgerEntry,
    createEquipmentForProfile,
    createVehicleForProfile
  };
}
