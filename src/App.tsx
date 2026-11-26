/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Activity, PricingPropertyItem } from './types/activity';
import type { EquipmentItem } from './types/equipment';
import type { PersonProfile } from './types/personProfile';
import type { TripRecord } from './types/trip';
import {
  INITIAL_CUSTOMER_REVIEWS,
  type CustomerReviewRecord,
  type DriverMissionRecord,
  type DriverMissionStatus,
  type InTripAddonRequestRecord,
  type ResourceMaintenanceBlock
} from './types/finance';
import {
  AppUser,
  SYSTEM_USERS,
  canUserAccessNavKey,
  resolveUserRoleKey
} from './types/auth';
import { Sidebar, NavigationItemKey } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ActivitiesSection } from './components/activities/ActivitiesSection';
import { ActivityPreviewModal } from './components/activities/ActivityPreviewModal';
import {
  ActivityCollection,
  INITIAL_COLLECTIONS as INITIAL_ACTIVITY_COLLECTIONS
} from './components/activities/CollectionsManager';
import {
  PricingPropertiesManager,
  INITIAL_PRICING_PROPERTIES
} from './components/activities/PricingPropertiesManager';
import { EquipmentSection } from './components/equipment/EquipmentSection';
import { TripsSection } from './components/trips/TripsSection';
import { BookingsSection } from './components/bookings/BookingsSection';
import { FinanceSection } from './components/finance/FinanceSection';
import { OperationalCostsManager } from './components/finance/OperationalCostsManager';
import {
  PricingToolManager,
  PlatformPricingSettings,
  DEFAULT_PLATFORM_PRICING_SETTINGS
} from './components/pricing/PricingToolManager';
import { AnalyticsConsole } from './components/analytics/AnalyticsConsole';
import { ReportsView } from './components/reports/ReportsView';
import { DecisionGuideModal } from './components/spec/DecisionGuideModal';
import {
  BookingQueueModal,
  BookingRequest,
  INITIAL_BOOKING_REQUESTS
} from './components/trips/BookingQueueModal';
import { TripBooking, INITIAL_TRIP_BOOKINGS } from './components/bookings/BookingsManagerView';
import { FavoritesHub } from './components/favorites/FavoritesHub';
import { LogisticsManagement } from './components/logistics/LogisticsManagement';
import { PlatformAuditLogsView } from './components/audit/PlatformAuditLogsView';
import { ThemeAppearanceStudio } from './components/theme/ThemeAppearanceStudio';
import { UnifiedMasterReferenceHub } from './components/reference/UnifiedMasterReferenceHub';
import { PersonProfilesHub } from './components/profiles/PersonProfilesHub';
import { AuthModal, ServerAuthStatus } from './components/auth/AuthModal';
import {
  CustomerMasterLayout,
  CustomerPortalSection
} from './components/storefront/CustomerMasterLayout';
import { CustomerStorefrontView } from './components/storefront/CustomerStorefrontView';
import { DriverFieldPortalView } from './components/logistics/DriverFieldPortalView';
import { OccupancyCalendarView } from './components/equipment/OccupancyCalendarView';
import { UserManagementView } from './components/users/UserManagementView';
import {
  fetchDomainStore,
  saveDomainStore,
  setInMemoryAuthToken
} from './services/serverStoreSync';
import { activityBelongsToOwner, saveActivityToDb } from './db/localActivitiesDb';
import { saveTripToDb } from './db/localTripsDb';
import { equipmentBelongsToEditableUser } from './utils/assetCustodyHelpers';
import {
  computeBookingPartnerAllocations,
  findWalletForParty
} from './utils/financialSettlementEngine';
import {
  isExperienceVisibleForCustomer,
  resolveAudienceByNationality,
  resolveAutoCurrencyByNationality
} from './utils/customerEligibility';
import {
  evaluateCancellationRefund,
  hasActiveOfferForCustomer
} from './utils/bookingPricing';
import { useAuditLogStore } from './hooks/useAuditLogStore';
import { buildBlankActivityForUser, useActivitiesStore } from './hooks/useActivitiesStore';
import { buildBlankTripForUser, useTripsStore } from './hooks/useTripsStore';
import { useSupplierCustodyStore } from './hooks/useSupplierCustodyStore';
import { usePersonProfilesStore } from './hooks/usePersonProfilesStore';
import {
  ACTIVITY_TERMINOLOGY,
  TRIP_TERMINOLOGY
} from './components/reference/creation/entityCreationTerminology';
import { useEquipmentsStore } from './hooks/useEquipmentsStore';
import { useLogisticsStore } from './hooks/useLogisticsStore';
import { useCategoriesStore } from './hooks/useCategoriesStore';
import { useFinanceStore } from './hooks/useFinanceStore';
import { useOperationalCostsStore } from './hooks/useOperationalCostsStore';
import { useFavoritesStore } from './hooks/useFavoritesStore';
import { useMasterAddonsStore } from './hooks/useMasterAddonsStore';
import { useMasterReferenceStore } from './hooks/useMasterReferenceStore';
import { useOwnerThemeStore } from './hooks/useOwnerThemeStore';
import { useUserPermissionsStore } from './hooks/useUserPermissionsStore';

// Re-export PricingPropertiesManager reference if needed by external consumers
export { PricingPropertiesManager };

const CURRENT_USER_STORAGE_KEY = 'zanoza_current_user_id_v1';
const PLATFORM_PRICING_SETTINGS_KEY = 'zanoza_platform_pricing_settings_v1';
const IN_TRIP_REQUESTS_STORAGE_KEY = 'zanoza_in_trip_requests_v1';
const ACTIVITY_BOOKINGS_STORAGE_KEY = 'zanoza_activity_bookings_v1';
const TRIP_BOOKINGS_STORAGE_KEY = 'zanoza_trip_bookings_v1';
const REVIEWS_STORAGE_KEY = 'zanoza_reviews_v1';
const DRIVER_MISSIONS_STORAGE_KEY = 'zanoza_driver_missions_v1';
const MAINTENANCE_BLOCKS_STORAGE_KEY = 'zanoza_maintenance_blocks_v1';

function readJsonArrayStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as T[];
    }
  } catch {
    // ignore storage errors
  }
  return fallback;
}

function getDefaultNavKeyForUser(user?: AppUser): NavigationItemKey {
  const roleKey = resolveUserRoleKey(user);
  if (roleKey === 'customer') return 'customer_storefront';
  if (roleKey === 'driver') return 'driver_portal';
  if (roleKey === 'tour_guide' || roleKey === 'delegate') return 'partner_earnings';
  if (roleKey === 'equipment_owner') return 'activity_equipment';
  return 'dashboard';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    try {
      const savedUserId = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      const matched = SYSTEM_USERS.find((u) => u.id === savedUserId);
      if (matched) return matched;
    } catch {
      // ignore storage access issues
    }
    return SYSTEM_USERS[0];
  });

  const [currentNavKey, setCurrentNavKey] = useState<NavigationItemKey>(() => {
    try {
      const saved = window.localStorage.getItem('zanoza_current_nav_key_v1');
      if (saved) {
        if (
          saved === 'activity_categories' ||
          saved === 'activity_custom_specs' ||
          saved === 'activity_addons_library' ||
          saved === 'activity_meta_library' ||
          saved === 'activity_equipment_types'
        ) {
          return 'unified_reference';
        }
        return saved as NavigationItemKey;
      }
    } catch {
      // ignore storage access issues
    }
    return 'dashboard';
  });

  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSpecGuideModal, setShowSpecGuideModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [customerPortalSection, setCustomerPortalSection] =
    useState<CustomerPortalSection>('catalog');
  const [customerCurrency, setCustomerCurrency] = useState<'EGP' | 'EUR'>('EGP');
  const [customerLang, setCustomerLang] = useState<'ar' | 'en'>('ar');

  const [selectedActivityForEdit, setSelectedActivityForEdit] = useState<Activity | null>(null);
  const [selectedTripForEdit, setSelectedTripForEdit] = useState<TripRecord | null>(null);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [previewActivity, setPreviewActivity] = useState<Activity | null>(null);
  const [previewEntityKind, setPreviewEntityKind] = useState<'activity' | 'trip'>('activity');
  const [previewClientMode, setPreviewClientMode] = useState<boolean>(false);
  const [preselectedProfileForAsset, setPreselectedProfileForAsset] = useState<PersonProfile | null>(null);
  const [pausedEquipmentDraftForActivity, setPausedEquipmentDraftForActivity] = useState<{
    item: EquipmentItem;
    isNew: boolean;
    returnToNav: NavigationItemKey;
  } | null>(null);
  const [restoredEquipmentDraftFromActivity, setRestoredEquipmentDraftFromActivity] = useState<{
    item: EquipmentItem;
    isNew: boolean;
  } | null>(null);

  const [activityCollections, setActivityCollections] = useState<ActivityCollection[]>(
    INITIAL_ACTIVITY_COLLECTIONS
  );
  const [pricingProperties, setPricingProperties] = useState<PricingPropertyItem[]>(
    INITIAL_PRICING_PROPERTIES
  );
  const [activityBookings, setActivityBookings] = useState<BookingRequest[]>(() =>
    readJsonArrayStorage<BookingRequest>(ACTIVITY_BOOKINGS_STORAGE_KEY, INITIAL_BOOKING_REQUESTS)
  );
  const [tripBookings, setTripBookings] = useState<TripBooking[]>(() =>
    readJsonArrayStorage<TripBooking>(TRIP_BOOKINGS_STORAGE_KEY, INITIAL_TRIP_BOOKINGS)
  );
  const [inTripRequests, setInTripRequests] = useState<InTripAddonRequestRecord[]>(() =>
    readJsonArrayStorage<InTripAddonRequestRecord>(IN_TRIP_REQUESTS_STORAGE_KEY, [])
  );
  const [reviews, setReviews] = useState<CustomerReviewRecord[]>(() => {
    const stored = readJsonArrayStorage<CustomerReviewRecord>(
      REVIEWS_STORAGE_KEY,
      INITIAL_CUSTOMER_REVIEWS
    );
    return stored.length > 0 ? stored : INITIAL_CUSTOMER_REVIEWS;
  });
  const [driverMissions, setDriverMissions] = useState<DriverMissionRecord[]>(() =>
    readJsonArrayStorage<DriverMissionRecord>(DRIVER_MISSIONS_STORAGE_KEY, [])
  );
  const [maintenanceBlocks, setMaintenanceBlocks] = useState<ResourceMaintenanceBlock[]>(() =>
    readJsonArrayStorage<ResourceMaintenanceBlock>(MAINTENANCE_BLOCKS_STORAGE_KEY, [])
  );

  // Real Server Authentication State (token kept strictly in React/JS memory)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStatus, setAuthStatus] = useState<ServerAuthStatus>({
    adminConfigured: false,
    envPasscodeConfigured: false,
    claimedAdmin: false,
    accounts: []
  });

  const refreshAuthStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      if (!res.ok) return;
      const data = (await res.json()) as Partial<ServerAuthStatus>;
      setAuthStatus({
        adminConfigured: Boolean(data.adminConfigured),
        envPasscodeConfigured: Boolean(data.envPasscodeConfigured),
        claimedAdmin: Boolean(data.claimedAdmin),
        accounts: Array.isArray(data.accounts) ? data.accounts : []
      });
    } catch {
      // ignore network error
    }
  }, []);

  useEffect(() => {
    void refreshAuthStatus();
  }, [refreshAuthStatus]);

  useEffect(() => {
    setInMemoryAuthToken(authToken);
  }, [authToken]);

  // Hydrate & Sync operational domains with server store (/api/store/:domain)
  const hydratedDomainsRef = useRef({
    activityBookings: false,
    tripBookings: false,
    inTripRequests: false,
    reviews: false,
    driverMissions: false,
    maintenanceBlocks: false
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchDomainStore<BookingRequest[]>('bookings_activities'),
      fetchDomainStore<TripBooking[]>('bookings_trips'),
      fetchDomainStore<InTripAddonRequestRecord[]>('in_trip_requests'),
      fetchDomainStore<CustomerReviewRecord[]>('reviews'),
      fetchDomainStore<DriverMissionRecord[]>('driver_missions'),
      fetchDomainStore<ResourceMaintenanceBlock[]>('maintenance_blocks')
    ])
      .then(([srvActBks, srvTripBks, srvInTrip, srvReviews, srvMissions, srvBlocks]) => {
        if (!active) return;
        if (Array.isArray(srvActBks)) setActivityBookings(srvActBks);
        if (Array.isArray(srvTripBks)) setTripBookings(srvTripBks);
        if (Array.isArray(srvInTrip)) setInTripRequests(srvInTrip);
        if (Array.isArray(srvReviews) && srvReviews.length > 0) setReviews(srvReviews);
        if (Array.isArray(srvMissions)) setDriverMissions(srvMissions);
        if (Array.isArray(srvBlocks)) setMaintenanceBlocks(srvBlocks);
        hydratedDomainsRef.current = {
          activityBookings: true,
          tripBookings: true,
          inTripRequests: true,
          reviews: true,
          driverMissions: true,
          maintenanceBlocks: true
        };
      })
      .catch(() => {
        hydratedDomainsRef.current = {
          activityBookings: true,
          tripBookings: true,
          inTripRequests: true,
          reviews: true,
          driverMissions: true,
          maintenanceBlocks: true
        };
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(ACTIVITY_BOOKINGS_STORAGE_KEY, JSON.stringify(activityBookings));
    } catch {
      // ignore storage errors
    }
    if (hydratedDomainsRef.current.activityBookings) {
      void saveDomainStore('bookings_activities', activityBookings);
    }
  }, [activityBookings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(TRIP_BOOKINGS_STORAGE_KEY, JSON.stringify(tripBookings));
    } catch {
      // ignore storage errors
    }
    if (hydratedDomainsRef.current.tripBookings) {
      void saveDomainStore('bookings_trips', tripBookings);
    }
  }, [tripBookings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(IN_TRIP_REQUESTS_STORAGE_KEY, JSON.stringify(inTripRequests));
    } catch {
      // ignore storage errors
    }
    if (hydratedDomainsRef.current.inTripRequests) {
      void saveDomainStore('in_trip_requests', inTripRequests);
    }
  }, [inTripRequests]);

  useEffect(() => {
    try {
      window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    } catch {
      // ignore storage errors
    }
    if (hydratedDomainsRef.current.reviews) {
      void saveDomainStore('reviews', reviews);
    }
  }, [reviews]);

  useEffect(() => {
    try {
      window.localStorage.setItem(DRIVER_MISSIONS_STORAGE_KEY, JSON.stringify(driverMissions));
    } catch {
      // ignore storage errors
    }
    if (hydratedDomainsRef.current.driverMissions) {
      void saveDomainStore('driver_missions', driverMissions);
    }
  }, [driverMissions]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MAINTENANCE_BLOCKS_STORAGE_KEY, JSON.stringify(maintenanceBlocks));
    } catch {
      // ignore storage errors
    }
    if (hydratedDomainsRef.current.maintenanceBlocks) {
      void saveDomainStore('maintenance_blocks', maintenanceBlocks);
    }
  }, [maintenanceBlocks]);

  const [platformPricingSettings, setPlatformPricingSettings] = useState<PlatformPricingSettings>(
    () => {
      try {
        const raw = window.localStorage.getItem(PLATFORM_PRICING_SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PlatformPricingSettings>;
          if (parsed && typeof parsed === 'object') {
            return {
              serviceFee: {
                ...DEFAULT_PLATFORM_PRICING_SETTINGS.serviceFee,
                ...(parsed.serviceFee || {})
              },
              tax: {
                ...DEFAULT_PLATFORM_PRICING_SETTINGS.tax,
                ...(parsed.tax || {})
              },
              updatedAt: parsed.updatedAt || ''
            };
          }
        }
      } catch {
        // ignore storage errors
      }
      return DEFAULT_PLATFORM_PRICING_SETTINGS;
    }
  );

  // Platform-wide Audit Trail Store (القاعدة الثالثة)
  const { auditLogs, logAuditEvent, deleteAuditLogs } = useAuditLogStore();

  // Domain Stores
  const {
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
    syncEquipmentActivityLinks,
    renameCategoryPathPrefix
  } = useActivitiesStore(currentUser, logAuditEvent);

  const {
    trips,
    setTrips,
    saveTrip,
    deleteTrip,
    toggleTripStatus,
    removeTripEquipmentReference,
    renameTripCategoryPathPrefix
  } = useTripsStore(currentUser, logAuditEvent);

  const {
    registeredSuppliers,
    supplierJournals,
    allPlatformUsers,
    addRegisteredSupplier,
    recordPricingForSupplier,
    subscribeSupplierToPlatform
  } = useSupplierCustodyStore(
    currentUser,
    activities,
    setActivities,
    trips,
    setTrips,
    logAuditEvent
  );

  const {
    equipments,
    hasLoadedCatalogsFromDb,
    equipmentTypes,
    setEquipmentTypes,
    equipmentProperties,
    customTechnicalSpecs,
    setCustomTechnicalSpecs,
    partners,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    changeEquipmentStatus,
    changeEquipmentProperties,
    resetAllSpecsAndEquipmentCatalogs,
    createPartner,
    updatePartner,
    deletePartner
  } = useEquipmentsStore(currentUser, logAuditEvent);

  const {
    logisticsVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    changeVehicleStatus
  } = useLogisticsStore(currentUser, logAuditEvent);

  const {
    personProfiles,
    bilateralLedger,
    subscribedUsersFromProfiles,
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
    deleteBilateralLedgerEntry
  } = usePersonProfilesStore({
    currentUser,
    activities,
    setActivities,
    trips,
    setTrips,
    equipments,
    onCreateEquipment: createEquipment,
    onUpdateEquipment: updateEquipment,
    logisticsVehicles,
    onCreateVehicle: createVehicle,
    onUpdateVehicle: updateVehicle,
    partners,
    registeredSuppliers,
    onAuditLog: logAuditEvent
  });

  const basePlatformUsers = React.useMemo<AppUser[]>(() => {
    const map = new Map<string, AppUser>();
    allPlatformUsers.forEach((u) => map.set(u.id, u));
    subscribedUsersFromProfiles.forEach((u) => map.set(u.id, u));
    authStatus.accounts.forEach((u) => map.set(u.id, u));
    return Array.from(map.values());
  }, [allPlatformUsers, subscribedUsersFromProfiles, authStatus.accounts]);

  const {
    fixedTemplates,
    managedUsers,
    managedUsersAsAppUsers,
    addManagedUser,
    updateManagedUser,
    deleteManagedUser,
    updateFixedTemplate,
    applyFixedTemplateToUser,
    getAllowedNavKeysForUser,
    upsertCompanyCustomerFromClerk
  } = useUserPermissionsStore(currentUser, basePlatformUsers, logAuditEvent);

  const unifiedPlatformUsers = React.useMemo<AppUser[]>(() => {
    const map = new Map<string, AppUser>();
    basePlatformUsers.forEach((u) => map.set(u.id, u));
    managedUsersAsAppUsers.forEach((u) => map.set(u.id, u));
    return Array.from(map.values());
  }, [basePlatformUsers, managedUsersAsAppUsers]);

  const platformCompaniesForSignup = React.useMemo(() => {
    const byCompany = new Map<string, { id: string; companyName: string; ownerName: string }>();
    unifiedPlatformUsers.forEach((u) => {
      const role = resolveUserRoleKey(u);
      if (role === 'customer' || role === 'driver') return;
      const comp = (u.companyName || '').trim();
      if (!comp || byCompany.has(comp)) return;
      byCompany.set(comp, { id: u.id, companyName: comp, ownerName: u.name });
    });
    return Array.from(byCompany.values());
  }, [unifiedPlatformUsers]);

  const handleCompleteCustomerProfile = useCallback(
    (data: {
      name: string;
      phone: string;
      nationality: string;
      customerScope: 'platform' | 'company';
      registeredCompanyId?: string;
      registeredCompanyName?: string;
      registrationSource?: 'platform_signup' | 'company_page';
    }) => {
      const updatedUser: AppUser = {
        ...currentUser,
        name: data.name,
        phone: data.phone,
        nationality: data.nationality,
        customerScope: data.customerScope,
        registeredCompanyId:
          data.customerScope === 'company' ? data.registeredCompanyId : undefined,
        registeredCompanyName:
          data.customerScope === 'company' ? data.registeredCompanyName : undefined,
        registrationSource:
          data.registrationSource ||
          (data.customerScope === 'company' ? 'company_page' : 'platform_signup')
      };
      setCurrentUser(updatedUser);
      setCustomerCurrency(resolveAutoCurrencyByNationality(data.nationality));

      const existingManaged = managedUsers.find((m) => m.userId === currentUser.id);
      if (existingManaged) {
        updateManagedUser(
          currentUser.id,
          {
            personName: data.name,
            phone: data.phone,
            nationality: data.nationality,
            customerScope: data.customerScope,
            registeredCompanyId: updatedUser.registeredCompanyId,
            registeredCompanyName: updatedUser.registeredCompanyName,
            registrationSource: updatedUser.registrationSource
          },
          `استكمل العميل «${data.name}» تحديد الجنسية (${data.nationality}) ونطاق التسجيل (${data.customerScope === 'company' ? data.registeredCompanyName || 'شركة' : 'منصة'})`
        );
      } else {
        addManagedUser({
          personNumber: `CUS-${1001 + managedUsers.length}`,
          personName: data.name,
          phone: data.phone,
          companyName:
            data.customerScope === 'company'
              ? data.registeredCompanyName || 'عميل شركة'
              : 'عميل منصة زانوزا',
          nationality: data.nationality,
          customerScope: data.customerScope,
          registeredCompanyId: updatedUser.registeredCompanyId,
          registeredCompanyName: updatedUser.registeredCompanyName,
          registrationSource: updatedUser.registrationSource,
          fixedRole: 'customer',
          subscriptionType: 'customer_free',
          permissionMode: 'fixed_group'
        });
      }
    },
    [addManagedUser, currentUser, managedUsers, updateManagedUser]
  );

  // Lock customerCurrency automatically to registered nationality whenever a customer is active
  useEffect(() => {
    if (resolveUserRoleKey(currentUser) === 'customer' && currentUser.nationality) {
      const autoCurr = resolveAutoCurrencyByNationality(currentUser.nationality);
      if (customerCurrency !== autoCurr) {
        setCustomerCurrency(autoCurr);
      }
    }
  }, [currentUser, customerCurrency]);

  const currentUserAllowedNavKeys = React.useMemo(
    () => getAllowedNavKeysForUser(currentUser),
    [getAllowedNavKeysForUser, currentUser]
  );

  // Ensure currentNavKey respects the active user's role & custom permissions
  useEffect(() => {
    if (!canUserAccessNavKey(currentUser, currentNavKey, currentUserAllowedNavKeys)) {
      const preferred = getDefaultNavKeyForUser(currentUser);
      if (canUserAccessNavKey(currentUser, preferred, currentUserAllowedNavKeys)) {
        setCurrentNavKey(preferred);
      } else if (currentUserAllowedNavKeys && currentUserAllowedNavKeys.size > 0) {
        setCurrentNavKey(Array.from(currentUserAllowedNavKeys)[0] as NavigationItemKey);
      } else {
        setCurrentNavKey('customer_storefront');
      }
    }
  }, [currentUser, currentNavKey, currentUserAllowedNavKeys]);

  // Restore dynamically subscribed supplier / phone-claimed account if last selected before reload
  useEffect(() => {
    try {
      const savedUserId = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (savedUserId && savedUserId !== currentUser.id) {
        const matched = unifiedPlatformUsers.find((u) => u.id === savedUserId);
        if (matched) setCurrentUser(matched);
      }
    } catch {
      // ignore storage errors
    }
  }, [unifiedPlatformUsers]);

  const handleSaveActivityWithSupplierJournal = async (updated: Activity): Promise<Activity> => {
    const persisted = await saveActivity(updated);
    await recordPricingForSupplier({ entityType: 'activity', entity: persisted });
    return persisted;
  };

  const handleSaveTripWithSupplierJournal = async (updated: TripRecord): Promise<TripRecord> => {
    const persisted = await saveTrip(updated);
    await recordPricingForSupplier({ entityType: 'trip', entity: persisted });
    return persisted;
  };

  const handleSwitchToSubscribedUser = (user: AppUser) => {
    setIsEditingActivity(false);
    setIsEditingTrip(false);
    setPreviewActivity(null);
    setCurrentUser(user);
    setCurrentNavKey('activity_manage');
  };

  const handleRenameCategoryPathPrefix = (
    prevPath: string[],
    levelIndex: number,
    nextName: string
  ) => {
    renameCategoryPathPrefix(prevPath, levelIndex, nextName);
    renameTripCategoryPathPrefix(prevPath, levelIndex, nextName);
  };

  const {
    categoryTree,
    categoryRecords,
    handleCreateCategoryRecord,
    handleUpdateCategoryRecord,
    handleDeleteCategoryRecord,
    handleAddCategoryToTree,
    handleResetCategories
  } = useCategoriesStore(
    activities,
    hasLoadedActivitiesFromDb,
    handleRenameCategoryPathPrefix,
    currentUser,
    logAuditEvent
  );

  const {
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
  } = useFinanceStore(currentUser, logAuditEvent);

  const {
    ownerCostProfiles,
    saveCostProfile,
    deleteCostProfile,
    deleteMultipleCostProfiles
  } = useOperationalCostsStore(currentUser, logAuditEvent);

  useEffect(() => {
    ensureWalletsForParties(unifiedPlatformUsers, personProfiles);
  }, [ensureWalletsForParties, unifiedPlatformUsers, personProfiles]);

  const {
    platformResources,
    favoriteIds,
    favoriteResourceIds,
    favoriteEquipmentIds,
    favoriteLogisticsIds,
    favoriteFolders,
    userFavoritesCounts,
    totalFavoritesCount,
    handleToggleFavorite,
    handleToggleFavoriteResource,
    handleToggleFavoriteEquipment,
    handleToggleFavoriteLogistics,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleToggleItemInFolder,
    removeDeletedActivityFromAllUsers,
    removeDeletedEquipmentFromAllUsers,
    removeDeletedLogisticsFromAllUsers
  } = useFavoritesStore(
    currentUser,
    activities,
    hasLoadedActivitiesFromDb,
    equipments,
    hasLoadedCatalogsFromDb,
    logisticsVehicles,
    logAuditEvent
  );

  const {
    masterAddons,
    createMasterAddon,
    updateMasterAddon,
    deleteMasterAddon,
    resetMasterAddonsCatalog
  } = useMasterAddonsStore(currentUser, logAuditEvent);

  const {
    specGroups,
    inclusionsCatalog,
    equipmentUnitKinds,
    manufacturers,
    manufacturerModels,
    countriesRef,
    citiesRef,
    meetingPointsRef,
    createSpecGroup,
    updateSpecGroup,
    deleteSpecGroup,
    createInclusionItem,
    updateInclusionItem,
    deleteInclusionItem,
    createEquipmentUnitKind,
    updateEquipmentUnitKind,
    deleteEquipmentUnitKind,
    createManufacturer,
    updateManufacturer,
    deleteManufacturer,
    createManufacturerModel,
    updateManufacturerModel,
    deleteManufacturerModel,
    createCountryRef,
    updateCountryRef,
    deleteCountryRef,
    createCityRef,
    updateCityRef,
    deleteCityRef,
    createMeetingPointRef,
    updateMeetingPointRef,
    deleteMeetingPointRef,
    resetGroupsAndInclusionsCatalogs
  } = useMasterReferenceStore(currentUser, logAuditEvent);

  const {
    currentTheme,
    updateCurrentUserTheme,
    resetCurrentUserTheme
  } = useOwnerThemeStore(currentUser, logAuditEvent);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      '--zanoza-font',
      `'${currentTheme.fontFamily}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    );
    root.setAttribute('data-zanoza-template', currentTheme.templateId);
    root.setAttribute('data-zanoza-accent', currentTheme.colorPreset);
    root.setAttribute('data-zanoza-scale', currentTheme.fontScale);
    root.setAttribute('data-zanoza-radius', currentTheme.radiusMode);
  }, [currentTheme]);

  // Persist user & nav selection
  useEffect(() => {
    try {
      window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, currentUser.id);
    } catch {
      // ignore storage errors
    }
  }, [currentUser.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem('zanoza_current_nav_key_v1', currentNavKey);
    } catch {
      // ignore storage errors
    }
  }, [currentNavKey]);

  // Load persisted central pricing settings from server
  useEffect(() => {
    let active = true;
    fetch('/api/pricing-settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { settings?: PlatformPricingSettings | null } | null) => {
        if (!active || !data?.settings) return;
        const normalized: PlatformPricingSettings = {
          serviceFee: {
            ...DEFAULT_PLATFORM_PRICING_SETTINGS.serviceFee,
            ...(data.settings.serviceFee || {}),
            feeType: data.settings.serviceFee?.feeType === 'fixed' ? 'fixed' : 'percentage'
          },
          tax: {
            ...DEFAULT_PLATFORM_PRICING_SETTINGS.tax,
            ...(data.settings.tax || {})
          },
          updatedAt: data.settings.updatedAt || ''
        };
        setPlatformPricingSettings(normalized);
        try {
          window.localStorage.setItem(PLATFORM_PRICING_SETTINGS_KEY, JSON.stringify(normalized));
        } catch {
          // ignore storage errors
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const handleSavePlatformPricingSettings = async (next: PlatformPricingSettings) => {
    setPlatformPricingSettings(next);
    logAuditEvent({
      actor: currentUser,
      action: 'update',
      domain: 'pricing',
      entityId: 'platform-pricing-settings',
      entityName: 'إعدادات رسوم المنصة والضرائب',
      summary: `حدّث ${currentUser.name} إعدادات رسوم الخدمة والضرائب في أداة التسعير`
    });
    try {
      window.localStorage.setItem(PLATFORM_PRICING_SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
    try {
      const res = await fetch('/api/pricing-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: next })
      });
      if (res.ok) {
        const data = (await res.json()) as { settings?: PlatformPricingSettings };
        if (data.settings) {
          setPlatformPricingSettings(data.settings);
          try {
            window.localStorage.setItem(
              PLATFORM_PRICING_SETTINGS_KEY,
              JSON.stringify(data.settings)
            );
          } catch {
            // ignore storage errors
          }
        }
      }
    } catch {
      // localStorage already updated
    }
  };

  // Audited state setters for Collections, Pricing Properties & Custom Technical Specs
  const handleSetActivityCollections: React.Dispatch<React.SetStateAction<ActivityCollection[]>> = (
    updater
  ) => {
    setActivityCollections((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const prevIds = new Set(prev.map((c) => c.id));
      const nextIds = new Set(next.map((c) => c.id));
      next.forEach((c) => {
        if (!prevIds.has(c.id)) {
          logAuditEvent({
            actor: currentUser,
            action: 'create',
            domain: 'collection',
            entityId: c.id,
            entityName: c.name,
            summary: `أضاف ${currentUser.name} مجموعة/باقة «${c.name}»`
          });
        } else {
          const old = prev.find((p) => p.id === c.id);
          if (old && JSON.stringify(old) !== JSON.stringify(c)) {
            logAuditEvent({
              actor: currentUser,
              action: 'update',
              domain: 'collection',
              entityId: c.id,
              entityName: c.name,
              summary: `عدّل ${currentUser.name} المجموعة/الباقة «${c.name}»`
            });
          }
        }
      });
      prev.forEach((c) => {
        if (!nextIds.has(c.id)) {
          logAuditEvent({
            actor: currentUser,
            action: 'delete',
            domain: 'collection',
            entityId: c.id,
            entityName: c.name,
            summary: `حذف ${currentUser.name} المجموعة/الباقة «${c.name}»`
          });
        }
      });
      return next;
    });
  };

  const handleSetPricingProperties: React.Dispatch<React.SetStateAction<PricingPropertyItem[]>> = (
    updater
  ) => {
    setPricingProperties((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const prevIds = new Set(prev.map((p) => p.id));
      const nextIds = new Set(next.map((p) => p.id));
      next.forEach((p) => {
        const propName = p.displayLabel || p.categoryLabel;
        if (!prevIds.has(p.id)) {
          logAuditEvent({
            actor: currentUser,
            action: 'create',
            domain: 'pricing',
            entityId: p.id,
            entityName: propName,
            summary: `أضاف ${currentUser.name} خاصية سعر «${propName}»`
          });
        } else {
          const old = prev.find((o) => o.id === p.id);
          if (old && JSON.stringify(old) !== JSON.stringify(p)) {
            logAuditEvent({
              actor: currentUser,
              action: 'update',
              domain: 'pricing',
              entityId: p.id,
              entityName: propName,
              summary: `عدّل ${currentUser.name} خاصية السعر «${propName}»`
            });
          }
        }
      });
      prev.forEach((p) => {
        if (!nextIds.has(p.id)) {
          const propName = p.displayLabel || p.categoryLabel;
          logAuditEvent({
            actor: currentUser,
            action: 'delete',
            domain: 'pricing',
            entityId: p.id,
            entityName: propName,
            summary: `حذف ${currentUser.name} خاصية السعر «${propName}»`
          });
        }
      });
      return next;
    });
  };

  const handleSetCustomTechnicalSpecs: React.Dispatch<
    React.SetStateAction<typeof customTechnicalSpecs>
  > = (updater) => {
    setCustomTechnicalSpecs((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const prevIds = new Set(prev.map((s) => s.id));
      const nextIds = new Set(next.map((s) => s.id));
      next.forEach((s) => {
        if (!prevIds.has(s.id)) {
          logAuditEvent({
            actor: currentUser,
            action: 'create',
            domain: 'equipment_property',
            entityId: s.id,
            entityName: s.label,
            summary: `أضاف ${currentUser.name} مواصفة فنية مخصصة «${s.label}»`
          });
        } else {
          const old = prev.find((o) => o.id === s.id);
          if (old && JSON.stringify(old) !== JSON.stringify(s)) {
            logAuditEvent({
              actor: currentUser,
              action: 'update',
              domain: 'equipment_property',
              entityId: s.id,
              entityName: s.label,
              summary: `عدّل ${currentUser.name} المواصفة الفنية «${s.label}»`
            });
          }
        }
      });
      prev.forEach((s) => {
        if (!nextIds.has(s.id)) {
          logAuditEvent({
            actor: currentUser,
            action: 'delete',
            domain: 'equipment_property',
            entityId: s.id,
            entityName: s.label,
            summary: `حذف ${currentUser.name} المواصفة الفنية «${s.label}»`
          });
        }
      });
      return next;
    });
  };

  // Coordinated Cross-Domain Handlers
  const handleNavSelect = (key: NavigationItemKey) => {
    if (key !== 'activity_add' && pausedEquipmentDraftForActivity) {
      setPausedEquipmentDraftForActivity(null);
    }
    setIsEditingActivity(false);
    setIsEditingTrip(false);
    setPreviewActivity(null);
    setCurrentNavKey(key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewActivity = (presetCategory?: string | string[]) => {
    const blank = buildBlankActivityForUser(currentUser);
    const presetPath = Array.isArray(presetCategory)
      ? presetCategory
      : presetCategory
      ? [presetCategory]
      : [];
    const prepared: Activity =
      presetPath.length > 0 ? { ...blank, categoryPath: presetPath } : blank;
    setSelectedActivityForEdit(prepared);
    setIsEditingActivity(true);
    setCurrentNavKey('activity_add');
  };

  const handleOpenAddActivityFromEquipment = (
    draftItem: EquipmentItem,
    isNew: boolean,
    returnToNav: NavigationItemKey,
    presetCategoryPath: string[]
  ) => {
    setPausedEquipmentDraftForActivity({
      item: draftItem,
      isNew,
      returnToNav
    });
    const blank = buildBlankActivityForUser(currentUser);
    const prepared: Activity = {
      ...blank,
      categoryPath: presetCategoryPath.length > 0 ? presetCategoryPath : blank.categoryPath,
      equipmentIds: !isNew && draftItem.id ? [draftItem.id] : []
    };
    setSelectedActivityForEdit(prepared);
    setIsEditingActivity(true);
    setCurrentNavKey('activity_add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToEquipmentFromActivity = (persistedActivity?: Activity) => {
    if (!pausedEquipmentDraftForActivity) return;
    const { item, isNew, returnToNav } = pausedEquipmentDraftForActivity;
    const nextLinkedIds = persistedActivity
      ? Array.from(new Set([...(item.linkedActivityIds || []), persistedActivity.id]))
      : item.linkedActivityIds || [];
    setRestoredEquipmentDraftFromActivity({
      item: {
        ...item,
        linkedActivityIds: nextLinkedIds
      },
      isNew
    });
    setPausedEquipmentDraftForActivity(null);
    setSelectedActivityForEdit(null);
    setCurrentNavKey(returnToNav);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewTrip = (_presetCategory?: string) => {
    const blank = buildBlankTripForUser(currentUser);
    setSelectedTripForEdit(blank);
    setIsEditingTrip(true);
    setCurrentNavKey('trip_add');
  };

  const handleDeleteActivity = (activityId: string) => {
    deleteActivity(activityId);
    setSelectedCompareIds((prev) => prev.filter((id) => id !== activityId));
    removeDeletedActivityFromAllUsers(activityId);
  };

  const handleDeleteTrip = (tripId: string) => {
    deleteTrip(tripId);
    removeDeletedActivityFromAllUsers(tripId);
  };

  const handleDeleteEquipment = (equipmentId: string) => {
    deleteEquipment(equipmentId);
    removeEquipmentReference(equipmentId);
    removeTripEquipmentReference(equipmentId);
    removeDeletedEquipmentFromAllUsers(equipmentId);
  };

  const handleDeleteLogisticsVehicle = (vehicleId: string) => {
    deleteVehicle(vehicleId);
    removeDeletedLogisticsFromAllUsers(vehicleId);
  };

  const handleToggleCompare = (activity: Activity) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(activity.id)) return prev.filter((id) => id !== activity.id);
      if (prev.length >= 3) return [...prev.slice(1), activity.id];
      return [...prev, activity.id];
    });
  };

  const runFinanceSyncForBooking = useCallback(
    (
      booking: BookingRequest | TripBooking,
      bookingKind: 'activity_booking' | 'trip_booking',
      cancelReason?: string
    ) => {
      const entityId = 'activityId' in booking ? booking.activityId : undefined;
      const entityTitle = 'activityName' in booking ? booking.activityName : booking.tripTitle;
      const matchedActivity =
        bookingKind === 'activity_booking'
          ? activities.find((a) => a.id === entityId || a.name === entityTitle)
          : trips.find((t) => t.id === entityId || t.name === entityTitle) ||
            activities.find((a) => a.id === entityId || a.name === entityTitle);
      const costProfile = ownerCostProfiles.find(
        (p) => p.entityId === (matchedActivity?.id || entityId)
      );

      const allocation = computeBookingPartnerAllocations({
        booking,
        bookingKind,
        activity: matchedActivity,
        costProfile,
        equipments,
        logisticsVehicles,
        personProfiles,
        users: unifiedPlatformUsers,
        wallets,
        platformPricingSettings
      });

      syncBookingFinance(allocation);

      const isCancelledOrRejected =
        booking.status === 'rejected' ||
        booking.status === 'auto_cancelled' ||
        booking.status === 'cancelled';

      if (isCancelledOrRejected && allocation.paidNowEGP <= 0) {
        void reverseBookingPartnerLedgerEntries(
          booking.id,
          cancelReason || booking.rejectionReason || 'إلغاء الحجز ورد المستحقات'
        );
      } else if (allocation.paidNowEGP > 0) {
        void syncBookingPartnerLedgerEntries(allocation);
      }
    },
    [
      activities,
      equipments,
      logisticsVehicles,
      ownerCostProfiles,
      personProfiles,
      platformPricingSettings,
      reverseBookingPartnerLedgerEntries,
      syncBookingFinance,
      syncBookingPartnerLedgerEntries,
      trips,
      unifiedPlatformUsers,
      wallets
    ]
  );

  const restoreActivitySlotOnCancel = useCallback((req: BookingRequest) => {
    const totalPax = req.adultsCount + req.childrenCount + req.infantsCount;
    setActivities((prev) =>
      prev.map((act) => {
        if (act.id !== req.activityId && act.name !== req.activityName) return act;
        const updatedAct: Activity = {
          ...act,
          slots: act.slots.map((slot) => {
            if (slot.timeLabel !== req.slotLabel) return slot;
            const newBooked = Math.max(0, slot.bookedCount - totalPax);
            return {
              ...slot,
              bookedCount: newBooked,
              availableCount: Math.min(slot.maxCapacity, Math.max(0, slot.maxCapacity - newBooked))
            };
          }),
          stats: {
            ...act.stats,
            bookingsCount: Math.max(0, (act.stats.bookingsCount || 0) - 1),
            revenueEGP: Math.max(0, (act.stats.revenueEGP || 0) - (req.totalPriceEGP || 0)),
            revenueEUR: Math.max(
              0,
              Number(((act.stats.revenueEUR || 0) - (req.totalPriceEUR || 0)).toFixed(2))
            )
          }
        };
        void saveActivityToDb(updatedAct);
        return updatedAct;
      })
    );
  }, [setActivities]);

  const updateTripSlotsAndStats = useCallback(
    (tb: TripBooking, deltaSign: 1 | -1) => {
      const totalPax = tb.adultsCount + tb.childrenCount + tb.infantsCount;
      setTrips((prev) =>
        prev.map((trp) => {
          if (trp.id !== tb.activityId && trp.name !== tb.tripTitle) return trp;
          const updatedTrip: TripRecord = {
            ...trp,
            slots: trp.slots.map((slot) => {
              if (slot.timeLabel !== tb.departureTime) return slot;
              const newBooked = Math.max(0, slot.bookedCount + deltaSign * totalPax);
              return {
                ...slot,
                bookedCount: newBooked,
                availableCount: Math.min(
                  slot.maxCapacity,
                  Math.max(0, slot.maxCapacity - newBooked)
                )
              };
            }),
            stats: {
              ...trp.stats,
              bookingsCount: Math.max(0, (trp.stats.bookingsCount || 0) + deltaSign),
              revenueEGP: Math.max(
                0,
                (trp.stats.revenueEGP || 0) + deltaSign * (tb.totalPriceEGP || 0)
              ),
              revenueEUR: Math.max(
                0,
                Number(
                  ((trp.stats.revenueEUR || 0) + deltaSign * (tb.totalPriceEUR || 0)).toFixed(2)
                )
              )
            }
          };
          void saveTripToDb(updatedTrip);
          return updatedTrip;
        })
      );
    },
    [setTrips]
  );

  const handleApproveBooking = (req: BookingRequest) => {
    const approvedBooking: BookingRequest = { ...req, status: 'approved' };
    setActivityBookings((prev) =>
      prev.map((r) => (r.id === req.id ? approvedBooking : r))
    );
    logAuditEvent({
      actor: currentUser,
      action: 'approve',
      domain: 'booking',
      entityId: req.id,
      entityName: req.activityName,
      summary: `اعتمد ${currentUser.name} حجز النشاط «${req.activityName}» للعميل ${req.customerName}`
    });
    setActivities((prev) =>
      prev.map((act) => {
        if (act.id !== req.activityId) return act;
        const totalPax = req.adultsCount + req.childrenCount + req.infantsCount;
        const updatedAct: Activity = {
          ...act,
          slots: act.slots.map((slot) => {
            if (slot.timeLabel !== req.slotLabel) return slot;
            const newBooked = slot.bookedCount + totalPax;
            return {
              ...slot,
              bookedCount: newBooked,
              availableCount: Math.max(0, slot.maxCapacity - newBooked)
            };
          }),
          stats: {
            ...act.stats,
            bookingsCount: act.stats.bookingsCount + 1,
            revenueEGP: act.stats.revenueEGP + req.totalPriceEGP,
            revenueEUR: act.stats.revenueEUR + req.totalPriceEUR
          }
        };
        void saveActivityToDb(updatedAct);
        return updatedAct;
      })
    );
    runFinanceSyncForBooking(approvedBooking, 'activity_booking');
  };

  const handleRejectBooking = (bookingId: string, reason: string) => {
    const target = activityBookings.find((r) => r.id === bookingId);
    if (!target) return;
    const paidEGP =
      target.paymentStatus === 'paid'
        ? target.totalPriceEGP
        : target.paymentStatus === 'deposit'
          ? target.depositAmountEGP ?? Math.round((target.totalPriceEGP || 0) * 0.3)
          : 0;
    const paidEUR =
      target.paymentStatus === 'paid'
        ? target.totalPriceEUR
        : target.paymentStatus === 'deposit'
          ? target.depositAmountEUR ?? Number(((target.totalPriceEUR || 0) * 0.3).toFixed(2))
          : 0;
    const hasPaid = paidEGP > 0 || paidEUR > 0;
    const updatedRejected: BookingRequest = {
      ...target,
      status: 'rejected',
      rejectionReason: reason,
      ...(hasPaid
        ? {
            refundStatus: 'full_refund_pending',
            refundAmountEGP: paidEGP,
            refundAmountEUR: paidEUR,
            cancellationPolicySummary: 'تم رفض الحجز من الإدارة — استرداد كامل للمبلغ المدفوع'
          }
        : {})
    };
    setActivityBookings((prev) =>
      prev.map((r) => (r.id === bookingId ? updatedRejected : r))
    );
    logAuditEvent({
      actor: currentUser,
      action: 'reject',
      domain: 'booking',
      entityId: bookingId,
      entityName: target.activityName || bookingId,
      summary: `رفض ${currentUser.name} حجز النشاط «${target.activityName || bookingId}»`,
      details: reason ? `السبب: ${reason}` : undefined
    });
    runFinanceSyncForBooking(updatedRejected, 'activity_booking', reason);
  };

  const handleCreateCustomerBooking = (booking: BookingRequest) => {
    setActivityBookings((prev) =>
      prev.some((b) => b.id === booking.id) ? prev : [booking, ...prev]
    );
    logAuditEvent({
      actor: currentUser,
      action: 'create',
      domain: 'booking',
      entityId: booking.id,
      entityName: booking.activityName,
      summary: `حجز مباشر من بوابة العملاء (#${booking.bookingCode}) للعميل «${booking.customerName}»`
    });
    if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'deposit') {
      runFinanceSyncForBooking(booking, 'activity_booking');
    }
    if (!booking.id.startsWith('pub-req-')) {
      void fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      }).catch(() => undefined);
    }
  };

  const handleCreateTripBooking = (tripBooking: TripBooking) => {
    setTripBookings((prev) =>
      prev.some((tb) => tb.id === tripBooking.id) ? prev : [tripBooking, ...prev]
    );
    logAuditEvent({
      actor: currentUser,
      action: 'create',
      domain: 'booking',
      entityId: tripBooking.id,
      entityName: tripBooking.tripTitle,
      summary: `حجز رحلة مباشر من بوابة العملاء (#${tripBooking.bookingCode}) للعميل «${tripBooking.customerName}»`
    });
    if (tripBooking.paymentStatus === 'paid' || tripBooking.paymentStatus === 'deposit') {
      runFinanceSyncForBooking(tripBooking, 'trip_booking');
    }
  };

  const handleCancelCustomerBooking = async (
    bookingId: string,
    reason: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const target = activityBookings.find((b) => b.id === bookingId);
    if (target?.status === 'auto_cancelled') {
      return { ok: true };
    }
    const cleanReason = reason.trim() || 'تم الإلغاء بواسطة العميل من بوابة الحجوزات';
    const act = target ? activities.find((a) => a.id === target.activityId) : undefined;
    const paidEGP =
      target?.paymentStatus === 'paid'
        ? target.totalPriceEGP
        : target?.paymentStatus === 'deposit'
          ? target.depositAmountEGP ?? Math.round((target.totalPriceEGP || 0) * 0.3)
          : 0;
    const paidEUR =
      target?.paymentStatus === 'paid'
        ? target.totalPriceEUR
        : target?.paymentStatus === 'deposit'
          ? target.depositAmountEUR ?? Number(((target.totalPriceEUR || 0) * 0.3).toFixed(2))
          : 0;
    const localEval = target
      ? evaluateCancellationRefund({
          policy: act?.cancellationPolicy,
          tripDate: target.tripDate,
          slotLabel: target.slotLabel,
          paidAmountEGP: paidEGP,
          paidAmountEUR: paidEUR
        })
      : null;

    if (target && (target.status === 'approved' || target.status === 'completed')) {
      restoreActivitySlotOnCancel(target);
    }

    const cancelledBooking: BookingRequest | null = target
      ? {
          ...target,
          status: 'auto_cancelled',
          rejectionReason: cleanReason,
          ...(localEval
            ? {
                refundStatus:
                  paidEGP <= 0 && paidEUR <= 0
                    ? 'none'
                    : localEval.tier === 'full'
                      ? 'full_refund_pending'
                      : localEval.tier === 'partial'
                        ? 'partial_refund_pending'
                        : 'none',
                refundAmountEGP: localEval.refundAmountEGP,
                refundAmountEUR: localEval.refundAmountEUR,
                cancellationPolicySummary: localEval.summaryAr
              }
            : {})
        }
      : null;

    if (cancelledBooking) {
      setActivityBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? cancelledBooking : b))
      );
      runFinanceSyncForBooking(cancelledBooking, 'activity_booking', cleanReason);
    }
    logAuditEvent({
      actor: currentUser,
      action: 'status_change',
      domain: 'booking',
      entityId: bookingId,
      entityName: target?.activityName || bookingId,
      summary: `ألغى العميل «${target?.customerName || currentUser.name}» الحجز (#${target?.bookingCode || bookingId})`,
      details: cleanReason
    });

    try {
      const res = await fetch(`/api/public/bookings/${encodeURIComponent(bookingId)}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: target?.customerPhone || currentUser.phone,
          bookingCode: target?.bookingCode,
          reason: cleanReason
        })
      });
      if (res.ok) {
        const data = (await res.json()) as { booking?: BookingRequest };
        if (data.booking) {
          const merged = target ? { ...target, ...data.booking } : data.booking;
          setActivityBookings((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, ...data.booking } : b))
          );
          runFinanceSyncForBooking(merged, 'activity_booking', cleanReason);
        }
      }
      return { ok: true };
    } catch {
      return { ok: true };
    }
  };

  const handleCancelTripBooking = async (
    tripBookingId: string,
    reason: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const target = tripBookings.find((tb) => tb.id === tripBookingId);
    if (target?.status === 'cancelled') {
      return { ok: true };
    }
    const cleanReason = reason.trim() || 'تم الإلغاء بواسطة العميل من بوابة الحجوزات';
    const trp = target
      ? trips.find((t) => t.id === target.activityId || t.name === target.tripTitle)
      : undefined;
    const paidEGP =
      target?.paymentStatus === 'paid'
        ? target.totalPriceEGP
        : target?.paymentStatus === 'deposit'
          ? target.depositAmountEGP ?? Math.round((target.totalPriceEGP || 0) * 0.3)
          : 0;
    const paidEUR =
      target?.paymentStatus === 'paid'
        ? target.totalPriceEUR
        : target?.paymentStatus === 'deposit'
          ? target.depositAmountEUR ?? Number(((target.totalPriceEUR || 0) * 0.3).toFixed(2))
          : 0;
    const localEval = target
      ? evaluateCancellationRefund({
          policy: trp?.cancellationPolicy,
          tripDate: target.departureDate,
          slotLabel: target.departureTime,
          paidAmountEGP: paidEGP,
          paidAmountEUR: paidEUR
        })
      : null;

    if (target && (target.status === 'confirmed' || target.status === 'completed')) {
      updateTripSlotsAndStats(target, -1);
    }

    const cancelledTrip: TripBooking | null = target
      ? {
          ...target,
          status: 'cancelled',
          rejectionReason: cleanReason,
          ...(localEval
            ? {
                refundStatus:
                  paidEGP <= 0 && paidEUR <= 0
                    ? 'none'
                    : localEval.tier === 'full'
                      ? 'full_refund_pending'
                      : localEval.tier === 'partial'
                        ? 'partial_refund_pending'
                        : 'none',
                refundAmountEGP: localEval.refundAmountEGP,
                refundAmountEUR: localEval.refundAmountEUR,
                cancellationPolicySummary: localEval.summaryAr
              }
            : {})
        }
      : null;

    if (cancelledTrip) {
      setTripBookings((prev) =>
        prev.map((tb) => (tb.id === tripBookingId ? cancelledTrip : tb))
      );
      runFinanceSyncForBooking(cancelledTrip, 'trip_booking', cleanReason);
    }
    logAuditEvent({
      actor: currentUser,
      action: 'status_change',
      domain: 'booking',
      entityId: tripBookingId,
      entityName: target?.tripTitle || tripBookingId,
      summary: `ألغى العميل «${target?.customerName || currentUser.name}» حجز الرحلة (#${target?.bookingCode || tripBookingId})`,
      details: cleanReason
    });

    try {
      const res = await fetch(
        `/api/public/trip-bookings/${encodeURIComponent(tripBookingId)}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerPhone: target?.customerPhone || currentUser.phone,
            bookingCode: target?.bookingCode,
            reason: cleanReason
          })
        }
      );
      if (res.ok) {
        const data = (await res.json()) as { tripBooking?: TripBooking };
        if (data.tripBooking) {
          const merged = target ? { ...target, ...data.tripBooking } : data.tripBooking;
          setTripBookings((prev) =>
            prev.map((tb) => (tb.id === tripBookingId ? { ...tb, ...data.tripBooking } : tb))
          );
          runFinanceSyncForBooking(merged, 'trip_booking', cleanReason);
        }
      }
      return { ok: true };
    } catch {
      return { ok: true };
    }
  };

  const handleOwnerCancelActivityBooking = (req: BookingRequest, reason: string) => {
    if (req.status === 'auto_cancelled') return;
    const cleanReason = reason.trim() || 'إلغاء إداري من مالك النشاط';
    if (req.status === 'approved' || req.status === 'completed') {
      restoreActivitySlotOnCancel(req);
    }
    const paidEGP =
      req.paymentStatus === 'paid'
        ? req.totalPriceEGP
        : req.paymentStatus === 'deposit'
          ? req.depositAmountEGP ?? Math.round((req.totalPriceEGP || 0) * 0.3)
          : 0;
    const paidEUR =
      req.paymentStatus === 'paid'
        ? req.totalPriceEUR
        : req.paymentStatus === 'deposit'
          ? req.depositAmountEUR ?? Number(((req.totalPriceEUR || 0) * 0.3).toFixed(2))
          : 0;
    const hasPaid = paidEGP > 0 || paidEUR > 0;
    const updated: BookingRequest = {
      ...req,
      status: 'auto_cancelled',
      rejectionReason: cleanReason,
      refundStatus: hasPaid ? 'full_refund_pending' : 'none',
      refundAmountEGP: paidEGP,
      refundAmountEUR: paidEUR,
      cancellationPolicySummary: hasPaid
        ? 'إلغاء من مزوّد الخدمة — استرداد كامل للمبلغ المدفوع'
        : 'إلغاء من مزوّد الخدمة (حجز غير مدفوع)'
    };
    setActivityBookings((prev) => prev.map((b) => (b.id === req.id ? updated : b)));
    runFinanceSyncForBooking(updated, 'activity_booking', cleanReason);
    logAuditEvent({
      actor: currentUser,
      action: 'status_change',
      domain: 'booking',
      entityId: req.id,
      entityName: req.activityName,
      summary: `ألغى ${currentUser.name} حجز النشاط (#${req.bookingCode}) وتم استرداد المقاعد وتسوية المستحقات`,
      details: cleanReason
    });
  };

  const handleOwnerCancelTripBooking = (tb: TripBooking, reason: string) => {
    if (tb.status === 'cancelled') return;
    const cleanReason = reason.trim() || 'إلغاء إداري من مشغل الرحلة';
    if (tb.status === 'confirmed' || tb.status === 'completed') {
      updateTripSlotsAndStats(tb, -1);
    }
    const paidEGP =
      tb.paymentStatus === 'paid'
        ? tb.totalPriceEGP
        : tb.paymentStatus === 'deposit'
          ? tb.depositAmountEGP ?? Math.round((tb.totalPriceEGP || 0) * 0.3)
          : 0;
    const paidEUR =
      tb.paymentStatus === 'paid'
        ? tb.totalPriceEUR
        : tb.paymentStatus === 'deposit'
          ? tb.depositAmountEUR ?? Number(((tb.totalPriceEUR || 0) * 0.3).toFixed(2))
          : 0;
    const hasPaid = paidEGP > 0 || paidEUR > 0;
    const updated: TripBooking = {
      ...tb,
      status: 'cancelled',
      rejectionReason: cleanReason,
      refundStatus: hasPaid ? 'full_refund_pending' : 'none',
      refundAmountEGP: paidEGP,
      refundAmountEUR: paidEUR,
      cancellationPolicySummary: hasPaid
        ? 'إلغاء من مزوّد الخدمة — استرداد كامل للمبلغ المدفوع'
        : 'إلغاء من مزوّد الخدمة (حجز غير مدفوع)'
    };
    setTripBookings((prev) => prev.map((item) => (item.id === tb.id ? updated : item)));
    runFinanceSyncForBooking(updated, 'trip_booking', cleanReason);
    logAuditEvent({
      actor: currentUser,
      action: 'status_change',
      domain: 'booking',
      entityId: tb.id,
      entityName: tb.tripTitle,
      summary: `ألغى ${currentUser.name} حجز الرحلة (#${tb.bookingCode}) وتم استرداد المقاعد وتسوية المستحقات`,
      details: cleanReason
    });
  };

  const handleSettleBookingRefund = (
    bookingId: string,
    kind: 'activity_booking' | 'trip_booking'
  ) => {
    if (kind === 'activity_booking') {
      setActivityBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, refundStatus: 'refund_settled' } : b))
      );
    } else {
      setTripBookings((prev) =>
        prev.map((tb) => (tb.id === bookingId ? { ...tb, refundStatus: 'refund_settled' } : tb))
      );
    }
    markAllocationRefundSettled(bookingId);
    logAuditEvent({
      actor: currentUser,
      action: 'approve',
      domain: 'finance',
      entityId: bookingId,
      entityName: `استرداد الحجز ${bookingId}`,
      summary: `أكد ${currentUser.name} إتمام رد المستحقات المالية للحجز (${bookingId})`
    });
  };

  const handleTripBookingStatusUpdated = (
    updatedTripBooking: TripBooking,
    previousStatus: TripBooking['status']
  ) => {
    if (
      previousStatus === 'pending_approval' &&
      (updatedTripBooking.status === 'confirmed' || updatedTripBooking.status === 'completed')
    ) {
      updateTripSlotsAndStats(updatedTripBooking, 1);
    } else if (
      (previousStatus === 'confirmed' || previousStatus === 'completed') &&
      updatedTripBooking.status === 'cancelled'
    ) {
      updateTripSlotsAndStats(updatedTripBooking, -1);
    }
    runFinanceSyncForBooking(updatedTripBooking, 'trip_booking');
  };

  const handleRescheduleCustomerBooking = async (
    bookingId: string,
    tripDate: string,
    slotLabel: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const target = activityBookings.find((b) => b.id === bookingId);
    try {
      const res = await fetch(`/api/public/bookings/${encodeURIComponent(bookingId)}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: target?.customerPhone || currentUser.phone,
          bookingCode: target?.bookingCode,
          tripDate,
          slotLabel
        })
      });
      if (!res.ok && res.status === 400) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        return { ok: false, error: err?.error || 'الموعد المختار غير متاح.' };
      }
    } catch {
      // fall through to local optimistic state when offline
    }

    setActivityBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              tripDate,
              slotLabel,
              status: 'pending_approval',
              rejectionReason: undefined
            }
          : b
      )
    );
    logAuditEvent({
      actor: currentUser,
      action: 'update',
      domain: 'booking',
      entityId: bookingId,
      entityName: target?.activityName || bookingId,
      summary: `عدّل العميل «${target?.customerName || currentUser.name}» موعد الحجز (#${target?.bookingCode || bookingId}) إلى ${tripDate} · ${slotLabel}`
    });
    return { ok: true };
  };

  const handleRescheduleTripBooking = async (
    tripBookingId: string,
    departureDate: string,
    departureTime: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const target = tripBookings.find((tb) => tb.id === tripBookingId);
    try {
      const res = await fetch(
        `/api/public/trip-bookings/${encodeURIComponent(tripBookingId)}/reschedule`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerPhone: target?.customerPhone || currentUser.phone,
            bookingCode: target?.bookingCode,
            departureDate,
            departureTime
          })
        }
      );
      if (!res.ok && res.status === 400) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        return { ok: false, error: err?.error || 'الموعد المختار غير متاح.' };
      }
    } catch {
      // fall through to local optimistic state when offline
    }

    setTripBookings((prev) =>
      prev.map((tb) =>
        tb.id === tripBookingId
          ? {
              ...tb,
              departureDate,
              departureTime,
              status: 'pending_approval',
              rejectionReason: undefined
            }
          : tb
      )
    );
    logAuditEvent({
      actor: currentUser,
      action: 'update',
      domain: 'booking',
      entityId: tripBookingId,
      entityName: target?.tripTitle || tripBookingId,
      summary: `عدّل العميل «${target?.customerName || currentUser.name}» موعد الرحلة (#${target?.bookingCode || tripBookingId}) إلى ${departureDate} · ${departureTime}`
    });
    return { ok: true };
  };

  const handleCompleteActivityBooking = (req: BookingRequest) => {
    const completedBooking: BookingRequest = {
      ...req,
      status: 'completed',
      paymentStatus: 'paid'
    };
    setActivityBookings((prev) =>
      prev.map((r) => (r.id === req.id ? completedBooking : r))
    );
    logAuditEvent({
      actor: currentUser,
      action: 'status_change',
      domain: 'booking',
      entityId: req.id,
      entityName: req.activityName,
      summary: `أكد ${currentUser.name} تأدية وإتمام النشاط «${req.activityName}» للعميل ${req.customerName} (#${req.bookingCode})`
    });
    runFinanceSyncForBooking(completedBooking, 'activity_booking');
  };

  const handleAddCustomerReview = (review: CustomerReviewRecord) => {
    setReviews((prev) =>
      prev.some((r) => r.id === review.id) ? prev : [review, ...prev]
    );
    logAuditEvent({
      actor: currentUser,
      action: 'create',
      domain: 'activity',
      entityId: review.id,
      entityName: review.targetTitle,
      summary: `أضاف العميل «${review.customerName}» تقييم (${review.rating}/5) على «${review.targetTitle}»`
    });
  };

  const handleUpdateDriverMissionStatus = (
    bookingId: string,
    bookingKind: 'activity_booking' | 'trip_booking',
    status: DriverMissionStatus
  ) => {
    const updatedAt = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
    setDriverMissions((prev) => {
      const existing = prev.find((m) => m.bookingId === bookingId);
      if (existing) {
        return prev.map((m) =>
          m.bookingId === bookingId
            ? { ...m, status, assignedDriverName: currentUser.name, updatedAt }
            : m
        );
      }
      const next: DriverMissionRecord = {
        bookingId,
        bookingKind,
        status,
        assignedDriverName: currentUser.name,
        updatedAt
      };
      return [next, ...prev];
    });
    if (status === 'completed') {
      if (bookingKind === 'activity_booking') {
        const existing = activityBookings.find((b) => b.id === bookingId);
        if (existing && (existing.status === 'approved' || existing.status === 'completed')) {
          const completed: BookingRequest = {
            ...existing,
            status: 'completed',
            paymentStatus: 'paid'
          };
          setActivityBookings((prev) => prev.map((b) => (b.id === bookingId ? completed : b)));
          runFinanceSyncForBooking(completed, 'activity_booking');
        }
      } else {
        const existing = tripBookings.find((tb) => tb.id === bookingId);
        if (existing && (existing.status === 'confirmed' || existing.status === 'completed')) {
          const completed: TripBooking = {
            ...existing,
            status: 'completed',
            paymentStatus: 'paid'
          };
          setTripBookings((prev) => prev.map((tb) => (tb.id === bookingId ? completed : tb)));
          runFinanceSyncForBooking(completed, 'trip_booking');
        }
      }
    }
    logAuditEvent({
      actor: currentUser,
      action: 'status_change',
      domain: 'logistics',
      entityId: bookingId,
      entityName: `مهمة توصيل ${bookingId}`,
      summary: `حدّث السائق/المندوب ${currentUser.name} حالة المهمة الميدانية إلى «${status}»`
    });
  };

  const handleAddMaintenanceBlock = (block: ResourceMaintenanceBlock) => {
    setMaintenanceBlocks((prev) => [block, ...prev]);
    logAuditEvent({
      actor: currentUser,
      action: 'create',
      domain: 'equipment',
      entityId: block.id,
      entityName: block.resourceName,
      summary: `جدول ${currentUser.name} فترة إيقاف/صيانة لـ «${block.resourceName}» (${block.startDate} → ${block.endDate})`
    });
  };

  const handleDeleteMaintenanceBlock = (blockId: string) => {
    const target = maintenanceBlocks.find((b) => b.id === blockId);
    setMaintenanceBlocks((prev) => prev.filter((b) => b.id !== blockId));
    logAuditEvent({
      actor: currentUser,
      action: 'delete',
      domain: 'equipment',
      entityId: blockId,
      entityName: target?.resourceName || blockId,
      summary: `أزال ${currentUser.name} حجز الصيانة (${target?.resourceName || blockId})`
    });
  };

  // Status counters
  const publishedCount = activities.filter((a) => a.status === 'published').length;
  const pendingReviewCount = activities.filter((a) => a.status === 'pending_review').length;
  const pendingBookingsCount = activityBookings.filter(
    (b) => b.status === 'pending_approval'
  ).length;
  const ownedEquipmentCount = equipments.filter((eq) =>
    equipmentBelongsToEditableUser(eq, currentUser)
  ).length;

  const isCustomerShell = resolveUserRoleKey(currentUser) === 'customer';
  const todayIsoForCatalog = new Date().toISOString().split('T')[0];
  const visibleCustomerItems = React.useMemo(
    () =>
      [...activities, ...trips].filter((item) =>
        isExperienceVisibleForCustomer(item, currentUser)
      ),
    [activities, trips, currentUser]
  );
  const visibleCustomerItemIdSet = React.useMemo(
    () => new Set(visibleCustomerItems.map((it) => it.id)),
    [visibleCustomerItems]
  );
  const customerCatalogCount = visibleCustomerItems.length;
  const customerActiveCollectionsCount = activityCollections.filter(
    (c) => c.status === 'active' && c.activityIds.some((id) => visibleCustomerItemIdSet.has(id))
  ).length;
  const customerActiveOffersCount = visibleCustomerItems.filter((item) =>
    hasActiveOfferForCustomer(
      item,
      todayIsoForCatalog,
      resolveAudienceByNationality(currentUser.nationality || 'مصر')
    )
  ).length;
  const normalizedCurrentUserPhone = (currentUser.phone || '').replace(/[^\d]/g, '').trim();
  const customerMyBookingsCount = normalizedCurrentUserPhone
    ? activityBookings.filter(
        (b) => (b.customerPhone || '').replace(/[^\d]/g, '').trim() === normalizedCurrentUserPhone
      ).length +
      tripBookings.filter(
        (b) => (b.customerPhone || '').replace(/[^\d]/g, '').trim() === normalizedCurrentUserPhone
      ).length
    : 0;

  const partnerOptionsForBookings = React.useMemo(
    () => [
      ...unifiedPlatformUsers
        .filter((u) => {
          const rk = resolveUserRoleKey(u);
          return rk === 'delegate' || rk === 'driver' || rk === 'tour_guide';
        })
        .map((u) => ({ id: u.id, name: u.name, role: u.role })),
      ...personProfiles
        .filter((p) => p.roles.includes('crew_rep') || p.roles.includes('driver_vehicle_owner'))
        .filter((p) => !unifiedPlatformUsers.some((u) => u.id === p.linkedUserId))
        .map((p) => ({
          id: p.linkedUserId || p.id,
          name: p.name,
          role: p.roles.includes('crew_rep') ? 'مندوب / طاقم' : 'سائق'
        }))
    ],
    [unifiedPlatformUsers, personProfiles]
  );

  return (
    <div
      data-zanoza-template={currentTheme.templateId}
      data-zanoza-accent={currentTheme.colorPreset}
      data-zanoza-radius={currentTheme.radiusMode}
      style={{ fontFamily: `'${currentTheme.fontFamily}', sans-serif` }}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200"
    >
      {isCustomerShell ? (
        <CustomerMasterLayout
          activeSection={customerPortalSection}
          onSelectSection={setCustomerPortalSection}
          currency={customerCurrency}
          onChangeCurrency={setCustomerCurrency}
          lang={customerLang}
          onChangeLang={setCustomerLang}
          catalogCount={customerCatalogCount}
          collectionsCount={customerActiveCollectionsCount}
          offersCount={customerActiveOffersCount}
          myBookingsCount={customerMyBookingsCount}
          favoritesCount={favoriteIds.length}
          reviewsCount={reviews.length}
          currentUser={currentUser}
          allUsers={unifiedPlatformUsers}
          onSwitchUser={setCurrentUser}
          onOpenAuthModal={() => setShowAuthModal(true)}
          isAuthenticatedSession={Boolean(authToken)}
        >
          <CustomerStorefrontView
            activities={activities}
            trips={trips}
            activityCollections={activityCollections}
            equipments={equipments}
            logisticsVehicles={logisticsVehicles}
            maintenanceBlocks={maintenanceBlocks}
            reviews={reviews}
            platformPricingSettings={platformPricingSettings}
            activityBookings={activityBookings}
            tripBookings={tripBookings}
            driverMissions={driverMissions}
            inTripRequests={inTripRequests}
            currentUser={currentUser}
            companies={platformCompaniesForSignup}
            onCompleteCustomerProfile={handleCompleteCustomerProfile}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onCreateCustomerBooking={handleCreateCustomerBooking}
            onCreateTripBooking={handleCreateTripBooking}
            onCancelCustomerBooking={handleCancelCustomerBooking}
            onCancelTripBooking={handleCancelTripBooking}
            onRescheduleCustomerBooking={handleRescheduleCustomerBooking}
            onRescheduleTripBooking={handleRescheduleTripBooking}
            onAddReview={handleAddCustomerReview}
            activeSection={customerPortalSection}
            onChangeSection={setCustomerPortalSection}
            currency={customerCurrency}
            onChangeCurrency={setCustomerCurrency}
            lang={customerLang}
            onChangeLang={setCustomerLang}
            isStandaloneCustomerShell
          />
        </CustomerMasterLayout>
      ) : (
        <>
          <Sidebar
            currentKey={currentNavKey}
            onSelectKey={handleNavSelect}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            publishedCount={publishedCount}
            pendingReviewCount={pendingReviewCount}
            tripsCount={trips.length}
            equipmentCount={ownedEquipmentCount}
            partnersCount={partners.length}
            logisticsCount={logisticsVehicles.length}
            pendingBookingsCount={pendingBookingsCount}
            inTripRequestsCount={inTripRequests.length}
            favoritesCount={totalFavoritesCount}
            auditLogsCount={auditLogs.length}
            operationalCostsCount={ownerCostProfiles.length}
            personProfilesCount={personProfiles.length}
            pendingClaimRequestsCount={pendingClaimsForCurrentUser.length}
            managedUsersCount={managedUsers.length}
            currentUser={currentUser}
            customAllowedNavKeys={currentUserAllowedNavKeys}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />

          <div
            className={`${
              isSidebarCollapsed ? 'lg:mr-20' : 'lg:mr-72'
            } min-h-screen flex flex-col transition-all duration-300`}
          >
            <Navbar
              currentNavKey={currentNavKey}
              onSelectNav={handleNavSelect}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              onNewActivity={() => handleNewActivity()}
              onOpenSpecGuide={() => setShowSpecGuideModal(true)}
              onOpenBookingsQueue={() => setShowBookingsModal(true)}
              pendingBookingsCount={pendingBookingsCount}
              publishedCount={publishedCount}
              pendingReviewCount={pendingReviewCount}
              currentUser={currentUser}
              allUsers={unifiedPlatformUsers}
              onSwitchUser={setCurrentUser}
              userFavoritesCounts={userFavoritesCounts}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
              onOpenPersonProfiles={() => handleNavSelect('person_profiles')}
              isAuthenticatedSession={Boolean(authToken)}
              adminConfigured={authStatus.adminConfigured}
              onOpenAuthModal={() => setShowAuthModal(true)}
            />

            <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {currentNavKey === 'dashboard' && (
                <DashboardOverview
                  activities={activities}
                  equipments={equipments}
                  partnersCount={partners.length}
                  logisticsVehicles={logisticsVehicles}
                  currentUserId={currentUser.id}
                  wallets={wallets}
                  collections={collections}
                  transfers={transfers}
                  settlements={settlements}
                  onNavigate={setCurrentNavKey}
                />
              )}

              {currentNavKey === 'customer_storefront' && (
                <CustomerStorefrontView
                  activities={activities}
                  trips={trips}
                  activityCollections={activityCollections}
                  equipments={equipments}
                  logisticsVehicles={logisticsVehicles}
                  maintenanceBlocks={maintenanceBlocks}
                  reviews={reviews}
                  platformPricingSettings={platformPricingSettings}
                  activityBookings={activityBookings}
                  tripBookings={tripBookings}
                  driverMissions={driverMissions}
                  inTripRequests={inTripRequests}
                  currentUser={currentUser}
                  companies={platformCompaniesForSignup}
                  onCompleteCustomerProfile={handleCompleteCustomerProfile}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  onCreateCustomerBooking={handleCreateCustomerBooking}
                  onCreateTripBooking={handleCreateTripBooking}
                  onCancelCustomerBooking={handleCancelCustomerBooking}
                  onCancelTripBooking={handleCancelTripBooking}
                  onRescheduleCustomerBooking={handleRescheduleCustomerBooking}
                  onRescheduleTripBooking={handleRescheduleTripBooking}
                  onAddReview={handleAddCustomerReview}
                />
              )}

          {currentNavKey === 'unified_reference' && (
            <UnifiedMasterReferenceHub
              currentUser={currentUser}
              activities={activities}
              categoryTree={categoryTree}
              categoryRecords={categoryRecords}
              onCreateCategory={handleCreateCategoryRecord}
              onUpdateCategory={handleUpdateCategoryRecord}
              onDeleteCategory={handleDeleteCategoryRecord}
              specGroups={specGroups}
              onCreateSpecGroup={createSpecGroup}
              onUpdateSpecGroup={updateSpecGroup}
              onDeleteSpecGroup={deleteSpecGroup}
              customTechnicalSpecs={customTechnicalSpecs}
              onChangeCustomTechnicalSpecs={handleSetCustomTechnicalSpecs}
              equipmentProperties={equipmentProperties}
              onChangeEquipmentProperties={changeEquipmentProperties}
              inclusionsCatalog={inclusionsCatalog}
              onCreateInclusionItem={createInclusionItem}
              onUpdateInclusionItem={updateInclusionItem}
              onDeleteInclusionItem={deleteInclusionItem}
              equipmentTypes={equipmentTypes}
              onSaveEquipmentTypes={setEquipmentTypes}
              equipments={equipments}
              logisticsVehicles={logisticsVehicles}
              masterAddons={masterAddons}
              onCreateMasterAddon={createMasterAddon}
              onUpdateMasterAddon={updateMasterAddon}
              onDeleteMasterAddon={deleteMasterAddon}
              equipmentUnitKinds={equipmentUnitKinds}
              onCreateEquipmentUnitKind={createEquipmentUnitKind}
              onUpdateEquipmentUnitKind={updateEquipmentUnitKind}
              onDeleteEquipmentUnitKind={deleteEquipmentUnitKind}
              manufacturers={manufacturers}
              onCreateManufacturer={createManufacturer}
              onUpdateManufacturer={updateManufacturer}
              onDeleteManufacturer={deleteManufacturer}
              manufacturerModels={manufacturerModels}
              onCreateManufacturerModel={createManufacturerModel}
              onUpdateManufacturerModel={updateManufacturerModel}
              onDeleteManufacturerModel={deleteManufacturerModel}
              countriesRef={countriesRef}
              onCreateCountryRef={createCountryRef}
              onUpdateCountryRef={updateCountryRef}
              onDeleteCountryRef={deleteCountryRef}
              citiesRef={citiesRef}
              onCreateCityRef={createCityRef}
              onUpdateCityRef={updateCityRef}
              onDeleteCityRef={deleteCityRef}
              meetingPointsRef={meetingPointsRef}
              onCreateMeetingPointRef={createMeetingPointRef}
              onUpdateMeetingPointRef={updateMeetingPointRef}
              onDeleteMeetingPointRef={deleteMeetingPointRef}
              onResetAllMasterReference={async () => {
                await Promise.all([
                  handleResetCategories(),
                  resetAllSpecsAndEquipmentCatalogs(),
                  resetGroupsAndInclusionsCatalogs(),
                  Promise.resolve(resetMasterAddonsCatalog())
                ]);
              }}
            />
          )}

          <ActivitiesSection
            currentNavKey={currentNavKey}
            currentUser={currentUser}
            activities={activities}
            equipments={equipments}
            equipmentTypes={equipmentTypes}
            equipmentUnitKinds={equipmentUnitKinds}
            equipmentProperties={equipmentProperties}
            logisticsVehicles={logisticsVehicles}
            masterAddons={masterAddons}
            specGroups={specGroups}
            inclusionsCatalog={inclusionsCatalog}
            onCreateInclusionItem={createInclusionItem}
            isEditingActivity={isEditingActivity}
            setIsEditingActivity={setIsEditingActivity}
            selectedActivityForEdit={selectedActivityForEdit}
            setSelectedActivityForEdit={setSelectedActivityForEdit}
            selectedCompareIds={selectedCompareIds}
            favoriteIds={favoriteIds}
            activityCollections={activityCollections}
            setActivityCollections={handleSetActivityCollections}
            pricingProperties={pricingProperties}
            setPricingProperties={handleSetPricingProperties}
            customTechnicalSpecs={customTechnicalSpecs}
            platformPricingSettings={platformPricingSettings}
            categoryTree={categoryTree}
            categoryRecords={categoryRecords}
            onNavigate={setCurrentNavKey}
            onNewActivity={handleNewActivity}
            onSaveActivity={handleSaveActivityWithSupplierJournal}
            onAfterSaveActivity={(persisted) => {
              if (pausedEquipmentDraftForActivity) {
                handleReturnToEquipmentFromActivity(persisted);
              }
            }}
            onCancelActivityEdit={() => {
              if (pausedEquipmentDraftForActivity) {
                handleReturnToEquipmentFromActivity();
              }
            }}
            onDeleteActivity={handleDeleteActivity}
            onToggleStatus={toggleActivityStatus}
            onToggleCompare={handleToggleCompare}
            onClearCompare={() => setSelectedCompareIds([])}
            onToggleFavorite={handleToggleFavorite}
            onApplyOfferToActivity={applyOfferToActivity}
            onRemoveOffer={removeOfferFromActivity}
            onUpdateActivityPricing={updateActivityPricing}
            onAddCategoryToTree={handleAddCategoryToTree}
            onPreviewActivity={(act, clientMode) => {
              setPreviewEntityKind('activity');
              setPreviewClientMode(clientMode);
              setPreviewActivity(act);
            }}
            registeredSuppliers={registeredSuppliers}
            supplierJournals={supplierJournals}
            onAddRegisteredSupplier={addRegisteredSupplier}
            onSubscribeSupplierToPlatform={subscribeSupplierToPlatform}
            onSwitchToSubscribedUser={handleSwitchToSubscribedUser}
            countriesRef={countriesRef}
            citiesRef={citiesRef}
            meetingPointsRef={meetingPointsRef}
            onCreateCountryRef={createCountryRef}
            onCreateCityRef={createCityRef}
            onCreateMeetingPointRef={createMeetingPointRef}
            costProfiles={ownerCostProfiles}
            personProfiles={personProfiles}
            onSaveCostProfile={saveCostProfile}
            onSyncCostItemsToLedger={syncOperationalCostItemsToLedger}
          />

          {(currentNavKey === 'person_profiles' ||
            currentNavKey === 'activity_equipment_partners') && (
            <PersonProfilesHub
              currentUser={currentUser}
              allPlatformUsers={unifiedPlatformUsers}
              personProfiles={personProfiles}
              bilateralLedger={bilateralLedger}
              pendingClaimsForCurrentUser={pendingClaimsForCurrentUser}
              outgoingClaimsForCurrentUser={outgoingClaimsForCurrentUser}
              activities={activities}
              trips={trips}
              equipments={equipments}
              logisticsVehicles={logisticsVehicles}
              supplierJournals={supplierJournals}
              onCreateOrUpdateProfile={createOrUpdatePersonProfile}
              onRequestPhoneSignup={requestPlatformSignupAndMatchPhone}
              onApproveClaim={approveClaimAndIsolateControls}
              onRejectClaim={rejectClaimRequest}
              onAddLedgerEntry={addManualBilateralLedgerEntry}
              onDeleteLedgerEntry={deleteBilateralLedgerEntry}
              onOpenAddEquipmentForProfile={(profile) => {
                setPreselectedProfileForAsset(profile);
                handleNavSelect('activity_equipment_add');
              }}
              onOpenAddVehicleForProfile={(profile) => {
                setPreselectedProfileForAsset(profile);
                handleNavSelect('logistics_add');
              }}
              onSwitchUser={handleSwitchToSubscribedUser}
              onNavigate={handleNavSelect}
            />
          )}

          <EquipmentSection
            currentNavKey={currentNavKey}
            currentUser={currentUser}
            equipments={equipments}
            equipmentTypes={equipmentTypes}
            equipmentProperties={equipmentProperties}
            specGroups={specGroups}
            activities={activities}
            categoryRecords={categoryRecords}
            partners={partners}
            personProfiles={personProfiles}
            preselectedProfileForAsset={preselectedProfileForAsset}
            onConsumePreselectedProfile={() => setPreselectedProfileForAsset(null)}
            onCreatePartner={createPartner}
            onUpdatePartner={updatePartner}
            onDeletePartner={deletePartner}
            onCreateEquipment={createEquipment}
            onUpdateEquipment={updateEquipment}
            onDeleteEquipment={handleDeleteEquipment}
            onSyncEquipmentActivities={syncEquipmentActivityLinks}
            onChangeEquipmentStatus={changeEquipmentStatus}
            onSaveEquipmentTypes={setEquipmentTypes}
            equipmentUnitKinds={equipmentUnitKinds}
            manufacturers={manufacturers}
            manufacturerModels={manufacturerModels}
            onCreateEquipmentUnitKind={createEquipmentUnitKind}
            onCreateManufacturer={createManufacturer}
            onCreateManufacturerModel={createManufacturerModel}
            onNavigate={setCurrentNavKey}
            onOpenActivityInEditor={(act) => {
              setSelectedActivityForEdit(act);
              setIsEditingActivity(true);
              setCurrentNavKey('activity_add');
            }}
            externalRestoredDraft={restoredEquipmentDraftFromActivity}
            onConsumeExternalRestoredDraft={() => setRestoredEquipmentDraftFromActivity(null)}
            onOpenAddActivityFromEquipment={handleOpenAddActivityFromEquipment}
          />

          {currentNavKey === 'equipment_occupancy' && (
            <OccupancyCalendarView
              activities={activities}
              equipments={equipments}
              logisticsVehicles={logisticsVehicles}
              activityBookings={activityBookings}
              tripBookings={tripBookings}
              maintenanceBlocks={maintenanceBlocks}
              onAddMaintenanceBlock={handleAddMaintenanceBlock}
              onDeleteMaintenanceBlock={handleDeleteMaintenanceBlock}
            />
          )}

          {(currentNavKey === 'logistics_manage' ||
            currentNavKey === 'logistics_add' ||
            currentNavKey === 'logistics_transfers') && (
            <LogisticsManagement
              mode={
                currentNavKey === 'logistics_add'
                  ? 'add'
                  : currentNavKey === 'logistics_transfers'
                    ? 'transfers'
                    : 'manage'
              }
              currentUser={currentUser}
              logisticsVehicles={logisticsVehicles}
              activities={activities}
              partners={partners}
              personProfiles={personProfiles}
              preselectedProfileForAsset={preselectedProfileForAsset}
              onConsumePreselectedProfile={() => setPreselectedProfileForAsset(null)}
              onCreateVehicle={createVehicle}
              onUpdateVehicle={updateVehicle}
              onDeleteVehicle={handleDeleteLogisticsVehicle}
              onChangeVehicleStatus={changeVehicleStatus}
              onNavigate={setCurrentNavKey}
              onOpenActivityInEditor={(act) => {
                setSelectedActivityForEdit(act);
                setIsEditingActivity(true);
                setCurrentNavKey('activity_add');
              }}
              manufacturers={manufacturers}
              manufacturerModels={manufacturerModels}
              onCreateManufacturer={createManufacturer}
              onCreateManufacturerModel={createManufacturerModel}
              countriesRef={countriesRef}
              citiesRef={citiesRef}
              meetingPointsRef={meetingPointsRef}
              onCreateCountryRef={createCountryRef}
              onCreateCityRef={createCityRef}
              onCreateMeetingPointRef={createMeetingPointRef}
            />
          )}

          {currentNavKey === 'driver_portal' && (
            <DriverFieldPortalView
              currentUser={currentUser}
              wallet={findWalletForParty(
                wallets,
                currentUser.id,
                `prof-${currentUser.id}`,
                currentUser.name,
                'driver'
              )}
              allocations={allocations}
              activities={activities}
              activityBookings={activityBookings}
              tripBookings={tripBookings}
              logisticsVehicles={logisticsVehicles}
              driverMissions={driverMissions}
              onUpdateMissionStatus={handleUpdateDriverMissionStatus}
              onNavigate={handleNavSelect}
            />
          )}

          <TripsSection
            currentNavKey={currentNavKey}
            activities={activities}
            trips={trips}
            isEditingTrip={isEditingTrip}
            setIsEditingTrip={setIsEditingTrip}
            selectedTripForEdit={selectedTripForEdit}
            setSelectedTripForEdit={setSelectedTripForEdit}
            onNewTrip={handleNewTrip}
            onSaveTrip={handleSaveTripWithSupplierJournal}
            onDeleteTrip={handleDeleteTrip}
            onToggleTripStatus={toggleTripStatus}
            onPreviewTrip={(trip, clientMode) => {
              setPreviewEntityKind('trip');
              setPreviewClientMode(clientMode);
              setPreviewActivity(trip);
            }}
            equipments={equipments}
            equipmentTypes={equipmentTypes}
            equipmentUnitKinds={equipmentUnitKinds}
            equipmentProperties={equipmentProperties}
            logisticsVehicles={logisticsVehicles}
            masterAddons={masterAddons}
            specGroups={specGroups}
            inclusionsCatalog={inclusionsCatalog}
            onCreateInclusionItem={createInclusionItem}
            activityCollections={activityCollections}
            setActivityCollections={handleSetActivityCollections}
            pricingProperties={pricingProperties}
            customTechnicalSpecs={customTechnicalSpecs}
            categoryTree={categoryTree}
            categoryRecords={categoryRecords}
            onAddCategoryToTree={handleAddCategoryToTree}
            onNavigate={setCurrentNavKey}
            selectedCompareIds={selectedCompareIds}
            onToggleCompare={handleToggleCompare}
            onClearCompare={() => setSelectedCompareIds([])}
            currentUser={currentUser}
            onAuditLog={logAuditEvent}
            registeredSuppliers={registeredSuppliers}
            supplierJournals={supplierJournals}
            onAddRegisteredSupplier={addRegisteredSupplier}
            onSubscribeSupplierToPlatform={subscribeSupplierToPlatform}
            onSwitchToSubscribedUser={handleSwitchToSubscribedUser}
            countriesRef={countriesRef}
            citiesRef={citiesRef}
            meetingPointsRef={meetingPointsRef}
            onCreateCountryRef={createCountryRef}
            onCreateCityRef={createCityRef}
            onCreateMeetingPointRef={createMeetingPointRef}
            costProfiles={ownerCostProfiles}
            personProfiles={personProfiles}
            platformPricingSettings={platformPricingSettings}
            onSaveCostProfile={saveCostProfile}
            onSyncCostItemsToLedger={syncOperationalCostItemsToLedger}
          />

          <BookingsSection
            currentNavKey={currentNavKey}
            activities={activities}
            trips={trips}
            masterAddons={masterAddons}
            personProfiles={personProfiles}
            equipments={equipments}
            logisticsVehicles={logisticsVehicles}
            maintenanceBlocks={maintenanceBlocks}
            activityBookings={activityBookings}
            setActivityBookings={setActivityBookings}
            tripBookings={tripBookings}
            setTripBookings={setTripBookings}
            inTripRequests={inTripRequests}
            setInTripRequests={setInTripRequests}
            onApproveBooking={handleApproveBooking}
            onCompleteActivityBooking={handleCompleteActivityBooking}
            onRejectBooking={handleRejectBooking}
            onOwnerCancelActivityBooking={handleOwnerCancelActivityBooking}
            onOwnerCancelTripBooking={handleOwnerCancelTripBooking}
            onSettleBookingRefund={handleSettleBookingRefund}
            onBookingMutated={(booking, kind) => runFinanceSyncForBooking(booking, kind)}
            onTripBookingStatusUpdated={handleTripBookingStatusUpdated}
            partnerOptions={partnerOptionsForBookings}
            currentUser={currentUser}
            onAuditLog={logAuditEvent}
            onRegisterCompanyCustomer={(inp) =>
              upsertCompanyCustomerFromClerk({ ...inp, companyUser: currentUser })
            }
          />

          <FinanceSection
            currentNavKey={currentNavKey}
            currentUser={currentUser}
            wallets={wallets}
            collections={collections}
            transfers={transfers}
            settlements={settlements}
            allocations={allocations}
            bilateralLedger={bilateralLedger}
            personProfiles={personProfiles}
            activities={activities}
            activityBookings={activityBookings}
            onInitiateTransfer={handleInitiateTransfer}
            onApproveTransfer={handleApproveTransfer}
            onRejectTransfer={handleRejectTransfer}
            onCreateWallet={createManualWallet}
            onAddNewCollection={handleAddNewCollection}
            onRequestSettlement={handleRequestSettlement}
            onAuditSettlement={handleAuditSettlement}
            onNavigate={handleNavSelect}
          />

          {currentNavKey === 'operational_costs' && (
            <OperationalCostsManager
              currentUser={currentUser}
              activities={activities}
              trips={trips}
              costProfiles={ownerCostProfiles}
              platformPricingSettings={platformPricingSettings}
              onSaveCostProfile={saveCostProfile}
              onDeleteCostProfile={deleteCostProfile}
              onDeleteMultipleCostProfiles={deleteMultipleCostProfiles}
              personProfiles={personProfiles}
              activityBookings={activityBookings}
              tripBookings={tripBookings}
              allocations={allocations}
              onSyncCostItemsToLedger={syncOperationalCostItemsToLedger}
            />
          )}

          {currentNavKey === 'pricing_tool' && (
            <PricingToolManager
              settings={platformPricingSettings}
              onSaveSettings={handleSavePlatformPricingSettings}
            />
          )}

          {currentNavKey === 'activity_favorites' && (
            <FavoritesHub
              key={currentUser.id}
              currentUser={currentUser}
              activities={activities}
              favoriteActivityIds={favoriteIds}
              onToggleFavoriteActivity={handleToggleFavorite}
              onPreviewActivity={(act) => {
                const isOwn = activityBelongsToOwner(act, currentUser);
                setPreviewEntityKind('activity');
                setPreviewClientMode(!isOwn);
                setPreviewActivity(act);
              }}
              platformResources={platformResources}
              favoriteResourceIds={favoriteResourceIds}
              onToggleFavoriteResource={handleToggleFavoriteResource}
              equipments={equipments}
              equipmentTypes={equipmentTypes}
              favoriteEquipmentIds={favoriteEquipmentIds}
              onToggleFavoriteEquipment={handleToggleFavoriteEquipment}
              logisticsVehicles={logisticsVehicles}
              favoriteLogisticsIds={favoriteLogisticsIds}
              onToggleFavoriteLogistics={handleToggleFavoriteLogistics}
              onNavigate={handleNavSelect}
              folders={favoriteFolders}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onToggleItemInFolder={handleToggleItemInFolder}
            />
          )}

          {currentNavKey === 'performance_approvals' && (
            <AnalyticsConsole
              activities={activities}
              onApprovePlatformReview={(activityId) =>
                toggleActivityStatus(activityId, 'published')
              }
            />
          )}

          {currentNavKey === 'reports' && (
            <ReportsView
              activities={activities}
              collections={collections}
              wallets={wallets}
            />
          )}

          {currentNavKey === 'platform_audit_logs' && (
            <PlatformAuditLogsView
              auditLogs={auditLogs}
              onDeleteAuditLogs={deleteAuditLogs}
            />
          )}

          {currentNavKey === 'user_management' && (
            <UserManagementView
              currentUser={currentUser}
              fixedTemplates={fixedTemplates}
              managedUsers={managedUsers}
              onAddUser={addManagedUser}
              onUpdateUser={updateManagedUser}
              onDeleteUser={deleteManagedUser}
              onUpdateFixedTemplate={updateFixedTemplate}
              onApplyFixedTemplateToUser={applyFixedTemplateToUser}
              onSwitchToUser={(uid) => {
                const target = unifiedPlatformUsers.find((u) => u.id === uid);
                if (target) {
                  setIsEditingActivity(false);
                  setIsEditingTrip(false);
                  setPreviewActivity(null);
                  setCurrentUser(target);
                }
              }}
            />
          )}

          {currentNavKey === 'owner_theme_studio' && (
            <ThemeAppearanceStudio
              currentUser={currentUser}
              currentTheme={currentTheme}
              onUpdateTheme={updateCurrentUserTheme}
              onResetTheme={resetCurrentUserTheme}
            />
          )}
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>منصة ZanoZa السياحية (Siyahia) · نظام إدارة الأنشطة واليخوت والمحافظ المالية</span>
            <span className="font-mono text-[11px] text-slate-600">
              15 وحدة تشغيلية · 122 نقطة فنية معتمدة
            </span>
          </div>
        </footer>
      </div>

      <ActivityPreviewModal
        activity={previewActivity}
        clientMode={previewClientMode}
        onChangeClientMode={setPreviewClientMode}
        onClose={() => setPreviewActivity(null)}
        onOpenInEditor={(act) => {
          setPreviewActivity(null);
          if (previewEntityKind === 'trip') {
            setSelectedTripForEdit(act as TripRecord);
            setIsEditingTrip(true);
            setCurrentNavKey('trip_add');
          } else {
            setSelectedActivityForEdit(act);
            setIsEditingActivity(true);
            setCurrentNavKey('activity_add');
          }
        }}
        equipments={equipments}
        equipmentTypes={equipmentTypes}
        platformPricingSettings={platformPricingSettings}
        terms={previewEntityKind === 'trip' ? TRIP_TERMINOLOGY : ACTIVITY_TERMINOLOGY}
      />

      {showSpecGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-base text-white">وثيقة القرارات والمعايير المعتمدة (122 نقطة)</h3>
              <button
                onClick={() => setShowSpecGuideModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <DecisionGuideModal
              onNavigateToTab={(tab) => {
                setShowSpecGuideModal(false);
                if (tab === 'activities') setCurrentNavKey('activity_manage');
                else if (tab === 'editor') setCurrentNavKey('activity_add');
                else if (tab === 'wallets') setCurrentNavKey('finance_wallets');
                else if (tab === 'cashier') setCurrentNavKey('finance_cashier');
                else if (tab === 'compare') setCurrentNavKey('compare_activities');
                else if (tab === 'analytics') setCurrentNavKey('performance_approvals');
                else setCurrentNavKey('dashboard');
              }}
            />
          </div>
        </div>
      )}

      <BookingQueueModal
        isOpen={showBookingsModal}
        onClose={() => setShowBookingsModal(false)}
        activities={activities}
        requests={activityBookings}
        onApproveBooking={handleApproveBooking}
        onRejectBooking={handleRejectBooking}
      />
        </>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        isAuthenticatedSession={Boolean(authToken)}
        authStatus={authStatus}
        companies={platformCompaniesForSignup}
        onAuthSuccess={(token, user) => {
          setInMemoryAuthToken(token);
          setAuthToken(token);
          setCurrentUser(user);
          if (resolveUserRoleKey(user) === 'customer' && user.nationality) {
            setCustomerCurrency(resolveAutoCurrencyByNationality(user.nationality));
          }
          const allowed = getAllowedNavKeysForUser(user);
          if (!canUserAccessNavKey(user, currentNavKey, allowed)) {
            setCurrentNavKey(getDefaultNavKeyForUser(user));
          }
        }}
        onLogout={() => {
          setInMemoryAuthToken(null);
          setAuthToken(null);
        }}
        onRefreshStatus={() => void refreshAuthStatus()}
      />
    </div>
  );
}
