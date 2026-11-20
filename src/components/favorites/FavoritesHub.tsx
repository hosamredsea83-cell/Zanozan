import React, { useMemo, useState } from 'react';
import { Activity, CentralCategoryType } from '../../types/activity';
import { EquipmentItem, EquipmentTypeDefinition } from '../../types/equipment';
import { LOGISTICS_CATEGORY_LABELS, LogisticsVehicle } from '../../types/logistics';
import { AppUser } from '../../types/auth';
import {
  FavoriteBlockType,
  FavoriteFolder,
  FavoriteFolderColor,
  PlatformResourceItem
} from '../../types/favorites';
import { NavigationItemKey } from '../layout/Sidebar';
import { FavoriteEquipmentCard, FavoriteLogisticsCard } from './FavoritesAssetCards';
import {
  Heart,
  Car,
  UserCheck,
  Anchor,
  Compass,
  Ship,
  Waves,
  Navigation,
  Wrench,
  Truck,
  FolderPlus,
  FolderOpen,
  Folder,
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  Globe,
  Phone,
  ShieldCheck,
  Check,
  X,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Eye,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

type FavoriteItemKind = 'activity' | 'resource' | 'equipment' | 'logistics';

interface FavoritesHubProps {
  currentUser?: AppUser;
  activities: Activity[];
  favoriteActivityIds: string[];
  onToggleFavoriteActivity: (activityId: string) => void;
  onPreviewActivity?: (activity: Activity) => void;
  platformResources: PlatformResourceItem[];
  favoriteResourceIds: string[];
  onToggleFavoriteResource: (resourceId: string) => void;
  equipments: EquipmentItem[];
  equipmentTypes: EquipmentTypeDefinition[];
  favoriteEquipmentIds: string[];
  onToggleFavoriteEquipment: (equipmentId: string) => void;
  logisticsVehicles: LogisticsVehicle[];
  favoriteLogisticsIds: string[];
  onToggleFavoriteLogistics: (logisticsId: string) => void;
  onNavigate?: (key: NavigationItemKey) => void;
  folders: FavoriteFolder[];
  onCreateFolder: (folder: Omit<FavoriteFolder, 'id' | 'createdAt'>) => string;
  onRenameFolder: (folderId: string, name: string, description: string, color: FavoriteFolderColor) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleItemInFolder: (folderId: string, itemId: string) => void;
}

const BLOCK_META: Array<{
  id: FavoriteBlockType;
  label: string;
  shortDesc: string;
  icon: React.FC<{ className?: string }>;
  accent: string;
}> = [
  {
    id: 'drivers',
    label: 'السائقين',
    shortDesc: 'سائقو النقل السياحي والسفاري في المنصة',
    icon: Car,
    accent: 'text-cyan-400'
  },
  {
    id: 'representatives',
    label: 'المندوبين',
    shortDesc: 'مندوبو الاستقبال والفنادق والمجموعات',
    icon: UserCheck,
    accent: 'text-emerald-400'
  },
  {
    id: 'executors',
    label: 'منفذو الأنشطة',
    shortDesc: 'مشغلو اليخوت ومراكز الغوص والسفاري',
    icon: Anchor,
    accent: 'text-amber-400'
  },
  {
    id: 'activities',
    label: 'الأنشطة',
    shortDesc: 'جميع الأنشطة السياحية المسجلة في المنصة',
    icon: Compass,
    accent: 'text-sky-400'
  },
  {
    id: 'trips',
    label: 'الرحلات',
    shortDesc: 'الرحلات المجمعة والخاصة VIP والجماعية',
    icon: Ship,
    accent: 'text-violet-400'
  },
  {
    id: 'divers',
    label: 'الغطاسين',
    shortDesc: 'مدربو الغوص المعتمدون PADI / SSI',
    icon: Waves,
    accent: 'text-teal-400'
  },
  {
    id: 'guides',
    label: 'المرشدين',
    shortDesc: 'المرشدون البحريون والثقافيون والصحراويون',
    icon: Navigation,
    accent: 'text-rose-400'
  },
  {
    id: 'equipment',
    label: 'المعدات',
    shortDesc: 'معدات التشغيل واليخوت والدراجات والغوص في المنصة',
    icon: Wrench,
    accent: 'text-amber-400'
  },
  {
    id: 'logistics',
    label: 'وسائل النقل (اللوجستيات)',
    shortDesc: 'أسطول النقل السياحي والباصات والليموزين وقوارب التوصيل',
    icon: Truck,
    accent: 'text-emerald-400'
  }
];

const FOLDER_COLORS: Array<{
  id: FavoriteFolderColor;
  label: string;
  badgeCls: string;
  borderCls: string;
  dotCls: string;
}> = [
  {
    id: 'cyan',
    label: 'سماوي',
    badgeCls: 'bg-cyan-950/70 text-cyan-300 border-cyan-600/40',
    borderCls: 'border-cyan-500/40 bg-cyan-950/20',
    dotCls: 'bg-cyan-400'
  },
  {
    id: 'emerald',
    label: 'زمردي',
    badgeCls: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40',
    borderCls: 'border-emerald-500/40 bg-emerald-950/20',
    dotCls: 'bg-emerald-400'
  },
  {
    id: 'amber',
    label: 'ذهبي',
    badgeCls: 'bg-amber-950/70 text-amber-300 border-amber-600/40',
    borderCls: 'border-amber-500/40 bg-amber-950/20',
    dotCls: 'bg-amber-400'
  },
  {
    id: 'rose',
    label: 'وردي',
    badgeCls: 'bg-rose-950/70 text-rose-300 border-rose-600/40',
    borderCls: 'border-rose-500/40 bg-rose-950/20',
    dotCls: 'bg-rose-400'
  },
  {
    id: 'violet',
    label: 'بنفسجي',
    badgeCls: 'bg-violet-950/70 text-violet-300 border-violet-600/40',
    borderCls: 'border-violet-500/40 bg-violet-950/20',
    dotCls: 'bg-violet-400'
  }
];

const CATEGORY_LABELS: Record<CentralCategoryType, string> = {
  yacht: 'يخوت ولانشات',
  diving: 'غوص وسنوركلينج',
  safari: 'سفاري وصحراء',
  horse_riding: 'خيل وفروسية',
  marine_trip: 'رحلات بحرية',
  general: 'أنشطة متنوعة'
};

const getActivityRating = (act: Activity) =>
  Number(Math.min(5.0, Math.max(4.4, 4.95 - (act.stats.cancellationRatePercent || 0) * 0.03)).toFixed(1));

const getFolderColorStyle = (color: FavoriteFolderColor) =>
  FOLDER_COLORS.find((c) => c.id === color) || FOLDER_COLORS[0];

export const FavoritesHub: React.FC<FavoritesHubProps> = ({
  currentUser,
  activities,
  favoriteActivityIds,
  onToggleFavoriteActivity,
  onPreviewActivity,
  platformResources,
  favoriteResourceIds,
  onToggleFavoriteResource,
  equipments,
  equipmentTypes,
  favoriteEquipmentIds,
  onToggleFavoriteEquipment,
  logisticsVehicles,
  favoriteLogisticsIds,
  onToggleFavoriteLogistics,
  onNavigate,
  folders,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleItemInFolder
}) => {
  const [activeBlock, setActiveBlock] = useState<FavoriteBlockType>('drivers');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Strong Pre-Selection Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [subTypeFilter, setSubTypeFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'scheduled' | 'verified'>('all');
  const [favoritesScope, setFavoritesScope] = useState<'all_platform' | 'favorites_only' | 'unfiled'>('all_platform');
  const [maxPriceEGPFilter, setMaxPriceEGPFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rating_desc' | 'completed_desc' | 'price_asc' | 'price_desc'>('rating_desc');

  // Folder Create/Edit Modal & Card Assign Popover
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [folderDescInput, setFolderDescInput] = useState('');
  const [folderColorInput, setFolderColorInput] = useState<FavoriteFolderColor>('cyan');
  const [openFolderMenuItemId, setOpenFolderMenuItemId] = useState<string | null>(null);
  const [inlineNewFolderName, setInlineNewFolderName] = useState('');

  const allFavoritedSet = useMemo(() => {
    const existingActIds = new Set(activities.map((a) => a.id));
    const existingResIds = new Set(platformResources.map((r) => r.id));
    const existingEqIds = new Set(equipments.map((e) => e.id));
    const existingLogIds = new Set(logisticsVehicles.map((v) => v.id));
    return new Set([
      ...favoriteActivityIds.filter((id) => existingActIds.has(id)),
      ...favoriteResourceIds.filter((id) => existingResIds.has(id)),
      ...favoriteEquipmentIds.filter((id) => existingEqIds.has(id)),
      ...favoriteLogisticsIds.filter((id) => existingLogIds.has(id))
    ]);
  }, [
    activities,
    platformResources,
    equipments,
    logisticsVehicles,
    favoriteActivityIds,
    favoriteResourceIds,
    favoriteEquipmentIds,
    favoriteLogisticsIds
  ]);

  const allFiledItemIds = useMemo(() => {
    const set = new Set<string>();
    folders.forEach((f) => f.itemIds.forEach((id) => set.add(id)));
    return set;
  }, [folders]);

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === activeFolderId) || null,
    [folders, activeFolderId]
  );

  // Compute unified activity representation when filtering/displaying
  const activityLanguages = (act: Activity): string[] => {
    const langs = ['العربية'];
    if (act.translations?.en?.name) langs.push('الإنجليزية');
    if (act.translations?.de?.name) langs.push('الألمانية');
    if (act.translations?.ru?.name) langs.push('الروسية');
    return langs;
  };

  // Block counts (total on platform + favorited)
  const blockCounts = useMemo(() => {
    const map: Record<FavoriteBlockType, { total: number; favs: number }> = {
      drivers: { total: 0, favs: 0 },
      representatives: { total: 0, favs: 0 },
      executors: { total: 0, favs: 0 },
      activities: { total: activities.length, favs: 0 },
      trips: { total: 0, favs: 0 },
      divers: { total: 0, favs: 0 },
      guides: { total: 0, favs: 0 },
      equipment: { total: equipments.length, favs: 0 },
      logistics: { total: logisticsVehicles.length, favs: 0 }
    };

    platformResources.forEach((r) => {
      map[r.blockType].total += 1;
      if (favoriteResourceIds.includes(r.id)) {
        map[r.blockType].favs += 1;
      }
    });

    activities.forEach((a) => {
      if (favoriteActivityIds.includes(a.id)) {
        map.activities.favs += 1;
      }
    });

    equipments.forEach((eq) => {
      if (favoriteEquipmentIds.includes(eq.id)) {
        map.equipment.favs += 1;
      }
    });

    logisticsVehicles.forEach((v) => {
      if (favoriteLogisticsIds.includes(v.id)) {
        map.logistics.favs += 1;
      }
    });

    return map;
  }, [
    platformResources,
    activities,
    equipments,
    logisticsVehicles,
    favoriteResourceIds,
    favoriteActivityIds,
    favoriteEquipmentIds,
    favoriteLogisticsIds
  ]);

  // Dynamic Filter Options based on Active Block (or Folder)
  const { availableCities, availableSubTypes, availableLanguages } = useMemo(() => {
    const cities = new Set<string>();
    const subTypes = new Set<string>();
    const langs = new Set<string>();

    if (activeFolder || activeBlock === 'activities') {
      activities.forEach((a) => {
        if (a.location.city) cities.add(a.location.city);
        subTypes.add(CATEGORY_LABELS[a.primaryCategory] || a.primaryCategory);
        activityLanguages(a).forEach((l) => langs.add(l));
      });
    }

    if (activeFolder || activeBlock === 'equipment') {
      equipments.forEach((eq) => {
        const typeDef = equipmentTypes.find((t) => t.id === eq.typeId);
        const typeLabel = typeDef?.name || eq.classification;
        if (typeLabel) subTypes.add(typeLabel);
      });
    }

    if (activeFolder || activeBlock === 'logistics') {
      logisticsVehicles.forEach((v) => {
        if (v.city) cities.add(v.city);
        subTypes.add(LOGISTICS_CATEGORY_LABELS[v.category]);
      });
    }

    if (
      activeFolder ||
      (activeBlock !== 'activities' && activeBlock !== 'equipment' && activeBlock !== 'logistics')
    ) {
      platformResources
        .filter((r) => (activeFolder ? true : r.blockType === activeBlock))
        .forEach((r) => {
          cities.add(r.city);
          subTypes.add(r.subType);
          r.languages.forEach((l) => langs.add(l));
        });
    }

    return {
      availableCities: Array.from(cities),
      availableSubTypes: Array.from(subTypes),
      availableLanguages: Array.from(langs)
    };
  }, [activeBlock, activeFolder, activities, equipments, equipmentTypes, logisticsVehicles, platformResources]);

  const handleSelectBlock = (blockId: FavoriteBlockType) => {
    setActiveBlock(blockId);
    setSubTypeFilter('all');
    setCityFilter('all');
    setOpenFolderMenuItemId(null);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setCityFilter('all');
    setSubTypeFilter('all');
    setLanguageFilter('all');
    setMinRatingFilter(0);
    setAvailabilityFilter('all');
    setFavoritesScope('all_platform');
    setMaxPriceEGPFilter('');
    setSortBy('rating_desc');
  };

  const activeFiltersCount = [
    searchQuery.trim() !== '',
    cityFilter !== 'all',
    subTypeFilter !== 'all',
    languageFilter !== 'all',
    minRatingFilter > 0,
    availabilityFilter !== 'all',
    favoritesScope !== 'all_platform',
    maxPriceEGPFilter.trim() !== ''
  ].filter(Boolean).length;

  // Filter logic for Platform Resources (non-activities)
  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const maxPrice = maxPriceEGPFilter ? Number(maxPriceEGPFilter) : null;

    return platformResources
      .filter((item) => {
        if (activeFolder) {
          if (!activeFolder.itemIds.includes(item.id)) return false;
        } else if (item.blockType !== activeBlock) {
          return false;
        }

        const isFav = favoriteResourceIds.includes(item.id);
        if (favoritesScope === 'favorites_only' && !isFav) return false;
        if (favoritesScope === 'unfiled' && (!isFav || allFiledItemIds.has(item.id))) return false;

        if (cityFilter !== 'all' && item.city !== cityFilter) return false;
        if (subTypeFilter !== 'all' && item.subType !== subTypeFilter) return false;
        if (languageFilter !== 'all' && !item.languages.includes(languageFilter)) return false;
        if (minRatingFilter > 0 && item.rating < minRatingFilter) return false;
        if (availabilityFilter === 'available' && item.availability !== 'available') return false;
        if (availabilityFilter === 'scheduled' && item.availability !== 'scheduled') return false;
        if (availabilityFilter === 'verified' && !item.verified) return false;
        if (maxPrice !== null && !Number.isNaN(maxPrice) && (item.priceEGP ?? 0) > maxPrice) return false;

        if (q) {
          const hay = `${item.name} ${item.roleTitle} ${item.companyOrAffiliation} ${item.city} ${item.zone} ${item.specialty} ${item.subType}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating_desc') return b.rating - a.rating;
        if (sortBy === 'completed_desc') return b.completedCount - a.completedCount;
        if (sortBy === 'price_asc') return (a.priceEGP ?? 0) - (b.priceEGP ?? 0);
        return (b.priceEGP ?? 0) - (a.priceEGP ?? 0);
      });
  }, [
    platformResources,
    activeFolder,
    activeBlock,
    favoriteResourceIds,
    favoritesScope,
    allFiledItemIds,
    cityFilter,
    subTypeFilter,
    languageFilter,
    minRatingFilter,
    availabilityFilter,
    maxPriceEGPFilter,
    searchQuery,
    sortBy
  ]);

  // Filter logic for Activities block (or activities inside activeFolder)
  const filteredActivities = useMemo(() => {
    if (!activeFolder && activeBlock !== 'activities') return [];
    const q = searchQuery.trim().toLowerCase();
    const maxPrice = maxPriceEGPFilter ? Number(maxPriceEGPFilter) : null;

    return activities
      .filter((act) => {
        if (activeFolder && !activeFolder.itemIds.includes(act.id)) return false;

        const isFav = favoriteActivityIds.includes(act.id);
        if (favoritesScope === 'favorites_only' && !isFav) return false;
        if (favoritesScope === 'unfiled' && (!isFav || allFiledItemIds.has(act.id))) return false;

        if (cityFilter !== 'all' && act.location.city !== cityFilter) return false;
        const catLabel = CATEGORY_LABELS[act.primaryCategory] || act.primaryCategory;
        if (subTypeFilter !== 'all' && catLabel !== subTypeFilter) return false;

        const langs = activityLanguages(act);
        if (languageFilter !== 'all' && !langs.includes(languageFilter)) return false;
        if (minRatingFilter > 0 && getActivityRating(act) < minRatingFilter) return false;
        if (availabilityFilter === 'available' && act.status !== 'published') return false;
        if (availabilityFilter === 'verified' && act.status !== 'published') return false;
        if (maxPrice !== null && !Number.isNaN(maxPrice) && act.pricing.egyptianB2C.adultEGP > maxPrice) return false;

        if (q) {
          const hay = `${act.name} ${act.description} ${act.location.city} ${act.location.primarySite} ${act.owner.companyName} ${act.owner.name}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating_desc') return getActivityRating(b) - getActivityRating(a);
        if (sortBy === 'completed_desc') return b.stats.bookingsCount - a.stats.bookingsCount;
        if (sortBy === 'price_asc') return a.pricing.egyptianB2C.adultEGP - b.pricing.egyptianB2C.adultEGP;
        return b.pricing.egyptianB2C.adultEGP - a.pricing.egyptianB2C.adultEGP;
      });
  }, [
    activities,
    activeFolder,
    activeBlock,
    favoriteActivityIds,
    favoritesScope,
    allFiledItemIds,
    cityFilter,
    subTypeFilter,
    languageFilter,
    minRatingFilter,
    availabilityFilter,
    maxPriceEGPFilter,
    searchQuery,
    sortBy
  ]);

  // Filter logic for Equipment block (or equipment inside activeFolder)
  const filteredEquipments = useMemo(() => {
    if (!activeFolder && activeBlock !== 'equipment') return [];
    const q = searchQuery.trim().toLowerCase();

    return equipments.filter((eq) => {
      if (activeFolder && !activeFolder.itemIds.includes(eq.id)) return false;

      const isFav = favoriteEquipmentIds.includes(eq.id);
      if (favoritesScope === 'favorites_only' && !isFav) return false;
      if (favoritesScope === 'unfiled' && (!isFav || allFiledItemIds.has(eq.id))) return false;

      const typeDef = equipmentTypes.find((t) => t.id === eq.typeId);
      const typeLabel = typeDef?.name || eq.classification;
      if (subTypeFilter !== 'all' && typeLabel !== subTypeFilter) return false;

      if (availabilityFilter === 'available' && eq.status !== 'available') return false;
      if (availabilityFilter === 'scheduled' && eq.status !== 'in_use') return false;
      if (
        availabilityFilter === 'verified' &&
        eq.operationalData.maintenanceStatus !== 'ready'
      )
        return false;

      if (q) {
        const hay = `${eq.name} ${eq.id} ${eq.classification} ${typeLabel} ${eq.ownerCompanyName} ${eq.partnerCompanyName || ''} ${eq.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    equipments,
    equipmentTypes,
    activeFolder,
    activeBlock,
    favoriteEquipmentIds,
    favoritesScope,
    allFiledItemIds,
    subTypeFilter,
    availabilityFilter,
    searchQuery
  ]);

  // Filter logic for Logistics Vehicles block (or vehicles inside activeFolder)
  const filteredLogistics = useMemo(() => {
    if (!activeFolder && activeBlock !== 'logistics') return [];
    const q = searchQuery.trim().toLowerCase();
    const maxPrice = maxPriceEGPFilter ? Number(maxPriceEGPFilter) : null;

    return logisticsVehicles
      .filter((v) => {
        if (activeFolder && !activeFolder.itemIds.includes(v.id)) return false;

        const isFav = favoriteLogisticsIds.includes(v.id);
        if (favoritesScope === 'favorites_only' && !isFav) return false;
        if (favoritesScope === 'unfiled' && (!isFav || allFiledItemIds.has(v.id))) return false;

        if (cityFilter !== 'all' && v.city !== cityFilter) return false;
        if (subTypeFilter !== 'all' && LOGISTICS_CATEGORY_LABELS[v.category] !== subTypeFilter)
          return false;

        if (availabilityFilter === 'available' && v.status !== 'available') return false;
        if (availabilityFilter === 'scheduled' && v.status !== 'on_route') return false;
        if (availabilityFilter === 'verified' && (!v.hasAC || !v.hasGPS)) return false;
        if (maxPrice !== null && !Number.isNaN(maxPrice) && v.pricePerTripEGP > maxPrice)
          return false;

        if (q) {
          const hay = `${v.name} ${v.plateOrCode} ${v.id} ${LOGISTICS_CATEGORY_LABELS[v.category]} ${v.city} ${v.zone} ${v.driverName} ${v.ownerCompanyName} ${v.partnerCompanyName || ''} ${v.notes}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.pricePerTripEGP - b.pricePerTripEGP;
        if (sortBy === 'price_desc') return b.pricePerTripEGP - a.pricePerTripEGP;
        return b.passengerCapacity - a.passengerCapacity;
      });
  }, [
    logisticsVehicles,
    activeFolder,
    activeBlock,
    favoriteLogisticsIds,
    favoritesScope,
    allFiledItemIds,
    cityFilter,
    subTypeFilter,
    availabilityFilter,
    maxPriceEGPFilter,
    searchQuery,
    sortBy
  ]);

  const handleOpenCreateFolder = () => {
    setEditingFolderId(null);
    setFolderNameInput('');
    setFolderDescInput('');
    setFolderColorInput('cyan');
    setShowFolderModal(true);
  };

  const handleOpenEditFolder = (folder: FavoriteFolder) => {
    setEditingFolderId(folder.id);
    setFolderNameInput(folder.name);
    setFolderDescInput(folder.description);
    setFolderColorInput(folder.color);
    setShowFolderModal(true);
  };

  const handleSaveFolderModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderNameInput.trim()) return;
    if (editingFolderId) {
      onRenameFolder(editingFolderId, folderNameInput.trim(), folderDescInput.trim(), folderColorInput);
    } else {
      const createdId = onCreateFolder({
        name: folderNameInput.trim(),
        description: folderDescInput.trim() || 'ملف مخصص لتنظيم عناصر المفضلة',
        color: folderColorInput,
        itemIds: []
      });
      setActiveFolderId(createdId);
    }
    setShowFolderModal(false);
  };

  const ensureFavorited = (itemId: string, itemKind: FavoriteItemKind) => {
    if (itemKind === 'activity' && !favoriteActivityIds.includes(itemId)) {
      onToggleFavoriteActivity(itemId);
    } else if (itemKind === 'resource' && !favoriteResourceIds.includes(itemId)) {
      onToggleFavoriteResource(itemId);
    } else if (itemKind === 'equipment' && !favoriteEquipmentIds.includes(itemId)) {
      onToggleFavoriteEquipment(itemId);
    } else if (itemKind === 'logistics' && !favoriteLogisticsIds.includes(itemId)) {
      onToggleFavoriteLogistics(itemId);
    }
  };

  const handleAssignToFolder = (folderId: string, itemId: string, itemKind: FavoriteItemKind) => {
    const targetFolder = folders.find((f) => f.id === folderId);
    const alreadyInFolder = targetFolder?.itemIds.includes(itemId);
    onToggleItemInFolder(folderId, itemId);

    // Ensure adding to a folder also marks the item as favorite ❤️ if not already favorited
    if (!alreadyInFolder) {
      ensureFavorited(itemId, itemKind);
    }
  };

  const handleQuickCreateAndAssign = (itemId: string, itemKind: FavoriteItemKind) => {
    const trimmed = inlineNewFolderName.trim();
    if (!trimmed) return;
    const newId = onCreateFolder({
      name: trimmed,
      description: 'ملف تنظيم سريع من بطاقة الاختيار',
      color: 'cyan',
      itemIds: [itemId]
    });
    ensureFavorited(itemId, itemKind);
    setInlineNewFolderName('');
    setOpenFolderMenuItemId(null);
    return newId;
  };

  const renderFolderAssignPopover = (itemId: string, itemKind: FavoriteItemKind) => {
    const itemFolders = folders.filter((f) => f.itemIds.includes(itemId));
    const isOpen = openFolderMenuItemId === itemId;

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenFolderMenuItemId(isOpen ? null : itemId)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
            itemFolders.length > 0
              ? 'bg-cyan-950/60 border-cyan-600/40 text-cyan-300'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>{itemFolders.length > 0 ? `في ${itemFolders.length} ملف` : 'حفظ في ملف'}</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setOpenFolderMenuItemId(null)}
            />
            <div className="absolute left-0 bottom-full mb-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-30 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white text-[11px]">إضافة إلى ملفات المفضلة</span>
                <button
                  type="button"
                  onClick={() => setOpenFolderMenuItemId(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1">
                {folders.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-2">لا توجد ملفات بعد</p>
                ) : (
                  folders.map((folder) => {
                    const checked = folder.itemIds.includes(itemId);
                    const cStyle = getFolderColorStyle(folder.color);
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => handleAssignToFolder(folder.id, itemId, itemKind)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-right transition-colors cursor-pointer ${
                          checked
                            ? cStyle.borderCls + ' text-white font-semibold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${cStyle.dotCls}`} />
                          <span className="truncate text-[11px]">{folder.name}</span>
                        </div>
                        {checked && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Quick create new folder inline */}
              <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
                <input
                  type="text"
                  value={inlineNewFolderName}
                  onChange={(e) => setInlineNewFolderName(e.target.value)}
                  placeholder="اسم ملف جديد سريع..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => handleQuickCreateAndAssign(itemId, itemKind)}
                  className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
                  title="إنشاء وإضافة"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const activeBlockMeta = BLOCK_META.find((b) => b.id === activeBlock)!;
  const totalDisplayedCount =
    filteredResources.length +
    filteredActivities.length +
    filteredEquipments.length +
    filteredLogistics.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Heart className="w-6 h-6 fill-rose-500/30" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-white">
                المفضلة وتنظيم قوائم الاختيار على مستوى المنصة
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-950/60 border border-rose-700/40 text-rose-300 font-mono text-[11px] font-bold">
                {allFavoritedSet.size} عنصر بالمفضلة
              </span>
              {currentUser && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-600/40 text-cyan-300 text-[11px] font-semibold">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[9px] font-bold">
                    {currentUser.avatarInitials}
                  </span>
                  <span>مفضلة خاصة بحساب: {currentUser.name}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              استعرض جميع السائقين والمندوبين ومنفذي الأنشطة والأنشطة والرحلات والغطاسين والمرشدين والمعدات ووسائل النقل (اللوجستيات) في المنصة، أضفهم للمفضلة (❤️) ونظّمهم في ملفات مخصصة خاصة بحسابك فقط.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateFolder}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-950/40 transition-colors shrink-0 cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>+ إنشاء ملف مفضلة جديد</span>
        </button>
      </div>

      {/* SECTION 1: User-Created Favorite Folders / Files */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              {currentUser
                ? `ملفات تنظيم المفضلة الخاصة بحساب ${currentUser.name}`
                : 'ملفات تنظيم المفضلة (قوائم منشأة بواسطة المستخدم)'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {folders.length} ملفات منظمة
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveFolderId(null)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              activeFolderId === null
                ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>تصفح البلوكات بالكامل</span>
          </button>

          {folders.map((folder) => {
            const isSelected = activeFolderId === folder.id;
            const cStyle = getFolderColorStyle(folder.color);
            return (
              <div
                key={folder.id}
                className={`group flex items-center gap-1.5 rounded-xl border px-3 py-1.5 transition-all ${
                  isSelected
                    ? cStyle.borderCls + ' ring-1 ring-white/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveFolderId(isSelected ? null : folder.id)}
                  className="flex items-center gap-2 text-xs font-semibold text-white cursor-pointer"
                  title={folder.description}
                >
                  <Folder className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  <span>{folder.name}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${cStyle.badgeCls}`}>
                    {folder.itemIds.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditFolder(folder)}
                  className="p-1 text-slate-500 hover:text-cyan-300 transition-colors cursor-pointer"
                  title="تعديل اسم الملف"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeFolderId === folder.id) setActiveFolderId(null);
                    onDeleteFolder(folder.id);
                  }}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="حذف الملف"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {activeFolder && (
          <div className="bg-slate-950/90 border border-cyan-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="space-y-0.5">
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4" />
                <span>محتويات الملف: {activeFolder.name}</span>
              </div>
              <p className="text-[11px] text-slate-400">{activeFolder.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveFolderId(null)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold shrink-0 cursor-pointer"
            >
              العودة لتصفح البلوكات
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: Interactive Platform Category Blocks (9 Blocks) */}
      {!activeFolder && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-2.5">
          {BLOCK_META.map((block) => {
            const Icon = block.icon;
            const isActive = activeBlock === block.id;
            const counts = blockCounts[block.id];
            return (
              <button
                key={block.id}
                type="button"
                onClick={() => handleSelectBlock(block.id)}
                className={`text-right rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isActive
                    ? 'bg-cyan-600/15 border-cyan-400/60 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-400/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                      isActive
                        ? 'bg-cyan-500/20 border-cyan-400/40'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${block.accent}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    {counts.favs > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-950/70 border border-rose-700/40 text-rose-300 font-mono text-[10px] font-bold">
                        <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                        {counts.favs}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                      {counts.total}
                    </span>
                  </div>
                </div>

                <div>
                  <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-200'}`}>
                    {block.label}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {block.shortDesc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* SECTION 3: Strong Pre-Selection Filter Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs sm:text-sm font-bold text-white">
              فلترة قوية ومتقدمة قبل اختيار {activeFolder ? `عناصر «${activeFolder.name}»` : activeBlockMeta.label}
            </span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/50 text-cyan-300 font-mono text-[10px] font-bold">
                {activeFiltersCount} فلاتر نشطة
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
              النتائج المطابقة: {totalDisplayedCount}
            </span>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>مسح الفلاتر</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 1: Search + Scope Toggle + Sort */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs">
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`ابحث في ${activeFolder ? activeFolder.name : activeBlockMeta.label} بالاسم، التخصص، المنطقة، أو الشركة...`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="lg:col-span-4 flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            {[
              { id: 'all_platform', label: 'الكل في المنصة' },
              { id: 'favorites_only', label: 'المفضلة فقط ❤️' },
              { id: 'unfiled', label: 'مفضلة بدون ملف' }
            ].map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setFavoritesScope(sc.id as typeof favoritesScope)}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-colors font-semibold cursor-pointer ${
                  favoritesScope === sc.id
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>

          <div className="lg:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="rating_desc">الترتيب: الأعلى تقييماً</option>
              <option value="completed_desc">الترتيب: الأكثر خبرة وتنفيذاً</option>
              <option value="price_asc">الترتيب: الأقل تكلفة أولاً</option>
              <option value="price_desc">الترتيب: الأعلى تكلفة أولاً</option>
            </select>
          </div>
        </div>

        {/* Row 2: Multi-Criteria Pre-Selection Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">المدينة / المنطقة</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white"
            >
              <option value="all">جميع المدن والمناطق</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">
              {activeBlock === 'drivers'
                ? 'نوع المركبة'
                : activeBlock === 'divers'
                  ? 'مستوى الاعتماد'
                  : activeBlock === 'activities'
                    ? 'تصنيف النشاط'
                    : activeBlock === 'equipment'
                      ? 'نوع المعدة'
                      : activeBlock === 'logistics'
                        ? 'فئة وسيلة النقل'
                        : 'التخصص / الفئة'}
            </label>
            <select
              value={subTypeFilter}
              onChange={(e) => setSubTypeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white"
            >
              <option value="all">كل التخصصات والفئات</option>
              {availableSubTypes.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">اللغة المتاحة</label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white"
            >
              <option value="all">جميع اللغات</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">التقييم الأدنى</label>
            <select
              value={minRatingFilter}
              onChange={(e) => setMinRatingFilter(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white"
            >
              <option value={0}>كل التقييمات</option>
              <option value={4.5}>★ 4.5 فأعلى</option>
              <option value={4.8}>★ 4.8 فأعلى</option>
              <option value={4.9}>★ 4.9 فأعلى (نخبة)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">الجاهزية والاعتماد</label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as typeof availabilityFilter)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white"
            >
              <option value="all">الكل</option>
              <option value="available">متاح / جاهز الآن</option>
              <option value="scheduled">مجدول قريباً</option>
              <option value="verified">موثق ومعتمد فقط ✓</option>
            </select>
          </div>
        </div>

        {/* Budget Filter Chip */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
          <span className="text-slate-400">حد أقصى للتكلفة (ج.م):</span>
          <input
            type="number"
            min={0}
            value={maxPriceEGPFilter}
            onChange={(e) => setMaxPriceEGPFilter(e.target.value)}
            placeholder="مثال: 1000"
            className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
          />
          {[500, 1000, 2000].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setMaxPriceEGPFilter(String(preset))}
              className={`px-2 py-0.5 rounded-lg border font-mono cursor-pointer ${
                maxPriceEGPFilter === String(preset)
                  ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              حتى {preset} ج.م
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 4: Cards Grid */}
      {totalDisplayedCount === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Heart className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">لا توجد نتائج مطابقة للفلاتر المحددة</p>
          <p className="text-xs text-slate-500">
            {activeBlock === 'equipment' && equipments.length === 0
              ? 'لا توجد معدات مسجلة في المنصة بعد. يمكنك إضافة معدة جديدة من قسم إدارة المعدات.'
              : activeBlock === 'logistics' && logisticsVehicles.length === 0
                ? 'لا توجد وسائل نقل لوجستية مسجلة بعد. يمكنك إضافة وسيلة نقل من قسم إدارة اللوجستيات.'
                : 'جرّب تعديل معايير الفلترة أو تصفح كل عناصر المنصة لإضافتها إلى المفضلة والملفات.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {activeBlock === 'equipment' && equipments.length === 0 && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('activity_equipment_add')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                + إضافة معدة جديدة
              </button>
            )}
            {activeBlock === 'logistics' && logisticsVehicles.length === 0 && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('logistics_add')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                + إضافة وسيلة نقل جديدة
              </button>
            )}
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Platform Resource Cards (Drivers, Reps, Executors, Trips, Divers, Guides) */}
          {filteredResources.map((item) => {
            const isFav = favoriteResourceIds.includes(item.id);
            const blockMeta = BLOCK_META.find((b) => b.id === item.blockType)!;
            const BlockIcon = blockMeta.icon;
            const itemFolders = folders.filter((f) => f.itemIds.includes(item.id));

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition-all ${
                  isFav ? 'border-rose-500/35 shadow-md shadow-rose-950/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Top: Avatar + Name + Heart Icon */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-cyan-300 shrink-0 relative">
                        {item.avatarInitials}
                        {item.verified && (
                          <span
                            className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center"
                            title="موثق ومعتمد في المنصة"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-semibold text-slate-300">
                            <BlockIcon className={`w-3 h-3 ${blockMeta.accent}`} />
                            {blockMeta.label}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              item.availability === 'available'
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                                : item.availability === 'scheduled'
                                  ? 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                                  : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {item.availability === 'available'
                              ? 'متاح الآن'
                              : item.availability === 'scheduled'
                                ? 'مجدول'
                                : 'في مهمة'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1 truncate">{item.name}</h4>
                        <p className="text-[11px] text-cyan-300/90 truncate">{item.roleTitle}</p>
                      </div>
                    </div>

                    {/* Prominent Heart Favorite Button */}
                    <button
                      type="button"
                      onClick={() => onToggleFavoriteResource(item.id)}
                      className={`p-2 rounded-xl border transition-all shrink-0 cursor-pointer ${
                        isFav
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 hover:bg-rose-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40'
                      }`}
                      title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                      aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>

                  {/* Specialty & SubType */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">{item.companyOrAffiliation}</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 font-semibold text-[10px] shrink-0">
                        {item.subType}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{item.specialty}</p>
                  </div>

                  {/* Metadata Row: City, Rating, Languages */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">
                        {item.city} · {item.zone}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 font-mono">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-white font-bold">{item.rating.toFixed(1)}</span>
                      <span className="text-slate-500 text-[10px]">({item.completedCount} مهمة)</span>
                    </div>
                  </div>

                  {/* Languages & Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300">
                      <Globe className="w-3 h-3 text-emerald-400" />
                      {item.languages.join(' · ')}
                    </span>
                    {item.badges.slice(0, 2).map((b, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-400"
                      >
                        {b}
                      </span>
                    ))}
                  </div>

                  {/* Assigned Folders Chips */}
                  {itemFolders.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {itemFolders.map((f) => {
                        const cStyle = getFolderColorStyle(f.color);
                        return (
                          <span
                            key={f.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${cStyle.badgeCls}`}
                          >
                            <Folder className="w-2.5 h-2.5" />
                            {f.name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Card Footer: Price + Phone + Folder Assign */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div>
                    {item.priceEGP !== undefined && (
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {item.priceEGP === 0 ? 'مجاني' : `${item.priceEGP.toLocaleString()} ج.م`}
                        {item.priceEUR !== undefined && (
                          <span className="text-cyan-400 text-[11px] font-normal"> / €{item.priceEUR}</span>
                        )}
                      </div>
                    )}
                    <div dir="ltr" className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                      <Phone className="w-2.5 h-2.5 text-slate-500" />
                      {item.phone}
                    </div>
                  </div>

                  {renderFolderAssignPopover(item.id, 'resource')}
                </div>
              </div>
            );
          })}

          {/* Equipment Cards (when activeBlock === 'equipment' or inside a Folder) */}
          {filteredEquipments.map((eq) => (
            <FavoriteEquipmentCard
              key={eq.id}
              equipment={eq}
              equipmentTypes={equipmentTypes}
              isFav={favoriteEquipmentIds.includes(eq.id)}
              itemFolders={folders.filter((f) => f.itemIds.includes(eq.id))}
              onToggleFavorite={onToggleFavoriteEquipment}
              renderFolderPopover={() => renderFolderAssignPopover(eq.id, 'equipment')}
            />
          ))}

          {/* Logistics Vehicle Cards (when activeBlock === 'logistics' or inside a Folder) */}
          {filteredLogistics.map((vehicle) => (
            <FavoriteLogisticsCard
              key={vehicle.id}
              vehicle={vehicle}
              isFav={favoriteLogisticsIds.includes(vehicle.id)}
              itemFolders={folders.filter((f) => f.itemIds.includes(vehicle.id))}
              onToggleFavorite={onToggleFavoriteLogistics}
              renderFolderPopover={() => renderFolderAssignPopover(vehicle.id, 'logistics')}
            />
          ))}

          {/* Platform Activity Cards (when activeBlock === 'activities' or inside a Folder) */}
          {filteredActivities.map((act) => {
            const isFav = favoriteActivityIds.includes(act.id);
            const coverImg = act.media.find((m) => m.isCover)?.url || act.media[0]?.url;
            const itemFolders = folders.filter((f) => f.itemIds.includes(act.id));

            return (
              <div
                key={act.id}
                className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all ${
                  isFav ? 'border-rose-500/35 shadow-md shadow-rose-950/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Cover Image + Heart Overlay */}
                  <div className="aspect-[16/9] bg-slate-950 relative overflow-hidden">
                    {coverImg && (
                      <img
                        src={coverImg}
                        alt={act.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-slate-950/85 border border-slate-700 text-[10px] font-bold text-cyan-300">
                      {CATEGORY_LABELS[act.primaryCategory] || act.primaryCategory}
                    </span>

                    <button
                      type="button"
                      onClick={() => onToggleFavoriteActivity(act.id)}
                      className={`absolute top-2.5 left-2.5 p-2 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                        isFav
                          ? 'bg-rose-500/30 border-rose-400 text-white'
                          : 'bg-slate-950/75 border-slate-700 text-slate-200 hover:text-rose-400'
                      }`}
                      title={isFav ? 'إزالة النشاط من المفضلة' : 'إضافة النشاط إلى المفضلة'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>

                    <div className="absolute bottom-2.5 right-2.5 left-2.5 flex items-center justify-between text-[11px]">
                      <span className="text-white font-semibold truncate">{act.owner.companyName}</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-amber-300 font-mono text-[10px] font-bold shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {getActivityRating(act).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5">
                    <h4 className="text-sm font-bold text-white line-clamp-1">{act.name}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{act.description}</p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        {act.location.city} · {act.location.primarySite}
                      </span>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 font-sans block">مصريين (B2C)</span>
                        <span className="text-emerald-300 font-bold">
                          {act.pricing.egyptianB2C.adultEGP.toLocaleString()} ج.م
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          طفل: {act.pricing.egyptianB2C.childEGP === 0 ? 'مجاني' : `${act.pricing.egyptianB2C.childEGP} ج.م`} · رضيع:{' '}
                          {act.pricing.egyptianB2C.infantEGP === 0 ? 'مجاني' : `${act.pricing.egyptianB2C.infantEGP} ج.م`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-sans block">أجانب (B2C)</span>
                        <span className="text-cyan-300 font-bold">€{act.pricing.foreignerB2C.adultEUR}</span>
                        <span className="text-[10px] text-slate-400 block">
                          طفل: {act.pricing.foreignerB2C.childEUR === 0 ? 'مجاني' : `€${act.pricing.foreignerB2C.childEUR}`} · رضيع:{' '}
                          {act.pricing.foreignerB2C.infantEUR === 0 ? 'مجاني' : `€${act.pricing.foreignerB2C.infantEUR}`}
                        </span>
                      </div>
                    </div>

                    {itemFolders.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {itemFolders.map((f) => {
                          const cStyle = getFolderColorStyle(f.color);
                          return (
                            <span
                              key={f.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${cStyle.badgeCls}`}
                            >
                              <Folder className="w-2.5 h-2.5" />
                              {f.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-slate-800/80 flex items-center justify-between gap-2 bg-slate-950/40">
                  {onPreviewActivity ? (
                    <button
                      type="button"
                      onClick={() => onPreviewActivity(act)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[11px] font-semibold cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>معاينة التفاصيل</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      معتمد
                    </span>
                  )}

                  {renderFolderAssignPopover(act.id, 'activity')}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-cyan-400" />
                <span>{editingFolderId ? 'تعديل ملف المفضلة' : 'إنشاء ملف مفضلة جديد'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFolderModal} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">اسم الملف / المجلد</label>
                <input
                  type="text"
                  required
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  placeholder="مثال: طاقم رحلات الجفتون VIP، سائقو المطار المعتمدون..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">وصف مختصر</label>
                <textarea
                  rows={2}
                  value={folderDescInput}
                  onChange={(e) => setFolderDescInput(e.target.value)}
                  placeholder="وصف يوضح الغرض من هذا الملف..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1.5 font-semibold">لون التمييز</label>
                <div className="flex flex-wrap gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFolderColorInput(c.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold cursor-pointer ${
                        folderColorInput === c.id
                          ? c.badgeCls + ' ring-1 ring-white/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${c.dotCls}`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  {editingFolderId ? 'حفظ التعديلات' : 'إنشاء الملف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
