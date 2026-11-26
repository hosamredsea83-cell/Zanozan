import React, { useState, useEffect } from 'react';
import {
  Activity,
  ActivityMediaItem,
  ActivityStatus,
  CategoryRecord,
  Waypoint,
  PricingPropertyItem,
  CustomTechnicalSpecItem
} from '../../../types/activity';
import {
  EquipmentItem,
  EquipmentPropertyItem,
  EquipmentTypeDefinition
} from '../../../types/equipment';
import type { MasterAddonItem } from '../../../types/addon';
import type {
  CityRecord,
  CountryRecord,
  EquipmentUnitKindItem,
  InclusionCatalogItem,
  InclusionKind,
  MeetingPointRecord,
  SpecGroupRecord
} from '../../../types/masterReference';
import type { LogisticsVehicle } from '../../../types/logistics';
import { resolveCategoryByPath } from '../../../utils/masterReferenceResolver';
import { Save, Check, CheckCircle2, AlertTriangle, Compass } from 'lucide-react';
import type { Asset } from '../../MediaUploadSection';
import { CreationReferenceTwoColumnView } from './CreationReferenceTwoColumnView';
import { ActivityCollection } from '../../activities/CollectionsManager';
import { loadWaypointsBankFromDb, saveWaypointsToBankDb } from '../../../db/localWaypointsDb';
import { AppUser } from '../../../types/auth';
import type {
  ActivityCostProfile,
  OperationalCostLineItem
} from '../../../types/operationalCost';
import {
  computeLineItemCostEGP,
  getEntitySegmentBaseRevenueEGP
} from '../../../types/operationalCost';
import type { PersonProfile } from '../../../types/personProfile';
import type { PlatformPricingSettings } from '../../pricing/PricingToolManager';
import type {
  RegisteredSupplierRecord,
  SupplierPricingJournalEntry
} from '../../../types/supplierJournal';
import { CreationReferenceModals } from './CreationReferenceModals';
import {
  ACTIVITY_TERMINOLOGY,
  type EntityCreationOverrides,
  type EntityTerminologyConfig
} from './entityCreationTerminology';
import {
  RegisteredOwnerItem,
  DEFAULT_PAGE_OWNER,
  CategoryNode,
  INITIAL_CATEGORY_TREE,
  INITIAL_REGISTERED_OWNERS,
  StoredActivityPreset,
  INITIAL_STORED_MEDIA_LIBRARY,
  INITIAL_STORED_PRESETS,
  INITIAL_STORED_COUNTRIES,
  INITIAL_STORED_CITIES,
  INITIAL_STORED_SITES,
  StoredWaypointTemplate,
  sortItineraryWithAnchors,
  INITIAL_STORED_DURATIONS,
  StoredDurationPreset,
  INITIAL_STORED_STATUSES,
  StoredStatusOption,
  StoredChannelItem,
  buildLocalizedChannels,
  INITIAL_STORED_INCLUSIONS,
  INITIAL_STORED_EXCLUSIONS,
  INITIAL_STORED_PICKUP_POINTS,
  StoredPricingPackage,
  INITIAL_STORED_PRICING_PACKAGES
} from './creationReferenceData';

export interface CreationReferenceEditorProps {
  terms?: EntityTerminologyConfig;
  overrides?: EntityCreationOverrides;
  activity: Activity;
  onSave: (updatedActivity: Activity) => void | Promise<void>;
  onCancel: () => void;
  currentUser?: AppUser;
  equipments?: EquipmentItem[];
  equipmentTypes?: EquipmentTypeDefinition[];
  equipmentUnitKinds?: EquipmentUnitKindItem[];
  equipmentProperties?: EquipmentPropertyItem[];
  logisticsVehicles?: LogisticsVehicle[];
  masterAddons?: MasterAddonItem[];
  allActivities?: Activity[];
  onNavigateToEquipment?: () => void;
  activityCollections?: ActivityCollection[];
  onAddActivityCollection?: (col: ActivityCollection) => void;
  pricingProperties?: PricingPropertyItem[];
  customTechnicalSpecs?: CustomTechnicalSpecItem[];
  specGroups?: SpecGroupRecord[];
  inclusionsCatalog?: InclusionCatalogItem[];
  categoryRecords?: CategoryRecord[];
  onCreateInclusionItem?: (input: {
    label: string;
    kind: InclusionKind;
    linkedCategoryIds?: string[];
  }) => InclusionCatalogItem;
  onNavigateToCustomSpecs?: () => void;
  onNavigateToAddonsLibrary?: () => void;
  categoryTree?: CategoryNode[];
  onAddCategoryToTree?: (path: string[], newName: string) => void;
  isNewActivity?: boolean;
  registeredSuppliers?: RegisteredSupplierRecord[];
  supplierJournals?: SupplierPricingJournalEntry[];
  onAddRegisteredSupplier?: (input: {
    id?: string;
    name: string;
    companyName: string;
    phone: string;
    tier: string;
  }) => Promise<RegisteredSupplierRecord>;
  onSubscribeSupplierToPlatform?: (supplierId: string) => Promise<{
    supplier: RegisteredSupplierRecord;
    user: AppUser;
    migratedActivitiesCount: number;
    migratedTripsCount: number;
  } | null>;
  onSwitchToSubscribedUser?: (user: AppUser) => void;
  countriesRef?: CountryRecord[];
  citiesRef?: CityRecord[];
  meetingPointsRef?: MeetingPointRecord[];
  onCreateCountryRef?: (input: { name: string; code?: string }) => CountryRecord;
  onCreateCityRef?: (input: { countryId: string; name: string }) => CityRecord;
  onCreateMeetingPointRef?: (input: {
    countryId?: string;
    cityId: string;
    name: string;
    pointType?: 'meeting_point' | 'site' | 'both';
  }) => MeetingPointRecord;
  costProfiles?: ActivityCostProfile[];
  personProfiles?: PersonProfile[];
  platformPricingSettings?: PlatformPricingSettings;
  onSaveCostProfile?: (
    draft: Omit<ActivityCostProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'auditTrail'> & {
      id?: string;
    }
  ) => ActivityCostProfile;
  onSyncCostItemsToLedger?: (input: {
    entityId: string;
    entityName: string;
    computedItems: Array<{ item: OperationalCostLineItem; impactEGP: number }>;
  }) => Promise<number>;
}

export const CreationReferenceEditor: React.FC<CreationReferenceEditorProps> = ({
  terms = ACTIVITY_TERMINOLOGY,
  overrides,
  activity,
  onSave,
  onCancel,
  currentUser,
  equipments = [],
  equipmentTypes = [],
  equipmentUnitKinds = [],
  equipmentProperties = [],
  logisticsVehicles = [],
  masterAddons = [],
  allActivities = [],
  onNavigateToEquipment,
  activityCollections,
  onAddActivityCollection,
  pricingProperties = [],
  customTechnicalSpecs = [],
  specGroups = [],
  inclusionsCatalog = [],
  categoryRecords = [],
  onCreateInclusionItem,
  onNavigateToCustomSpecs,
  onNavigateToAddonsLibrary,
  categoryTree: externalCategoryTree,
  onAddCategoryToTree,
  isNewActivity,
  registeredSuppliers,
  supplierJournals = [],
  onAddRegisteredSupplier,
  onSubscribeSupplierToPlatform,
  onSwitchToSubscribedUser,
  countriesRef = [],
  citiesRef = [],
  meetingPointsRef = [],
  onCreateCountryRef,
  onCreateCityRef,
  onCreateMeetingPointRef,
  costProfiles = [],
  personProfiles = [],
  platformPricingSettings,
  onSaveCostProfile,
  onSyncCostItemsToLedger
}) => {
  const isNew = isNewActivity ?? !allActivities.some((a) => a.id === activity.id);
  const [formData, setFormData] = useState<Activity>({ ...activity });
  const existingCostProfile = React.useMemo(
    () => costProfiles.find((p) => p.entityId === activity.id),
    [costProfiles, activity.id]
  );
  const [draftCostItems, setDraftCostItems] = useState<OperationalCostLineItem[]>(
    () => existingCostProfile?.items || []
  );
  const [draftEurRate, setDraftEurRate] = useState<number>(
    () => existingCostProfile?.eurToEgpRate || 52
  );
  const [draftExpectedPax, setDraftExpectedPax] = useState<number>(
    () => existingCostProfile?.defaultExpectedPax || Math.max(1, activity.minPax || 4)
  );
  useEffect(() => {
    if (existingCostProfile) {
      setDraftCostItems(existingCostProfile.items);
      setDraftEurRate(existingCostProfile.eurToEgpRate || 52);
      setDraftExpectedPax(existingCostProfile.defaultExpectedPax || 4);
    }
  }, [existingCostProfile?.id]);
  const [newWaypointName, setNewWaypointName] = useState('');
  const [newWaypointType, setNewWaypointType] = useState<Waypoint['type']>('stopover');
  const [newWaypointDuration, setNewWaypointDuration] = useState(0);
  const [newWaypointDepartureTime, setNewWaypointDepartureTime] = useState('');
  const [newWaypointReturnTime, setNewWaypointReturnTime] = useState('');
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [newYoutubeTitle, setNewYoutubeTitle] = useState('');
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [localCategoryTree, setLocalCategoryTree] =
    useState<CategoryNode[]>(INITIAL_CATEGORY_TREE);
  const categoryTree = externalCategoryTree ?? localCategoryTree;
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [targetParentCategoryPath, setTargetParentCategoryPath] = useState<string[]>([]);
  const [newSubcategoryTitle, setNewSubcategoryTitle] = useState('');
  const [storedMediaLibrary, setStoredMediaLibrary] =
    useState<Asset[]>(INITIAL_STORED_MEDIA_LIBRARY);

  const [storedPresets] = useState<StoredActivityPreset[]>(INITIAL_STORED_PRESETS);
  const [, setShowPresetsDrawer] = useState(false);
  const [savePresetToast, setSavePresetToast] = useState<string | null>(null);

  const applyPreset = (preset: StoredActivityPreset) => {
    setFormData((prev) => ({
      ...prev,
      name: preset.name,
      description: preset.description,
      translations: {
        ...prev.translations,
        en: {
          name: preset.nameEn,
          description: preset.descriptionEn
        }
      }
    }));
    setSavePresetToast(
      `تم اختيار وتحميل "${preset.name.slice(0, 30)}..." ويمكنك التعديل عليها بحرية`
    );
    setTimeout(() => setSavePresetToast(null), 3500);
  };

  const [storedCountries] = useState<string[]>(INITIAL_STORED_COUNTRIES);
  const [storedCountriesList, setStoredCountriesList] = useState<string[]>(storedCountries);
  const [storedCities, setStoredCities] = useState<string[]>(INITIAL_STORED_CITIES);
  const [storedSites, setStoredSites] = useState<string[]>(INITIAL_STORED_SITES);
  const [storedWaypointsBank, setStoredWaypointsBank] = useState<StoredWaypointTemplate[]>([]);

  useEffect(() => {
    let active = true;
    loadWaypointsBankFromDb()
      .then(async (rows) => {
        if (!active) return;
        if (rows.length > 0) {
          setStoredWaypointsBank(rows);
          return;
        }
        const existingSavedWaypoints = allActivities.flatMap((act) =>
          (act.location?.itinerary || []).map((wp, idx) => ({
            id: wp.id,
            name: wp.name,
            type: wp.type,
            durationMinutes: wp.durationMinutes,
            departureTime: wp.departureTime,
            returnTime: wp.returnTime,
            description: wp.description,
            savedAt:
              (Date.parse(act.updatedAt || act.createdAt || '') || Date.now()) + idx
          }))
        );
        if (existingSavedWaypoints.length > 0) {
          const synced = await saveWaypointsToBankDb(existingSavedWaypoints);
          if (active) setStoredWaypointsBank(synced);
        }
      })
      .catch((err) => {
        console.error('Failed to load waypoints bank from DB:', err);
      });
    return () => {
      active = false;
    };
  }, [allActivities]);

  const handleSaveWaypointToBank = async (item: {
    id?: string;
    name: string;
    type: Waypoint['type'];
    durationMinutes?: number;
    departureTime?: string;
    returnTime?: string;
    description?: string;
  }) => {
    try {
      const latest10 = await saveWaypointsToBankDb([item]);
      setStoredWaypointsBank(latest10);
    } catch (err) {
      console.error('Failed to save waypoint to bank DB:', err);
    }
  };

  const [storedDurations, setStoredDurations] =
    useState<StoredDurationPreset[]>(INITIAL_STORED_DURATIONS);
  const [storedStatuses, setStoredStatuses] =
    useState<StoredStatusOption[]>(INITIAL_STORED_STATUSES);
  const [storedChannels, setStoredChannels] = useState<StoredChannelItem[]>(() =>
    buildLocalizedChannels(terms, !isNew)
  );
  const [storedInclusions, setStoredInclusions] = useState<string[]>(INITIAL_STORED_INCLUSIONS);
  const [storedExclusions, setStoredExclusions] = useState<string[]>(INITIAL_STORED_EXCLUSIONS);
  const [storedPickupPoints, setStoredPickupPoints] =
    useState<string[]>(INITIAL_STORED_PICKUP_POINTS);
  const [storedPricingPackages, setStoredPricingPackages] = useState<StoredPricingPackage[]>(
    INITIAL_STORED_PRICING_PACKAGES
  );

  // Quick Inline Add Inputs State
  const [newCityInput, setNewCityInput] = useState('');
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [newSiteInput, setNewSiteInput] = useState('');
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [newDurationLabel, setNewDurationLabel] = useState('');
  const [showAddDurationModal, setShowAddDurationModal] = useState(false);
  const [newCustomStatusInput, setNewCustomStatusInput] = useState('');
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [newInclusionInput, setNewInclusionInput] = useState('');
  const [newExclusionInput, setNewExclusionInput] = useState('');
  const [newPickupPointInput, setNewPickupPointInput] = useState('');
  const [showAddPickupModal, setShowAddPickupModal] = useState(false);
  const [showAddPricingPackageModal, setShowAddPricingPackageModal] = useState(false);
  const [newPricingPackageName, setNewPricingPackageName] = useState('');

  const notifyDbSuccess = (msg: string) => {
    setSavePresetToast(msg);
    setTimeout(() => setSavePresetToast(null), 3500);
  };

  const handleAddCityToDb = (cityName: string) => {
    if (!cityName.trim()) return;
    const name = cityName.trim();
    if (onCreateCityRef) {
      const matchedCountry =
        countriesRef.find((c) => c.name === formData.location.country) || countriesRef[0];
      onCreateCityRef({ countryId: matchedCountry?.id || 'cnt-eg', name });
    }
    if (!storedCities.includes(name)) {
      setStoredCities((prev) => [...prev, name]);
    }
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, city: name }
    }));
    setNewCityInput('');
    setShowAddCityModal(false);
    notifyDbSuccess(`✓ تمت إضافة مدينة "${name}" إلى قاعدة البيانات واختيارها`);
  };

  const handleAddSiteToDb = (siteName: string) => {
    if (!siteName.trim()) return;
    const name = siteName.trim();
    if (onCreateMeetingPointRef) {
      const matchedCity =
        citiesRef.find((ct) => ct.name === formData.location.city) || citiesRef[0];
      onCreateMeetingPointRef({
        countryId: matchedCity?.countryId,
        cityId: matchedCity?.id || 'cty-hrg',
        name,
        pointType: 'site'
      });
    }
    if (!storedSites.includes(name)) {
      setStoredSites((prev) => [...prev, name]);
    }
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, primarySite: name }
    }));
    setNewSiteInput('');
    setShowAddSiteModal(false);
    notifyDbSuccess(`✓ تمت إضافة موقع "${name}" إلى قاعدة البيانات واختياره`);
  };

  const handleAddCountryToDb = (countryName: string) => {
    if (!countryName.trim()) return;
    const name = countryName.trim();
    if (onCreateCountryRef) {
      onCreateCountryRef({ name });
    }
    if (!storedCountriesList.includes(name)) {
      setStoredCountriesList((prev) => [...prev, name]);
    }
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, country: name }
    }));
    notifyDbSuccess(`✓ تمت إضافة دولة "${name}" إلى قاعدة البيانات واختيارها`);
  };

  const handleAddDurationPresetToDb = () => {
    const days = formData.duration.days || 0;
    const hours = formData.duration.hours || 0;
    const minutes = formData.duration.minutes || 0;
    const label =
      newDurationLabel.trim() ||
      `${days ? days + ' يوم ' : ''}${hours ? hours + ' ساعة ' : ''}${
        minutes ? minutes + ' دقيقة' : ''
      }`.trim() ||
      'مدة مخصصة';

    const newPreset: StoredDurationPreset = {
      id: `dur-${Date.now()}`,
      label,
      days,
      hours,
      minutes
    };
    setStoredDurations((prev) => [...prev, newPreset]);
    setNewDurationLabel('');
    setShowAddDurationModal(false);
    notifyDbSuccess(`✓ تم حفظ المدة (${label}) كخيار دائم في قاعدة البيانات`);
  };

  const handleAddCustomStatusToDb = () => {
    if (!newCustomStatusInput.trim()) return;
    const label = newCustomStatusInput.trim();
    const id = `status-${Date.now()}`;
    const newStatus: StoredStatusOption = {
      id,
      label,
      badgeText: label,
      color: 'cyan'
    };
    setStoredStatuses((prev) => [...prev, newStatus]);
    setFormData((prev) => ({ ...prev, status: id as ActivityStatus }));
    setNewCustomStatusInput('');
    setShowAddStatusModal(false);
    notifyDbSuccess(`✓ تمت إضافة حالة "${label}" إلى قائمة الحالات المخزنة`);
  };

  const handleAddCustomChannelToDb = () => {
    if (!newChannelName.trim()) return;
    const name = newChannelName.trim();
    const id = `channel-${Date.now()}`;
    const newChan: StoredChannelItem = {
      id,
      name,
      description: newChannelDesc.trim() || terms.customChannelDefaultDesc,
      badge: 'مخصص',
      active: true
    };
    setStoredChannels((prev) => [...prev, newChan]);
    setNewChannelName('');
    setNewChannelDesc('');
    setShowAddChannelModal(false);
    notifyDbSuccess(`✓ تمت إضافة قناة النشر "${name}" وحفظها في قاعدة البيانات`);
  };

  const handleAddInclusionToDb = (item: string) => {
    if (!item.trim()) return;
    const val = item.trim();
    const activeCat = resolveCategoryByPath(formData.categoryPath || [], categoryRecords);
    if (onCreateInclusionItem) {
      onCreateInclusionItem({
        label: val,
        kind: 'included',
        linkedCategoryIds: activeCat ? [activeCat.id] : []
      });
    }
    if (!storedInclusions.includes(val)) {
      setStoredInclusions((prev) => [...prev, val]);
    }
    if (!formData.inclusions.meals.includes(val) && !formData.inclusions.drinks.includes(val)) {
      setFormData((prev) => ({
        ...prev,
        inclusions: {
          ...prev.inclusions,
          meals: [...prev.inclusions.meals, val]
        }
      }));
    }
    setNewInclusionInput('');
    notifyDbSuccess(`✓ تمت إضافة بند "${val}" إلى المرجع الموحد وربطه بالفئة وتفعيله`);
  };

  const handleAddExclusionToDb = (item: string) => {
    if (!item.trim()) return;
    const val = item.trim();
    const activeCat = resolveCategoryByPath(formData.categoryPath || [], categoryRecords);
    if (onCreateInclusionItem) {
      onCreateInclusionItem({
        label: val,
        kind: 'excluded',
        linkedCategoryIds: activeCat ? [activeCat.id] : []
      });
    }
    if (!storedExclusions.includes(val)) {
      setStoredExclusions((prev) => [...prev, val]);
    }
    if (!formData.inclusions.notIncluded.includes(val)) {
      setFormData((prev) => ({
        ...prev,
        inclusions: {
          ...prev.inclusions,
          notIncluded: [...prev.inclusions.notIncluded, val]
        }
      }));
    }
    setNewExclusionInput('');
    notifyDbSuccess(
      `✓ تمت إضافة بند "${val}" إلى قائمة غير المشمول بالمرجع الموحد وربطه بالفئة`
    );
  };

  const handleAddPickupPointToDb = (pt: string) => {
    if (!pt.trim()) return;
    const name = pt.trim();
    if (onCreateMeetingPointRef) {
      const matchedCity =
        citiesRef.find((ct) => ct.name === formData.location.city) || citiesRef[0];
      onCreateMeetingPointRef({
        countryId: matchedCity?.countryId,
        cityId: matchedCity?.id || 'cty-hrg',
        name,
        pointType: 'meeting_point'
      });
    }
    if (!storedPickupPoints.includes(name)) {
      setStoredPickupPoints((prev) => [...prev, name]);
    }
    setFormData((prev) => ({
      ...prev,
      logistics: { ...prev.logistics, pickupPoint: name }
    }));
    setNewPickupPointInput('');
    setShowAddPickupModal(false);
    notifyDbSuccess(`✓ تمت إضافة نقطة "${name}" إلى قاعدة البيانات واختيارها`);
  };

  const handleApplyPricingPackage = (pkg: StoredPricingPackage) => {
    setFormData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        egyptianB2C: {
          ...prev.pricing.egyptianB2C,
          adultEGP: pkg.egyptianAdult,
          childEGP: pkg.egyptianChild,
          privateTotalEGP: pkg.egyptianPrivate
        },
        foreignerB2C: {
          ...prev.pricing.foreignerB2C,
          adultEUR: pkg.foreignAdult,
          childEUR: pkg.foreignChild,
          privateTotalEUR: pkg.foreignPrivate
        }
      }
    }));
    notifyDbSuccess(`✓ تم تطبيق أسعار "${pkg.name}" بنجاح ويمكنك تعديل أي رقم`);
  };

  const handleSaveCurrentPricingAsPackage = () => {
    if (!newPricingPackageName.trim()) return;
    const pkgName = newPricingPackageName.trim();
    const newPkg: StoredPricingPackage = {
      id: `pkg-${Date.now()}`,
      name: pkgName,
      badge: 'مخصص',
      egyptianAdult: formData.pricing.egyptianB2C.adultEGP || 0,
      egyptianChild: formData.pricing.egyptianB2C.childEGP || 0,
      egyptianPrivate: formData.pricing.egyptianB2C.privateTotalEGP || 0,
      foreignAdult: formData.pricing.foreignerB2C.adultEUR || 0,
      foreignChild: formData.pricing.foreignerB2C.childEUR || 0,
      foreignPrivate: formData.pricing.foreignerB2C.privateTotalEUR || 0
    };
    setStoredPricingPackages((prev) => [...prev, newPkg]);
    setNewPricingPackageName('');
    setShowAddPricingPackageModal(false);
    notifyDbSuccess(`✓ تم حفظ باقة الأسعار "${pkgName}" في قاعدة البيانات`);
  };

  const addCategoryToTree = (path: string[], newName: string) => {
    if (!newName.trim()) return;
    const trimmed = newName.trim();

    if (onAddCategoryToTree) {
      onAddCategoryToTree(path, trimmed);
      setFormData((prev) => ({
        ...prev,
        categoryPath: path.length === 0 ? [trimmed] : [...path, trimmed]
      }));
      return;
    }

    if (path.length === 0) {
      const newNode: CategoryNode = {
        id: `cat-${Date.now()}`,
        name: trimmed,
        children: []
      };
      setLocalCategoryTree((prev) => [...prev, newNode]);
      setFormData((prev) => ({
        ...prev,
        categoryPath: [trimmed]
      }));
      return;
    }

    const updateNodes = (nodes: CategoryNode[], depth: number): CategoryNode[] => {
      return nodes.map((node) => {
        if (node.name === path[depth]) {
          if (depth === path.length - 1) {
            const newNode: CategoryNode = {
              id: `cat-${Date.now()}`,
              name: trimmed,
              children: []
            };
            return {
              ...node,
              children: [...(node.children || []), newNode]
            };
          } else if (node.children) {
            return {
              ...node,
              children: updateNodes(node.children, depth + 1)
            };
          }
        }
        return node;
      });
    };

    setLocalCategoryTree((prev) => updateNodes(prev, 0));
    setFormData((prev) => ({
      ...prev,
      categoryPath: [...path, trimmed]
    }));
  };

  const activePageOwner: RegisteredOwnerItem = currentUser
    ? {
        id: currentUser.id,
        name: `${currentUser.name} (صاحب الصفحة)`,
        companyName: currentUser.companyName,
        phone: currentUser.phone,
        tier: `${currentUser.tier} (الحساب الحالي)`
      }
    : DEFAULT_PAGE_OWNER;

  const [isAccountOwner, setIsAccountOwner] = useState<boolean>(() => {
    if (activity.supplierCustody?.isExternalSupplier) return false;
    if (!activity.owner?.id) return true;
    if (currentUser) {
      return activity.owner.id === currentUser.id || activity.owner.name === currentUser.name;
    }
    return (
      activity.owner.id === 'own-001' ||
      activity.owner.id === 'own-page-user' ||
      activity.owner.name.includes('أحمد') ||
      activity.owner.name.includes('صاحب الصفحة')
    );
  });
  const [localRegisteredOwners, setLocalRegisteredOwners] =
    useState<RegisteredOwnerItem[]>(INITIAL_REGISTERED_OWNERS);
  const registeredOwners: RegisteredOwnerItem[] = React.useMemo(() => {
    if (registeredSuppliers && registeredSuppliers.length > 0) {
      return registeredSuppliers.map((s) => ({
        id: s.id,
        name: s.name,
        companyName: s.companyName,
        phone: s.phone,
        tier: s.tier
      }));
    }
    return localRegisteredOwners;
  }, [registeredSuppliers, localRegisteredOwners]);

  const [showAddOwnerModal, setShowAddOwnerModal] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerCompany, setNewOwnerCompany] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newOwnerTier, setNewOwnerTier] = useState('شخصي');

  const handleToggleOwnership = (isOwner: boolean) => {
    setIsAccountOwner(isOwner);
    if (isOwner) {
      setFormData((prev) => ({
        ...prev,
        owner: activePageOwner,
        supplierCustody: undefined
      }));
    } else {
      setFormData((prev) => {
        const currentIsExternal =
          prev.owner?.id &&
          prev.owner.id !== currentUser?.id &&
          prev.owner.id !== activePageOwner.id;
        const targetOther = currentIsExternal
          ? prev.owner
          : registeredOwners[0] || activePageOwner;
        const matchedSup = registeredSuppliers?.find(
          (s) => s.id === targetOther.id || s.linkedPlatformUserId === targetOther.id
        );
        return {
          ...prev,
          owner: targetOther,
          supplierCustody: {
            isExternalSupplier: true,
            supplierId: matchedSup?.id || targetOther.id,
            supplierStatus: matchedSup?.platformStatus || 'pending_signup',
            addedByUserId: prev.supplierCustody?.addedByUserId || currentUser?.id || activePageOwner.id,
            addedByUserName:
              prev.supplierCustody?.addedByUserName || currentUser?.name || activePageOwner.name,
            addedByCompanyName:
              prev.supplierCustody?.addedByCompanyName ||
              currentUser?.companyName ||
              activePageOwner.companyName,
            claimedUserId: matchedSup?.linkedPlatformUserId
          }
        };
      });
    }
  };

  const handleRegisterNewSupplier = async (input: {
    name: string;
    companyName: string;
    phone: string;
    tier: string;
  }): Promise<RegisteredOwnerItem> => {
    if (onAddRegisteredSupplier) {
      const savedSup = await onAddRegisteredSupplier(input);
      const ownerObj: RegisteredOwnerItem = {
        id: savedSup.id,
        name: savedSup.name,
        companyName: savedSup.companyName,
        phone: savedSup.phone,
        tier: savedSup.tier
      };
      setIsAccountOwner(false);
      setFormData((prev) => ({
        ...prev,
        owner: ownerObj,
        supplierCustody: {
          isExternalSupplier: true,
          supplierId: savedSup.id,
          supplierStatus: savedSup.platformStatus,
          addedByUserId: currentUser?.id || activePageOwner.id,
          addedByUserName: currentUser?.name || activePageOwner.name,
          addedByCompanyName: currentUser?.companyName || activePageOwner.companyName,
          claimedUserId: savedSup.linkedPlatformUserId
        }
      }));
      return ownerObj;
    }

    const createdOwner: RegisteredOwnerItem = {
      id: `own-${Date.now().toString().slice(-4)}`,
      name: input.name.trim(),
      companyName: input.companyName.trim(),
      phone: input.phone.trim() || '+201000000000',
      tier: input.tier
    };

    setLocalRegisteredOwners((prev) => [...prev, createdOwner]);
    setIsAccountOwner(false);
    setFormData((prev) => ({
      ...prev,
      owner: createdOwner,
      supplierCustody: {
        isExternalSupplier: true,
        supplierId: createdOwner.id,
        supplierStatus: 'pending_signup',
        addedByUserId: currentUser?.id || activePageOwner.id,
        addedByUserName: currentUser?.name || activePageOwner.name,
        addedByCompanyName: currentUser?.companyName || activePageOwner.companyName
      }
    }));
    return createdOwner;
  };

  const handleAddNewOwnerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newOwnerName.trim() || !newOwnerCompany.trim()) return;

    void handleRegisterNewSupplier({
      name: newOwnerName.trim(),
      companyName: newOwnerCompany.trim(),
      phone: newOwnerPhone.trim() || '+201000000000',
      tier: newOwnerTier
    });

    setNewOwnerName('');
    setNewOwnerCompany('');
    setNewOwnerPhone('');
    setNewOwnerTier('شخصي');
    setShowAddOwnerModal(false);
  };

  const totalStorageBytes = formData.media.reduce((acc, m) => acc + m.fileSizeBytes, 0);
  const maxStorageBytes = 2 * 1024 * 1024 * 1024;
  const storagePercentage = Math.min(100, Math.round((totalStorageBytes / maxStorageBytes) * 100));

  const handleAddWaypoint = () => {
    if (!newWaypointName.trim()) return;
    const newWp: Waypoint = {
      id: `wp-${Date.now()}`,
      name: newWaypointName.trim(),
      type: newWaypointType,
      order: formData.location.itinerary.length + 1,
      durationMinutes:
        newWaypointType === 'departure' || newWaypointType === 'return'
          ? undefined
          : newWaypointDuration,
      departureTime:
        newWaypointType === 'departure' ? newWaypointDepartureTime || undefined : undefined,
      returnTime: newWaypointType === 'return' ? newWaypointReturnTime || undefined : undefined,
      description: 'نقطة توقف جديدة تم إدراجها ضمن خط السير'
    };
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        itinerary: sortItineraryWithAnchors([...prev.location.itinerary, newWp])
      }
    }));
    setNewWaypointName('');
    setNewWaypointDuration(0);
    setNewWaypointDepartureTime('');
    setNewWaypointReturnTime('');
  };

  const handleMoveWaypoint = (id: string, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const list = sortItineraryWithAnchors(prev.location.itinerary);
      const index = list.findIndex((w) => w.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;

      const current = list[index];
      const neighbor = list[targetIndex];

      if (current.type === 'departure' && neighbor.type !== 'departure') return prev;
      if (neighbor.type === 'departure' && current.type !== 'departure') return prev;
      if (current.type === 'return' && neighbor.type !== 'return') return prev;
      if (neighbor.type === 'return' && current.type !== 'return') return prev;

      const swapped = [...list];
      swapped[index] = neighbor;
      swapped[targetIndex] = current;

      return {
        ...prev,
        location: {
          ...prev.location,
          itinerary: swapped.map((w, idx) => ({ ...w, order: idx + 1 }))
        }
      };
    });
  };

  const handleRemoveWaypoint = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        itinerary: sortItineraryWithAnchors(prev.location.itinerary.filter((w) => w.id !== id))
      }
    }));
  };

  const handleRemoveCategoryLevel = (index: number) => {
    if (formData.categoryPath.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      categoryPath: prev.categoryPath.filter((_, idx) => idx !== index)
    }));
  };

  const handleRemoveMedia = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.filter((m) => m.id !== id)
    }));
  };

  const currentImageAssets: Asset[] = React.useMemo(() => {
    return formData.media
      .filter((m) => m.type === 'image')
      .map((m) => ({
        id: m.id,
        url: m.url,
        name: m.title,
        extension: '.jpg',
        sizeBytes: m.fileSizeBytes || 1800000,
        dateAdded: Date.now()
      }));
  }, [formData.media]);

  const handleMediaFilesUpdate = React.useCallback((files: Asset[]) => {
    setFormData((prev) => {
      const prevImages = prev.media.filter((m) => m.type === 'image');
      if (
        prevImages.length === files.length &&
        files.every(
          (f, idx) =>
            prevImages[idx] && prevImages[idx].id === f.id && prevImages[idx].url === f.url
        )
      ) {
        return prev;
      }

      const videos = prev.media.filter((m) => m.type === 'video');
      const newImages: ActivityMediaItem[] = files.map((file, idx) => ({
        id: file.id,
        url: file.url,
        title: file.name,
        isCover: idx === 0,
        order: idx + 1,
        fileSizeBytes: file.sizeBytes || 1800000,
        type: 'image'
      }));

      return {
        ...prev,
        media: [...newImages, ...videos]
      };
    });
  }, []);

  const handleAddYoutubeVideo = () => {
    if (!newYoutubeUrl.trim()) return;
    const isDuplicate = formData.media.some(
      (m) => m.url.trim().toLowerCase() === newYoutubeUrl.trim().toLowerCase()
    );
    if (isDuplicate) {
      notifyDbSuccess(terms.youtubeDuplicateWarning);
      return;
    }
    const newMedia: ActivityMediaItem = {
      id: `vid-${Date.now()}`,
      url: newYoutubeUrl,
      title: newYoutubeTitle || terms.youtubeDefaultTitle,
      isCover: false,
      order: formData.media.length + 1,
      fileSizeBytes: 0,
      type: 'video',
      videoSource: 'youtube',
      youtubeUrl: newYoutubeUrl
    };
    setFormData((prev) => ({
      ...prev,
      media: [...prev.media, newMedia]
    }));
    setNewYoutubeUrl('');
    setNewYoutubeTitle('');
  };

  const handleSaveAll = async () => {
    if (isSaving) return;
    const errors: string[] = [];

    const hasImage = formData.media.some(
      (m) => m.type === 'image' && Boolean(m.url && m.url.trim().length > 0)
    );
    if (!hasImage) {
      errors.push(terms.validationMediaError);
    }

    if (!formData.name.trim()) {
      errors.push(terms.validationNameError);
    }

    if (!formData.description.trim()) {
      errors.push(terms.validationDescriptionError);
    }

    const hasPrice =
      (formData.pricing?.egyptianB2C?.adultEGP ?? 0) > 0 ||
      (formData.pricing?.foreignerB2C?.adultEUR ?? 0) > 0 ||
      (formData.pricing?.egyptianB2B?.adultEGP ?? 0) > 0 ||
      (formData.pricing?.foreignerB2B?.adultEUR ?? 0) > 0 ||
      (formData.pricing?.egyptianB2C?.privateTotalEGP ?? 0) > 0 ||
      (formData.pricing?.foreignerB2C?.privateTotalEUR ?? 0) > 0 ||
      (formData.pricing?.egyptianB2C?.privatePerPersonEGP ?? 0) > 0 ||
      (formData.dynamicPricing?.baseRate?.adultPrice ?? 0) > 0;
    if (!hasPrice) {
      errors.push(terms.validationPriceError);
    }

    if (!formData.status || !formData.status.trim()) {
      errors.push(terms.validationStatusError);
    }

    if (overrides?.customValidate) {
      errors.push(...overrides.customValidate(formData));
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowSaveAlert(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    setIsSaving(true);
    try {
      await onSave(formData);
      if (onSaveCostProfile && (draftCostItems.length > 0 || existingCostProfile)) {
        const savedProfile = onSaveCostProfile({
          id: existingCostProfile?.id,
          entityId: formData.id,
          entityType: terms.kind,
          entityName: formData.name,
          eurToEgpRate: draftEurRate,
          defaultExpectedPax: draftExpectedPax,
          items: draftCostItems,
          actualRuns: existingCostProfile?.actualRuns || []
        });
        if (onSyncCostItemsToLedger && draftCostItems.some((it) => it.assignedProfileId)) {
          const rev = getEntitySegmentBaseRevenueEGP(
            formData,
            'egyptianB2C',
            draftExpectedPax,
            draftEurRate
          );
          const computedItems = draftCostItems
            .filter((item) => item.assignedProfileId)
            .map((item) => ({
              item,
              impactEGP: computeLineItemCostEGP(
                item,
                draftExpectedPax,
                rev.grossRevenueEGP,
                draftEurRate
              )
            }));
          if (computedItems.length > 0) {
            void onSyncCostItemsToLedger({
              entityId: savedProfile.entityId,
              entityName: savedProfile.entityName,
              computedItems
            });
          }
        }
      }
      setShowSaveAlert(true);
      setTimeout(() => setShowSaveAlert(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Top Header & Save Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-1">
            <Compass className="w-4 h-4" />
            <span>{terms.editorSystemLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400 font-normal">
              {terms.editorIdLabel}: {formData.id}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {formData.name || terms.editorDefaultNewTitle}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={() => void handleSaveAll()}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 text-xs md:text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 rounded-lg shadow-md transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'جاري الحفظ في قاعدة البيانات...' : 'حفظ واعتماد التعديلات'}</span>
          </button>
        </div>
      </div>

      {/* Extension Slot: Top Banner */}
      {overrides?.renderTopBanner?.({ formData, setFormData })}

      {validationErrors.length > 0 && (
        <div className="bg-rose-950/85 border border-rose-500/60 text-rose-100 px-4 py-3.5 rounded-xl text-xs space-y-2 animate-fade-in">
          <div className="flex items-center justify-between gap-2 font-bold text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{terms.validationAlertHeader}</span>
            </div>
            <button
              type="button"
              onClick={() => setValidationErrors([])}
              className="text-rose-300 hover:text-white text-xs font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
          <ul className="list-disc list-inside space-y-1 text-rose-200 pr-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {showSaveAlert && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{terms.saveSuccessAlert}</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">سجل التعديل محفوظ</span>
        </div>
      )}

      {savePresetToast && (
        <div
          className={`px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-2 animate-fade-in border ${
            savePresetToast.startsWith('⚠️')
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                savePresetToast.startsWith('⚠️') ? 'text-rose-400' : 'text-emerald-400'
              }`}
            />
            <span>{savePresetToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSavePresetToast(null)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Content: Two-Column Integrated View */}
      <CreationReferenceTwoColumnView
        terms={terms}
        overrides={overrides}
        formData={formData}
        setFormData={setFormData}
        categoryTree={categoryTree}
        addCategoryToTree={addCategoryToTree}
        handleRemoveCategoryLevel={handleRemoveCategoryLevel}
        setShowAddCategoryModal={setShowAddCategoryModal}
        setTargetParentCategoryPath={setTargetParentCategoryPath}
        setNewSubcategoryTitle={setNewSubcategoryTitle}
        storedPresets={storedPresets}
        applyPreset={applyPreset}
        setShowPresetsDrawer={setShowPresetsDrawer}
        currentImageAssets={currentImageAssets}
        storedMediaLibrary={storedMediaLibrary}
        setStoredMediaLibrary={setStoredMediaLibrary}
        handleMediaFilesUpdate={handleMediaFilesUpdate}
        newYoutubeUrl={newYoutubeUrl}
        setNewYoutubeUrl={setNewYoutubeUrl}
        handleAddYoutubeVideo={handleAddYoutubeVideo}
        storedPricingPackages={storedPricingPackages}
        handleApplyPricingPackage={handleApplyPricingPackage}
        setShowAddPricingPackageModal={setShowAddPricingPackageModal}
        storedChannels={storedChannels}
        setStoredChannels={setStoredChannels}
        setShowAddChannelModal={setShowAddChannelModal}
        isAccountOwner={isAccountOwner}
        handleToggleOwnership={handleToggleOwnership}
        registeredOwners={registeredOwners}
        setShowAddOwnerModal={setShowAddOwnerModal}
        storedWaypointsBank={storedWaypointsBank}
        setStoredWaypointsBank={setStoredWaypointsBank}
        onSaveWaypointToBank={handleSaveWaypointToBank}
        newWaypointName={newWaypointName}
        setNewWaypointName={setNewWaypointName}
        newWaypointType={newWaypointType}
        setNewWaypointType={setNewWaypointType}
        newWaypointDuration={newWaypointDuration}
        setNewWaypointDuration={setNewWaypointDuration}
        newWaypointDepartureTime={newWaypointDepartureTime}
        setNewWaypointDepartureTime={setNewWaypointDepartureTime}
        newWaypointReturnTime={newWaypointReturnTime}
        setNewWaypointReturnTime={setNewWaypointReturnTime}
        handleAddWaypoint={handleAddWaypoint}
        handleMoveWaypoint={handleMoveWaypoint}
        handleRemoveWaypoint={handleRemoveWaypoint}
        storedPickupPoints={storedPickupPoints}
        setShowAddPickupModal={setShowAddPickupModal}
        storedEquipmentList={storedInclusions}
        storedExclusionsList={storedExclusions}
        notifyDbSuccess={notifyDbSuccess}
        currentUser={currentUser}
        equipments={equipments}
        equipmentTypes={equipmentTypes}
        equipmentUnitKinds={equipmentUnitKinds}
        equipmentProperties={equipmentProperties}
        logisticsVehicles={logisticsVehicles}
        masterAddons={masterAddons}
        allActivities={allActivities}
        onNavigateToEquipment={onNavigateToEquipment}
        activityCollections={activityCollections}
        onAddActivityCollection={onAddActivityCollection}
        pricingProperties={pricingProperties}
        customTechnicalSpecs={customTechnicalSpecs}
        specGroups={specGroups}
        inclusionsCatalog={inclusionsCatalog}
        categoryRecords={categoryRecords}
        onNavigateToCustomSpecs={onNavigateToCustomSpecs}
        onNavigateToAddonsLibrary={onNavigateToAddonsLibrary}
        storedDurations={storedDurations}
        setShowAddDurationModal={setShowAddDurationModal}
        storedStatuses={storedStatuses}
        setShowAddStatusModal={setShowAddStatusModal}
        totalStorageBytes={totalStorageBytes}
        storagePercentage={storagePercentage}
        newYoutubeTitle={newYoutubeTitle}
        setNewYoutubeTitle={setNewYoutubeTitle}
        handleRemoveMedia={handleRemoveMedia}
        storedCountries={storedCountriesList}
        handleAddCountryToDb={handleAddCountryToDb}
        storedCities={storedCities}
        setShowAddCityModal={setShowAddCityModal}
        storedSites={storedSites}
        setShowAddSiteModal={setShowAddSiteModal}
        newInclusionInput={newInclusionInput}
        setNewInclusionInput={setNewInclusionInput}
        handleAddInclusionToDb={handleAddInclusionToDb}
        newExclusionInput={newExclusionInput}
        setNewExclusionInput={setNewExclusionInput}
        handleAddExclusionToDb={handleAddExclusionToDb}
        isNewActivity={isNew}
        validationErrors={validationErrors}
        registeredSuppliers={registeredSuppliers}
        supplierJournals={supplierJournals}
        onRegisterNewSupplier={handleRegisterNewSupplier}
        onSubscribeSupplierToPlatform={onSubscribeSupplierToPlatform}
        onSwitchToSubscribedUser={onSwitchToSubscribedUser}
        countriesRef={countriesRef}
        citiesRef={citiesRef}
        meetingPointsRef={meetingPointsRef}
        onCreateCountryRef={onCreateCountryRef}
        onCreateCityRef={onCreateCityRef}
        onCreateMeetingPointRef={onCreateMeetingPointRef}
        draftCostItems={draftCostItems}
        setDraftCostItems={setDraftCostItems}
        draftEurRate={draftEurRate}
        setDraftEurRate={setDraftEurRate}
        draftExpectedPax={draftExpectedPax}
        setDraftExpectedPax={setDraftExpectedPax}
        personProfiles={personProfiles}
        platformPricingSettings={platformPricingSettings}
      />

      <CreationReferenceModals
        terms={terms}
        formData={formData}
        showAddCityModal={showAddCityModal}
        setShowAddCityModal={setShowAddCityModal}
        newCityInput={newCityInput}
        setNewCityInput={setNewCityInput}
        handleAddCityToDb={handleAddCityToDb}
        showAddSiteModal={showAddSiteModal}
        setShowAddSiteModal={setShowAddSiteModal}
        newSiteInput={newSiteInput}
        setNewSiteInput={setNewSiteInput}
        handleAddSiteToDb={handleAddSiteToDb}
        showAddDurationModal={showAddDurationModal}
        setShowAddDurationModal={setShowAddDurationModal}
        newDurationLabel={newDurationLabel}
        setNewDurationLabel={setNewDurationLabel}
        handleAddDurationPresetToDb={handleAddDurationPresetToDb}
        showAddStatusModal={showAddStatusModal}
        setShowAddStatusModal={setShowAddStatusModal}
        newCustomStatusInput={newCustomStatusInput}
        setNewCustomStatusInput={setNewCustomStatusInput}
        handleAddCustomStatusToDb={handleAddCustomStatusToDb}
        showAddChannelModal={showAddChannelModal}
        setShowAddChannelModal={setShowAddChannelModal}
        newChannelName={newChannelName}
        setNewChannelName={setNewChannelName}
        newChannelDesc={newChannelDesc}
        setNewChannelDesc={setNewChannelDesc}
        handleAddCustomChannelToDb={handleAddCustomChannelToDb}
        showAddPickupModal={showAddPickupModal}
        setShowAddPickupModal={setShowAddPickupModal}
        newPickupPointInput={newPickupPointInput}
        setNewPickupPointInput={setNewPickupPointInput}
        handleAddPickupPointToDb={handleAddPickupPointToDb}
        showAddPricingPackageModal={showAddPricingPackageModal}
        setShowAddPricingPackageModal={setShowAddPricingPackageModal}
        newPricingPackageName={newPricingPackageName}
        setNewPricingPackageName={setNewPricingPackageName}
        handleSaveCurrentPricingAsPackage={handleSaveCurrentPricingAsPackage}
        showAddOwnerModal={showAddOwnerModal}
        setShowAddOwnerModal={setShowAddOwnerModal}
        newOwnerName={newOwnerName}
        setNewOwnerName={setNewOwnerName}
        newOwnerCompany={newOwnerCompany}
        setNewOwnerCompany={setNewOwnerCompany}
        newOwnerPhone={newOwnerPhone}
        setNewOwnerPhone={setNewOwnerPhone}
        newOwnerTier={newOwnerTier}
        setNewOwnerTier={setNewOwnerTier}
        handleAddNewOwnerSubmit={handleAddNewOwnerSubmit}
        notifyDbSuccess={notifyDbSuccess}
        showAddCategoryModal={showAddCategoryModal}
        setShowAddCategoryModal={setShowAddCategoryModal}
        targetParentCategoryPath={targetParentCategoryPath}
        newSubcategoryTitle={newSubcategoryTitle}
        setNewSubcategoryTitle={setNewSubcategoryTitle}
        addCategoryToTree={addCategoryToTree}
      />
    </div>
  );
};
