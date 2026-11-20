import React, { useState, useEffect } from 'react';
import { Activity, ActivityMediaItem, ActivityStatus, Waypoint, PricingPropertyItem, CustomTechnicalSpecItem } from '../../types/activity';
import { EquipmentItem, EquipmentTypeDefinition } from '../../types/equipment';
import { Save, Check, CheckCircle2, AlertTriangle, Compass } from 'lucide-react';
import type { Asset } from '../MediaUploadSection';
import { ActivityTwoColumnView } from './ActivityTwoColumnView';
import { ActivityCollection } from './CollectionsManager';
import { loadWaypointsBankFromDb, saveWaypointsToBankDb } from '../../db/localWaypointsDb';
import { AppUser } from '../../types/auth';
import { ActivityEditorModals } from './ActivityEditorModals';
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
  INITIAL_STORED_WAYPOINTS_BANK,
  StoredDurationPreset,
  INITIAL_STORED_DURATIONS,
  StoredStatusOption,
  INITIAL_STORED_STATUSES,
  StoredChannelItem,
  INITIAL_STORED_CHANNELS,
  StoredDescriptionTemplate,
  INITIAL_STORED_DESCRIPTION_TEMPLATES,
  INITIAL_STORED_INCLUSIONS,
  INITIAL_STORED_EXCLUSIONS,
  INITIAL_STORED_PICKUP_POINTS,
  StoredPricingPackage,
  INITIAL_STORED_PRICING_PACKAGES
} from './activityEditorData';

export type {
  RegisteredOwnerItem,
  CategoryNode,
  StoredActivityPreset,
  StoredWaypointTemplate,
  StoredDurationPreset,
  StoredStatusOption,
  StoredChannelItem,
  StoredDescriptionTemplate,
  StoredPricingPackage
};
export {
  INITIAL_CATEGORY_TREE,
  INITIAL_STORED_MEDIA_LIBRARY,
  INITIAL_STORED_PRESETS,
  INITIAL_STORED_COUNTRIES,
  INITIAL_STORED_CITIES,
  INITIAL_STORED_SITES,
  sortItineraryWithAnchors,
  INITIAL_STORED_WAYPOINTS_BANK,
  INITIAL_STORED_DURATIONS,
  INITIAL_STORED_STATUSES,
  INITIAL_STORED_CHANNELS,
  INITIAL_STORED_DESCRIPTION_TEMPLATES,
  INITIAL_STORED_INCLUSIONS,
  INITIAL_STORED_EXCLUSIONS,
  INITIAL_STORED_PICKUP_POINTS,
  INITIAL_STORED_PRICING_PACKAGES
};

interface ActivityEditorProps {
  activity: Activity;
  onSave: (updatedActivity: Activity) => void | Promise<void>;
  onCancel: () => void;
  currentUser?: AppUser;
  equipments?: EquipmentItem[];
  equipmentTypes?: EquipmentTypeDefinition[];
  allActivities?: Activity[];
  onNavigateToEquipment?: () => void;
  activityCollections?: ActivityCollection[];
  onAddActivityCollection?: (col: ActivityCollection) => void;
  pricingProperties?: PricingPropertyItem[];
  customTechnicalSpecs?: CustomTechnicalSpecItem[];
  onNavigateToCustomSpecs?: () => void;
  categoryTree?: CategoryNode[];
  onAddCategoryToTree?: (path: string[], newName: string) => void;
  isNewActivity?: boolean;
}

export const ActivityEditor: React.FC<ActivityEditorProps> = ({
  activity,
  onSave,
  onCancel,
  currentUser,
  equipments = [],
  equipmentTypes = [],
  allActivities = [],
  onNavigateToEquipment,
  activityCollections,
  onAddActivityCollection,
  pricingProperties = [],
  customTechnicalSpecs = [],
  onNavigateToCustomSpecs,
  categoryTree: externalCategoryTree,
  onAddCategoryToTree,
  isNewActivity
}) => {
  const isNew = isNewActivity ?? !allActivities.some((a) => a.id === activity.id);
  const [formData, setFormData] = useState<Activity>({ ...activity });
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
  const [localCategoryTree, setLocalCategoryTree] = useState<CategoryNode[]>(INITIAL_CATEGORY_TREE);
  const categoryTree = externalCategoryTree ?? localCategoryTree;
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [targetParentCategoryPath, setTargetParentCategoryPath] = useState<string[]>([]);
  const [newSubcategoryTitle, setNewSubcategoryTitle] = useState('');
  const [storedMediaLibrary, setStoredMediaLibrary] = useState<Asset[]>(INITIAL_STORED_MEDIA_LIBRARY);

  // Stored presets from database state
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
    setSavePresetToast(`تم اختيار وتحميل "${preset.name.slice(0, 30)}..." ويمكنك التعديل عليها بحرية`);
    setTimeout(() => setSavePresetToast(null), 3500);
  };

  // Database Catalogs State for all fields
  const [storedCountries, setStoredCountries] = useState<string[]>(INITIAL_STORED_COUNTRIES);
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
        // Backfill from real activities already persisted in DB (if any)
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
  const [storedDurations, setStoredDurations] = useState<StoredDurationPreset[]>(INITIAL_STORED_DURATIONS);
  const [storedStatuses, setStoredStatuses] = useState<StoredStatusOption[]>(INITIAL_STORED_STATUSES);
  const [storedChannels, setStoredChannels] = useState<StoredChannelItem[]>(() =>
    isNew ? INITIAL_STORED_CHANNELS.map((c) => ({ ...c, active: false })) : INITIAL_STORED_CHANNELS
  );
  const [storedInclusions, setStoredInclusions] = useState<string[]>(INITIAL_STORED_INCLUSIONS);
  const [storedExclusions, setStoredExclusions] = useState<string[]>(INITIAL_STORED_EXCLUSIONS);
  const [storedPickupPoints, setStoredPickupPoints] = useState<string[]>(INITIAL_STORED_PICKUP_POINTS);
  const [storedPricingPackages, setStoredPricingPackages] = useState<StoredPricingPackage[]>(INITIAL_STORED_PRICING_PACKAGES);

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
    if (!storedCountries.includes(name)) {
      setStoredCountries((prev) => [...prev, name]);
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
    const label = newDurationLabel.trim() || `${days ? days + ' يوم ' : ''}${hours ? hours + ' ساعة ' : ''}${minutes ? minutes + ' دقيقة' : ''}`.trim() || 'مدة مخصصة';
    
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
      description: newChannelDesc.trim() || 'قناة نشر مخصصة ومضافة بواسطة صاحب النشاط',
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
    notifyDbSuccess(`✓ تمت إضافة بند "${val}" إلى بنك المشمولات وتفعيله`);
  };

  const handleAddExclusionToDb = (item: string) => {
    if (!item.trim()) return;
    const val = item.trim();
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
    notifyDbSuccess(`✓ تمت إضافة بند "${val}" إلى بنك غير المشمول وتفعيله`);
  };

  const handleAddPickupPointToDb = (pt: string) => {
    if (!pt.trim()) return;
    const name = pt.trim();
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

  // Helper to add a category node under a specific path in the tree
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

    // If adding to root
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

    // Deep clone and insert into matching branch
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


  // Ownership state (Section 1 item 7 - On / Off switch & registered partners)
  const activePageOwner: RegisteredOwnerItem = currentUser ? {
    id: currentUser.id,
    name: `${currentUser.name} (صاحب الصفحة)`,
    companyName: currentUser.companyName,
    phone: currentUser.phone,
    tier: `${currentUser.tier} (الحساب الحالي)`
  } : DEFAULT_PAGE_OWNER;

  const [isAccountOwner, setIsAccountOwner] = useState<boolean>(() => {
    if (!activity.owner?.id) return true;
    if (currentUser) {
      return activity.owner.id === currentUser.id || activity.owner.name.includes(currentUser.name);
    }
    return (
      activity.owner.id === 'own-001' ||
      activity.owner.id === 'own-page-user' ||
      activity.owner.name.includes('أحمد') ||
      activity.owner.name.includes('صاحب الصفحة')
    );
  });
  const [registeredOwners, setRegisteredOwners] = useState<RegisteredOwnerItem[]>(INITIAL_REGISTERED_OWNERS);
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
        owner: activePageOwner
      }));
    } else {
      const targetOther = registeredOwners[0] || activePageOwner;
      setFormData((prev) => ({
        ...prev,
        owner: targetOther
      }));
    }
  };



  const handleAddNewOwnerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newOwnerName.trim() || !newOwnerCompany.trim()) return;

    const createdOwner: RegisteredOwnerItem = {
      id: `own-${Date.now().toString().slice(-4)}`,
      name: newOwnerName.trim(),
      companyName: newOwnerCompany.trim(),
      phone: newOwnerPhone.trim() || '+201000000000',
      tier: newOwnerTier
    };

    setRegisteredOwners((prev) => [...prev, createdOwner]);
    setFormData((prev) => ({
      ...prev,
      owner: createdOwner
    }));

    setNewOwnerName('');
    setNewOwnerCompany('');
    setNewOwnerPhone('');
    setNewOwnerTier('شخصي');
    setShowAddOwnerModal(false);
  };

  // Storage quota simulated metrics
  const totalStorageBytes = formData.media.reduce((acc, m) => acc + m.fileSizeBytes, 0);
  const maxStorageBytes = 2 * 1024 * 1024 * 1024; // 2GB
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
      returnTime:
        newWaypointType === 'return' ? newWaypointReturnTime || undefined : undefined,
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

      // Enforce anchor constraint: departure always stays at the start, return always stays at the end
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

  // Memoized initial media image assets to avoid unstable array references
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
        files.every((f, idx) => prevImages[idx] && prevImages[idx].id === f.id && prevImages[idx].url === f.url)
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
    const isDuplicate = formData.media.some((m) => m.url.trim().toLowerCase() === newYoutubeUrl.trim().toLowerCase());
    if (isDuplicate) {
      notifyDbSuccess('⚠️ هذا الفيديو أو الرابط مضاف مسبقاً في وسائط النشاط (ممنوع تكرار الوسائط)');
      return;
    }
    const newMedia: ActivityMediaItem = {

      id: `vid-${Date.now()}`,
      url: newYoutubeUrl,
      title: newYoutubeTitle || 'فيديو استعراضي للنشاط على YouTube',
      isCover: false,
      order: formData.media.length + 1,
      fileSizeBytes: 0, // YouTube does not consume storage space!
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
      errors.push('إضافة صورة واحدة على الأقل للنشاط');
    }

    if (!formData.name.trim()) {
      errors.push('إدخال اسم النشاط');
    }

    if (!formData.description.trim()) {
      errors.push('إدخال وصف النشاط');
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
      errors.push('تحديد سعر النشاط (قيمة أكبر من 0)');
    }

    if (!formData.status || !formData.status.trim()) {
      errors.push('تحديد حالة النشاط');
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
            <span>نظام إدارة الأنشطة المعتمد منصة ZanoZa</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400 font-normal">معرف النشاط: {formData.id}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {formData.name || 'نشاط سياحي جديد'}
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

      {validationErrors.length > 0 && (
        <div className="bg-rose-950/85 border border-rose-500/60 text-rose-100 px-4 py-3.5 rounded-xl text-xs space-y-2 animate-fade-in">
          <div className="flex items-center justify-between gap-2 font-bold text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>لا يمكن حفظ النشاط قبل استكمال البيانات الإلزامية التالية:</span>
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
            <span>تم حفظ النشاط ومزامنة التعديلات بنجاح في قاعدة بيانات المنصة.</span>
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
      <ActivityTwoColumnView
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
        allActivities={allActivities}
        onNavigateToEquipment={onNavigateToEquipment}
        activityCollections={activityCollections}
        onAddActivityCollection={onAddActivityCollection}
        pricingProperties={pricingProperties}
        customTechnicalSpecs={customTechnicalSpecs}
        onNavigateToCustomSpecs={onNavigateToCustomSpecs}
        storedDurations={storedDurations}
        setShowAddDurationModal={setShowAddDurationModal}
        storedStatuses={storedStatuses}
        setShowAddStatusModal={setShowAddStatusModal}
        totalStorageBytes={totalStorageBytes}
        storagePercentage={storagePercentage}
        newYoutubeTitle={newYoutubeTitle}
        setNewYoutubeTitle={setNewYoutubeTitle}
        handleRemoveMedia={handleRemoveMedia}
        storedCountries={storedCountries}
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
      />










      <ActivityEditorModals
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
