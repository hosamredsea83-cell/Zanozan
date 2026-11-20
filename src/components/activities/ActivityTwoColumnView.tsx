import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, BookOpen, FolderTree, Plus, ChevronRight, ChevronUp, ChevronDown, Check, DollarSign,
  Calendar, Truck, Tag, ExternalLink, Globe, Store, Share2, Info, UserCheck, UserPlus,
  Building2, Phone, Shield, Youtube, Edit2, Layers, Search, HelpCircle, X, Languages, Clock,
  MapPin, Database, Trash2, Image
} from 'lucide-react';
import { Activity, Waypoint, TimeSlotCapacity, PricingPropertyItem, CustomTechnicalSpecItem, MetaGroup, MetaField } from '../../types/activity';
import { AppUser } from '../../types/auth';
import { EquipmentItem, EquipmentTypeDefinition } from '../../types/equipment';
import { CategoryNode, sortItineraryWithAnchors } from './ActivityEditor';
import { MultiLevelCategoryDropdown } from './MultiLevelCategoryDropdown';
import { MediaUploadSection, Asset } from '../MediaUploadSection';
import { StoredChannelItem, StoredActivityPreset, StoredPricingPackage, RegisteredOwnerItem, StoredWaypointTemplate, StoredDurationPreset, StoredStatusOption } from './ActivityEditor';
import { INITIAL_COLLECTIONS, ActivityCollection } from './CollectionsManager';
import { ActivityEquipmentSelector } from './ActivityEquipmentSelector';
import { DynamicPricingRulesEditor } from './DynamicPricingRulesEditor';

interface ActivityTwoColumnViewProps {
  formData: Activity;
  setFormData: React.Dispatch<React.SetStateAction<Activity>>;
  categoryTree: CategoryNode[];
  addCategoryToTree: (parentPath: string[], name: string) => void;
  handleRemoveCategoryLevel: (levelIndex: number) => void;
  setShowAddCategoryModal: (show: boolean) => void;
  setTargetParentCategoryPath: (path: string[]) => void;
  setNewSubcategoryTitle: (title: string) => void;
  storedPresets: StoredActivityPreset[];
  applyPreset: (preset: StoredActivityPreset) => void;
  setShowPresetsDrawer: (show: boolean) => void;
  currentImageAssets: Asset[];
  storedMediaLibrary: Asset[];
  setStoredMediaLibrary: React.Dispatch<React.SetStateAction<Asset[]>>;
  handleMediaFilesUpdate: (files: Asset[]) => void;
  newYoutubeUrl: string;
  setNewYoutubeUrl: (url: string) => void;
  handleAddYoutubeVideo: () => void;
  storedPricingPackages: StoredPricingPackage[];
  handleApplyPricingPackage: (pkg: StoredPricingPackage) => void;
  setShowAddPricingPackageModal: (show: boolean) => void;
  storedChannels: StoredChannelItem[];
  setStoredChannels: React.Dispatch<React.SetStateAction<StoredChannelItem[]>>;
  setShowAddChannelModal: (show: boolean) => void;
  isAccountOwner: boolean;
  handleToggleOwnership: (isOwner: boolean) => void;
  registeredOwners: RegisteredOwnerItem[];
  setShowAddOwnerModal: (show: boolean) => void;
  storedWaypointsBank: StoredWaypointTemplate[];
  setStoredWaypointsBank: React.Dispatch<React.SetStateAction<StoredWaypointTemplate[]>>;
  onSaveWaypointToBank: (item: {
    id?: string;
    name: string;
    type: Waypoint['type'];
    durationMinutes?: number;
    departureTime?: string;
    returnTime?: string;
    description?: string;
  }) => void | Promise<void>;
  newWaypointName: string;
  setNewWaypointName: (name: string) => void;
  newWaypointType: Waypoint['type'];
  setNewWaypointType: (type: Waypoint['type']) => void;
  newWaypointDuration: number;
  setNewWaypointDuration: (duration: number) => void;
  newWaypointDepartureTime: string;
  setNewWaypointDepartureTime: (time: string) => void;
  newWaypointReturnTime: string;
  setNewWaypointReturnTime: (time: string) => void;
  handleAddWaypoint: () => void;
  handleMoveWaypoint: (id: string, direction: 'up' | 'down') => void;
  handleRemoveWaypoint: (id: string) => void;
  storedPickupPoints: string[];
  setShowAddPickupModal: (show: boolean) => void;
  storedEquipmentList: string[];
  storedExclusionsList: string[];
  notifyDbSuccess: (msg: string) => void;
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
  storedDurations?: StoredDurationPreset[];
  setShowAddDurationModal?: (show: boolean) => void;
  storedStatuses?: StoredStatusOption[];
  setShowAddStatusModal?: (show: boolean) => void;
  totalStorageBytes?: number;
  storagePercentage?: number;
  newYoutubeTitle?: string;
  setNewYoutubeTitle?: (title: string) => void;
  handleRemoveMedia?: (id: string) => void;
  storedCountries?: string[];
  handleAddCountryToDb?: (country: string) => void;
  storedCities?: string[];
  setShowAddCityModal?: (show: boolean) => void;
  storedSites?: string[];
  setShowAddSiteModal?: (show: boolean) => void;
  newInclusionInput?: string;
  setNewInclusionInput?: (val: string) => void;
  handleAddInclusionToDb?: (val: string) => void;
  newExclusionInput?: string;
  setNewExclusionInput?: (val: string) => void;
  handleAddExclusionToDb?: (val: string) => void;
  isNewActivity?: boolean;
  validationErrors?: string[];
}

export const ActivityTwoColumnView: React.FC<ActivityTwoColumnViewProps> = ({
  formData,
  setFormData,
  categoryTree,
  addCategoryToTree,
  handleRemoveCategoryLevel,
  storedPresets,
  applyPreset,
  setShowPresetsDrawer,
  currentImageAssets,
  storedMediaLibrary,
  setStoredMediaLibrary,
  handleMediaFilesUpdate,
  newYoutubeUrl,
  setNewYoutubeUrl,
  handleAddYoutubeVideo,
  storedChannels,
  setStoredChannels,
  setShowAddChannelModal,
  isAccountOwner,
  handleToggleOwnership,
  registeredOwners,
  setShowAddOwnerModal,
  storedWaypointsBank,
  setStoredWaypointsBank,
  onSaveWaypointToBank,
  newWaypointName,
  setNewWaypointName,
  newWaypointType,
  setNewWaypointType,
  newWaypointDuration,
  setNewWaypointDuration,
  newWaypointDepartureTime,
  setNewWaypointDepartureTime,
  newWaypointReturnTime,
  setNewWaypointReturnTime,
  handleAddWaypoint,
  handleMoveWaypoint,
  handleRemoveWaypoint,
  storedPickupPoints,
  setShowAddPickupModal,
  storedEquipmentList,
  storedExclusionsList,
  notifyDbSuccess,
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
  storedDurations = [],
  setShowAddDurationModal,
  storedStatuses = [],
  setShowAddStatusModal,
  totalStorageBytes = 0,
  storagePercentage = 0,
  newYoutubeTitle = '',
  setNewYoutubeTitle,
  handleRemoveMedia,
  storedCountries = [],
  handleAddCountryToDb,
  storedCities = [],
  setShowAddCityModal,
  storedSites = [],
  setShowAddSiteModal,
  newInclusionInput = '',
  setNewInclusionInput,
  handleAddInclusionToDb,
  newExclusionInput = '',
  setNewExclusionInput,
  handleAddExclusionToDb,
  isNewActivity = false,
  validationErrors = []
}) => {
  // Local state for UI controls in Two-Column Add Activity screen
  const [chargeTax, setChargeTax] = useState(!isNewActivity);
  const [inventoryTracked, setInventoryTracked] = useState(!isNewActivity);
  const [skuCode, setSkuCode] = useState(
    isNewActivity ? '' : formData.id ? `ACT-${formData.id.toUpperCase().slice(0, 8)}` : ''
  );
  const [barcode, setBarcode] = useState('');
  const [sellWhenOutOfStock, setSellWhenOutOfStock] = useState(false);
  const [activityType, setActivityType] = useState(
    formData.tripNature || ''
  );
  const [showInlineCountryAdd, setShowInlineCountryAdd] = useState(false);
  const [inlineCountryName, setInlineCountryName] = useState('');

  // Collections Multi-Select State — Strictly ONLY collections added by the activity owner
  const targetOwnerId = formData.owner?.id || currentUser?.id;
  const targetOwnerName = formData.owner?.name || currentUser?.name || 'صاحب النشاط';
  const sourceCollections = activityCollections ?? INITIAL_COLLECTIONS;
  const ownerAddedCollections = sourceCollections.filter(
    (c) => targetOwnerId && c.ownerId === targetOwnerId
  );

  const [localAddedCollections, setLocalAddedCollections] = useState<ActivityCollection[]>([]);
  const availableCollections = [
    ...localAddedCollections.filter(
      (lc) => !ownerAddedCollections.some((oc) => oc.name.toLowerCase() === lc.name.toLowerCase())
    ),
    ...ownerAddedCollections
  ];

  const [selectedCollections, setSelectedCollections] = useState<string[]>(() =>
    ownerAddedCollections
      .filter((c) => formData.id && c.activityIds.includes(formData.id))
      .map((c) => c.name)
  );
  const [, setCollectionsTag] = useState(() => selectedCollections.join('، '));
  const [collectionSearchInput, setCollectionSearchInput] = useState('');
  const [isCollectionsDropdownOpen, setIsCollectionsDropdownOpen] = useState(false);
  const collectionsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const validForOwner = sourceCollections
      .filter((c) => targetOwnerId && c.ownerId === targetOwnerId && formData.id && c.activityIds.includes(formData.id))
      .map((c) => c.name);
    setSelectedCollections(validForOwner);
    setCollectionsTag(validForOwner.join('، '));
  }, [targetOwnerId, formData.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collectionsContainerRef.current && !collectionsContainerRef.current.contains(event.target as Node)) {
        setIsCollectionsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSelectCollection = (name: string) => {
    setSelectedCollections(prev => {
      const exists = prev.includes(name);
      const next = exists ? prev.filter(c => c !== name) : [...prev, name];
      setCollectionsTag(next.join('، '));
      return next;
    });
  };

  const handleRemoveCollection = (name: string) => {
    setSelectedCollections(prev => {
      const next = prev.filter(c => c !== name);
      setCollectionsTag(next.join('، '));
      return next;
    });
  };

  const handleAddNewCustomCollection = (name: string) => {
    if (!name.trim()) return;
    const trimmed = name.trim();
    if (!availableCollections.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      const created: ActivityCollection = {
        id: `col-${Date.now().toString().slice(-4)}`,
        name: trimmed,
        description: `مجموعة مضافة من قِبل ${targetOwnerName}`,
        coverUrl: '/src/assets/images/zanoza_yacht_hurghada_1794046061468.jpg',
        category: formData.categoryPath[1] || 'مخصصة',
        activityIds: formData.id ? [formData.id] : [],
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        ownerId: targetOwnerId,
        ownerName: targetOwnerName
      };
      if (onAddActivityCollection) {
        onAddActivityCollection(created);
      } else {
        setLocalAddedCollections(prev => [created, ...prev]);
      }
    }
    if (!selectedCollections.includes(trimmed)) {
      handleToggleSelectCollection(trimmed);
    }
    notifyDbSuccess(`✓ تمت إضافة المجموعة "${trimmed}" لحساب صاحب النشاط وتعيينها للنشاط`);
  };

  const filteredAvailableCollections = availableCollections.filter(c => 
    c.name.toLowerCase().includes(collectionSearchInput.toLowerCase()) ||
    (c.category && c.category.toLowerCase().includes(collectionSearchInput.toLowerCase()))
  );
  const [tagsInput, setTagsInput] = useState('');
  const [themeTemplate, setThemeTemplate] = useState(isNewActivity ? '' : 'default_product');

  // SEO state
  const [isSeoEditing, setIsSeoEditing] = useState(false);
  const [customSeoTitle, setCustomSeoTitle] = useState('');
  const [customSeoDescription, setCustomSeoDescription] = useState('');
  const [customSeoHandle, setCustomSeoHandle] = useState('');

  // Variants list for activity packages card
  const [variants, setVariants] = useState<Array<{ id: string; name: string; priceEGP: number; priceUSD: number }>>(() =>
    isNewActivity
      ? []
      : [
          { id: 'v-1', name: 'باقة فردية (Single Ticket)', priceEGP: formData.pricing?.egyptianB2C?.adultEGP || 0, priceUSD: formData.pricing?.foreignerB2C?.adultEUR || 0 },
          { id: 'v-2', name: 'باقة زوجية (Couple Pack)', priceEGP: Math.round((formData.pricing?.egyptianB2C?.adultEGP || 0) * 1.85), priceUSD: Math.round((formData.pricing?.foreignerB2C?.adultEUR || 0) * 1.85) },
          { id: 'v-3', name: 'باقة عائلية (Family 4 Pax)', priceEGP: Math.round((formData.pricing?.egyptianB2C?.adultEGP || 0) * 3.4), priceUSD: Math.round((formData.pricing?.foreignerB2C?.adultEUR || 0) * 3.4) },
          { id: 'v-4', name: 'يخت خاص VIP (Private Cruise)', priceEGP: formData.pricing?.egyptianB2C?.privateTotalEGP || 0, priceUSD: formData.pricing?.foreignerB2C?.privateTotalEUR || 0 }
        ]
  );
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarPriceEGP, setNewVarPriceEGP] = useState(0);
  const [newVarPriceUSD, setNewVarPriceUSD] = useState(0);

  // Owner block state
  const [showAddOwnerBlock, setShowAddOwnerBlock] = useState(false);
  const [newOwnerNameInput, setNewOwnerNameInput] = useState('');
  const [newOwnerCompanyInput, setNewOwnerCompanyInput] = useState('');
  const [newOwnerPhoneInput, setNewOwnerPhoneInput] = useState('');
  const [newOwnerTierInput, setNewOwnerTierInput] = useState('شخصي');

  const handleAddNewOwner = () => {
    if (!newOwnerNameInput.trim() || !newOwnerCompanyInput.trim()) return;
    const newOwner: RegisteredOwnerItem = {
      id: `own-${Date.now().toString().slice(-4)}`,
      name: newOwnerNameInput.trim(),
      companyName: newOwnerCompanyInput.trim(),
      phone: newOwnerPhoneInput.trim() || '+201000000000',
      tier: newOwnerTierInput
    };
    registeredOwners.push(newOwner);
    setFormData((prev) => ({
      ...prev,
      owner: newOwner
    }));
    notifyDbSuccess(`✓ تمت إضافة المالك "${newOwner.name}" وإسناد النشاط له بنجاح في قاعدة البيانات`);
    setShowAddOwnerBlock(false);
    setNewOwnerNameInput('');
    setNewOwnerCompanyInput('');
    setNewOwnerPhoneInput('');
    setNewOwnerTierInput('شخصي');
    handleToggleOwnership(false);
  };

  // Computed SEO handle
  const defaultSlug = (formData.translations?.en?.name || formData.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const activeSlug = customSeoHandle || defaultSlug || '';
  const activeSeoTitle = customSeoTitle || formData.name || 'عنوان النشاط';
  const activeSeoDesc = customSeoDescription || (formData.description ? formData.description.slice(0, 160) : 'لا يوجد وصف تعريفي مدخل بعد.');

  // Handle adding variant
  const handleAddVariant = () => {
    if (!newVarName.trim()) return;
    const item = {
      id: `v-${Date.now()}`,
      name: newVarName.trim(),
      priceEGP: newVarPriceEGP,
      priceUSD: newVarPriceUSD
    };
    setVariants(prev => [...prev, item]);
    setNewVarName('');
    setShowAddVariantModal(false);
    notifyDbSuccess(`✓ تمت إضافة الباقة "${item.name}"`);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
    notifyDbSuccess(`تم حذف الباقة`);
  };

  // Track which group's details should be shown after inserting a group
  const [activeInsertedSpecGroupTitle, setActiveInsertedSpecGroupTitle] = useState<string | null>(null);

  // Technical Specifications (MetaGroups) Interactive Editor Helpers (100% from IndexedDB)
  const activeCustomSpecs = customTechnicalSpecs.filter((s) => s.isActive);

  const groupedActiveCustomSpecs = activeCustomSpecs.reduce<
    Array<{ title: string; specs: CustomTechnicalSpecItem[] }>
  >((acc, spec) => {
    const title = (spec.groupTitle || 'المواصفات الفنية للنشاط').trim();
    const existing = acc.find((g) => g.title.toLowerCase() === title.toLowerCase());
    if (existing) {
      existing.specs.push(spec);
    } else {
      acc.push({ title, specs: [spec] });
    }
    return acc;
  }, []);

  const selectedSpecGroup = activeInsertedSpecGroupTitle
    ? groupedActiveCustomSpecs.find(
        (g) => g.title.trim().toLowerCase() === activeInsertedSpecGroupTitle.trim().toLowerCase()
      ) ?? null
    : null;

  const handleInsertCustomSpecGroup = (
    groupTitle: string,
    specs: CustomTechnicalSpecItem[]
  ) => {
    if (specs.length === 0) return;
    setActiveInsertedSpecGroupTitle(groupTitle);
    const nowSuffix = Date.now().toString().slice(-4);

    setFormData((prev) => {
      const existingGroups = prev.metaGroups || [];
      const matched = existingGroups.find(
        (g) => g.title.trim().toLowerCase() === groupTitle.trim().toLowerCase()
      );
      if (matched) {
        return prev;
      }
      const createdGroup: MetaGroup = {
        id: `mg-custom-${nowSuffix}`,
        title: groupTitle,
        fields: []
      };
      return {
        ...prev,
        metaGroups: [...existingGroups, createdGroup]
      };
    });

    notifyDbSuccess(`✓ تم إدراج مجموعة "${groupTitle}" — اختر المواصفات المطلوبة يدوياً من التفاصيل`);
  };

  const handleUpdateMetaGroupTitle = (groupId: string, title: string) => {
    setFormData((prev) => ({
      ...prev,
      metaGroups: prev.metaGroups.map((g) => (g.id === groupId ? { ...g, title } : g))
    }));
  };

  const handleRemoveMetaGroup = (groupId: string) => {
    const removedGroup = (formData.metaGroups || []).find((g) => g.id === groupId);
    if (
      removedGroup &&
      activeInsertedSpecGroupTitle &&
      removedGroup.title.trim().toLowerCase() === activeInsertedSpecGroupTitle.trim().toLowerCase()
    ) {
      setActiveInsertedSpecGroupTitle(null);
    }
    setFormData((prev) => ({
      ...prev,
      metaGroups: prev.metaGroups.filter((g) => g.id !== groupId)
    }));
  };

  const handleUpdateMetaField = (groupId: string, fieldId: string, patch: Partial<MetaField>) => {
    setFormData((prev) => ({
      ...prev,
      metaGroups: prev.metaGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              fields: g.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f))
            }
          : g
      )
    }));
  };

  const handleRemoveMetaField = (groupId: string, fieldId: string) => {
    setFormData((prev) => ({
      ...prev,
      metaGroups: prev.metaGroups.map((g) =>
        g.id === groupId
          ? { ...g, fields: g.fields.filter((f) => f.id !== fieldId) }
          : g
      )
    }));
  };

  const handleToggleCustomSpec = (spec: CustomTechnicalSpecItem) => {
    const specKey = `custom_${spec.id}`;
    const newField: MetaField = {
      id: `mf-${spec.id}-${Date.now().toString().slice(-4)}`,
      key: specKey,
      label: spec.label,
      type: spec.type,
      value: spec.defaultValue,
      options: spec.options,
      isRequired: spec.isRequired,
      isPublicForClient: spec.isPublicForClient,
      isLinkedToCentralLibrary: false
    };

    const targetTitle = (spec.groupTitle || 'المواصفات الفنية للنشاط').trim();
    const existingGroups = formData.metaGroups || [];
    const matchedGroup = existingGroups.find(
      (g) => g.title.trim().toLowerCase() === targetTitle.toLowerCase()
    );

    if (matchedGroup) {
      const alreadyExists = matchedGroup.fields.some((f) => f.key === specKey);
      if (alreadyExists) {
        setFormData((prev) => ({
          ...prev,
          metaGroups: prev.metaGroups.map((g) =>
            g.id === matchedGroup.id
              ? { ...g, fields: g.fields.filter((f) => f.key !== specKey) }
              : g
          )
        }));
        notifyDbSuccess(`تم إلغاء تحديد "${spec.label}" من مجموعة "${targetTitle}"`);
        return;
      }
      setFormData((prev) => ({
        ...prev,
        metaGroups: prev.metaGroups.map((g) =>
          g.id === matchedGroup.id ? { ...g, fields: [...g.fields, newField] } : g
        )
      }));
    } else {
      const createdGroup: MetaGroup = {
        id: `mg-custom-${Date.now().toString().slice(-4)}`,
        title: targetTitle,
        fields: [newField]
      };
      setFormData((prev) => ({
        ...prev,
        metaGroups: [...(prev.metaGroups || []), createdGroup]
      }));
    }

    notifyDbSuccess(`✓ تم تحديد "${spec.label}" داخل مجموعة "${targetTitle}"`);
  };

  const [isInstantTranslating, setIsInstantTranslating] = useState(false);
  const [translateDirection, setTranslateDirection] = useState<'ar_to_en' | 'en_to_ar'>('ar_to_en');
  const clientTranslationCacheRef = React.useRef<Map<string, string>>(new Map());

  const showTranslateFeedback = (type: 'success' | 'error', message: string) => {
    notifyDbSuccess(type === 'success' ? message : `⚠️ ${message}`);
  };

  const handleInstantTranslate = async () => {
    const arName = formData.name.trim();
    const arDesc = formData.description.trim();
    const enName = formData.translations?.en?.name?.trim() || '';
    const enDesc = formData.translations?.en?.description?.trim() || '';

    const isArToEn = translateDirection === 'ar_to_en';
    const sourceLang: 'ar' | 'en' = isArToEn ? 'ar' : 'en';
    const targetLang: 'ar' | 'en' = isArToEn ? 'en' : 'ar';

    const items: Array<{ key: 'name' | 'description'; text: string }> = [];
    if (isArToEn) {
      if (arName) items.push({ key: 'name', text: arName });
      if (arDesc) items.push({ key: 'description', text: arDesc });
      if (items.length === 0) {
        showTranslateFeedback('error', 'يرجى كتابة الاسم أو الوصف بالعربية أولاً للترجمة إلى الإنجليزية');
        return;
      }
    } else {
      if (enName) items.push({ key: 'name', text: enName });
      if (enDesc) items.push({ key: 'description', text: enDesc });
      if (items.length === 0) {
        showTranslateFeedback('error', 'يرجى كتابة الاسم أو الوصف بالإنجليزية أولاً للترجمة إلى العربية');
        return;
      }
    }

    const cache = clientTranslationCacheRef.current;
    const resolvedMap: Record<string, string> = {};
    const uncachedItems: Array<{ key: 'name' | 'description'; text: string }> = [];

    for (const item of items) {
      const cacheKey = `${sourceLang}:${targetLang}:${item.text}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        resolvedMap[item.key] = cached;
      } else {
        uncachedItems.push(item);
      }
    }

    const applyTranslations = (map: Record<string, string>) => {
      if (isArToEn) {
        setFormData((prev) => ({
          ...prev,
          translations: {
            ...prev.translations,
            en: {
              ...prev.translations?.en,
              name: map.name?.trim() || prev.translations?.en?.name || '',
              description: map.description?.trim() || prev.translations?.en?.description || '',
            },
          },
        }));
        showTranslateFeedback('success', '✓ تمت الترجمة الفورية للاسم والوصف إلى الإنجليزية بدقة');
      } else {
        setFormData((prev) => ({
          ...prev,
          name: map.name?.trim() || prev.name,
          description: map.description?.trim() || prev.description,
        }));
        showTranslateFeedback('success', '✓ تمت الترجمة الفورية للاسم والوصف إلى العربية بدقة');
      }
    };

    if (uncachedItems.length === 0) {
      applyTranslations(resolvedMap);
      return;
    }

    setIsInstantTranslating(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 9000);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ items: uncachedItems, sourceLang, targetLang }),
      });

      const rawBody = await response.text();
      let data: { translations?: Record<string, string>; error?: string } = {};
      if (rawBody) {
        try {
          data = JSON.parse(rawBody) as { translations?: Record<string, string>; error?: string };
        } catch {
          throw new Error(`استجابة غير صالحة من خادم الترجمة (${response.status})`);
        }
      }

      if (!response.ok || !data.translations) {
        throw new Error(data.error || `تعذرت الترجمة الفورية حالياً (${response.status})`);
      }

      for (const item of uncachedItems) {
        const translated = data.translations[item.key]?.trim();
        if (translated) {
          resolvedMap[item.key] = translated;
          if (cache.size >= 400) {
            const oldest = cache.keys().next().value;
            if (oldest) cache.delete(oldest);
          }
          cache.set(`${sourceLang}:${targetLang}:${item.text}`, translated);
        }
      }

      applyTranslations(resolvedMap);
    } catch (error) {
      const isTimeout = error instanceof DOMException && error.name === 'AbortError';
      const message = isTimeout
        ? 'انتهت مهلة الاتصال بخدمة الترجمة، يرجى المحاولة مرة أخرى'
        : error instanceof Error && error.message
        ? error.message
        : 'تعذر إتمام الترجمة الفورية، يرجى المحاولة مرة أخرى';
      showTranslateFeedback('error', message);
    } finally {
      window.clearTimeout(timeoutId);
      setIsInstantTranslating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ========================================================
          1. MAIN COLUMN (العمود الرئيسي - 8 أعمدة)
          يحتوي على: العنوان والوصف، الوسائط، التصنيف، التسعير، المخزون والسعة، الشحن واللوجستيات، الخيارات، ومعاينة محركات البحث
      ======================================================== */}
      <div className="lg:col-span-8 space-y-6">

        {/* 1. الاسم والوصف (العربية والإنجليزية + زر ترجمة فورية) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>الاسم والوصف (بالعربية والإنجليزية)</span>
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={translateDirection}
                onChange={(e) => setTranslateDirection(e.target.value as 'ar_to_en' | 'en_to_ar')}
                disabled={isInstantTranslating}
                aria-label="اتجاه الترجمة"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ar_to_en">AR-EN (عربي ← إنجليزي)</option>
                <option value="en_to_ar">EN-AR (إنجليزي ← عربي)</option>
              </select>

              <button
                type="button"
                onClick={handleInstantTranslate}
                disabled={isInstantTranslating}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Languages className={`w-3.5 h-3.5 ${isInstantTranslating ? 'animate-spin' : ''}`} />
                <span>{isInstantTranslating ? 'جاري الترجمة...' : 'ترجمة فورية'}</span>
              </button>
            </div>
          </div>

          {/* الاسم بالعربي و الاسم بالإنجليزية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                الاسم بالعربي *
              </label>
              <input
                type="text"
                placeholder="اكتب اسم النشاط بالعربية..."
                value={formData.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, name: value }));
                }}
                className={`w-full bg-slate-950 border rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors ${
                  validationErrors.some((e) => e.includes('اسم النشاط')) ? 'border-rose-500/70' : 'border-slate-800'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                الاسم بالإنجليزية
              </label>
              <input
                type="text"
                dir="ltr"
                placeholder="Activity name in English..."
                value={formData.translations?.en?.name || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    translations: {
                      ...prev.translations,
                      en: { ...prev.translations?.en, name: value }
                    }
                  }));
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans transition-colors"
              />
            </div>
          </div>

          {/* الوصف بالعربي و الوصف بالإنجليزية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                الوصف بالعربي *
              </label>
              <textarea
                rows={4}
                placeholder="اكتب وصف النشاط بالعربية..."
                value={formData.description}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, description: value }));
                }}
                className={`w-full bg-slate-950 border rounded-lg p-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed ${
                  validationErrors.some((e) => e.includes('وصف النشاط')) ? 'border-rose-500/70' : 'border-slate-800'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                الوصف بالإنجليزية
              </label>
              <textarea
                rows={4}
                dir="ltr"
                placeholder="Activity description in English..."
                value={formData.translations?.en?.description || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    translations: {
                      ...prev.translations,
                      en: { ...prev.translations?.en, description: value }
                    }
                  }));
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 2. الوسائط (Media) */}
        <div className={`space-y-4 rounded-2xl ${
          validationErrors.some((e) => e.includes('صورة')) ? 'ring-1 ring-rose-500/70 p-1' : ''
        }`}>
          <MediaUploadSection
            title="Media / وسائط وصور النشاط"
            initialFiles={currentImageAssets}
            existingLibrary={storedMediaLibrary}
            maxFiles={12}
            onUpdate={handleMediaFilesUpdate}
            onAddToLibrary={(newAsset) => {
              setStoredMediaLibrary((prev) => {
                const exists = prev.some((item) => item.name === newAsset.name && item.sizeBytes === newAsset.sizeBytes);
                return exists ? prev : [newAsset, ...prev];
              });
            }}
          />

          {/* Storage Quota Gauge */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Image className="w-4 h-4 text-cyan-400" />
                  <span>حدود التخزين وباقة المالك</span>
                </h3>
                <p className="text-xs text-slate-400">
                  الحدود مرتبطة بباقة صاحب النشاط. روابط YouTube لا تستهلك مساحة التخزين في المنصة.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                باقة: {formData.owner?.tier || 'افتراضي'}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>المساحة المستهلكة: {(totalStorageBytes / (1024 * 1024)).toFixed(1)} ميجابايت من 2048 ميجابايت</span>
                <span>{storagePercentage}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, storagePercentage)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Attached YouTube Videos List */}
          {formData.media.filter((m) => m.type === 'video').length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-bold border-b border-slate-800 pb-2">
                <span className="flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-rose-500" />
                  <span>فيديوهات النشاط المرفقة من YouTube (0MB استهلاك مساحة):</span>
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  {formData.media.filter((m) => m.type === 'video').length} فيديو
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.media.filter((m) => m.type === 'video').map((vid) => (
                  <div key={vid.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-rose-950/60 border border-rose-800/50 flex items-center justify-center shrink-0">
                        <Youtube className="w-5 h-5 text-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-white font-medium truncate">{vid.title}</p>
                        <a href={vid.url} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-400 hover:underline truncate block font-mono">
                          {vid.url}
                        </a>
                      </div>
                    </div>
                    {handleRemoveMedia && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(vid.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                        title="حذف الفيديو"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Attachment */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Youtube className="w-4 h-4 text-rose-500" />
                <span>فيديو ترويجي (YouTube / Video URL)</span>
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {setNewYoutubeTitle && (
                <input
                  type="text"
                  placeholder="عنوان الفيديو (مثال: جولة كابينة اليخت)..."
                  value={newYoutubeTitle}
                  onChange={(e) => setNewYoutubeTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              )}
              <input
                type="text"
                dir="ltr"
                placeholder="https://www.youtube.com/watch?v=..."
                value={newYoutubeUrl}
                onChange={(e) => setNewYoutubeUrl(e.target.value)}
                className={`${setNewYoutubeTitle ? '' : 'md:col-span-2'} bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500`}
              />
              <button
                type="button"
                onClick={handleAddYoutubeVideo}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                + ربط الفيديو
              </button>
            </div>
          </div>
        </div>

        {/* 3. التصنيف (Category) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-cyan-400" />
                <span>Category / التصنيف متعدد المستويات</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                اختر مسار تصنيف النشاط عبر القائمة الهرمية المنسدلة، أو تصفح المستويات بالتتابع.
              </p>
            </div>
          </div>

          {/* Multi-Level Category Flyout Selector */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 shadow-md">
            <MultiLevelCategoryDropdown
              categoryTree={categoryTree}
              selectedPath={formData.categoryPath}
              onSelectPath={(path) => {
                setFormData((prev) => ({
                  ...prev,
                  categoryPath: path
                }));
                if (path.length > 0) {
                  notifyDbSuccess(`✓ تم تحديد مسار التصنيف: ${path.join(' ← ')}`);
                } else {
                  notifyDbSuccess(`تم إلغاء تحديد التصنيف`);
                }
              }}
              onAddCategory={(parentPath, name) => {
                addCategoryToTree(parentPath, name);
                notifyDbSuccess(`✓ تم إضافة وحفظ التصنيف "${name}" بنجاح في قاعدة البيانات`);
              }}
              label="Category / التصنيف متعدد المستويات"
              placeholder="Choose a product category / اختر تصنيف النشاط..."
              helperText="Determines tax rates and adds metafields / قائمة هرمية متقدمة مطابقة للنمط المطلوب"
            />
          </div>

          {/* Breadcrumb Trail */}
          {formData.categoryPath.length > 0 && (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">مسار التصنيف المعتمد:</span>
                <span className="text-[11px] text-slate-500">انقر على (×) لحذف المستوى الأخير</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {formData.categoryPath.map((cat, idx) => (
                  <React.Fragment key={idx}>
                    <div className="flex items-center gap-1.5 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-cyan-200">
                      <span className="text-cyan-400 font-mono text-[10px] font-bold">L{idx + 1}:</span>
                      <span className="font-medium text-white">{cat}</span>
                      {idx === formData.categoryPath.length - 1 && formData.categoryPath.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategoryLevel(idx)}
                          className="text-slate-400 hover:text-rose-400 mr-1 p-0.5 transition-colors"
                          title="حذف هذا المستوى والرجوع للسابق"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {idx < formData.categoryPath.length - 1 && (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. التسعير (Pricing) */}
        <div className={`bg-slate-900 border rounded-2xl p-5 space-y-4 ${
          validationErrors.some((e) => e.includes('سعر النشاط')) ? 'border-rose-500/70' : 'border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <span>Pricing / التسعير والأسعار</span>
              </h3>
            </div>
          </div>

          {/* Dynamic Opt-in Pricing Rules Engine (Base Rate + Dynamic Chips Bar + Accordion Cards) */}
          <DynamicPricingRulesEditor
            formData={formData}
            setFormData={setFormData}
            pricingProperties={pricingProperties}
          />

          {/* Tax Checkbox */}
          <div className="flex items-center gap-2 pt-2 text-xs text-slate-300">
            <input
              type="checkbox"
              id="charge-tax-checkbox"
              checked={chargeTax}
              onChange={(e) => setChargeTax(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="charge-tax-checkbox" className="cursor-pointer">
              Charge tax on this activity / حساب ضريبة القيمة المضافة المعتمدة على هذا النشاط
            </label>
          </div>
        </div>

        {/* 5. المخزون والسعة (Inventory & Capacity) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Inventory & Capacity / المخزون والسعة الاستيعابية</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تتبع الأماكن الشاغرة وفترات التشغيل ومواعيد المغادرة وكود النشاط.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              الحد الأدنى: <span className="text-white font-bold">{formData.minPax}</span> · الحد الأقصى: <span className="text-white font-bold">{formData.maxPax}</span>
            </div>
          </div>

          {/* Inventory Tracked Checkbox */}
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              id="inventory-tracked-cb"
              checked={inventoryTracked}
              onChange={(e) => setInventoryTracked(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="inventory-tracked-cb" className="cursor-pointer font-medium">
              Inventory tracked / تتبع وتحديث سعة الحجز تلقائياً مع كل حجز مؤكد
            </label>
          </div>

          {/* Shop Location / Capacity and SKU / Barcode Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">السعة اليومية الإجمالية (Daily Capacity)</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={formData.maxPax || ''}
                onChange={(e) => setFormData({ ...formData, maxPax: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">SKU (Stock Keeping Unit / كود النشاط)</label>
              <input
                type="text"
                placeholder="أدخل كود النشاط..."
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-white text-xs placeholder:font-sans placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Barcode (الباركود الدولي إن وجد)</label>
              <input
                type="text"
                placeholder="أدخل الباركود..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-white text-xs placeholder:font-sans placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Departure Slots */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-slate-300 block">
              فترات التشغيل ومواعيد المغادرة (Departure Slots):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formData.slots.map((slot) => (
                <div key={slot.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{slot.timeLabel}</span>
                    <span className="text-cyan-400 font-mono">{slot.availableCount} شاغر</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full"
                      style={{ width: `${(slot.bookedCount / slot.maxCapacity) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>السعة القصوى: {slot.maxCapacity}</span>
                    <span className="text-emerald-400">متاح للحجز</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sell when out of stock toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <div>
              <span className="font-semibold text-slate-300 block">Sell when out of stock / استمرار قبول الحجز عند اكتمال السعة</span>
              <span className="text-[11px] text-slate-500">تحويل الحجوزات الإضافية لقائمة الانتظار أو طلب موافقة يدوية</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={sellWhenOutOfStock}
              onClick={() => setSellWhenOutOfStock(!sellWhenOutOfStock)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                sellWhenOutOfStock ? 'bg-cyan-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  sellWhenOutOfStock ? '-translate-x-6' : '-translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Booking Approval Deadlines & Cancellation Policy */}
          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">دورة طلب الحجز ومهل الرد والدفع</span>
              <span className="text-[10px] text-amber-400 font-semibold">نظام التدقيق قبل إتمام الدفع</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-white block">مهلة الرد على طلب الحجز:</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  يبدأ احتسابها فور وصول الطلب؛ وإذا انتهت دون رد يُلغى الطلب تلقائياً.
                </p>
                <div className="flex items-center gap-2 pt-1 font-mono">
                  <span className="text-slate-400">المهلة المحددة:</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={formData.approvalDeadlineHours || ''}
                    onChange={(e) => setFormData({ ...formData, approvalDeadlineHours: parseInt(e.target.value) || 0 })}
                    className="w-16 bg-slate-900 border border-slate-800 text-center rounded py-1 text-cyan-300 font-bold"
                  />
                  <span>ساعات</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-white block">مهلة إتمام الدفع:</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  مهلة العميل بعد الموافقة؛ إذا انتهت دون دفع تعود الأماكن الشاغرة فوراً للنشاط.
                </p>
                <div className="flex items-center gap-2 pt-1 font-mono">
                  <span className="text-slate-400">المهلة المحددة:</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={formData.paymentDeadlineHours || ''}
                    onChange={(e) => setFormData({ ...formData, paymentDeadlineHours: parseInt(e.target.value) || 0 })}
                    className="w-16 bg-slate-900 border border-slate-800 text-center rounded py-1 text-cyan-300 font-bold"
                  />
                  <span>ساعات</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">
                  سياسة الإلغاء والاسترداد: {formData.cancellationPolicy.name || 'غير محددة'}
                </span>
                {formData.cancellationPolicy.isPlatformDefault && (
                  <span className="text-emerald-400 text-[11px]">سياسة المنصة الجاهزة</span>
                )}
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {formData.cancellationPolicy.customTerms || 'لم يتم تحديد شروط إلغاء بعد.'}
              </p>
            </div>
          </div>
        </div>

        {/* 6. الشحن واللوجستيات والموقع الجغرافي وخط السير (GIS, Logistics & Itinerary) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>الموقع الجغرافي والنقل واللوجستيات وخط السير (GIS & Logistics)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديد الدولة والمدينة وموقع التنفيذ، خدمات التوصيل ونقاط التجمع، وبناء محطات خط السير الملاحي.
              </p>
            </div>
          </div>

          {/* Country, City, Primary Site (GIS Location) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Country */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>الدولة *</span>
                </label>
                {handleAddCountryToDb && (
                  <button
                    type="button"
                    onClick={() => setShowInlineCountryAdd((prev) => !prev)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة دولة</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                list="two-col-countries-list"
                placeholder="اكتب اسم الدولة أو اختر..."
                value={formData.location.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, country: e.target.value }
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <datalist id="two-col-countries-list">
                {storedCountries.map((c, i) => (
                  <option key={i} value={c} />
                ))}
              </datalist>
              {showInlineCountryAdd && handleAddCountryToDb && (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="اسم الدولة الجديدة..."
                    value={inlineCountryName}
                    onChange={(e) => setInlineCountryName(e.target.value)}
                    className="flex-1 bg-slate-950 border border-cyan-500/40 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!inlineCountryName.trim()) return;
                      handleAddCountryToDb(inlineCountryName.trim());
                      setInlineCountryName('');
                      setShowInlineCountryAdd(false);
                    }}
                    className="px-2 py-1 bg-cyan-600 text-white rounded text-[10px] font-bold cursor-pointer"
                  >
                    حفظ
                  </button>
                </div>
              )}
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-semibold">مدينة الانطلاق *</label>
                {setShowAddCityModal && (
                  <button
                    type="button"
                    onClick={() => setShowAddCityModal(true)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة مدينة</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                list="two-col-cities-list"
                placeholder="اكتب اسم المدينة أو اختر..."
                value={formData.location.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, city: e.target.value }
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <datalist id="two-col-cities-list">
                {storedCities.map((city, idx) => (
                  <option key={idx} value={city} />
                ))}
              </datalist>
              {storedCities.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {storedCities.slice(0, 4).map((city, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          location: { ...formData.location, city }
                        });
                        notifyDbSuccess(`✓ تم اختيار مدينة ${city}`);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        formData.location.city === city
                          ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Site */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-semibold">مكان التنفيذ الأساسي *</label>
                {setShowAddSiteModal && (
                  <button
                    type="button"
                    onClick={() => setShowAddSiteModal(true)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة موقع</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                list="two-col-sites-list"
                placeholder="مثال: مارينا الغردقة، أورانج باي..."
                value={formData.location.primarySite}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, primarySite: e.target.value }
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <datalist id="two-col-sites-list">
                {storedSites.map((site, idx) => (
                  <option key={idx} value={site} />
                ))}
              </datalist>
              {storedSites.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {storedSites.slice(0, 3).map((site, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          location: { ...formData.location, primarySite: site }
                        });
                        notifyDbSuccess(`✓ تم اختيار موقع ${site.slice(0, 20)}...`);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors truncate max-w-[130px] cursor-pointer ${
                        formData.location.primarySite === site
                          ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {site}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transfer & Pickup Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800/80">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">هل النشاط يحتاج إلى نقل؟</span>
                <input
                  type="checkbox"
                  checked={formData.logistics.requiresTransfer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      logistics: { ...formData.logistics, requiresTransfer: e.target.checked }
                    })
                  }
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">هل النقل متوفر من صاحب النشاط؟</span>
                <input
                  type="checkbox"
                  checked={formData.logistics.transferProvidedByOwner}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      logistics: { ...formData.logistics, transferProvidedByOwner: e.target.checked }
                    })
                  }
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div className="pt-1">
                <label className="text-[11px] text-slate-400 block mb-1">
                  تكلفة النقل منفصلة عن سعر النشاط (ج.م):
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.logistics.separateTransferFeeEGP || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      logistics: { ...formData.logistics, separateTransferFeeEGP: parseInt(e.target.value) || 0 }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-white"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-300 font-semibold">نقطة استقبال العميل (Pick-up):</label>
                  <button
                    type="button"
                    onClick={() => setShowAddPickupModal(true)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة نقطة</span>
                  </button>
                </div>
                <input
                  type="text"
                  list="two-col-pickups-list"
                  placeholder="اكتب نقطة الاستقبال أو اختر من القائمة..."
                  value={formData.logistics.pickupPoint}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      logistics: { ...formData.logistics, pickupPoint: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
                <datalist id="two-col-pickups-list">
                  {storedPickupPoints.map((pt, i) => (
                    <option key={i} value={pt} />
                  ))}
                </datalist>
                {storedPickupPoints.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {storedPickupPoints.slice(0, 3).map((pt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            logistics: { ...formData.logistics, pickupPoint: pt }
                          });
                          notifyDbSuccess(`✓ تم اختيار نقطة الاستقبال: ${pt.slice(0, 20)}...`);
                        }}
                        className={`text-[9px] px-2 py-0.5 rounded border transition-colors truncate max-w-[140px] cursor-pointer ${
                          formData.logistics.pickupPoint === pt
                            ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {pt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-semibold">نقطة العودة (Drop-off):</label>
                <input
                  type="text"
                  list="two-col-pickups-list"
                  placeholder="نفس نقطة الاستقبال أو اختر أخرى..."
                  value={formData.logistics.dropoffPoint}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      logistics: { ...formData.logistics, dropoffPoint: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Waypoints Bank & Builder */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">محطات خط السير الملاحي ({formData.location.itinerary.length} محطات):</span>
              <span className="text-[11px] text-cyan-400">انطلاق ← توقف سنوركلينج ← عودة</span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                  <Database className="w-3 h-3 text-amber-400" />
                  <span>بنك المحطات والمعالم المحفوظة (آخر 10 محطات — انقر للإضافة لخط السير):</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {Math.min(storedWaypointsBank.length, 10)} / 10
                </span>
              </div>

              {storedWaypointsBank.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  لا توجد محطات محفوظة في قاعدة البيانات بعد — سيظهر هنا آخر 10 محطات يتم حفظها تلقائياً.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {storedWaypointsBank.slice(0, 10).map((wpTpl) => (
                    <button
                      key={wpTpl.id}
                      type="button"
                      onClick={() => {
                        const newWp: Waypoint = {
                          id: `wp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                          name: wpTpl.name,
                          type: wpTpl.type,
                          order: formData.location.itinerary.length + 1,
                          lat: 27.2289,
                          lng: 33.8423,
                          durationMinutes:
                            wpTpl.type === 'departure' || wpTpl.type === 'return'
                              ? undefined
                              : wpTpl.durationMinutes,
                          departureTime: wpTpl.type === 'departure' ? wpTpl.departureTime : undefined,
                          returnTime: wpTpl.type === 'return' ? wpTpl.returnTime : undefined,
                          description: wpTpl.description
                        };
                        setFormData((prev) => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            itinerary: sortItineraryWithAnchors([...prev.location.itinerary, newWp])
                          }
                        }));
                        notifyDbSuccess(`✓ تمت إضافة محطة "${wpTpl.name}" لخط السير`);
                      }}
                      className="text-[11px] px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-amber-500/50 rounded-lg flex items-center gap-1.5 transition-all text-right cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-amber-400" />
                      <span>{wpTpl.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {wpTpl.type === 'departure'
                          ? wpTpl.departureTime
                            ? `(ذهاب ${wpTpl.departureTime})`
                            : '(انطلاق)'
                          : wpTpl.type === 'return'
                          ? wpTpl.returnTime
                            ? `(عودة ${wpTpl.returnTime})`
                            : '(عودة)'
                          : `(${wpTpl.durationMinutes || 0}د)`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              {(() => {
                const orderedList = sortItineraryWithAnchors(formData.location.itinerary);
                const typeLabels: Record<Waypoint['type'], string> = {
                  departure: 'نقطة انطلاق',
                  stopover: 'نقطة توقف واستراحة',
                  sightseeing: 'معلم يمر به النشاط',
                  return: 'نقطة عودة'
                };
                return orderedList.map((wp, idx) => {
                  const prevWp = idx > 0 ? orderedList[idx - 1] : null;
                  const nextWp = idx < orderedList.length - 1 ? orderedList[idx + 1] : null;

                  const canMoveUp =
                    !!prevWp &&
                    !(wp.type !== 'departure' && prevWp.type === 'departure') &&
                    !(wp.type === 'return' && prevWp.type !== 'return');

                  const canMoveDown =
                    !!nextWp &&
                    !(wp.type === 'departure' && nextWp.type !== 'departure') &&
                    !(wp.type !== 'return' && nextWp.type === 'return');

                  const updateWaypointField = (patch: Partial<Waypoint>) => {
                    setFormData((prev) => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        itinerary: prev.location.itinerary.map((item) =>
                          item.id === wp.id ? { ...item, ...patch } : item
                        )
                      }
                    }));
                  };

                  return (
                    <div
                      key={wp.id}
                      className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-white truncate">{wp.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border shrink-0 ${
                            wp.type === 'departure'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                              : wp.type === 'return'
                              ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                              : 'bg-slate-900 text-slate-300 border-slate-700'
                          }`}
                        >
                          {typeLabels[wp.type]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {wp.type === 'departure' ? (
                          <label className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                            <span>ساعة الذهاب:</span>
                            <input
                              type="time"
                              value={wp.departureTime || ''}
                              onChange={(e) => updateWaypointField({ departureTime: e.target.value })}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-cyan-500"
                            />
                          </label>
                        ) : wp.type === 'return' ? (
                          <label className="flex items-center gap-1.5 text-[11px] text-rose-300">
                            <span>ساعة العودة:</span>
                            <input
                              type="time"
                              value={wp.returnTime || ''}
                              onChange={(e) => updateWaypointField({ returnTime: e.target.value })}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-cyan-500"
                            />
                          </label>
                        ) : (
                          <span className="font-mono text-slate-400 text-[11px]">
                            {wp.durationMinutes || 0} دقيقة
                          </span>
                        )}

                        <div className="flex items-center gap-0.5 border-r border-slate-800 pr-2 mr-1">
                          <button
                            type="button"
                            disabled={!canMoveUp}
                            onClick={() => handleMoveWaypoint(wp.id, 'up')}
                            title={
                              canMoveUp
                                ? 'تحريك للأعلى'
                                : wp.type === 'departure'
                                ? 'نقطة الانطلاق دائماً في البداية'
                                : 'لا يمكن التحريك لأعلى'
                            }
                            className={`p-1 rounded transition-colors ${
                              canMoveUp
                                ? 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer'
                                : 'text-slate-600 opacity-35 cursor-not-allowed'
                            }`}
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={!canMoveDown}
                            onClick={() => handleMoveWaypoint(wp.id, 'down')}
                            title={
                              canMoveDown
                                ? 'تحريك للأسفل'
                                : wp.type === 'return'
                                ? 'نقطة العودة دائماً في النهاية'
                                : 'لا يمكن التحريك لأسفل'
                            }
                            className={`p-1 rounded transition-colors ${
                              canMoveDown
                                ? 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer'
                                : 'text-slate-600 opacity-35 cursor-not-allowed'
                            }`}
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveWaypoint(wp.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer p-1"
                          title="حذف المحطة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Add Custom Waypoint Inline Form */}
            <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] text-cyan-300 font-semibold">
                <span>إضافة محطة أو نقطة جديدة لخط السير:</span>
                <span className="text-[10px] text-slate-400">نقطة الانطلاق بالبداية ونقطة العودة بالنهاية تلقائياً</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  list="two-col-waypoints-autocomplete"
                  placeholder="اسم نقطة التوقف أو المعلم..."
                  value={newWaypointName}
                  onChange={(e) => setNewWaypointName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <datalist id="two-col-waypoints-autocomplete">
                  {storedWaypointsBank.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.description}
                    </option>
                  ))}
                </datalist>

                <select
                  value={newWaypointType}
                  onChange={(e) => setNewWaypointType(e.target.value as Waypoint['type'])}
                  className="bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="departure">نقطة انطلاق</option>
                  <option value="stopover">نقطة توقف واستراحة</option>
                  <option value="sightseeing">معلم يمر به النشاط</option>
                  <option value="return">نقطة عودة</option>
                </select>

                {newWaypointType === 'departure' ? (
                  <label className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-emerald-300 whitespace-nowrap">
                    <span>ساعة الذهاب:</span>
                    <input
                      type="time"
                      value={newWaypointDepartureTime}
                      onChange={(e) => setNewWaypointDepartureTime(e.target.value)}
                      className="bg-transparent text-xs font-mono text-white focus:outline-none"
                    />
                  </label>
                ) : newWaypointType === 'return' ? (
                  <label className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-rose-300 whitespace-nowrap">
                    <span>ساعة العودة:</span>
                    <input
                      type="time"
                      value={newWaypointReturnTime}
                      onChange={(e) => setNewWaypointReturnTime(e.target.value)}
                      className="bg-transparent text-xs font-mono text-white focus:outline-none"
                    />
                  </label>
                ) : (
                  <input
                    type="number"
                    min={0}
                    placeholder="الدقائق"
                    value={newWaypointDuration || ''}
                    onChange={(e) => setNewWaypointDuration(parseInt(e.target.value) || 0)}
                    className="w-24 bg-slate-900 border border-slate-800 text-xs rounded-lg px-2 py-2 text-center font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!newWaypointName.trim()) return;
                    const trimmedName = newWaypointName.trim();
                    const snapshotItem = {
                      id: `wp-${Date.now()}`,
                      name: trimmedName,
                      type: newWaypointType,
                      durationMinutes:
                        newWaypointType === 'departure' || newWaypointType === 'return'
                          ? undefined
                          : newWaypointDuration,
                      departureTime:
                        newWaypointType === 'departure'
                          ? newWaypointDepartureTime || undefined
                          : undefined,
                      returnTime:
                        newWaypointType === 'return'
                          ? newWaypointReturnTime || undefined
                          : undefined,
                      description: `محطة ${trimmedName} محفوظة في قاعدة البيانات`
                    };
                    handleAddWaypoint();
                    void onSaveWaypointToBank(snapshotItem);
                    notifyDbSuccess(`✓ تمت إضافة المحطة لخط السير وحفظها في بنك المحطات`);
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-sm cursor-pointer"
                >
                  + إضافة لخط السير
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 7. الخيارات والباقات (Variants) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                <span>Variants / الباقات والخيارات المتاحة</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديد خيارات مثل: باقة فردية، باقة زوجية، يخت خاص، أو إضافات خاصة.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddVariantModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add options like size or package</span>
            </button>
          </div>

          {/* Variants Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <div className="grid grid-cols-12 px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] font-semibold text-slate-400">
              <span className="col-span-6">اسم الباقة / الخيار (Variant)</span>
              <span className="col-span-3 text-center">السعر المصري (EGP)</span>
              <span className="col-span-2 text-center">الأجنبي (USD)</span>
              <span className="col-span-1 text-center">إجراء</span>
            </div>
            <div className="divide-y divide-slate-800/80">
              {variants.map((v) => (
                <div key={v.id} className="grid grid-cols-12 px-3.5 py-2.5 items-center text-xs">
                  <span className="col-span-6 font-medium text-white">{v.name}</span>
                  <span className="col-span-3 text-center font-mono text-cyan-400 font-semibold">{v.priceEGP} ج.م</span>
                  <span className="col-span-2 text-center font-mono text-amber-400 font-semibold">${v.priceUSD}</span>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(v.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                      title="حذف الخيار"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* 9. المعدات المستخدمة في النشاط (ربط مرن بملفات المعدات المستقلة) */}
        <ActivityEquipmentSelector
          formData={formData}
          setFormData={setFormData}
          equipments={equipments}
          equipmentTypes={equipmentTypes}
          allActivities={allActivities}
          onNavigateToEquipment={onNavigateToEquipment}
          notifyDbSuccess={notifyDbSuccess}
        />

        {/* 10. الموارد ومنع التعارض المتزامن */}
        {formData.resources.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">الموارد ومنع التعارض المتزامن</h3>
                <p className="text-xs text-slate-400">
                  ربط النشاط بمعدات أو مركبات أو يخوت محددة، والتحقق التلقائي من توافرها ومنع ازدواجية الحجز.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {formData.resources.map((res) => (
                <div
                  key={res.id}
                  className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{res.name}</span>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      (مطلوب: {res.quantityRequired} / متاح إجمالي: {res.quantityAvailableTotal})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 text-[11px]">✓ لا يوجد تعارض مواعيد</span>
                    <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded">
                      {res.isMandatory ? 'إلزامي للتشغيل' : 'اختياري'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. الخصائص والمواصفات ومكتبة الخصائص المركزية (واجهة تعبئة وتعديل تفاعلية) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>الخصائص والمواصفات ومكتبة الخصائص المركزية</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                أضف وعدّل المواصفات الفنية للنشاط (تظهر مباشرةً في بطاقة النشاط بالمتجر، مع إمكانية جعلها عامة للعميل أو داخلية).
              </p>
            </div>
            <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-800/40 px-2.5 py-1 rounded-lg">
              {(formData.metaGroups || []).reduce((acc, g) => acc + g.fields.length, 0)} خاصية مسجلة
            </span>
          </div>

          {/* إدراج المواصفات الفنية المخصصة من قاعدة البيانات المحلية */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>إدراج سريع من المواصفات الفنية المسجلة في قاعدة البيانات المحلية:</span>
              </span>
              {onNavigateToCustomSpecs && (
                <button
                  type="button"
                  onClick={onNavigateToCustomSpecs}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                >
                  إدارة المواصفات الفنية مخصصة ←
                </button>
              )}
            </div>

            {groupedActiveCustomSpecs.length > 0 ? (
              <div className="space-y-3">
                {/* أزرار إدراج مجموعة كاملة بنقرة واحدة */}
                <div className="flex flex-wrap gap-2">
                  {groupedActiveCustomSpecs.map((grp) => {
                    const isSelectedGroup =
                      selectedSpecGroup?.title.trim().toLowerCase() ===
                      grp.title.trim().toLowerCase();
                    const isInsertedInActivity = (formData.metaGroups || []).some(
                      (mg) => mg.title.trim().toLowerCase() === grp.title.trim().toLowerCase()
                    );
                    return (
                      <button
                        key={grp.title}
                        type="button"
                        onClick={() => handleInsertCustomSpecGroup(grp.title, grp.specs)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                          isSelectedGroup
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 ring-1 ring-cyan-500/40'
                            : isInsertedInActivity
                            ? 'bg-emerald-950/40 hover:bg-slate-800 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-900 hover:bg-slate-800 border-cyan-500/40 hover:border-cyan-400 text-cyan-300'
                        }`}
                        title={`إدراج كافة مواصفات مجموعة "${grp.title}" (${grp.specs.length})`}
                      >
                        {isInsertedInActivity ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span>إدراج مجموعة: {grp.title}</span>
                        <span className="text-[10px] font-mono bg-cyan-950/70 px-1.5 py-0.2 rounded">
                          {grp.specs.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* تفاصيل مواصفات المجموعة المدرجة — غير محددة افتراضياً ويتم تحديدها يدوياً */}
                {selectedSpecGroup && (
                  <div className="pt-2.5 border-t border-slate-800/80 space-y-2.5">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-cyan-300">
                          تفاصيل مجموعة {selectedSpecGroup.title} (حدد المواصفات المطلوبة يدوياً):
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveInsertedSpecGroupTitle(null)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          إخفاء التفاصيل
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSpecGroup.specs.map((spec) => {
                          const targetMetaGroup = (formData.metaGroups || []).find(
                            (mg) =>
                              mg.title.trim().toLowerCase() ===
                              selectedSpecGroup.title.trim().toLowerCase()
                          );
                          const isSpecIncluded = Boolean(
                            targetMetaGroup?.fields.some((f) => f.key === `custom_${spec.id}`)
                          );
                          return (
                            <button
                              key={spec.id}
                              type="button"
                              onClick={() => handleToggleCustomSpec(spec)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                                isSpecIncluded
                                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-white'
                              }`}
                              title={
                                isSpecIncluded
                                  ? `انقر لإلغاء تحديد "${spec.label}"`
                                  : `انقر لتحديد "${spec.label}" وإضافتها للمجموعة`
                              }
                            >
                              {isSpecIncluded ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Plus className="w-3 h-3 text-slate-400" />
                              )}
                              <span>{spec.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                لا توجد مواصفات مخصصة مفعّلة في قاعدة البيانات المحلية حالياً. يمكنك إضافتها من «ادارة المواصفات الفنية مخصصة».
              </p>
            )}
          </div>

          {/* المجموعات والخصائص المضافة مع التعديل المباشر */}
          {formData.metaGroups.length > 0 ? (
            <div className="space-y-3">
              {formData.metaGroups.map((group) => (
                <div key={group.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <input
                      type="text"
                      value={group.title}
                      onChange={(e) => handleUpdateMetaGroupTitle(group.id, e.target.value)}
                      placeholder="اسم مجموعة المواصفات..."
                      className="flex-1 min-w-[200px] bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 font-bold text-xs sm:text-sm text-cyan-300 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMetaGroup(group.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-[11px] font-semibold transition-colors cursor-pointer"
                      title="حذف المجموعة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف المجموعة</span>
                    </button>
                  </div>

                  {group.fields.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.fields.map((field) => (
                        <div
                          key={field.id}
                          className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) =>
                                handleUpdateMetaField(group.id, field.id, { label: e.target.value })
                              }
                              placeholder="اسم الخاصية..."
                              className="flex-1 min-w-0 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-2 py-1 text-xs font-semibold text-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveMetaField(group.id, field.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                              title="حذف الخاصية"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* قيمة الخاصية حسب النوع */}
                          <div>
                            {field.type === 'boolean' ? (
                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateMetaField(group.id, field.id, { value: true })
                                  }
                                  className={`py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                    field.value === true
                                      ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  نعم ✓ متوفر
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateMetaField(group.id, field.id, { value: false })
                                  }
                                  className={`py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                    field.value === false
                                      ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  لا ✕ غير متوفر
                                </button>
                              </div>
                            ) : field.type === 'single_choice' && field.options && field.options.length > 0 ? (
                              <select
                                value={String(field.value ?? '')}
                                onChange={(e) =>
                                  handleUpdateMetaField(group.id, field.id, { value: e.target.value })
                                }
                                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-semibold focus:outline-none"
                              >
                                {field.options.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === 'number' ? (
                              <input
                                type="number"
                                value={Number(field.value) || 0}
                                onChange={(e) =>
                                  handleUpdateMetaField(group.id, field.id, {
                                    value: parseFloat(e.target.value) || 0
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 font-bold focus:outline-none"
                              />
                            ) : (
                              <input
                                type="text"
                                value={Array.isArray(field.value) ? field.value.join('، ') : String(field.value ?? '')}
                                onChange={(e) =>
                                  handleUpdateMetaField(group.id, field.id, { value: e.target.value })
                                }
                                placeholder="أدخل القيمة..."
                                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-medium focus:outline-none"
                              />
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/80 text-[10px]">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateMetaField(group.id, field.id, {
                                  isPublicForClient: !field.isPublicForClient
                                })
                              }
                              className={`px-2 py-0.5 rounded border font-semibold cursor-pointer transition-colors ${
                                field.isPublicForClient
                                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                                  : 'bg-amber-950/50 border-amber-600/40 text-amber-300'
                              }`}
                            >
                              {field.isPublicForClient ? 'عام للعميل' : 'داخلي فقط'}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateMetaField(group.id, field.id, {
                                  isRequired: !field.isRequired
                                })
                              }
                              className={`px-2 py-0.5 rounded border font-semibold cursor-pointer transition-colors ${
                                field.isRequired
                                  ? 'bg-emerald-950/50 border-emerald-600/40 text-emerald-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-400'
                              }`}
                            >
                              {field.isRequired ? 'إلزامي' : 'اختياري'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 bg-slate-900/50 rounded-lg p-2.5 border border-slate-800">
                      غير محددة بعد — اختر المواصفات المطلوبة يدوياً من تفاصيل المجموعة بالأعلى.
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-4 text-center">
              لم تتم إضافة أي مواصفات فنية لهذا النشاط بعد. اختر مجموعة من المواصفات الفنية المسجلة بالأعلى ثم حدد تفاصيلها يدوياً.
            </div>
          )}
        </div>

        {/* 12. ما يشمله وما لا يشمله + شروط السلامة والتأمين */}
        <div className="grid grid-cols-1 gap-6">
          {/* Inclusions & Exclusions (الأولى) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>ما يشمله وما لا يشمله</span>
              </h4>
              <span className="text-[10px] text-cyan-400 font-mono">بنك المشمولات المخزنة</span>
            </div>

            {/* Inclusions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-semibold text-xs">✓ المشمول مجاناً في الرحلة:</span>
                <span className="text-[10px] text-slate-400">انقر للإضافة أو الإزالة</span>
              </div>

              {setNewInclusionInput && handleAddInclusionToDb && (
                <div className="flex items-center gap-1.5 pb-1">
                  <input
                    type="text"
                    placeholder="اكتب بند مشمول جديد لإضافته لقاعدة البيانات..."
                    value={newInclusionInput}
                    onChange={(e) => setNewInclusionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInclusionToDb(newInclusionInput);
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddInclusionToDb(newInclusionInput)}
                    className="px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    + إضافة للمشمول
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {storedEquipmentList.map((inc, i) => {
                  const isSelected =
                    formData.inclusions.meals.includes(inc) ||
                    formData.inclusions.drinks.includes(inc);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setFormData((prev) => ({
                            ...prev,
                            inclusions: {
                              ...prev.inclusions,
                              meals: prev.inclusions.meals.filter((m) => m !== inc),
                              drinks: prev.inclusions.drinks.filter((d) => d !== inc)
                            }
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            inclusions: {
                              ...prev.inclusions,
                              meals: [...prev.inclusions.meals, inc]
                            }
                          }));
                          notifyDbSuccess(`✓ تمت إضافة "${inc}" إلى المشمولات`);
                        }
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {inc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exclusions */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-semibold text-xs">✕ غير مشمول (برسوم إضافية أو على حساب العميل):</span>
                <span className="text-[10px] text-slate-400">انقر للتبديل</span>
              </div>

              {setNewExclusionInput && handleAddExclusionToDb && (
                <div className="flex items-center gap-1.5 pb-1">
                  <input
                    type="text"
                    placeholder="اكتب بند غير مشمول جديد لإضافته..."
                    value={newExclusionInput}
                    onChange={(e) => setNewExclusionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExclusionToDb(newExclusionInput);
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddExclusionToDb(newExclusionInput)}
                    className="px-3 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    + إضافة لغير المشمول
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {storedExclusionsList.map((notInc, i) => {
                  const isSelected = formData.inclusions.notIncluded.includes(notInc);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setFormData((prev) => ({
                            ...prev,
                            inclusions: {
                              ...prev.inclusions,
                              notIncluded: prev.inclusions.notIncluded.filter((n) => n !== notInc)
                            }
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            inclusions: {
                              ...prev.inclusions,
                              notIncluded: [...prev.inclusions.notIncluded, notInc]
                            }
                          }));
                          notifyDbSuccess(`✓ تمت إضافة "${notInc}" إلى غير المشمول`);
                        }
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/70 text-amber-300 border-amber-500/50 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {isSelected ? '✕ ' : '+ '}
                      {notInc}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Safety Rules (الثانية) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>شروط السلامة والتأمين</span>
            </h4>
            <div className="text-xs space-y-2.5 text-slate-300">
              <div>
                <span className="text-slate-400 block mb-1">الحد الأدنى للعمر (سنوات):</span>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.safetyRules.minAge || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safetyRules: { ...formData.safetyRules, minAge: parseInt(e.target.value) || 0 }
                    })
                  }
                  className="w-28 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-cyan-300 font-bold text-center"
                />
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">تعليمات السلامة الإلزامية (قابلة للتعديل):</span>
                <textarea
                  rows={2}
                  placeholder="اكتب تعليمات السلامة..."
                  value={formData.safetyRules.safetyInstructions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safetyRules: { ...formData.safetyRules, safetyInstructions: e.target.value }
                    })
                  }
                  className="w-full text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">وثيقة التأمين والمسؤولية:</span>
                <textarea
                  rows={2}
                  placeholder="اكتب تفاصيل التأمين إن وجدت..."
                  value={formData.safetyRules.insuranceCoverage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safetyRules: { ...formData.safetyRules, insuranceCoverage: e.target.value }
                    })
                  }
                  className="w-full text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">المزيد (شروط وملاحظات سلامة إضافية):</span>
                <textarea
                  rows={2}
                  placeholder="أضف أي نصوص أو شروط سلامة إضافية..."
                  value={formData.safetyRules.additionalNotes || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      safetyRules: { ...formData.safetyRules, additionalNotes: e.target.value }
                    })
                  }
                  className="w-full text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* معاينة محركات البحث (Search Engine Listing) — آخر بلوك */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Search Engine Listing / معاينة الظهور في محركات البحث</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                معاينة كيفية ظهور هذا النشاط في نتائج بحث Google وشبكات التواصل.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSeoEditing(!isSeoEditing)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              {isSeoEditing ? 'إغلاق التعديل' : 'Edit / تعديل SEO'}
            </button>
          </div>

          {/* Google Live Search Preview Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-left" dir="ltr">
            <div className="text-[11px] text-emerald-400 font-mono truncate">
              https://zanoza-tour.com/activities/{activeSlug}
            </div>
            <div className="text-sm font-semibold text-sky-400 hover:underline cursor-pointer truncate">
              {activeSeoTitle}
            </div>
            <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {activeSeoDesc}
            </div>
          </div>

          {/* Expandable SEO Edit Fields */}
          {isSeoEditing && (
            <div className="space-y-3 pt-2 border-t border-slate-800 text-xs animate-fade-in">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 block font-semibold">Page title / عنوان الصفحة</label>
                <input
                  type="text"
                  placeholder="عنوان الصفحة لمحركات البحث..."
                  value={customSeoTitle || formData.name}
                  onChange={(e) => setCustomSeoTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 block font-semibold">URL handle / الرابط الدائم للنشاط</label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="activity-slug-url"
                  value={activeSlug}
                  onChange={(e) => setCustomSeoHandle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-cyan-300 text-xs focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 block font-semibold">Meta description / الوصف التعريفي</label>
                <textarea
                  rows={2}
                  placeholder="وصف مختصر يظهر أسفل العنوان في بحث جوجل..."
                  value={customSeoDescription || formData.description?.slice(0, 160)}
                  onChange={(e) => setCustomSeoDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs focus:border-cyan-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>


      {/* ========================================================
          2. SIDEBAR COLUMN (العمود الجانبي - 4 أعمدة)
          يحتوي على: الحالة، النشر (موقعي الخاص - داخل المنصة)، تنظيم النشاط (المالك والنوع والوسوم)، وقالب العرض
      ======================================================== */}
      <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">

        {/* 1. حالة النشاط (Status) */}
        <div className={`bg-slate-900 border rounded-2xl p-5 space-y-3.5 ${
          validationErrors.some((e) => e.includes('حالة النشاط')) ? 'border-rose-500/70' : 'border-slate-800'
        }`}>
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Status / حالة النشاط *</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                formData.status === 'published'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : !formData.status
                    ? 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              }`}>
                {!formData.status
                  ? 'غير محددة *'
                  : storedStatuses.find((s) => s.id === formData.status)?.badgeText ||
                    (formData.status === 'published' ? 'نشط' : formData.status === 'pending_review' ? 'قيد المراجعة' : 'مسودة')}
              </span>
              {setShowAddStatusModal && (
                <button
                  type="button"
                  onClick={() => setShowAddStatusModal(true)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-semibold cursor-pointer"
                  title="إضافة حالة مخصصة جديدة لقاعدة البيانات"
                >
                  <Plus className="w-3 h-3" />
                  <span>حالة جديدة</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2.5 text-white font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- اختر حالة النشاط * --</option>
              {storedStatuses.length > 0 ? (
                storedStatuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))
              ) : (
                <>
                  <option value="draft">Draft / مسودة (غير معروض للجمهور)</option>
                  <option value="published">Active (Published) / نشط (متاح للحجز المباشر)</option>
                  <option value="pending_review">Pending Review / قيد المراجعة والاعتماد</option>
                  <option value="paused">Paused / متوقف مؤقتاً</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* 1.5. مدة النشاط (Duration) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Duration / مدة النشاط</span>
            </h3>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
              اكتب المدة بحرية كاملة:
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 text-center">أيام</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.duration.days || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: { ...formData.duration, days: parseInt(e.target.value) || 0 }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center font-mono text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 text-center">ساعات</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.duration.hours || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: { ...formData.duration, hours: parseInt(e.target.value) || 0 }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center font-mono text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 text-center">دقائق</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  placeholder="0"
                  value={formData.duration.minutes || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: { ...formData.duration, minutes: parseInt(e.target.value) || 0 }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center font-mono text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. النشر (Publishing) - البند الذي طلبه المستخدم صراحة */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>Publishing / النشر</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تحديد منافذ نشر النشاط للعملاء
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddChannelModal(true)}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              + إضافة قناة
            </button>
          </div>

          {(() => {
            const activeChannels = storedChannels.filter((chan) =>
              chan.id === 'ownerStorefront'
                ? !!formData.channels?.ownerStorefront
                : chan.id === 'tourismMarketplace'
                ? !!formData.channels?.tourismMarketplace
                : chan.id === 'mobileApp'
                ? !!formData.channels?.mobileApp
                : chan.id === 'b2bAgents'
                ? !!formData.channels?.b2bAgencies
                : !!chan.active
            );
            const activeChannelsCount = activeChannels.length;
            const channelCountLabel =
              activeChannelsCount === 1 || activeChannelsCount > 10 ? 'قناة نشر' : 'قنوات نشر';

            return (
              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                النشاط متاح في{' '}
                <strong className="text-cyan-300">
                  {activeChannelsCount} {channelCountLabel}
                </strong>{' '}
                {activeChannelsCount > 0
                  ? `(${activeChannels.map((c) => c.name).join('، ')})`
                  : '(لم يتم اختيار أي قناة نشر)'}
                .
              </div>
            );
          })()}

          {/* Publishing Channels List */}
          <div className="space-y-2.5">
            {storedChannels.map((chan) => {
              const isChanActive =
                chan.id === 'ownerStorefront'
                  ? !!formData.channels?.ownerStorefront
                  : chan.id === 'tourismMarketplace'
                  ? !!formData.channels?.tourismMarketplace
                  : chan.id === 'mobileApp'
                  ? !!formData.channels?.mobileApp
                  : chan.id === 'b2bAgents'
                  ? !!formData.channels?.b2bAgencies
                  : !!chan.active;

              const toggleChan = () => {
                if (chan.id === 'ownerStorefront') {
                  setFormData({
                    ...formData,
                    channels: {
                      ...formData.channels,
                      ownerStorefront: !formData.channels?.ownerStorefront
                    }
                  });
                } else if (chan.id === 'tourismMarketplace') {
                  setFormData({
                    ...formData,
                    channels: {
                      ...formData.channels,
                      tourismMarketplace: !formData.channels?.tourismMarketplace
                    }
                  });
                } else if (chan.id === 'mobileApp') {
                  setFormData({
                    ...formData,
                    channels: {
                      ...formData.channels,
                      mobileApp: !formData.channels?.mobileApp
                    }
                  });
                } else if (chan.id === 'b2bAgents') {
                  setFormData({
                    ...formData,
                    channels: {
                      ...formData.channels,
                      b2bAgencies: !formData.channels?.b2bAgencies
                    }
                  });
                } else {
                  setStoredChannels((prev) =>
                    prev.map((c) => (c.id === chan.id ? { ...c, active: !c.active } : c))
                  );
                }
                notifyDbSuccess(`✓ تم تحديث حالة قناة النشر: ${chan.name}`);
              };

              return (
                <div
                  key={chan.id}
                  onClick={toggleChan}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isChanActive
                      ? 'bg-cyan-950/30 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isChanActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-900 text-slate-500'
                    }`}>
                      {chan.id === 'ownerStorefront' ? (
                        <Globe className="w-4 h-4" />
                      ) : (
                        <Store className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{chan.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{chan.badge}</p>
                    </div>
                  </div>

                  {/* Toggle button */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isChanActive}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                      isChanActive ? 'bg-cyan-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        isChanActive ? '-translate-x-4' : '-translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. تنظيم النشاط والمالك (Product Organization) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>Product Organization / تنظيم النشاط</span>
            </h3>
          </div>

          {/* طبيعة الرحلة أو نظام الحجز */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 block font-medium">طبيعة الرحلة أو نظام الحجز</label>
            <select
              value={activityType}
              onChange={(e) => {
                const value = e.target.value;
                setActivityType(value);
                setFormData((prev) => ({ ...prev, tripNature: value }));
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- اختر طبيعة الرحلة أو نظام الحجز --</option>
              <option value="رحلة خاصة">رحلة خاصة</option>
              <option value="رحلة جماعية">رحلة جماعية</option>
              <option value="يوم كامل">يوم كامل</option>
              <option value="نصف يوم">نصف يوم</option>
            </select>
          </div>

          {/* Vendor / Owner Info */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block">Vendor / المالك المسؤول</label>
                <span className={`text-[11px] font-medium flex items-center gap-1 mt-0.5 ${
                  isAccountOwner ? 'text-cyan-400' : 'text-amber-400'
                }`}>
                  {isAccountOwner ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                      <span>صاحب الصفحة (الحساب الحالي)</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>شخص آخر (مورد / شريك خارجي)</span>
                    </>
                  )}
                </span>
              </div>
              {/* زر ON / OFF للتبديل بين صاحب الصفحة وشخص آخر */}
              <button
                type="button"
                role="switch"
                aria-checked={isAccountOwner}
                onClick={() => {
                  const nextVal = !isAccountOwner;
                  handleToggleOwnership(nextVal);
                  if (!nextVal) {
                    setShowAddOwnerBlock(true);
                  }
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  isAccountOwner 
                    ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]' 
                    : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:border-slate-600'
                }`}
                title={isAccountOwner ? 'صاحب الصفحة: مفعّل (ON)' : 'شخص آخر: غير مفعّل (OFF)'}
              >
                <span className="text-[11px] font-bold font-mono">
                  {isAccountOwner ? 'ON' : 'OFF'}
                </span>
                <span
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    isAccountOwner ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      isAccountOwner ? '-translate-x-4' : '-translate-x-1'
                    }`}
                  />
                </span>
              </button>
            </div>

            {/* في حاله ان صاحب النشاط هو المالك للصفحة: لاتظهر بيانات المورد نهائياً */}
            {!isAccountOwner && (
              /* في حاله اختار انه مالك اخر: يظهر بلوك الاضافة داخل مباشرة وليس خارجياً */
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-fade-in text-right">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>تحديد المالك أو إضافة مالك جديد</span>
                  </span>
                </div>

                {/* اختيار من الملاك المسجلين */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block font-medium">اختر من الملاك المسجلين مسبقاً:</label>
                  <select
                    value={formData.owner?.name || ''}
                    onChange={(e) => {
                      if (e.target.value === 'ADD_NEW_ACTION') {
                        setShowAddOwnerBlock(true);
                        return;
                      }
                      const selected = registeredOwners.find(o => o.name === e.target.value);
                      if (selected) {
                        setFormData({
                          ...formData,
                          owner: {
                            ...formData.owner,
                            id: selected.id,
                            name: selected.name,
                            companyName: selected.companyName,
                            phone: selected.phone,
                            tier: selected.tier
                          }
                        });
                        notifyDbSuccess(`✓ تم تعيين المالك: ${selected.name}`);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:border-cyan-500 font-medium"
                  >
                    {registeredOwners.map(o => (
                      <option key={o.id} value={o.name}>{o.name} — {o.companyName} ({o.tier})</option>
                    ))}
                    <option value="ADD_NEW_ACTION">+ إدخال بيانات مالك جديد بالأسفل...</option>
                  </select>
                </div>

                {/* تفاصيل المالك المحدد حالياً */}
                {formData.owner && formData.owner.name && (
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{formData.owner.name}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">{formData.owner.tier || 'شخصي'}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formData.owner.companyName}</span>
                    </div>
                    {formData.owner.phone && (
                      <div className="text-[11px] text-cyan-400 font-mono flex items-center gap-1.5 dir-ltr justify-end">
                        <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{formData.owner.phone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* زر التبديل لإظهار / إخفاء حقول الإضافة السريعة */}
                <div className="pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowAddOwnerBlock(!showAddOwnerBlock)}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 text-cyan-400 border border-dashed border-cyan-500/40 text-[11px] rounded-lg transition font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{showAddOwnerBlock ? 'إخفاء نموذج الإضافة' : '+ إضافة مالك آخر جديد للنشاط'}</span>
                  </button>
                </div>

                {/* بلوك إضافة مالك جديد (داخل البطاقة نفسها) */}
                {showAddOwnerBlock && (
                  <div className="p-3 bg-slate-900 rounded-lg border border-cyan-500/30 space-y-2.5 text-xs">
                    <span className="text-[11px] font-bold text-cyan-300 block mb-1">
                      بيانات المالك الجديد (إضافة وحفظ مباشرة):
                    </span>

                    <div>
                      <label className="text-[10px] text-slate-300 block mb-1 font-semibold">اسم المالك الكامل *</label>
                      <input
                        type="text"
                        value={newOwnerNameInput}
                        onChange={(e) => setNewOwnerNameInput(e.target.value)}
                        placeholder="مثال: كابتن محمود عبد الرحيم"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-300 block mb-1 font-semibold">اسم الشركة / المنشأة *</label>
                      <input
                        type="text"
                        value={newOwnerCompanyInput}
                        onChange={(e) => setNewOwnerCompanyInput(e.target.value)}
                        placeholder="مثال: شركة مارينا هيروز لليخوت"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-300 block mb-1 font-semibold">رقم الهاتف / الواتساب</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={newOwnerPhoneInput}
                        onChange={(e) => setNewOwnerPhoneInput(e.target.value)}
                        placeholder="+201xxxxxxxxx"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 placeholder-slate-500 text-right"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-300 block mb-1 font-semibold">باقة الاشتراك / التصنيف</label>
                      <select
                        value={newOwnerTierInput}
                        onChange={(e) => setNewOwnerTierInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500 font-medium"
                      >
                        <option value="شخصي">شخصي (الافتراضية)</option>
                        <option value="باقة الشركاء المعتمدين">باقة الشركاء المعتمدين</option>
                        <option value="باقة المحترفين الفضية">باقة المحترفين الفضية</option>
                        <option value="باقة المحترفين الذهبية">باقة المحترفين الذهبية</option>
                        <option value="باقة كبار الشركاء VIP">باقة كبار الشركاء VIP</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowAddOwnerBlock(false)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs rounded-lg transition"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={handleAddNewOwner}
                        disabled={!newOwnerNameInput.trim() || !newOwnerCompanyInput.trim()}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm transition"
                      >
                        حفظ وإسناد النشاط له
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Collections / الباقات والمجموعات (اختيار متعدد وبحث فوري في المجموعات المنشأة) */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80 relative" ref={collectionsContainerRef}>
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-slate-400 font-semibold block">
                Collections / الباقات والمجموعات
              </label>
              <span className="text-[10px] text-cyan-400 font-mono">
                {selectedCollections.length} محددة
              </span>
            </div>

            {/* Input مباشر كطفل أول لـ div:nth-of-type(4) للحفاظ التام على محدد CSS */}
            <input
              type="text"
              placeholder={selectedCollections.length === 0 ? "ابحث بالاسم أو اختر مجموعة من القائمة..." : "ابحث لاختيار مجموعة أخرى..."}
              value={collectionSearchInput}
              onChange={(e) => {
                setCollectionSearchInput(e.target.value);
                setIsCollectionsDropdownOpen(true);
              }}
              onFocus={() => setIsCollectionsDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (collectionSearchInput.trim()) {
                    handleAddNewCustomCollection(collectionSearchInput.trim());
                    setCollectionSearchInput('');
                  }
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 transition-colors focus:outline-none"
            />

            {/* عرض المجموعات المختارة كبطاقات صغيرة (Chips) قابلة للحذف */}
            {selectedCollections.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {selectedCollections.map((colName) => (
                  <span
                    key={colName}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-[11px] font-medium animate-fade-in shadow-sm"
                  >
                    <span>{colName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCollection(colName)}
                      className="hover:text-white p-0.5 rounded hover:bg-cyan-900/60 transition cursor-pointer"
                      title="إزالة المجموعة من النشاط"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* القائمة المنسدلة التفاعلية بجميع المجموعات المنشأة */}
            {isCollectionsDropdownOpen && (
              <div className="absolute z-40 right-0 left-0 top-full mt-1 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto animate-fade-in text-right">
                <div className="p-2 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400 bg-slate-950 sticky top-0 z-10">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-cyan-400" />
                    <span>مجموعات {targetOwnerName} فقط ({availableCollections.length}):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCollectionsDropdownOpen(false)}
                    className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
                  >
                    إغلاق ✕
                  </button>
                </div>

                <div className="p-1 space-y-0.5">
                  {availableCollections.length === 0 && !collectionSearchInput.trim() && (
                    <div className="p-3 text-center text-[11px] text-slate-400 leading-relaxed">
                      لا توجد مجموعات مضافة من قِبل صاحب النشاط بعد. أضف مجموعات من قسم «إضافة مجموعات» أو اكتب اسم المجموعة هنا واضغط Enter.
                    </div>
                  )}

                  {filteredAvailableCollections.map((col) => {
                    const isSelected = selectedCollections.includes(col.name);
                    return (
                      <div
                        key={col.id}
                        onClick={() => {
                          handleToggleSelectCollection(col.name);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition text-xs ${
                          isSelected
                            ? 'bg-cyan-950/70 text-cyan-300 font-bold border border-cyan-800/50'
                            : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-cyan-600 border-cyan-500 text-white' : 'border-slate-700 bg-slate-950'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{col.name}</span>
                        </div>
                        {col.category && (
                          <span className="text-[9px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0 mr-1.5">
                            {col.category}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {filteredAvailableCollections.length === 0 && collectionSearchInput.trim() && (
                    <div
                      onClick={() => {
                        handleAddNewCustomCollection(collectionSearchInput.trim());
                        setCollectionSearchInput('');
                      }}
                      className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 hover:bg-cyan-900/60 cursor-pointer text-xs flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 shrink-0 text-cyan-400" />
                      <span>إضافة واختيار المجموعة لصاحب النشاط: <strong>"{collectionSearchInput.trim()}"</strong></span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 block font-medium">Tags / الوسوم والكلمات الدلالية</label>
            <input
              type="text"
              placeholder="بحر، يخوت، غوص، VIP..."
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500"
            />
          </div>
        </div>

        {/* 4. قالب العرض (Theme Template) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Theme Template / قالب العرض</span>
            </h3>
          </div>

          <div className="space-y-1.5">
            <select
              value={themeTemplate}
              onChange={(e) => setThemeTemplate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- اختر قالب العرض (اختياري) --</option>
              <option value="default_product">Default activity template (قالب النشاط الافتراضي)</option>
              <option value="marine_vip">Marine & Yacht VIP Template (قالب الرحلات البحرية)</option>
              <option value="desert_safari">Desert & Safari Template (قالب رحلات السفاري)</option>
            </select>
          </div>

          <p className="text-[10px] text-slate-500 leading-normal">
            يحدد طريقة تنسيق وعرض بطاقة النشاط في واجهة المتجر وتطبيق الهواتف الذكية.
          </p>
        </div>

      </div>

      {/* Modal: Add New Variant */}
      {showAddVariantModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-cyan-400" />
                <span>إضافة باقة أو خيار جديد للنشاط</span>
              </h3>
              <button onClick={() => setShowAddVariantModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1 font-semibold">اسم الباقة أو الخيار:</label>
                <input
                  type="text"
                  placeholder="مثال: باقة كبار الشخصيات، رحلة خاصة بعد الظهر..."
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 font-semibold">السعر للمصري (EGP):</label>
                  <input
                    type="number"
                    value={newVarPriceEGP}
                    onChange={(e) => setNewVarPriceEGP(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 font-semibold">السعر للأجنبي (USD):</label>
                  <input
                    type="number"
                    value={newVarPriceUSD}
                    onChange={(e) => setNewVarPriceUSD(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddVariantModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleAddVariant}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg"
              >
                إضافة الخيار
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
