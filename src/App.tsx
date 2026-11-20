/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Activity, PricingPropertyItem } from './types/activity';
import { AppUser, SYSTEM_USERS } from './types/auth';
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
import { saveActivityToDb } from './db/localActivitiesDb';
import { useAuditLogStore } from './hooks/useAuditLogStore';
import { buildBlankActivityForUser, useActivitiesStore } from './hooks/useActivitiesStore';
import { useEquipmentsStore } from './hooks/useEquipmentsStore';
import { useLogisticsStore } from './hooks/useLogisticsStore';
import { useCategoriesStore } from './hooks/useCategoriesStore';
import { useFinanceStore } from './hooks/useFinanceStore';
import { useFavoritesStore } from './hooks/useFavoritesStore';

// Re-export PricingPropertiesManager reference if needed by external consumers
export { PricingPropertiesManager };

const CURRENT_USER_STORAGE_KEY = 'zanoza_current_user_id_v1';
const PLATFORM_PRICING_SETTINGS_KEY = 'zanoza_platform_pricing_settings_v1';

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
      if (saved) return saved as NavigationItemKey;
    } catch {
      // ignore storage access issues
    }
    return 'dashboard';
  });

  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSpecGuideModal, setShowSpecGuideModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);

  const [selectedActivityForEdit, setSelectedActivityForEdit] = useState<Activity | null>(null);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [previewActivity, setPreviewActivity] = useState<Activity | null>(null);
  const [previewClientMode, setPreviewClientMode] = useState<boolean>(false);

  const [activityCollections, setActivityCollections] = useState<ActivityCollection[]>(
    INITIAL_ACTIVITY_COLLECTIONS
  );
  const [pricingProperties, setPricingProperties] = useState<PricingPropertyItem[]>(
    INITIAL_PRICING_PROPERTIES
  );
  const [activityBookings, setActivityBookings] = useState<BookingRequest[]>(
    INITIAL_BOOKING_REQUESTS
  );
  const [tripBookings, setTripBookings] = useState<TripBooking[]>(INITIAL_TRIP_BOOKINGS);

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
  const { auditLogs, logAuditEvent } = useAuditLogStore();

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
    renameCategoryPathPrefix
  } = useActivitiesStore(currentUser, logAuditEvent);

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
    resetEquipmentPropertiesCatalog,
    resetCustomTechnicalSpecsCatalog,
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
    categoryTree,
    categoryRecords,
    handleCreateCategoryRecord,
    handleUpdateCategoryRecord,
    handleDeleteCategoryRecord,
    handleAddCategoryToTree
  } = useCategoriesStore(
    activities,
    hasLoadedActivitiesFromDb,
    renameCategoryPathPrefix,
    currentUser,
    logAuditEvent
  );

  const {
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
  } = useFinanceStore(currentUser, logAuditEvent);

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
    setIsEditingActivity(false);
    setPreviewActivity(null);
    setCurrentNavKey(key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewActivity = (_presetCategory?: string) => {
    const blank = buildBlankActivityForUser(currentUser);
    setSelectedActivityForEdit(blank);
    setIsEditingActivity(true);
    setCurrentNavKey('activity_add');
  };

  const handleDeleteActivity = (activityId: string) => {
    deleteActivity(activityId);
    setSelectedCompareIds((prev) => prev.filter((id) => id !== activityId));
    removeDeletedActivityFromAllUsers(activityId);
  };

  const handleDeleteEquipment = (equipmentId: string) => {
    deleteEquipment(equipmentId);
    removeEquipmentReference(equipmentId);
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

  const handleApproveBooking = (req: BookingRequest) => {
    setActivityBookings((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: 'approved' } : r))
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
  };

  const handleRejectBooking = (bookingId: string, reason: string) => {
    const target = activityBookings.find((r) => r.id === bookingId);
    setActivityBookings((prev) =>
      prev.map((r) =>
        r.id === bookingId ? { ...r, status: 'rejected', rejectionReason: reason } : r
      )
    );
    logAuditEvent({
      actor: currentUser,
      action: 'reject',
      domain: 'booking',
      entityId: bookingId,
      entityName: target?.activityName || bookingId,
      summary: `رفض ${currentUser.name} حجز النشاط «${target?.activityName || bookingId}»`,
      details: reason ? `السبب: ${reason}` : undefined
    });
  };

  // Status counters
  const publishedCount = activities.filter((a) => a.status === 'published').length;
  const pendingReviewCount = activities.filter((a) => a.status === 'pending_review').length;
  const pendingBookingsCount = activityBookings.filter(
    (b) => b.status === 'pending_approval'
  ).length;
  const ownedEquipmentCount = equipments.filter((eq) => eq.ownerId === currentUser.id).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-tajawal selection:bg-cyan-500/20 selection:text-cyan-200">
      <Sidebar
        currentKey={currentNavKey}
        onSelectKey={handleNavSelect}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        publishedCount={publishedCount}
        pendingReviewCount={pendingReviewCount}
        equipmentCount={ownedEquipmentCount}
        partnersCount={partners.length}
        logisticsCount={logisticsVehicles.length}
        pendingBookingsCount={pendingBookingsCount}
        favoritesCount={totalFavoritesCount}
        auditLogsCount={auditLogs.length}
        currentUser={currentUser}
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
          allUsers={SYSTEM_USERS}
          onSwitchUser={setCurrentUser}
          userFavoritesCounts={userFavoritesCounts}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
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

          <ActivitiesSection
            currentNavKey={currentNavKey}
            currentUser={currentUser}
            activities={activities}
            equipments={equipments}
            equipmentTypes={equipmentTypes}
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
            setCustomTechnicalSpecs={handleSetCustomTechnicalSpecs}
            platformPricingSettings={platformPricingSettings}
            categoryTree={categoryTree}
            categoryRecords={categoryRecords}
            onNavigate={setCurrentNavKey}
            onNewActivity={handleNewActivity}
            onSaveActivity={saveActivity}
            onDeleteActivity={handleDeleteActivity}
            onToggleStatus={toggleActivityStatus}
            onToggleCompare={handleToggleCompare}
            onClearCompare={() => setSelectedCompareIds([])}
            onToggleFavorite={handleToggleFavorite}
            onApplyOfferToActivity={applyOfferToActivity}
            onRemoveOffer={removeOfferFromActivity}
            onUpdateActivityPricing={updateActivityPricing}
            onCreateCategoryRecord={handleCreateCategoryRecord}
            onUpdateCategoryRecord={handleUpdateCategoryRecord}
            onDeleteCategoryRecord={handleDeleteCategoryRecord}
            onAddCategoryToTree={handleAddCategoryToTree}
            onResetCustomSpecsCatalog={resetCustomTechnicalSpecsCatalog}
            onPreviewActivity={(act, clientMode) => {
              setPreviewClientMode(clientMode);
              setPreviewActivity(act);
            }}
          />

          <EquipmentSection
            currentNavKey={currentNavKey}
            currentUser={currentUser}
            equipments={equipments}
            equipmentTypes={equipmentTypes}
            equipmentProperties={equipmentProperties}
            activities={activities}
            categoryRecords={categoryRecords}
            partners={partners}
            onCreatePartner={createPartner}
            onUpdatePartner={updatePartner}
            onDeletePartner={deletePartner}
            onCreateEquipment={createEquipment}
            onUpdateEquipment={updateEquipment}
            onDeleteEquipment={handleDeleteEquipment}
            onChangeEquipmentStatus={changeEquipmentStatus}
            onSaveEquipmentTypes={setEquipmentTypes}
            onChangeEquipmentProperties={changeEquipmentProperties}
            onResetEquipmentPropertiesCatalog={resetEquipmentPropertiesCatalog}
            onNavigate={setCurrentNavKey}
            onOpenActivityInEditor={(act) => {
              setSelectedActivityForEdit(act);
              setIsEditingActivity(true);
              setCurrentNavKey('activity_add');
            }}
          />

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
            />
          )}

          <TripsSection
            currentNavKey={currentNavKey}
            activities={activities}
            selectedCompareIds={selectedCompareIds}
            onToggleCompare={handleToggleCompare}
            onClearCompare={() => setSelectedCompareIds([])}
            currentUser={currentUser}
            onAuditLog={logAuditEvent}
          />

          <BookingsSection
            currentNavKey={currentNavKey}
            activities={activities}
            activityBookings={activityBookings}
            setActivityBookings={setActivityBookings}
            tripBookings={tripBookings}
            setTripBookings={setTripBookings}
            onApproveBooking={handleApproveBooking}
            onRejectBooking={handleRejectBooking}
            currentUser={currentUser}
            onAuditLog={logAuditEvent}
          />

          <FinanceSection
            currentNavKey={currentNavKey}
            wallets={wallets}
            collections={collections}
            transfers={transfers}
            settlements={settlements}
            onInitiateTransfer={handleInitiateTransfer}
            onApproveTransfer={handleApproveTransfer}
            onRejectTransfer={handleRejectTransfer}
            onAddNewCollection={handleAddNewCollection}
            onRequestSettlement={handleRequestSettlement}
            onAuditSettlement={handleAuditSettlement}
          />

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
                const isOwn =
                  act.owner?.id === currentUser.id || act.owner?.name === currentUser.name;
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
            <PlatformAuditLogsView auditLogs={auditLogs} />
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
          setSelectedActivityForEdit(act);
          setPreviewActivity(null);
          setIsEditingActivity(true);
          setCurrentNavKey('activity_add');
        }}
        equipments={equipments}
        equipmentTypes={equipmentTypes}
        platformPricingSettings={platformPricingSettings}
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
    </div>
  );
}
