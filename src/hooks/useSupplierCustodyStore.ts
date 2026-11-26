import { useEffect, useMemo, useState } from 'react';
import type { Activity } from '../types/activity';
import type { TripRecord } from '../types/trip';
import { AppUser, SYSTEM_USERS } from '../types/auth';
import type {
  RegisteredSupplierRecord,
  SupplierPricingJournalEntry
} from '../types/supplierJournal';
import { INITIAL_REGISTERED_OWNERS } from '../components/reference/creation/creationReferenceData';
import {
  loadRegisteredSuppliersFromDb,
  loadSubscribedUsersFromDb,
  loadSupplierPricingJournalsFromDb,
  saveRegisteredSupplierToDb,
  saveSubscribedUserToDb,
  saveSupplierPricingJournalToDb
} from '../db/localSupplierJournalsDb';
import { saveActivityToDb } from '../db/localActivitiesDb';
import { saveTripToDb } from '../db/localTripsDb';
import type { LogAuditEventInput } from './useAuditLogStore';

function normalizePhone(phone?: string): string {
  return (phone || '').replace(/[\s\-()]/g, '').trim();
}

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'م';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0] || ''}${parts[1][0] || ''}`;
}

export function buildSupplierMatchesPlatformUser(
  supplier: Pick<RegisteredSupplierRecord, 'id' | 'name' | 'companyName' | 'phone' | 'linkedPlatformUserId'>,
  users: AppUser[]
): AppUser | undefined {
  const cleanPhone = normalizePhone(supplier.phone);
  return users.find((u) => {
    if (supplier.linkedPlatformUserId && u.id === supplier.linkedPlatformUserId) return true;
    if (u.id === supplier.id) return true;
    if (cleanPhone && normalizePhone(u.phone) === cleanPhone) return true;
    if (
      supplier.companyName &&
      u.companyName.trim().toLowerCase() === supplier.companyName.trim().toLowerCase()
    ) {
      return true;
    }
    return false;
  });
}

export function entityMatchesSupplier(
  entity: Pick<Activity, 'owner' | 'supplierCustody'>,
  supplier: RegisteredSupplierRecord
): boolean {
  if (entity.supplierCustody?.supplierId === supplier.id) return true;
  if (entity.owner?.id === supplier.id) return true;
  if (supplier.linkedPlatformUserId && entity.owner?.id === supplier.linkedPlatformUserId) {
    return true;
  }
  const supPhone = normalizePhone(supplier.phone);
  const entPhone = normalizePhone(entity.owner?.phone);
  if (supPhone && entPhone && supPhone === entPhone && entity.owner?.name === supplier.name) {
    return true;
  }
  return (
    entity.owner?.name === supplier.name &&
    entity.owner?.companyName === supplier.companyName
  );
}

export function useSupplierCustodyStore(
  currentUser: AppUser,
  activities: Activity[],
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>,
  trips: TripRecord[],
  setTrips: React.Dispatch<React.SetStateAction<TripRecord[]>>,
  onAuditLog?: (input: LogAuditEventInput) => void
) {
  const [registeredSuppliers, setRegisteredSuppliers] = useState<RegisteredSupplierRecord[]>([]);
  const [supplierJournals, setSupplierJournals] = useState<SupplierPricingJournalEntry[]>([]);
  const [subscribedUsers, setSubscribedUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadRegisteredSuppliersFromDb(),
      loadSupplierPricingJournalsFromDb(),
      loadSubscribedUsersFromDb()
    ])
      .then(async ([storedSuppliers, storedJournals, storedUsers]) => {
        if (!active) return;

        let suppliersList = storedSuppliers;
        if (suppliersList.length === 0) {
          const todayIso = new Date().toISOString().split('T')[0];
          const seeded: RegisteredSupplierRecord[] = INITIAL_REGISTERED_OWNERS.map((o) => ({
            id: o.id,
            name: o.name,
            companyName: o.companyName,
            phone: o.phone,
            tier: o.tier,
            platformStatus: 'pending_signup',
            addedByUserId: 'system',
            addedByUserName: 'المرجع المبدئي للمنصة',
            createdAt: todayIso
          }));
          await Promise.all(seeded.map((s) => saveRegisteredSupplierToDb(s)));
          suppliersList = seeded;
        }

        if (!active) return;
        setRegisteredSuppliers(suppliersList);
        setSupplierJournals(
          [...storedJournals].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
        );
        setSubscribedUsers(storedUsers);
      })
      .catch((err) => {
        console.error('Failed to load supplier custody data:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  const allPlatformUsers = useMemo<AppUser[]>(() => {
    const map = new Map<string, AppUser>();
    SYSTEM_USERS.forEach((u) => map.set(u.id, u));
    subscribedUsers.forEach((u) => map.set(u.id, u));
    return Array.from(map.values());
  }, [subscribedUsers]);

  const addRegisteredSupplier = async (input: {
    id?: string;
    name: string;
    companyName: string;
    phone: string;
    tier: string;
  }): Promise<RegisteredSupplierRecord> => {
    const matchedPlatformUser = buildSupplierMatchesPlatformUser(
      {
        id: input.id || '',
        name: input.name,
        companyName: input.companyName,
        phone: input.phone
      },
      allPlatformUsers
    );

    const nowIso = new Date().toISOString();
    const record: RegisteredSupplierRecord = {
      id: input.id || `own-${Date.now().toString().slice(-6)}`,
      name: input.name.trim(),
      companyName: input.companyName.trim(),
      phone: input.phone.trim() || '+201000000000',
      tier: input.tier || 'شخصي',
      platformStatus: matchedPlatformUser ? 'subscribed' : 'pending_signup',
      linkedPlatformUserId: matchedPlatformUser?.id,
      addedByUserId: currentUser.id,
      addedByUserName: currentUser.name,
      createdAt: nowIso.split('T')[0],
      subscribedAt: matchedPlatformUser ? nowIso : undefined
    };

    await saveRegisteredSupplierToDb(record);
    setRegisteredSuppliers((prev) => {
      const exists = prev.some((s) => s.id === record.id);
      return exists ? prev.map((s) => (s.id === record.id ? record : s)) : [...prev, record];
    });

    onAuditLog?.({
      actor: currentUser,
      action: 'create',
      domain: 'activity',
      entityId: record.id,
      entityName: record.name,
      summary: `أضاف ${currentUser.name} المورد الخارجي «${record.name}» (${record.companyName}) لحين دخوله النظام`
    });

    return record;
  };

  const ensureSupplierExistsFromOwner = async (
    owner: Activity['owner']
  ): Promise<RegisteredSupplierRecord> => {
    const existing = registeredSuppliers.find(
      (s) =>
        s.id === owner.id ||
        s.linkedPlatformUserId === owner.id ||
        (s.name === owner.name && s.companyName === owner.companyName)
    );
    if (existing) return existing;
    return addRegisteredSupplier({
      id: owner.id,
      name: owner.name,
      companyName: owner.companyName,
      phone: owner.phone,
      tier: owner.tier
    });
  };

  const recordPricingForSupplier = async (params: {
    entityType: 'activity' | 'trip';
    entity: Activity;
  }): Promise<SupplierPricingJournalEntry | null> => {
    const { entityType, entity } = params;
    const isExternal =
      Boolean(entity.supplierCustody?.isExternalSupplier) ||
      (Boolean(entity.owner?.id) && entity.owner.id !== currentUser.id);

    if (!isExternal || !entity.owner?.name) {
      return null;
    }

    const supplier = await ensureSupplierExistsFromOwner(entity.owner);
    const matchedUser = buildSupplierMatchesPlatformUser(supplier, allPlatformUsers);
    const isAlreadySubscribed = supplier.platformStatus === 'subscribed' || Boolean(matchedUser);

    const entry: SupplierPricingJournalEntry = {
      id: `supj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierCompany: supplier.companyName,
      supplierPhone: supplier.phone,
      recordedByUserId: currentUser.id,
      recordedByUserName: currentUser.name,
      entityType,
      entityId: entity.id,
      entityName: entity.name || (entityType === 'trip' ? 'رحلة بدون اسم' : 'نشاط بدون اسم'),
      pricingSnapshot: JSON.parse(JSON.stringify(entity.pricing)) as Activity['pricing'],
      recordedAt: new Date().toISOString(),
      status: isAlreadySubscribed ? 'transferred_to_supplier' : 'recorded_for_supplier',
      claimedUserId: matchedUser?.id || supplier.linkedPlatformUserId,
      notes: isAlreadySubscribed
        ? 'تم تسجيل الأسعار وترحيلها مباشرة لصفحة المورد المشترك بالمنصة'
        : 'تم حفظ الأسعار في يوميات المورد المختار لحين اشتراكه بالمنصة'
    };

    await saveSupplierPricingJournalToDb(entry);
    setSupplierJournals((prev) => [entry, ...prev]);

    onAuditLog?.({
      actor: currentUser,
      action: 'create',
      domain: 'pricing',
      entityId: entity.id,
      entityName: entity.name,
      summary: `تم حفظ أسعار ${entityType === 'trip' ? 'الرحلة' : 'النشاط'} «${entity.name}» في يوميات المورد «${supplier.name}»`,
      details: `المصري: ${entity.pricing?.egyptianB2C?.adultEGP || 0} ج.م · الأجنبي: €${entity.pricing?.foreignerB2C?.adultEUR || 0} · الحالة: ${
        isAlreadySubscribed ? 'مُرحّل لصفحة المورد' : 'معلق لحين اشتراك المورد'
      }`
    });

    return entry;
  };

  const subscribeSupplierToPlatform = async (supplierId: string): Promise<{
    supplier: RegisteredSupplierRecord;
    user: AppUser;
    migratedActivitiesCount: number;
    migratedTripsCount: number;
  } | null> => {
    const targetSupplier = registeredSuppliers.find((s) => s.id === supplierId);
    if (!targetSupplier) return null;

    const existingUser = buildSupplierMatchesPlatformUser(targetSupplier, allPlatformUsers);
    const nowIso = new Date().toISOString();

    const platformUser: AppUser =
      existingUser ??
      {
        id: `user-sup-${targetSupplier.id}`,
        name: targetSupplier.name,
        email: `${targetSupplier.id.replace(/[^a-zA-Z0-9_-]/g, '')}@zanoza.com`,
        companyName: targetSupplier.companyName,
        phone: targetSupplier.phone || '+201000000000',
        role: 'مورد وصاحب نشاط مشترك بالمنصة',
        tier: targetSupplier.tier || 'باقة الشركاء المعتمدين',
        avatarColor: 'bg-teal-600',
        initials: buildInitials(targetSupplier.name),
        avatarInitials: buildInitials(targetSupplier.name)
      };

    if (!existingUser) {
      await saveSubscribedUserToDb(platformUser);
      setSubscribedUsers((prev) =>
        prev.some((u) => u.id === platformUser.id) ? prev : [...prev, platformUser]
      );
    }

    const updatedSupplier: RegisteredSupplierRecord = {
      ...targetSupplier,
      platformStatus: 'subscribed',
      linkedPlatformUserId: platformUser.id,
      subscribedAt: targetSupplier.subscribedAt || nowIso
    };
    await saveRegisteredSupplierToDb(updatedSupplier);
    setRegisteredSuppliers((prev) =>
      prev.map((s) => (s.id === updatedSupplier.id ? updatedSupplier : s))
    );

    // Migrate matching activities to the subscribed supplier's personal platform account
    const matchingActivities = activities.filter((act) =>
      entityMatchesSupplier(act, targetSupplier)
    );
    const migratedActivities: Activity[] = [];
    for (const act of matchingActivities) {
      const updatedAct: Activity = {
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
          supplierId: updatedSupplier.id,
          supplierStatus: 'subscribed',
          addedByUserId: act.supplierCustody?.addedByUserId || act.createdById || currentUser.id,
          addedByUserName:
            act.supplierCustody?.addedByUserName || act.createdByName || currentUser.name,
          addedByCompanyName:
            act.supplierCustody?.addedByCompanyName || act.createdByCompany,
          claimedUserId: platformUser.id,
          claimedAt: nowIso
        }
      };
      const saved = await saveActivityToDb(updatedAct);
      migratedActivities.push(saved);
    }
    if (migratedActivities.length > 0) {
      const migratedMap = new Map(migratedActivities.map((a) => [a.id, a]));
      setActivities((prev) => prev.map((a) => migratedMap.get(a.id) ?? a));
    }

    // Migrate matching trips to the subscribed supplier's personal platform account
    const matchingTrips = trips.filter((tr) => entityMatchesSupplier(tr, targetSupplier));
    const migratedTrips: TripRecord[] = [];
    for (const tr of matchingTrips) {
      const updatedTrip: TripRecord = {
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
          supplierId: updatedSupplier.id,
          supplierStatus: 'subscribed',
          addedByUserId: tr.supplierCustody?.addedByUserId || tr.createdById || currentUser.id,
          addedByUserName:
            tr.supplierCustody?.addedByUserName || tr.createdByName || currentUser.name,
          addedByCompanyName:
            tr.supplierCustody?.addedByCompanyName || tr.createdByCompany,
          claimedUserId: platformUser.id,
          claimedAt: nowIso
        }
      };
      const saved = await saveTripToDb(updatedTrip);
      migratedTrips.push(saved);
    }
    if (migratedTrips.length > 0) {
      const migratedTripMap = new Map(migratedTrips.map((t) => [t.id, t]));
      setTrips((prev) => prev.map((t) => migratedTripMap.get(t.id) ?? t));
    }

    // Transfer all supplier pricing journals to claimed status
    const matchingJournals = supplierJournals.filter(
      (j) =>
        j.supplierId === updatedSupplier.id ||
        (j.supplierName === updatedSupplier.name && j.supplierCompany === updatedSupplier.companyName)
    );
    const updatedJournals: SupplierPricingJournalEntry[] = [];
    for (const j of matchingJournals) {
      const nextJ: SupplierPricingJournalEntry = {
        ...j,
        status: 'transferred_to_supplier',
        claimedUserId: platformUser.id,
        notes: 'تم ترحيل قيد اليوميات لصفحة المورد الشخصية مع صلاحية التعديل والحذف'
      };
      await saveSupplierPricingJournalToDb(nextJ);
      updatedJournals.push(nextJ);
    }
    if (updatedJournals.length > 0) {
      const jMap = new Map(updatedJournals.map((j) => [j.id, j]));
      setSupplierJournals((prev) => prev.map((j) => jMap.get(j.id) ?? j));
    }

    onAuditLog?.({
      actor: currentUser,
      action: 'approve',
      domain: 'activity',
      entityId: updatedSupplier.id,
      entityName: updatedSupplier.name,
      summary: `اشترك المورد «${updatedSupplier.name}» بالمنصة وتم نقل ${migratedActivities.length} نشاط و ${migratedTrips.length} رحلة إلى صفحته الشخصية بكامل صلاحيات التعديل والحذف`,
      details: `حساب المنصة: ${platformUser.id} · قيود اليوميات المرحلة: ${updatedJournals.length}`
    });

    return {
      supplier: updatedSupplier,
      user: platformUser,
      migratedActivitiesCount: migratedActivities.length,
      migratedTripsCount: migratedTrips.length
    };
  };

  return {
    registeredSuppliers,
    supplierJournals,
    subscribedUsers,
    allPlatformUsers,
    addRegisteredSupplier,
    recordPricingForSupplier,
    subscribeSupplierToPlatform
  };
}
