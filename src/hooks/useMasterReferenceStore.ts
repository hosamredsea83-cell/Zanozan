import { useEffect, useState } from 'react';
import type { AppUser } from '../types/auth';
import type {
  AssetCatalogScope,
  CityRecord,
  CountryRecord,
  EquipmentUnitKindItem,
  InclusionCatalogItem,
  InclusionKind,
  ManufacturerModelRecord,
  ManufacturerRecord,
  MasterGroupScope,
  MeetingPointRecord,
  SpecGroupRecord
} from '../types/masterReference';
import {
  loadCitiesRefFromDb,
  loadCountriesRefFromDb,
  loadEquipmentUnitKindsFromDb,
  loadInclusionsCatalogFromDb,
  loadManufacturerModelsFromDb,
  loadManufacturersFromDb,
  loadMeetingPointsRefFromDb,
  loadSpecGroupsFromDb,
  resetAndReseedInclusionsCatalogDb,
  resetAndReseedSpecGroupsDb,
  resetCitiesRefDb,
  resetCountriesRefDb,
  resetEquipmentUnitKindsDb,
  resetManufacturerModelsDb,
  resetManufacturersDb,
  resetMeetingPointsRefDb,
  saveCitiesRefToDb,
  saveCountriesRefToDb,
  saveEquipmentUnitKindsToDb,
  saveInclusionsCatalogToDb,
  saveManufacturerModelsToDb,
  saveManufacturersToDb,
  saveMeetingPointsRefToDb,
  saveSpecGroupsToDb
} from '../db/localMasterReferenceDb';
import {
  buildCreateAuditTrail,
  buildUpdateAuditTrail,
  type LogAuditEventInput
} from './useAuditLogStore';

export function toggleCategoryLinkOnArrays(
  linkedIds: string[] | undefined,
  excludedIds: string[] | undefined,
  categoryId: string,
  mode: 'link' | 'exclude' | 'clear'
): { linkedCategoryIds: string[]; excludedCategoryIds: string[] } {
  const nextLinked = new Set(linkedIds ?? []);
  const nextExcluded = new Set(excludedIds ?? []);

  if (mode === 'link') {
    nextExcluded.delete(categoryId);
    nextLinked.add(categoryId);
  } else if (mode === 'exclude') {
    nextLinked.delete(categoryId);
    nextExcluded.add(categoryId);
  } else {
    nextLinked.delete(categoryId);
    nextExcluded.delete(categoryId);
  }

  return {
    linkedCategoryIds: Array.from(nextLinked),
    excludedCategoryIds: Array.from(nextExcluded)
  };
}

export function useMasterReferenceStore(
  currentUser: AppUser,
  onAuditLog: (input: LogAuditEventInput) => void
) {
  const [specGroups, setSpecGroups] = useState<SpecGroupRecord[]>([]);
  const [inclusionsCatalog, setInclusionsCatalog] = useState<InclusionCatalogItem[]>([]);
  const [equipmentUnitKinds, setEquipmentUnitKinds] = useState<EquipmentUnitKindItem[]>([]);
  const [manufacturers, setManufacturers] = useState<ManufacturerRecord[]>([]);
  const [manufacturerModels, setManufacturerModels] = useState<ManufacturerModelRecord[]>([]);
  const [countriesRef, setCountriesRef] = useState<CountryRecord[]>([]);
  const [citiesRef, setCitiesRef] = useState<CityRecord[]>([]);
  const [meetingPointsRef, setMeetingPointsRef] = useState<MeetingPointRecord[]>([]);
  const [hasLoadedMasterRef, setHasLoadedMasterRef] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadSpecGroupsFromDb(),
      loadInclusionsCatalogFromDb(),
      loadEquipmentUnitKindsFromDb(),
      loadManufacturersFromDb(),
      loadManufacturerModelsFromDb(),
      loadCountriesRefFromDb(),
      loadCitiesRefFromDb(),
      loadMeetingPointsRefFromDb()
    ])
      .then(([groups, inclusions, unitKinds, mfgs, mdls, cnts, cts, mps]) => {
        if (!active) return;
        setSpecGroups(groups);
        setInclusionsCatalog(inclusions);
        setEquipmentUnitKinds(unitKinds);
        setManufacturers(mfgs);
        setManufacturerModels(mdls);
        setCountriesRef(cnts);
        setCitiesRef(cts);
        setMeetingPointsRef(mps);
        setHasLoadedMasterRef(true);
      })
      .catch((err) => {
        console.error('Failed loading unified master reference catalogs:', err);
        if (active) setHasLoadedMasterRef(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedMasterRef) return;
    void saveSpecGroupsToDb(specGroups);
  }, [specGroups, hasLoadedMasterRef]);

  useEffect(() => {
    if (!hasLoadedMasterRef) return;
    void saveInclusionsCatalogToDb(inclusionsCatalog);
  }, [inclusionsCatalog, hasLoadedMasterRef]);

  useEffect(() => {
    if (!hasLoadedMasterRef) return;
    void saveEquipmentUnitKindsToDb(equipmentUnitKinds);
  }, [equipmentUnitKinds, hasLoadedMasterRef]);

  useEffect(() => {
    if (!hasLoadedMasterRef) return;
    void saveManufacturersToDb(manufacturers);
  }, [manufacturers, hasLoadedMasterRef]);

  useEffect(() => {
    if (!hasLoadedMasterRef) return;
    void saveManufacturerModelsToDb(manufacturerModels);
  }, [manufacturerModels, hasLoadedMasterRef]);

  useEffect(() => {
    if (!hasLoadedMasterRef) return;
    void saveCountriesRefToDb(countriesRef);
  }, [countriesRef, hasLoadedMasterRef]);

  useEffect(() => {
    if (!hasLoadedMasterRef) return;
    void saveCitiesRefToDb(citiesRef);
  }, [citiesRef, hasLoadedMasterRef]);

  useEffect(() => {
    if (!hasLoadedMasterRef) return;
    void saveMeetingPointsRefToDb(meetingPointsRef);
  }, [meetingPointsRef, hasLoadedMasterRef]);

  const createSpecGroup = (input: {
    name: string;
    scope: MasterGroupScope;
    description?: string;
    linkedCategoryIds?: string[];
    linkedUnitKindIds?: string[];
  }): SpecGroupRecord => {
    const nowIso = new Date().toISOString();
    const audit = buildCreateAuditTrail(currentUser);
    const created: SpecGroupRecord = {
      id: `grp-${Date.now().toString(36)}`,
      name: input.name.trim(),
      scope: input.scope,
      description: input.description?.trim() || '',
      order: specGroups.length + 1,
      isActive: true,
      linkedCategoryIds: input.linkedCategoryIds ?? [],
      excludedCategoryIds: [],
      linkedUnitKindIds: input.linkedUnitKindIds ?? [],
      createdAt: nowIso,
      updatedAt: nowIso,
      ...audit
    };
    setSpecGroups((prev) => [...prev, created]);
    onAuditLog({
      actor: currentUser,
      action: 'create',
      domain: 'activity',
      entityId: created.id,
      entityName: created.name,
      summary: `أضاف ${currentUser.name} مجموعة مواصفات «${created.name}» في المرجع الموحد`
    });
    return created;
  };

  const updateSpecGroup = (id: string, patch: Partial<SpecGroupRecord>) => {
    const existing = specGroups.find((g) => g.id === id);
    if (!existing) return;
    const nowIso = new Date().toISOString();
    const audit = buildUpdateAuditTrail(currentUser, existing);
    const updated: SpecGroupRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: nowIso,
      ...audit
    };
    setSpecGroups((prev) => prev.map((g) => (g.id === id ? updated : g)));
    onAuditLog({
      actor: currentUser,
      action: 'update',
      domain: 'activity',
      entityId: updated.id,
      entityName: updated.name,
      summary: `عدّل ${currentUser.name} مجموعة المواصفات «${updated.name}» في المرجع الموحد`
    });
  };

  const deleteSpecGroup = (id: string) => {
    const target = specGroups.find((g) => g.id === id);
    setSpecGroups((prev) => prev.filter((g) => g.id !== id));
    if (target) {
      onAuditLog({
        actor: currentUser,
        action: 'delete',
        domain: 'activity',
        entityId: target.id,
        entityName: target.name,
        summary: `حذف ${currentUser.name} مجموعة المواصفات «${target.name}» من المرجع الموحد`
      });
    }
  };

  const createInclusionItem = (input: {
    label: string;
    kind: InclusionKind;
    linkedCategoryIds?: string[];
  }): InclusionCatalogItem => {
    const trimmed = input.label.trim();
    const existingSame = inclusionsCatalog.find(
      (i) => i.kind === input.kind && i.label.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existingSame) {
      const mergedLinks = Array.from(
        new Set([...(existingSame.linkedCategoryIds || []), ...(input.linkedCategoryIds || [])])
      );
      const updatedExisting: InclusionCatalogItem = {
        ...existingSame,
        linkedCategoryIds: mergedLinks,
        excludedCategoryIds: (existingSame.excludedCategoryIds || []).filter(
          (id) => !(input.linkedCategoryIds || []).includes(id)
        ),
        updatedAt: new Date().toISOString()
      };
      setInclusionsCatalog((prev) =>
        prev.map((i) => (i.id === existingSame.id ? updatedExisting : i))
      );
      return updatedExisting;
    }

    const nowIso = new Date().toISOString();
    const audit = buildCreateAuditTrail(currentUser);
    const created: InclusionCatalogItem = {
      id: `${input.kind === 'included' ? 'inc' : 'exc'}-${Date.now().toString(36)}`,
      kind: input.kind,
      label: trimmed,
      isActive: true,
      linkedCategoryIds: input.linkedCategoryIds ?? [],
      excludedCategoryIds: [],
      createdAt: nowIso,
      updatedAt: nowIso,
      ...audit
    };
    setInclusionsCatalog((prev) => [created, ...prev]);
    onAuditLog({
      actor: currentUser,
      action: 'create',
      domain: 'activity',
      entityId: created.id,
      entityName: created.label,
      summary: `أضاف ${currentUser.name} بند ${
        created.kind === 'included' ? 'مشمول' : 'غير مشمول'
      } «${created.label}» إلى المرجع الموحد`
    });
    return created;
  };

  const updateInclusionItem = (id: string, patch: Partial<InclusionCatalogItem>) => {
    const existing = inclusionsCatalog.find((i) => i.id === id);
    if (!existing) return;
    const audit = buildUpdateAuditTrail(currentUser, existing);
    const updated: InclusionCatalogItem = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date().toISOString(),
      ...audit
    };
    setInclusionsCatalog((prev) => prev.map((i) => (i.id === id ? updated : i)));
    onAuditLog({
      actor: currentUser,
      action: 'update',
      domain: 'activity',
      entityId: updated.id,
      entityName: updated.label,
      summary: `عدّل ${currentUser.name} بند ${
        updated.kind === 'included' ? 'المشمول' : 'غير المشمول'
      } «${updated.label}»`
    });
  };

  const deleteInclusionItem = (id: string) => {
    const target = inclusionsCatalog.find((i) => i.id === id);
    setInclusionsCatalog((prev) => prev.filter((i) => i.id !== id));
    if (target) {
      onAuditLog({
        actor: currentUser,
        action: 'delete',
        domain: 'activity',
        entityId: target.id,
        entityName: target.label,
        summary: `حذف ${currentUser.name} بند «${target.label}» من المرجع الموحد`
      });
    }
  };

  // ============================================================================
  // Equipment Unit Kinds CRUD
  // ============================================================================
  const createEquipmentUnitKind = (input: {
    name: string;
    domainScope?: AssetCatalogScope;
    defaultCategoryId?: string;
    defaultTypeId?: string;
    linkedCategoryIds?: string[];
    description?: string;
  }): EquipmentUnitKindItem => {
    const trimmed = input.name.trim();
    const existing = equipmentUnitKinds.find(
      (u) => u.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      if (input.linkedCategoryIds && input.linkedCategoryIds.length > 0) {
        const merged = Array.from(
          new Set([...(existing.linkedCategoryIds ?? []), ...input.linkedCategoryIds])
        );
        const updatedExisting: EquipmentUnitKindItem = {
          ...existing,
          linkedCategoryIds: merged,
          excludedCategoryIds: (existing.excludedCategoryIds ?? []).filter(
            (id) => !input.linkedCategoryIds!.includes(id)
          ),
          updatedAt: new Date().toISOString()
        };
        setEquipmentUnitKinds((prev) => prev.map((u) => (u.id === existing.id ? updatedExisting : u)));
        return updatedExisting;
      }
      return existing;
    }

    const nowIso = new Date().toISOString();
    const audit = buildCreateAuditTrail(currentUser);
    const created: EquipmentUnitKindItem = {
      id: `uk-${Date.now().toString(36)}`,
      name: trimmed,
      domainScope: input.domainScope ?? 'equipment',
      defaultCategoryId: input.defaultCategoryId,
      defaultTypeId: input.defaultTypeId,
      linkedCategoryIds:
        input.linkedCategoryIds ?? (input.defaultCategoryId ? [input.defaultCategoryId] : []),
      excludedCategoryIds: [],
      description: input.description?.trim() || '',
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...audit
    };
    setEquipmentUnitKinds((prev) => [...prev, created]);
    onAuditLog({
      actor: currentUser,
      action: 'create',
      domain: 'equipment',
      entityId: created.id,
      entityName: created.name,
      summary: `أضاف ${currentUser.name} نوع وحدة «${created.name}» إلى المرجع الموحد`
    });
    return created;
  };

  const updateEquipmentUnitKind = (id: string, patch: Partial<EquipmentUnitKindItem>) => {
    const existing = equipmentUnitKinds.find((u) => u.id === id);
    if (!existing) return;
    const audit = buildUpdateAuditTrail(currentUser, existing);
    const updated: EquipmentUnitKindItem = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date().toISOString(),
      ...audit
    };
    setEquipmentUnitKinds((prev) => prev.map((u) => (u.id === id ? updated : u)));
  };

  const deleteEquipmentUnitKind = (id: string) => {
    const target = equipmentUnitKinds.find((u) => u.id === id);
    setEquipmentUnitKinds((prev) => prev.filter((u) => u.id !== id));
    setManufacturers((prev) =>
      prev.map((m) =>
        m.linkedUnitKindIds?.includes(id)
          ? {
              ...m,
              linkedUnitKindIds: m.linkedUnitKindIds.filter((kId) => kId !== id),
              updatedAt: new Date().toISOString()
            }
          : m
      )
    );
    setSpecGroups((prev) =>
      prev.map((g) =>
        g.linkedUnitKindIds?.includes(id)
          ? {
              ...g,
              linkedUnitKindIds: g.linkedUnitKindIds.filter((kId) => kId !== id),
              updatedAt: new Date().toISOString()
            }
          : g
      )
    );
    if (target) {
      onAuditLog({
        actor: currentUser,
        action: 'delete',
        domain: 'equipment',
        entityId: target.id,
        entityName: target.name,
        summary: `حذف ${currentUser.name} نوع الوحدة «${target.name}» من المرجع الموحد`
      });
    }
  };

  // ============================================================================
  // Manufacturers & Models CRUD
  // ============================================================================
  const createManufacturer = (input: {
    name: string;
    applicableTo?: AssetCatalogScope;
    linkedUnitKindIds?: string[];
  }): ManufacturerRecord => {
    const trimmed = input.name.trim();
    const incomingKindIds = Array.from(new Set(input.linkedUnitKindIds ?? []));
    const existing = manufacturers.find(
      (m) => m.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      const existingKindIds = existing.linkedUnitKindIds ?? [];
      const mergedKindIds = Array.from(new Set([...existingKindIds, ...incomingKindIds]));
      const needsKindMerge = mergedKindIds.length !== existingKindIds.length;
      const needsScopePromote =
        Boolean(input.applicableTo) &&
        existing.applicableTo !== 'both' &&
        existing.applicableTo !== input.applicableTo;

      if (needsKindMerge || needsScopePromote) {
        const promoted: ManufacturerRecord = {
          ...existing,
          applicableTo: needsScopePromote ? 'both' : existing.applicableTo,
          linkedUnitKindIds: mergedKindIds,
          updatedAt: new Date().toISOString()
        };
        setManufacturers((prev) => prev.map((m) => (m.id === existing.id ? promoted : m)));
        return promoted;
      }
      return existing;
    }

    const nowIso = new Date().toISOString();
    const audit = buildCreateAuditTrail(currentUser);
    const created: ManufacturerRecord = {
      id: `mfg-${Date.now().toString(36)}`,
      name: trimmed,
      applicableTo: input.applicableTo ?? 'both',
      linkedUnitKindIds: incomingKindIds,
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...audit
    };
    setManufacturers((prev) => [...prev, created]);
    onAuditLog({
      actor: currentUser,
      action: 'create',
      domain: 'equipment',
      entityId: created.id,
      entityName: created.name,
      summary: `أضاف ${currentUser.name} الشركة المصنعة «${created.name}» إلى المرجع الموحد`
    });
    return created;
  };

  const updateManufacturer = (id: string, patch: Partial<ManufacturerRecord>) => {
    const existing = manufacturers.find((m) => m.id === id);
    if (!existing) return;
    const audit = buildUpdateAuditTrail(currentUser, existing);
    const updated: ManufacturerRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date().toISOString(),
      ...audit
    };
    setManufacturers((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const deleteManufacturer = (id: string) => {
    const target = manufacturers.find((m) => m.id === id);
    setManufacturers((prev) => prev.filter((m) => m.id !== id));
    setManufacturerModels((prev) => prev.filter((mdl) => mdl.manufacturerId !== id));
    if (target) {
      onAuditLog({
        actor: currentUser,
        action: 'delete',
        domain: 'equipment',
        entityId: target.id,
        entityName: target.name,
        summary: `حذف ${currentUser.name} الشركة المصنعة «${target.name}» وموديلاتها من المرجع الموحد`
      });
    }
  };

  const createManufacturerModel = (input: {
    manufacturerId: string;
    name: string;
    applicableTo?: AssetCatalogScope;
    unitKindId?: string;
  }): ManufacturerModelRecord => {
    const trimmed = input.name.trim();
    const existing = manufacturerModels.find(
      (mdl) =>
        mdl.manufacturerId === input.manufacturerId &&
        mdl.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;

    const nowIso = new Date().toISOString();
    const audit = buildCreateAuditTrail(currentUser);
    const parentMfg = manufacturers.find((m) => m.id === input.manufacturerId);
    const created: ManufacturerModelRecord = {
      id: `mdl-${Date.now().toString(36)}`,
      manufacturerId: input.manufacturerId,
      name: trimmed,
      applicableTo: input.applicableTo ?? parentMfg?.applicableTo ?? 'both',
      unitKindId: input.unitKindId,
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...audit
    };
    setManufacturerModels((prev) => [...prev, created]);
    onAuditLog({
      actor: currentUser,
      action: 'create',
      domain: 'equipment',
      entityId: created.id,
      entityName: created.name,
      summary: `أضاف ${currentUser.name} الموديل «${created.name}» (${parentMfg?.name || ''}) في المرجع الموحد`
    });
    return created;
  };

  const updateManufacturerModel = (id: string, patch: Partial<ManufacturerModelRecord>) => {
    const existing = manufacturerModels.find((mdl) => mdl.id === id);
    if (!existing) return;
    const audit = buildUpdateAuditTrail(currentUser, existing);
    const updated: ManufacturerModelRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date().toISOString(),
      ...audit
    };
    setManufacturerModels((prev) => prev.map((mdl) => (mdl.id === id ? updated : mdl)));
  };

  const deleteManufacturerModel = (id: string) => {
    setManufacturerModels((prev) => prev.filter((mdl) => mdl.id !== id));
  };

  // ============================================================================
  // Geographic References: Country -> City -> Meeting Point
  // ============================================================================
  const createCountryRef = (input: { name: string; code?: string }): CountryRecord => {
    const trimmed = input.name.trim();
    const existing = countriesRef.find((c) => c.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const nowIso = new Date().toISOString();
    const audit = buildCreateAuditTrail(currentUser);
    const created: CountryRecord = {
      id: `cnt-${Date.now().toString(36)}`,
      name: trimmed,
      code: input.code?.trim(),
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...audit
    };
    setCountriesRef((prev) => [...prev, created]);
    onAuditLog({
      actor: currentUser,
      action: 'create',
      domain: 'activity',
      entityId: created.id,
      entityName: created.name,
      summary: `أضاف ${currentUser.name} دولة «${created.name}» إلى مرجع البلاد بالمرجع الموحد`
    });
    return created;
  };

  const updateCountryRef = (id: string, patch: Partial<CountryRecord>) => {
    const existing = countriesRef.find((c) => c.id === id);
    if (!existing) return;
    const audit = buildUpdateAuditTrail(currentUser, existing);
    const updated: CountryRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date().toISOString(),
      ...audit
    };
    setCountriesRef((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const deleteCountryRef = (id: string) => {
    const cityIds = new Set(citiesRef.filter((ct) => ct.countryId === id).map((ct) => ct.id));
    setCountriesRef((prev) => prev.filter((c) => c.id !== id));
    setCitiesRef((prev) => prev.filter((ct) => ct.countryId !== id));
    setMeetingPointsRef((prev) =>
      prev.filter((mp) => mp.countryId !== id && !cityIds.has(mp.cityId))
    );
  };

  const createCityRef = (input: { countryId: string; name: string }): CityRecord => {
    const trimmed = input.name.trim();
    const resolvedCountryId = input.countryId || countriesRef[0]?.id || 'cnt-eg';
    const existing = citiesRef.find(
      (ct) => ct.countryId === resolvedCountryId && ct.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;

    const nowIso = new Date().toISOString();
    const audit = buildCreateAuditTrail(currentUser);
    const created: CityRecord = {
      id: `cty-${Date.now().toString(36)}`,
      countryId: resolvedCountryId,
      name: trimmed,
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...audit
    };
    setCitiesRef((prev) => [...prev, created]);
    onAuditLog({
      actor: currentUser,
      action: 'create',
      domain: 'activity',
      entityId: created.id,
      entityName: created.name,
      summary: `أضاف ${currentUser.name} مدينة «${created.name}» إلى المرجع الموحد`
    });
    return created;
  };

  const updateCityRef = (id: string, patch: Partial<CityRecord>) => {
    const existing = citiesRef.find((ct) => ct.id === id);
    if (!existing) return;
    const audit = buildUpdateAuditTrail(currentUser, existing);
    const updated: CityRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date().toISOString(),
      ...audit
    };
    setCitiesRef((prev) => prev.map((ct) => (ct.id === id ? updated : ct)));
  };

  const deleteCityRef = (id: string) => {
    setCitiesRef((prev) => prev.filter((ct) => ct.id !== id));
    setMeetingPointsRef((prev) => prev.filter((mp) => mp.cityId !== id));
  };

  const createMeetingPointRef = (input: {
    countryId?: string;
    cityId: string;
    name: string;
    pointType?: 'meeting_point' | 'site' | 'both';
  }): MeetingPointRecord => {
    const trimmed = input.name.trim();
    const cityObj = citiesRef.find((ct) => ct.id === input.cityId) || citiesRef[0];
    const resolvedCityId = cityObj?.id || input.cityId || 'cty-hrg';
    const resolvedCountryId = input.countryId || cityObj?.countryId || countriesRef[0]?.id || 'cnt-eg';
    const existing = meetingPointsRef.find(
      (mp) => mp.cityId === resolvedCityId && mp.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;

    const nowIso = new Date().toISOString();
    const audit = buildCreateAuditTrail(currentUser);
    const created: MeetingPointRecord = {
      id: `mp-${Date.now().toString(36)}`,
      countryId: resolvedCountryId,
      cityId: resolvedCityId,
      name: trimmed,
      pointType: input.pointType ?? 'both',
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...audit
    };
    setMeetingPointsRef((prev) => [...prev, created]);
    onAuditLog({
      actor: currentUser,
      action: 'create',
      domain: 'activity',
      entityId: created.id,
      entityName: created.name,
      summary: `أضاف ${currentUser.name} نقطة التقاء «${created.name}» إلى المرجع الموحد`
    });
    return created;
  };

  const updateMeetingPointRef = (id: string, patch: Partial<MeetingPointRecord>) => {
    const existing = meetingPointsRef.find((mp) => mp.id === id);
    if (!existing) return;
    const audit = buildUpdateAuditTrail(currentUser, existing);
    const updated: MeetingPointRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date().toISOString(),
      ...audit
    };
    setMeetingPointsRef((prev) => prev.map((mp) => (mp.id === id ? updated : mp)));
  };

  const deleteMeetingPointRef = (id: string) => {
    setMeetingPointsRef((prev) => prev.filter((mp) => mp.id !== id));
  };

  const resetGroupsAndInclusionsCatalogs = async () => {
    const [groups, inclusions, unitKinds, mfgs, mdls, cnts, cts, mps] = await Promise.all([
      resetAndReseedSpecGroupsDb(),
      resetAndReseedInclusionsCatalogDb(),
      resetEquipmentUnitKindsDb(),
      resetManufacturersDb(),
      resetManufacturerModelsDb(),
      resetCountriesRefDb(),
      resetCitiesRefDb(),
      resetMeetingPointsRefDb()
    ]);
    setSpecGroups(groups);
    setInclusionsCatalog(inclusions);
    setEquipmentUnitKinds(unitKinds);
    setManufacturers(mfgs);
    setManufacturerModels(mdls);
    setCountriesRef(cnts);
    setCitiesRef(cts);
    setMeetingPointsRef(mps);
    onAuditLog({
      actor: currentUser,
      action: 'update',
      domain: 'activity',
      entityId: 'unified-master-reference',
      entityName: 'المرجع الموحد',
      summary: `أعاد ${currentUser.name} ضبط وتهيئة كافة جداول المرجع الموحد`
    });
  };

  return {
    specGroups,
    setSpecGroups,
    inclusionsCatalog,
    setInclusionsCatalog,
    equipmentUnitKinds,
    manufacturers,
    manufacturerModels,
    countriesRef,
    citiesRef,
    meetingPointsRef,
    hasLoadedMasterRef,
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
  };
}
