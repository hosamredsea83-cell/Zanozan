import { useEffect, useState } from 'react';
import type { AppUser } from '../types/auth';
import type { ActivityCostProfile } from '../types/operationalCost';
import {
  loadOperationalCostProfilesFromDb,
  saveOperationalCostProfilesToDb
} from '../db/localOperationalCostsDb';
import {
  buildCreateAuditTrail,
  buildUpdateAuditTrail,
  type LogAuditEventInput
} from './useAuditLogStore';

export function useOperationalCostsStore(
  currentUser: AppUser,
  onAuditLog: (input: LogAuditEventInput) => void
) {
  const [allCostProfiles, setAllCostProfiles] = useState<ActivityCostProfile[]>([]);
  const [hasLoadedCostsFromDb, setHasLoadedCostsFromDb] = useState(false);

  useEffect(() => {
    let active = true;
    loadOperationalCostProfilesFromDb()
      .then((rows) => {
        if (!active) return;
        setAllCostProfiles(rows);
        setHasLoadedCostsFromDb(true);
      })
      .catch(() => {
        if (!active) return;
        setAllCostProfiles([]);
        setHasLoadedCostsFromDb(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const ownerCostProfiles = allCostProfiles.filter((p) => p.ownerId === currentUser.id);

  const persistNext = (nextAll: ActivityCostProfile[]) => {
    setAllCostProfiles(nextAll);
    void saveOperationalCostProfilesToDb(nextAll);
  };

  const saveCostProfile = (
    draft: Omit<ActivityCostProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'auditTrail'> & {
      id?: string;
    }
  ): ActivityCostProfile => {
    const nowIso = new Date().toISOString();
    const existing =
      (draft.id ? allCostProfiles.find((p) => p.id === draft.id) : undefined) ||
      allCostProfiles.find(
        (p) =>
          p.ownerId === currentUser.id &&
          p.entityId === draft.entityId &&
          p.entityType === draft.entityType
      );

    if (existing) {
      const updated: ActivityCostProfile = {
        ...existing,
        ...draft,
        id: existing.id,
        ownerId: currentUser.id,
        createdAt: existing.createdAt || nowIso,
        updatedAt: nowIso,
        auditTrail: buildUpdateAuditTrail(currentUser, existing.auditTrail)
      };
      const nextAll = allCostProfiles.map((p) => (p.id === existing.id ? updated : p));
      persistNext(nextAll);
      onAuditLog({
        actor: currentUser,
        action: 'update',
        domain: 'operational_cost',
        entityId: updated.id,
        entityName: updated.entityName,
        summary: `حدّث ${currentUser.name} ملف التكلفة التشغيلية لـ «${updated.entityName}» (${updated.items.length} بنود)`
      });
      return updated;
    }

    const created: ActivityCostProfile = {
      ...draft,
      id: `opc-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
      ownerId: currentUser.id,
      createdAt: nowIso,
      updatedAt: nowIso,
      auditTrail: buildCreateAuditTrail(currentUser)
    };
    persistNext([created, ...allCostProfiles]);
    onAuditLog({
      actor: currentUser,
      action: 'create',
      domain: 'operational_cost',
      entityId: created.id,
      entityName: created.entityName,
      summary: `أنشأ ${currentUser.name} ملف التكلفة التشغيلية لـ «${created.entityName}» (${created.items.length} بنود)`
    });
    return created;
  };

  const deleteCostProfile = (profileId: string) => {
    const target = allCostProfiles.find((p) => p.id === profileId);
    const nextAll = allCostProfiles.filter((p) => p.id !== profileId);
    persistNext(nextAll);
    if (target) {
      onAuditLog({
        actor: currentUser,
        action: 'delete',
        domain: 'operational_cost',
        entityId: target.id,
        entityName: target.entityName,
        summary: `حذف ${currentUser.name} ملف التكلفة التشغيلية لـ «${target.entityName}»`
      });
    }
  };

  const deleteMultipleCostProfiles = (profileIds: string[]) => {
    const idSet = new Set(profileIds);
    const removed = allCostProfiles.filter((p) => idSet.has(p.id));
    if (removed.length === 0) return;
    const nextAll = allCostProfiles.filter((p) => !idSet.has(p.id));
    persistNext(nextAll);
    onAuditLog({
      actor: currentUser,
      action: 'delete',
      domain: 'operational_cost',
      entityId: profileIds.join(','),
      entityName: `${removed.length} ملف تكلفة تشغيلية`,
      summary: `حذف ${currentUser.name} جماعياً ${removed.length} ملفات من التكلفة التشغيلية`
    });
  };

  return {
    allCostProfiles,
    ownerCostProfiles,
    hasLoadedCostsFromDb,
    saveCostProfile,
    deleteCostProfile,
    deleteMultipleCostProfiles
  };
}
