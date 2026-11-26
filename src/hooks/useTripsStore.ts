import { useEffect, useState } from 'react';
import type { TripRecord, TripStatus } from '../types/trip';
import type { AppUser } from '../types/auth';
import {
  deleteTripFromDb,
  loadAllTripsFromDb,
  loadCompanyTripsFromDb,
  saveTripToDb
} from '../db/localTripsDb';
import { saveWaypointsToBankDb } from '../db/localWaypointsDb';
import type { LogAuditEventInput } from './useAuditLogStore';
import { buildCreateAuditTrail, buildUpdateAuditTrail } from './useAuditLogStore';

export function buildBlankTripForUser(currentUser: AppUser): TripRecord {
  const todayIso = new Date().toISOString().split('T')[0];

  return {
    id: `trp-${Date.now()}`,
    entityKind: 'trip',
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
    tripNature: '',
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
    selectedPricingProperties: [],
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
    equipmentIds: [],
    showEquipmentToClient: false,
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

export function useTripsStore(
  currentUser: AppUser,
  onAuditLog?: (input: LogAuditEventInput) => void
) {
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [hasLoadedTripsFromDb, setHasLoadedTripsFromDb] = useState(false);

  useEffect(() => {
    let active = true;
    loadAllTripsFromDb()
      .then((stored) => {
        if (!active) return;
        setTrips(stored);
        setHasLoadedTripsFromDb(true);
      })
      .catch((err) => {
        console.error('Failed to load trips from database:', err);
        if (active) setHasLoadedTripsFromDb(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    loadCompanyTripsFromDb(currentUser)
      .then((ownerTrips) => {
        if (!active || ownerTrips.length === 0) return;
        setTrips((prev) => {
          const ownerMap = new Map(ownerTrips.map((t) => [t.id, t]));
          const merged = prev.map((t) => ownerMap.get(t.id) ?? t);
          const existingIds = new Set(prev.map((t) => t.id));
          const newlyFetched = ownerTrips.filter((t) => !existingIds.has(t.id));
          return [...newlyFetched, ...merged];
        });
      })
      .catch((err) => {
        console.error('Failed to retrieve company trips from database:', err);
      });
    return () => {
      active = false;
    };
  }, [currentUser.id]);

  const saveTrip = async (updatedTrip: TripRecord): Promise<TripRecord> => {
    const existing = trips.find((t) => t.id === updatedTrip.id);
    const isNew = !existing;
    const audit = isNew
      ? buildCreateAuditTrail(currentUser)
      : buildUpdateAuditTrail(currentUser, existing);

    const normalizedOwner = {
      id: updatedTrip.owner?.id || currentUser.id,
      name: updatedTrip.owner?.name || currentUser.name,
      companyName: updatedTrip.owner?.companyName || currentUser.companyName,
      phone: updatedTrip.owner?.phone || currentUser.phone,
      tier: updatedTrip.owner?.tier || currentUser.tier
    };

    const persisted = await saveTripToDb({
      ...updatedTrip,
      entityKind: 'trip',
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

    setTrips((prev) => {
      const exists = prev.some((t) => t.id === persisted.id);
      if (exists) {
        return prev.map((t) => (t.id === persisted.id ? persisted : t));
      }
      return [persisted, ...prev];
    });

    onAuditLog?.({
      actor: currentUser,
      action: isNew ? 'create' : 'update',
      domain: 'trip',
      entityId: persisted.id,
      entityName: persisted.name || 'رحلة بدون اسم',
      summary: isNew
        ? `أنشأ ${currentUser.name} رحلة جديدة «${persisted.name}»`
        : `عدّل ${currentUser.name} بيانات الرحلة «${persisted.name}»`,
      details: `المدينة: ${persisted.location?.city || 'غير محددة'} · الحالة: ${persisted.status || 'مسودة'}`
    });

    return persisted;
  };

  const deleteTrip = (tripId: string) => {
    const target = trips.find((t) => t.id === tripId);
    void deleteTripFromDb(tripId);
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
    onAuditLog?.({
      actor: currentUser,
      action: 'delete',
      domain: 'trip',
      entityId: tripId,
      entityName: target?.name || tripId,
      summary: `حذف ${currentUser.name} الرحلة «${target?.name || tripId}»`,
      details: target
        ? `الشركة: ${target.owner?.companyName || '—'} · المدينة: ${target.location?.city || '—'}`
        : undefined
    });
  };

  const toggleTripStatus = (tripId: string, newStatus: TripStatus) => {
    const target = trips.find((t) => t.id === tripId);
    const audit = buildUpdateAuditTrail(currentUser, target);
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        const updated: TripRecord = { ...t, status: newStatus, ...audit };
        void saveTripToDb(updated);
        return updated;
      })
    );
    onAuditLog?.({
      actor: currentUser,
      action: newStatus === 'published' ? 'approve' : 'status_change',
      domain: 'trip',
      entityId: tripId,
      entityName: target?.name || tripId,
      summary: `غيّر ${currentUser.name} حالة الرحلة «${target?.name || tripId}» إلى «${newStatus}»`
    });
  };

  const removeTripEquipmentReference = (equipmentId: string) => {
    setTrips((prev) =>
      prev.map((trp) => {
        if (!trp.equipmentIds?.includes(equipmentId)) return trp;
        const nextTrip: TripRecord = {
          ...trp,
          equipmentIds: trp.equipmentIds.filter((id) => id !== equipmentId)
        };
        void saveTripToDb(nextTrip);
        return nextTrip;
      })
    );
  };

  const renameTripCategoryPathPrefix = (
    prevPath: string[],
    levelIndex: number,
    nextName: string
  ) => {
    setTrips((prev) =>
      prev.map((trp) => {
        if (!Array.isArray(trp.categoryPath) || trp.categoryPath.length < prevPath.length) {
          return trp;
        }
        const matchesPrefix = prevPath.every((seg, idx) => trp.categoryPath[idx] === seg);
        if (!matchesPrefix) return trp;
        const nextCategoryPath = [...trp.categoryPath];
        nextCategoryPath[levelIndex] = nextName;
        const updatedTrip: TripRecord = {
          ...trp,
          categoryPath: nextCategoryPath
        };
        void saveTripToDb(updatedTrip);
        return updatedTrip;
      })
    );
  };

  return {
    trips,
    setTrips,
    hasLoadedTripsFromDb,
    saveTrip,
    deleteTrip,
    toggleTripStatus,
    removeTripEquipmentReference,
    renameTripCategoryPathPrefix
  };
}
