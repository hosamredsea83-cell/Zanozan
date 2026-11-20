import { useEffect, useState } from 'react';
import type { Activity, ActivityStatus, SeasonalDiscount } from '../types/activity';
import type { AppUser } from '../types/auth';
import {
  deleteActivityFromDb,
  loadAllActivitiesFromDb,
  loadCompanyActivitiesFromDb,
  saveActivityToDb
} from '../db/localActivitiesDb';
import { saveWaypointsToBankDb } from '../db/localWaypointsDb';
import type { LogAuditEventInput } from './useAuditLogStore';
import { buildCreateAuditTrail, buildUpdateAuditTrail } from './useAuditLogStore';

export function buildBlankActivityForUser(currentUser: AppUser): Activity {
  const todayIso = new Date().toISOString().split('T')[0];

  return {
    id: `act-${Date.now()}`,
    name: '',
    translations: {
      en: {
        name: '',
        description: ''
      }
    },
    description: '',
    categoryPath: [],
    primaryCategory: 'general',
    duration: { days: 0, hours: 0, minutes: 0 },
    location: {
      primarySite: '',
      country: '',
      city: '',
      itinerary: []
    },
    status: '',
    owner: {
      id: currentUser.id,
      name: currentUser.name,
      companyName: currentUser.companyName,
      phone: currentUser.phone,
      tier: currentUser.tier
    },
    media: [],
    pricing: {
      egyptianB2C: { adultEGP: 0, adultEUR: 0, childEGP: 0, childEUR: 0, infantEGP: 0, infantEUR: 0, privatePricingType: 'total_group', privateTotalEGP: 0, privateTotalEUR: 0 },
      foreignerB2C: { adultEGP: 0, adultEUR: 0, childEGP: 0, childEUR: 0, infantEGP: 0, infantEUR: 0, privatePricingType: 'total_group', privateTotalEGP: 0, privateTotalEUR: 0 },
      egyptianB2B: { adultEGP: 0, adultEUR: 0, childEGP: 0, childEUR: 0, infantEGP: 0, infantEUR: 0, privatePricingType: 'total_group', privateTotalEGP: 0, privateTotalEUR: 0 },
      foreignerB2B: { adultEGP: 0, adultEUR: 0, childEGP: 0, childEUR: 0, infantEGP: 0, infantEUR: 0, privatePricingType: 'total_group', privateTotalEGP: 0, privateTotalEUR: 0 }
    },
    dynamicPricing: {
      baseRate: {
        adultPrice: 0,
        currency: 'EGP'
      },
      activeRules: []
    },
    seasonalDiscounts: [],
    minPax: 0,
    maxPax: 0,
    slots: [],
    cancellationPolicy: {
      id: '',
      name: '',
      isPlatformDefault: false,
      fullRefundHoursNotice: 0,
      partialRefundPercentage: 0,
      partialRefundHoursNotice: 0
    },
    approvalDeadlineHours: 0,
    paymentDeadlineHours: 0,
    metaGroups: [],
    resources: [],
    logistics: {
      requiresTransfer: false,
      transferProvidedByOwner: false,
      needsMarketTransportOrder: false,
      pickupPoint: '',
      dropoffPoint: '',
      passengerCapacity: 0,
      separateTransferFeeEGP: 0,
      separateTransferFeeEUR: 0
    },
    inclusions: {
      meals: [],
      drinks: [],
      equipmentProvided: [],
      guideLanguage: [],
      notIncluded: [],
      paidAddons: []
    },
    safetyRules: {
      minAge: 0,
      clientPrerequisites: [],
      attireGearNotes: '',
      safetyInstructions: '',
      hasGuideSupervisor: false,
      insuranceCoverage: ''
    },
    stats: {
      viewsCount: 0,
      inquiriesCount: 0,
      bookingsCount: 0,
      cancellationRatePercent: 0,
      revenueEUR: 0,
      revenueEGP: 0
    },
    channels: {
      ownerStorefront: false,
      tourismMarketplace: false,
      b2bAgencies: false,
      b2cCustomers: false,
      mobileApp: false
    },
    createdAt: todayIso,
    updatedAt: todayIso
  };
}

export function useActivitiesStore(
  currentUser: AppUser,
  onAuditLog?: (input: LogAuditEventInput) => void
) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [hasLoadedActivitiesFromDb, setHasLoadedActivitiesFromDb] = useState(false);

  useEffect(() => {
    let active = true;
    loadAllActivitiesFromDb()
      .then((stored) => {
        if (!active) return;
        setActivities(stored);
        setHasLoadedActivitiesFromDb(true);
      })
      .catch((err) => {
        console.error('Failed to load activities from database:', err);
        if (active) setHasLoadedActivitiesFromDb(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    loadCompanyActivitiesFromDb(currentUser)
      .then((ownerActs) => {
        if (!active || ownerActs.length === 0) return;
        setActivities((prev) => {
          const ownerMap = new Map(ownerActs.map((a) => [a.id, a]));
          const merged = prev.map((a) => ownerMap.get(a.id) ?? a);
          const existingIds = new Set(prev.map((a) => a.id));
          const newlyFetched = ownerActs.filter((a) => !existingIds.has(a.id));
          return [...newlyFetched, ...merged];
        });
      })
      .catch((err) => {
        console.error('Failed to retrieve company activities from database:', err);
      });
    return () => {
      active = false;
    };
  }, [currentUser.id]);

  const saveActivity = async (updatedActivity: Activity): Promise<Activity> => {
    const existing = activities.find((a) => a.id === updatedActivity.id);
    const isNew = !existing;
    const audit = isNew
      ? buildCreateAuditTrail(currentUser)
      : buildUpdateAuditTrail(currentUser, existing);

    const normalizedOwner = {
      id: updatedActivity.owner?.id || currentUser.id,
      name: updatedActivity.owner?.name || currentUser.name,
      companyName: updatedActivity.owner?.companyName || currentUser.companyName,
      phone: updatedActivity.owner?.phone || currentUser.phone,
      tier: updatedActivity.owner?.tier || currentUser.tier
    };

    const persisted = await saveActivityToDb({
      ...updatedActivity,
      owner: normalizedOwner,
      ...audit
    });

    if (Array.isArray(persisted.location?.itinerary) && persisted.location.itinerary.length > 0) {
      void saveWaypointsToBankDb(
        persisted.location.itinerary.map((wp) => ({
          id: wp.id,
          name: wp.name,
          type: wp.type,
          durationMinutes: wp.durationMinutes,
          departureTime: wp.departureTime,
          returnTime: wp.returnTime,
          description: wp.description
        }))
      );
    }

    setActivities((prev) => {
      const exists = prev.some((a) => a.id === persisted.id);
      if (exists) {
        return prev.map((a) => (a.id === persisted.id ? persisted : a));
      }
      return [persisted, ...prev];
    });

    onAuditLog?.({
      actor: currentUser,
      action: isNew ? 'create' : 'update',
      domain: 'activity',
      entityId: persisted.id,
      entityName: persisted.name || 'نشاط بدون اسم',
      summary: isNew
        ? `أنشأ ${currentUser.name} نشاطاً جديداً «${persisted.name}»`
        : `عدّل ${currentUser.name} بيانات النشاط «${persisted.name}»`,
      details: `المدينة: ${persisted.location?.city || 'غير محددة'} · الحالة: ${persisted.status || 'مسودة'}`
    });

    return persisted;
  };

  const deleteActivity = (activityId: string) => {
    const target = activities.find((a) => a.id === activityId);
    void deleteActivityFromDb(activityId);
    setActivities((prev) => prev.filter((a) => a.id !== activityId));
    onAuditLog?.({
      actor: currentUser,
      action: 'delete',
      domain: 'activity',
      entityId: activityId,
      entityName: target?.name || activityId,
      summary: `حذف ${currentUser.name} النشاط «${target?.name || activityId}»`,
      details: target
        ? `الشركة: ${target.owner?.companyName || '—'} · المدينة: ${target.location?.city || '—'}`
        : undefined
    });
  };

  const toggleActivityStatus = (activityId: string, newStatus: ActivityStatus) => {
    const target = activities.find((a) => a.id === activityId);
    const audit = buildUpdateAuditTrail(currentUser, target);
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== activityId) return a;
        const updated: Activity = { ...a, status: newStatus, ...audit };
        void saveActivityToDb(updated);
        return updated;
      })
    );
    onAuditLog?.({
      actor: currentUser,
      action: newStatus === 'published' ? 'approve' : 'status_change',
      domain: 'activity',
      entityId: activityId,
      entityName: target?.name || activityId,
      summary: `غيّر ${currentUser.name} حالة النشاط «${target?.name || activityId}» إلى «${newStatus}»`
    });
  };

  const applyOfferToActivity = (activityId: string, offer: SeasonalDiscount) => {
    const target = activities.find((a) => a.id === activityId);
    const audit = buildUpdateAuditTrail(currentUser, target);
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== activityId) return a;
        const updated: Activity = {
          ...a,
          seasonalDiscounts: [...a.seasonalDiscounts, offer],
          ...audit
        };
        void saveActivityToDb(updated);
        return updated;
      })
    );
    onAuditLog?.({
      actor: currentUser,
      action: 'create',
      domain: 'pricing',
      entityId: activityId,
      entityName: target?.name || activityId,
      summary: `أضاف ${currentUser.name} عرضاً موسمياً «${offer.title}» على النشاط «${target?.name || activityId}»`
    });
  };

  const removeOfferFromActivity = (activityId: string, offerId: string) => {
    const target = activities.find((a) => a.id === activityId);
    const offerTitle = target?.seasonalDiscounts.find((o) => o.id === offerId)?.title || offerId;
    const audit = buildUpdateAuditTrail(currentUser, target);
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== activityId) return a;
        const updated: Activity = {
          ...a,
          seasonalDiscounts: a.seasonalDiscounts.filter((o) => o.id !== offerId),
          ...audit
        };
        void saveActivityToDb(updated);
        return updated;
      })
    );
    onAuditLog?.({
      actor: currentUser,
      action: 'delete',
      domain: 'pricing',
      entityId: activityId,
      entityName: target?.name || activityId,
      summary: `حذف ${currentUser.name} العرض «${offerTitle}» من النشاط «${target?.name || activityId}»`
    });
  };

  const updateActivityPricing = (activityId: string, updatedPricing: Activity['pricing']) => {
    const target = activities.find((a) => a.id === activityId);
    const audit = buildUpdateAuditTrail(currentUser, target);
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== activityId) return a;
        const updated: Activity = { ...a, pricing: updatedPricing, ...audit };
        void saveActivityToDb(updated);
        return updated;
      })
    );
    onAuditLog?.({
      actor: currentUser,
      action: 'update',
      domain: 'pricing',
      entityId: activityId,
      entityName: target?.name || activityId,
      summary: `حدّث ${currentUser.name} تسعير النشاط «${target?.name || activityId}»`
    });
  };

  const removeEquipmentReference = (equipmentId: string) => {
    setActivities((prev) =>
      prev.map((act) => {
        if (!act.equipmentIds?.includes(equipmentId)) return act;
        const nextAct: Activity = {
          ...act,
          equipmentIds: act.equipmentIds.filter((id) => id !== equipmentId)
        };
        void saveActivityToDb(nextAct);
        return nextAct;
      })
    );
  };

  const renameCategoryPathPrefix = (prevPath: string[], levelIndex: number, nextName: string) => {
    setActivities((prev) =>
      prev.map((act) => {
        if (!Array.isArray(act.categoryPath) || act.categoryPath.length < prevPath.length) {
          return act;
        }
        const matchesPrefix = prevPath.every((seg, idx) => act.categoryPath[idx] === seg);
        if (!matchesPrefix) return act;
        const nextCategoryPath = [...act.categoryPath];
        nextCategoryPath[levelIndex] = nextName;
        const updatedAct: Activity = {
          ...act,
          categoryPath: nextCategoryPath
        };
        void saveActivityToDb(updatedAct);
        return updatedAct;
      })
    );
  };

  return {
    activities,
    setActivities,
    hasLoadedActivitiesFromDb,
    saveActivity,
    deleteActivity,
    toggleActivityStatus,
    applyOfferToActivity,
    removeOfferFromActivity,
    updateActivityPricing,
    removeEquipmentReference,
    renameCategoryPathPrefix
  };
}
