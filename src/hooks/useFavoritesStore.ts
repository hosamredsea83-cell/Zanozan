import { useEffect, useState } from 'react';
import type { Activity } from '../types/activity';
import type { EquipmentItem } from '../types/equipment';
import type { LogisticsVehicle } from '../types/logistics';
import { AppUser, SYSTEM_USERS } from '../types/auth';
import type {
  FavoriteFolder,
  FavoriteFolderColor,
  PlatformResourceItem,
  UserFavoritesData
} from '../types/favorites';
import type { LogAuditEventInput } from './useAuditLogStore';

const USER_FAVORITES_STORAGE_KEY = 'zanoza_user_favorites_v1';

const EMPTY_USER_FAVORITES: UserFavoritesData = {
  favoriteActivityIds: [],
  favoriteResourceIds: [],
  favoriteEquipmentIds: [],
  favoriteLogisticsIds: [],
  folders: []
};

export function useFavoritesStore(
  currentUser: AppUser,
  activities: Activity[],
  hasLoadedActivitiesFromDb: boolean,
  equipments: EquipmentItem[] = [],
  hasLoadedEquipmentsFromDb: boolean = false,
  logisticsVehicles: LogisticsVehicle[] = [],
  onAuditLog?: (input: LogAuditEventInput) => void
) {
  const [favoritesByUser, setFavoritesByUser] = useState<Record<string, UserFavoritesData>>(() => {
    try {
      const raw = window.localStorage.getItem(USER_FAVORITES_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, Partial<UserFavoritesData>>;
      if (!parsed || typeof parsed !== 'object') return {};
      const normalized: Record<string, UserFavoritesData> = {};
      for (const [uid, data] of Object.entries(parsed)) {
        if (data && typeof data === 'object') {
          normalized[uid] = {
            favoriteActivityIds: Array.isArray(data.favoriteActivityIds)
              ? data.favoriteActivityIds
              : [],
            favoriteResourceIds: Array.isArray(data.favoriteResourceIds)
              ? data.favoriteResourceIds
              : [],
            favoriteEquipmentIds: Array.isArray(data.favoriteEquipmentIds)
              ? data.favoriteEquipmentIds
              : [],
            favoriteLogisticsIds: Array.isArray(data.favoriteLogisticsIds)
              ? data.favoriteLogisticsIds
              : [],
            folders: Array.isArray(data.folders) ? data.folders : []
          };
        }
      }
      return normalized;
    } catch {
      return {};
    }
  });

  const platformResources: PlatformResourceItem[] = [];
  const validActivityIdSet = new Set(activities.map((a) => a.id));
  const validResourceIdSet = new Set(platformResources.map((r) => r.id));
  const validEquipmentIdSet = new Set(equipments.map((e) => e.id));
  const validLogisticsIdSet = new Set(logisticsVehicles.map((v) => v.id));

  const activeUserFavorites = favoritesByUser[currentUser.id] ?? EMPTY_USER_FAVORITES;
  const favoriteIds = activeUserFavorites.favoriteActivityIds.filter((id) =>
    validActivityIdSet.has(id)
  );
  const favoriteResourceIds = activeUserFavorites.favoriteResourceIds.filter((id) =>
    validResourceIdSet.has(id)
  );
  const favoriteEquipmentIds = activeUserFavorites.favoriteEquipmentIds.filter((id) =>
    validEquipmentIdSet.has(id)
  );
  const favoriteLogisticsIds = activeUserFavorites.favoriteLogisticsIds.filter((id) =>
    validLogisticsIdSet.has(id)
  );
  const favoriteFolders = activeUserFavorites.folders.map((folder) => ({
    ...folder,
    itemIds: folder.itemIds.filter(
      (id) =>
        validActivityIdSet.has(id) ||
        validResourceIdSet.has(id) ||
        validEquipmentIdSet.has(id) ||
        validLogisticsIdSet.has(id)
    )
  }));

  const userFavoritesCounts = SYSTEM_USERS.reduce<Record<string, number>>((acc, u) => {
    const uFav = favoritesByUser[u.id];
    const validActCount = uFav
      ? uFav.favoriteActivityIds.filter((id) => validActivityIdSet.has(id)).length
      : 0;
    const validResCount = uFav
      ? uFav.favoriteResourceIds.filter((id) => validResourceIdSet.has(id)).length
      : 0;
    const validEqCount = uFav
      ? uFav.favoriteEquipmentIds.filter((id) => validEquipmentIdSet.has(id)).length
      : 0;
    const validLogCount = uFav
      ? uFav.favoriteLogisticsIds.filter((id) => validLogisticsIdSet.has(id)).length
      : 0;
    acc[u.id] = validActCount + validResCount + validEqCount + validLogCount;
    return acc;
  }, {});

  useEffect(() => {
    if (!hasLoadedActivitiesFromDb || !hasLoadedEquipmentsFromDb) return;
    setFavoritesByUser((prevMap) => {
      let changed = false;
      const cleanedMap: Record<string, UserFavoritesData> = {};
      for (const [uid, data] of Object.entries(prevMap)) {
        const cleanActs = data.favoriteActivityIds.filter((id) => validActivityIdSet.has(id));
        const cleanRes = data.favoriteResourceIds.filter((id) => validResourceIdSet.has(id));
        const cleanEq = data.favoriteEquipmentIds.filter((id) => validEquipmentIdSet.has(id));
        const cleanLog = data.favoriteLogisticsIds.filter((id) => validLogisticsIdSet.has(id));
        const cleanFolders = data.folders.map((f) => {
          const cleanItems = f.itemIds.filter(
            (id) =>
              validActivityIdSet.has(id) ||
              validResourceIdSet.has(id) ||
              validEquipmentIdSet.has(id) ||
              validLogisticsIdSet.has(id)
          );
          if (cleanItems.length !== f.itemIds.length) changed = true;
          return { ...f, itemIds: cleanItems };
        });
        if (
          cleanActs.length !== data.favoriteActivityIds.length ||
          cleanRes.length !== data.favoriteResourceIds.length ||
          cleanEq.length !== data.favoriteEquipmentIds.length ||
          cleanLog.length !== data.favoriteLogisticsIds.length
        ) {
          changed = true;
        }
        cleanedMap[uid] = {
          favoriteActivityIds: cleanActs,
          favoriteResourceIds: cleanRes,
          favoriteEquipmentIds: cleanEq,
          favoriteLogisticsIds: cleanLog,
          folders: cleanFolders
        };
      }
      return changed ? cleanedMap : prevMap;
    });
  }, [activities, equipments, logisticsVehicles, hasLoadedActivitiesFromDb, hasLoadedEquipmentsFromDb]);

  useEffect(() => {
    try {
      window.localStorage.setItem(USER_FAVORITES_STORAGE_KEY, JSON.stringify(favoritesByUser));
    } catch {
      // ignore storage errors
    }
  }, [favoritesByUser]);

  const updateCurrentUserFavorites = (
    updater: (prev: UserFavoritesData) => UserFavoritesData
  ) => {
    const userId = currentUser.id;
    setFavoritesByUser((prevMap) => {
      const currentData = prevMap[userId] ?? EMPTY_USER_FAVORITES;
      return {
        ...prevMap,
        [userId]: updater(currentData)
      };
    });
  };

  const handleToggleFavorite = (activityId: string) => {
    const isRemoving = activeUserFavorites.favoriteActivityIds.includes(activityId);
    const act = activities.find((a) => a.id === activityId);
    updateCurrentUserFavorites((prev) => ({
      ...prev,
      favoriteActivityIds: prev.favoriteActivityIds.includes(activityId)
        ? prev.favoriteActivityIds.filter((id) => id !== activityId)
        : [...prev.favoriteActivityIds, activityId]
    }));
    onAuditLog?.({
      actor: currentUser,
      action: isRemoving ? 'delete' : 'create',
      domain: 'favorites',
      entityId: activityId,
      entityName: act?.name || activityId,
      summary: isRemoving
        ? `أزال ${currentUser.name} النشاط «${act?.name || activityId}» من المفضلة`
        : `أضاف ${currentUser.name} النشاط «${act?.name || activityId}» إلى المفضلة`
    });
  };

  const handleToggleFavoriteResource = (resourceId: string) => {
    updateCurrentUserFavorites((prev) => ({
      ...prev,
      favoriteResourceIds: prev.favoriteResourceIds.includes(resourceId)
        ? prev.favoriteResourceIds.filter((id) => id !== resourceId)
        : [...prev.favoriteResourceIds, resourceId]
    }));
  };

  const handleToggleFavoriteEquipment = (equipmentId: string) => {
    const isRemoving = activeUserFavorites.favoriteEquipmentIds.includes(equipmentId);
    const eq = equipments.find((e) => e.id === equipmentId);
    updateCurrentUserFavorites((prev) => ({
      ...prev,
      favoriteEquipmentIds: prev.favoriteEquipmentIds.includes(equipmentId)
        ? prev.favoriteEquipmentIds.filter((id) => id !== equipmentId)
        : [...prev.favoriteEquipmentIds, equipmentId]
    }));
    onAuditLog?.({
      actor: currentUser,
      action: isRemoving ? 'delete' : 'create',
      domain: 'favorites',
      entityId: equipmentId,
      entityName: eq?.name || equipmentId,
      summary: isRemoving
        ? `أزال ${currentUser.name} المعدة «${eq?.name || equipmentId}» من المفضلة`
        : `أضاف ${currentUser.name} المعدة «${eq?.name || equipmentId}» إلى المفضلة`
    });
  };

  const handleToggleFavoriteLogistics = (logisticsId: string) => {
    const isRemoving = activeUserFavorites.favoriteLogisticsIds.includes(logisticsId);
    const v = logisticsVehicles.find((lv) => lv.id === logisticsId);
    updateCurrentUserFavorites((prev) => ({
      ...prev,
      favoriteLogisticsIds: prev.favoriteLogisticsIds.includes(logisticsId)
        ? prev.favoriteLogisticsIds.filter((id) => id !== logisticsId)
        : [...prev.favoriteLogisticsIds, logisticsId]
    }));
    onAuditLog?.({
      actor: currentUser,
      action: isRemoving ? 'delete' : 'create',
      domain: 'favorites',
      entityId: logisticsId,
      entityName: v?.name || logisticsId,
      summary: isRemoving
        ? `أزال ${currentUser.name} وسيلة النقل «${v?.name || logisticsId}» من المفضلة`
        : `أضاف ${currentUser.name} وسيلة النقل «${v?.name || logisticsId}» إلى المفضلة`
    });
  };

  const handleCreateFolder = (
    folder: Omit<FavoriteFolder, 'id' | 'ownerUserId' | 'createdAt'>
  ): string => {
    const newId = `fld-${Date.now().toString().slice(-4)}`;
    updateCurrentUserFavorites((prev) => ({
      ...prev,
      folders: [
        {
          ...folder,
          id: newId,
          ownerUserId: currentUser.id,
          createdAt: new Date().toISOString().split('T')[0]
        },
        ...prev.folders
      ]
    }));
    onAuditLog?.({
      actor: currentUser,
      action: 'create',
      domain: 'favorites',
      entityId: newId,
      entityName: folder.name,
      summary: `أنشأ ${currentUser.name} مجلد مفضلة «${folder.name}»`
    });
    return newId;
  };

  const handleRenameFolder = (
    folderId: string,
    name: string,
    description: string,
    color: FavoriteFolderColor
  ) => {
    updateCurrentUserFavorites((prev) => ({
      ...prev,
      folders: prev.folders.map((f) =>
        f.id === folderId ? { ...f, name, description, color } : f
      )
    }));
    onAuditLog?.({
      actor: currentUser,
      action: 'update',
      domain: 'favorites',
      entityId: folderId,
      entityName: name,
      summary: `عدّل ${currentUser.name} مجلد المفضلة «${name}»`
    });
  };

  const handleDeleteFolder = (folderId: string) => {
    const target = activeUserFavorites.folders.find((f) => f.id === folderId);
    updateCurrentUserFavorites((prev) => ({
      ...prev,
      folders: prev.folders.filter((f) => f.id !== folderId)
    }));
    onAuditLog?.({
      actor: currentUser,
      action: 'delete',
      domain: 'favorites',
      entityId: folderId,
      entityName: target?.name || folderId,
      summary: `حذف ${currentUser.name} مجلد المفضلة «${target?.name || folderId}»`
    });
  };

  const handleToggleItemInFolder = (folderId: string, itemId: string) => {
    updateCurrentUserFavorites((prev) => ({
      ...prev,
      folders: prev.folders.map((f) => {
        if (f.id !== folderId) return f;
        const exists = f.itemIds.includes(itemId);
        return {
          ...f,
          itemIds: exists
            ? f.itemIds.filter((id) => id !== itemId)
            : [...f.itemIds, itemId]
        };
      })
    }));
  };

  const removeItemFromAllUsers = (
    key:
      | 'favoriteActivityIds'
      | 'favoriteEquipmentIds'
      | 'favoriteLogisticsIds',
    itemId: string
  ) => {
    setFavoritesByUser((prevMap) => {
      const nextMap: Record<string, UserFavoritesData> = {};
      for (const [uid, data] of Object.entries(prevMap)) {
        nextMap[uid] = {
          ...data,
          [key]: data[key].filter((id) => id !== itemId),
          folders: data.folders.map((f) => ({
            ...f,
            itemIds: f.itemIds.filter((id) => id !== itemId)
          }))
        };
      }
      return nextMap;
    });
  };

  const removeDeletedActivityFromAllUsers = (activityId: string) =>
    removeItemFromAllUsers('favoriteActivityIds', activityId);

  const removeDeletedEquipmentFromAllUsers = (equipmentId: string) =>
    removeItemFromAllUsers('favoriteEquipmentIds', equipmentId);

  const removeDeletedLogisticsFromAllUsers = (logisticsId: string) =>
    removeItemFromAllUsers('favoriteLogisticsIds', logisticsId);

  return {
    platformResources,
    favoriteIds,
    favoriteResourceIds,
    favoriteEquipmentIds,
    favoriteLogisticsIds,
    favoriteFolders,
    userFavoritesCounts,
    totalFavoritesCount:
      favoriteIds.length +
      favoriteResourceIds.length +
      favoriteEquipmentIds.length +
      favoriteLogisticsIds.length,
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
  };
}
