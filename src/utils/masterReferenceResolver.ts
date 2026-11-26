import type { CategoryRecord, CustomTechnicalSpecItem } from '../types/activity';
import type { MasterAddonItem } from '../types/addon';
import type {
  EquipmentItem,
  EquipmentPropertyItem,
  EquipmentTypeDefinition
} from '../types/equipment';
import {
  LOGISTICS_CATEGORY_LABELS,
  type LogisticsVehicle,
  type LogisticsVehicleCategory
} from '../types/logistics';
import type {
  EquipmentUnitKindItem,
  InclusionCatalogItem,
  InheritanceResolution,
  SpecGroupRecord
} from '../types/masterReference';

export const LOGISTICS_CATEGORY_TO_UNIT_KIND_ID: Record<LogisticsVehicleCategory, string> = {
  limousine_sedan: 'uk-car',
  hiace_van: 'uk-hiace-van',
  coaster_minibus: 'uk-coaster-bus',
  tourist_bus: 'uk-tourist-bus',
  suv_4x4: 'uk-logistics-4x4',
  boat_shuttle: 'uk-shuttle-boat'
};

export interface LinkableCategoryItem {
  linkedCategoryIds?: string[];
  excludedCategoryIds?: string[];
}

export interface ResolvedActivitySpecGroup {
  group: SpecGroupRecord;
  inheritance: InheritanceResolution;
  specs: Array<CustomTechnicalSpecItem & { inheritance: InheritanceResolution }>;
}

export interface ResolvedEquipmentLibGroup {
  group: SpecGroupRecord;
  inheritance: InheritanceResolution;
  properties: Array<EquipmentPropertyItem & { inheritance: InheritanceResolution }>;
}

export interface CategoryCompatibilityResult {
  hasCategorySelected: boolean;
  selectedCategoryId: string | null;
  selectedCategoryRecord: CategoryRecord | null;
  ancestorChain: CategoryRecord[];
  compatibleActivityGroups: ResolvedActivitySpecGroup[];
  compatibleLibraryGroups: ResolvedEquipmentLibGroup[];
  compatibleInclusions: Array<InclusionCatalogItem & { inheritance: InheritanceResolution }>;
  compatibleExclusions: Array<InclusionCatalogItem & { inheritance: InheritanceResolution }>;
  compatibleEquipmentTypes: Array<EquipmentTypeDefinition & { inheritance: InheritanceResolution }>;
  compatibleEquipmentUnitKinds: Array<EquipmentUnitKindItem & { inheritance: InheritanceResolution }>;
  compatibleLogisticsUnitKinds: Array<EquipmentUnitKindItem & { inheritance: InheritanceResolution }>;
  compatibleEquipments: Array<EquipmentItem & { inheritance: InheritanceResolution }>;
  compatibleLogisticsVehicles: Array<LogisticsVehicle & { inheritance: InheritanceResolution }>;
  compatibleMasterAddons: Array<MasterAddonItem & { inheritance: InheritanceResolution }>;
}

/**
 * Resolves the exact CategoryRecord from a categoryPath (["الأنشطة البحرية واليخوت", "رحلات اليخوت الخاصة VIP"]).
 */
export function resolveCategoryByPath(
  categoryPath: string[],
  categoryRecords: CategoryRecord[]
): CategoryRecord | null {
  if (!categoryPath || categoryPath.length === 0 || categoryRecords.length === 0) {
    return null;
  }

  let currentParentId: string | null = null;
  let matched: CategoryRecord | null = null;

  for (const seg of categoryPath) {
    const cleanSeg = seg.trim();
    const candidate = categoryRecords.find(
      (r) =>
        r.name.trim() === cleanSeg &&
        (currentParentId === null ? r.parentId === null : r.parentId === currentParentId)
    );
    if (candidate) {
      matched = candidate;
      currentParentId = candidate.id;
    } else {
      // Fallback: search by exact name anywhere if hierarchy was slightly flattened
      const byName = categoryRecords.find((r) => r.name.trim() === cleanSeg);
      if (byName) {
        matched = byName;
        currentParentId = byName.id;
      }
    }
  }

  return matched;
}

/**
 * Returns the chain from [selectedCategory, parent, rootParent, ...].
 */
export function resolveCategoryAncestorChain(
  categoryId: string | null,
  categoryRecords: CategoryRecord[]
): CategoryRecord[] {
  if (!categoryId || categoryRecords.length === 0) return [];
  const byId = new Map(categoryRecords.map((r) => [r.id, r]));
  const chain: CategoryRecord[] = [];
  const visited = new Set<string>();

  let currId: string | null = categoryId;
  while (currId && !visited.has(currId)) {
    visited.add(currId);
    const rec = byId.get(currId);
    if (!rec) break;
    chain.push(rec);
    currId = rec.parentId;
  }
  return chain;
}

/**
 * Evaluates hierarchical inheritance (`direct` | `inherited` | `excluded` | `none`)
 * for an entity relative to a target categoryId and its ancestor chain.
 */
export function evaluateCategoryInheritance(
  item: LinkableCategoryItem,
  targetCategoryId: string | null,
  ancestorChain: CategoryRecord[]
): InheritanceResolution {
  if (!targetCategoryId || ancestorChain.length === 0) {
    return { status: 'none' };
  }

  const linkedSet = new Set(item.linkedCategoryIds ?? []);
  const excludedSet = new Set(item.excludedCategoryIds ?? []);

  // 1. Direct exclusion on target category or any closer ancestor overrides parent links
  for (let i = 0; i < ancestorChain.length; i += 1) {
    const anc = ancestorChain[i];
    if (excludedSet.has(anc.id)) {
      return {
        status: 'excluded',
        sourceCategoryId: anc.id,
        sourceCategoryName: anc.name
      };
    }
    if (linkedSet.has(anc.id)) {
      return {
        status: i === 0 ? 'direct' : 'inherited',
        sourceCategoryId: anc.id,
        sourceCategoryName: anc.name
      };
    }
  }

  return { status: 'none' };
}

export function isInheritanceCompatible(res: InheritanceResolution): boolean {
  return res.status === 'direct' || res.status === 'inherited';
}

export function resolveCategoryCompatibility(params: {
  categoryPath: string[];
  categoryRecords: CategoryRecord[];
  specGroups: SpecGroupRecord[];
  customTechnicalSpecs: CustomTechnicalSpecItem[];
  equipmentProperties: EquipmentPropertyItem[];
  inclusionsCatalog: InclusionCatalogItem[];
  equipmentTypes: EquipmentTypeDefinition[];
  equipmentUnitKinds?: EquipmentUnitKindItem[];
  equipments: EquipmentItem[];
  logisticsVehicles?: LogisticsVehicle[];
  masterAddons: MasterAddonItem[];
  selectedCategoryIdOverride?: string | null;
}): CategoryCompatibilityResult {
  const {
    categoryPath,
    categoryRecords,
    specGroups,
    customTechnicalSpecs,
    equipmentProperties,
    inclusionsCatalog,
    equipmentTypes,
    equipmentUnitKinds = [],
    equipments,
    logisticsVehicles = [],
    masterAddons,
    selectedCategoryIdOverride
  } = params;

  const selectedRecord = selectedCategoryIdOverride
    ? categoryRecords.find((r) => r.id === selectedCategoryIdOverride) ?? null
    : resolveCategoryByPath(categoryPath, categoryRecords);

  const selectedCategoryId = selectedRecord?.id ?? null;

  if (!selectedCategoryId && (!categoryPath || categoryPath.length === 0)) {
    return {
      hasCategorySelected: false,
      selectedCategoryId: null,
      selectedCategoryRecord: null,
      ancestorChain: [],
      compatibleActivityGroups: [],
      compatibleLibraryGroups: [],
      compatibleInclusions: [],
      compatibleExclusions: [],
      compatibleEquipmentTypes: [],
      compatibleEquipmentUnitKinds: [],
      compatibleLogisticsUnitKinds: [],
      compatibleEquipments: [],
      compatibleLogisticsVehicles: [],
      compatibleMasterAddons: []
    };
  }

  const ancestorChain = resolveCategoryAncestorChain(selectedCategoryId, categoryRecords);

  // 1. Activity Spec Groups + Properties
  const activeActivityGroups = specGroups
    .filter((g) => g.isActive && g.scope === 'activity_spec')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const compatibleActivityGroups: ResolvedActivitySpecGroup[] = [];
  for (const grp of activeActivityGroups) {
    const grpRes = evaluateCategoryInheritance(grp, selectedCategoryId, ancestorChain);
    if (!isInheritanceCompatible(grpRes)) continue;

    const specsInGrp = customTechnicalSpecs
      .filter(
        (s) =>
          s.isActive &&
          (s.groupId === grp.id ||
            (!s.groupId && s.groupTitle.trim().toLowerCase() === grp.name.trim().toLowerCase()))
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((s) => ({
        ...s,
        inheritance:
          (s.linkedCategoryIds && s.linkedCategoryIds.length > 0) ||
          (s.excludedCategoryIds && s.excludedCategoryIds.length > 0)
            ? evaluateCategoryInheritance(s, selectedCategoryId, ancestorChain)
            : grpRes
      }))
      .filter((s) => isInheritanceCompatible(s.inheritance));

    if (specsInGrp.length > 0 || grpRes.status === 'direct' || grpRes.status === 'inherited') {
      compatibleActivityGroups.push({
        group: grp,
        inheritance: grpRes,
        specs: specsInGrp
      });
    }
  }

  // 2. Equipment Library Groups + Properties
  const activeLibGroups = specGroups
    .filter((g) => g.isActive && g.scope === 'equipment_library')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const compatibleLibraryGroups: ResolvedEquipmentLibGroup[] = [];
  for (const grp of activeLibGroups) {
    const grpRes = evaluateCategoryInheritance(grp, selectedCategoryId, ancestorChain);
    if (!isInheritanceCompatible(grpRes)) continue;

    const propsInGrp = equipmentProperties
      .filter((p) => p.groupId === grp.id)
      .map((p) => ({
        ...p,
        inheritance:
          (p.linkedCategoryIds && p.linkedCategoryIds.length > 0) ||
          (p.excludedCategoryIds && p.excludedCategoryIds.length > 0)
            ? evaluateCategoryInheritance(p, selectedCategoryId, ancestorChain)
            : grpRes
      }))
      .filter((p) => isInheritanceCompatible(p.inheritance));

    compatibleLibraryGroups.push({
      group: grp,
      inheritance: grpRes,
      properties: propsInGrp
    });
  }

  // 3. Inclusions & Exclusions
  const compatibleInclusions = inclusionsCatalog
    .filter((item) => item.isActive && item.kind === 'included')
    .map((item) => ({
      ...item,
      inheritance: evaluateCategoryInheritance(item, selectedCategoryId, ancestorChain)
    }))
    .filter((item) => isInheritanceCompatible(item.inheritance));

  const compatibleExclusions = inclusionsCatalog
    .filter((item) => item.isActive && item.kind === 'excluded')
    .map((item) => ({
      ...item,
      inheritance: evaluateCategoryInheritance(item, selectedCategoryId, ancestorChain)
    }))
    .filter((item) => isInheritanceCompatible(item.inheritance));

  // 4. Equipment & Logistics Unit Kinds, Equipment Types, Equipments & Logistics Vehicles
  const compatibleEquipmentUnitKinds = equipmentUnitKinds
    .filter((uk) => uk.isActive && (uk.domainScope === 'equipment' || uk.domainScope === 'both'))
    .map((uk) => ({
      ...uk,
      inheritance: evaluateCategoryInheritance(uk, selectedCategoryId, ancestorChain)
    }))
    .filter((uk) => isInheritanceCompatible(uk.inheritance));

  const compatibleLogisticsUnitKinds = equipmentUnitKinds
    .filter((uk) => uk.isActive && (uk.domainScope === 'logistics' || uk.domainScope === 'both'))
    .map((uk) => ({
      ...uk,
      inheritance: evaluateCategoryInheritance(uk, selectedCategoryId, ancestorChain)
    }))
    .filter((uk) => isInheritanceCompatible(uk.inheritance));

  const unitKindByNormalizedName = new Map(
    equipmentUnitKinds
      .filter((uk) => uk.domainScope === 'equipment' || uk.domainScope === 'both')
      .map((uk) => [uk.name.trim().toLowerCase(), uk])
  );
  const compatUnitKindResByName = new Map(
    compatibleEquipmentUnitKinds.map((uk) => [uk.name.trim().toLowerCase(), uk.inheritance])
  );

  const compatibleEquipmentTypes = equipmentTypes
    .map((eqType) => ({
      ...eqType,
      inheritance: evaluateCategoryInheritance(eqType, selectedCategoryId, ancestorChain)
    }))
    .filter((eqType) => isInheritanceCompatible(eqType.inheritance));

  const eqTypeResMap = new Map(
    compatibleEquipmentTypes.map((t) => [t.id, t.inheritance])
  );

  const compatibleEquipments: Array<EquipmentItem & { inheritance: InheritanceResolution }> = [];
  for (const eq of equipments) {
    const excludedSet = new Set(eq.excludedCategoryIds ?? []);
    if (ancestorChain.some((anc) => excludedSet.has(anc.id))) {
      continue;
    }

    const normClass = (eq.classification || '').trim().toLowerCase();
    const matchedCatalogUnitKind = normClass ? unitKindByNormalizedName.get(normClass) : undefined;
    if (matchedCatalogUnitKind) {
      const ukRes = compatUnitKindResByName.get(normClass);
      if (ukRes && isInheritanceCompatible(ukRes)) {
        compatibleEquipments.push({ ...eq, inheritance: ukRes });
        continue;
      }
      // If unit kind exists in catalog and is explicitly excluded for this category, respect exclusion
      const rawUkRes = evaluateCategoryInheritance(
        matchedCatalogUnitKind,
        selectedCategoryId,
        ancestorChain
      );
      if (rawUkRes.status === 'excluded') {
        continue;
      }
    }

    const hasOwnLinks = Boolean(eq.linkedCategoryIds && eq.linkedCategoryIds.length > 0);
    if (hasOwnLinks) {
      const ownRes = evaluateCategoryInheritance(eq, selectedCategoryId, ancestorChain);
      if (isInheritanceCompatible(ownRes)) {
        compatibleEquipments.push({ ...eq, inheritance: ownRes });
        continue;
      }
    }

    // Legacy fallback: inherit from EquipmentTypeDefinition unless explicitly excluded
    const typeRes = eqTypeResMap.get(eq.typeId);
    if (typeRes && isInheritanceCompatible(typeRes)) {
      compatibleEquipments.push({ ...eq, inheritance: typeRes });
    }
  }

  const compatLogisticsById = new Map(
    compatibleLogisticsUnitKinds.map((uk) => [uk.id, uk.inheritance])
  );
  const compatLogisticsByName = new Map(
    compatibleLogisticsUnitKinds.map((uk) => [uk.name.trim().toLowerCase(), uk.inheritance])
  );
  const compatibleLogisticsVehicles: Array<
    LogisticsVehicle & { inheritance: InheritanceResolution }
  > = [];
  for (const veh of logisticsVehicles) {
    const mappedUkId = LOGISTICS_CATEGORY_TO_UNIT_KIND_ID[veh.category];
    const mappedLabel = (LOGISTICS_CATEGORY_LABELS[veh.category] || '').trim().toLowerCase();
    const res =
      (mappedUkId ? compatLogisticsById.get(mappedUkId) : undefined) ||
      (mappedLabel ? compatLogisticsByName.get(mappedLabel) : undefined);
    if (res && isInheritanceCompatible(res)) {
      compatibleLogisticsVehicles.push({ ...veh, inheritance: res });
    }
  }

  // 5. Paid Add-ons
  const compatibleMasterAddons = masterAddons
    .filter((addon) => addon.isActive)
    .map((addon) => ({
      ...addon,
      inheritance: evaluateCategoryInheritance(addon, selectedCategoryId, ancestorChain)
    }))
    .filter((addon) => isInheritanceCompatible(addon.inheritance));

  return {
    hasCategorySelected: Boolean(selectedCategoryId || categoryPath.length > 0),
    selectedCategoryId,
    selectedCategoryRecord: selectedRecord,
    ancestorChain,
    compatibleActivityGroups,
    compatibleLibraryGroups,
    compatibleInclusions,
    compatibleExclusions,
    compatibleEquipmentTypes,
    compatibleEquipmentUnitKinds,
    compatibleLogisticsUnitKinds,
    compatibleEquipments,
    compatibleLogisticsVehicles,
    compatibleMasterAddons
  };
}

/**
 * Resolves equipment_library spec groups & properties for EquipmentForm.
 * Prioritizes explicit `linkedUnitKindIds` matches when a unit kind (e.g. مركب / يخت / لانش / باتش باجي)
 * is selected, and falls back to hierarchical category inheritance when no unit-kind-specific specs exist.
 */
export function resolveEquipmentSpecsForForm(params: {
  selectedUnitKindId?: string | null;
  selectedCategoryIds: string[];
  categoryRecords: CategoryRecord[];
  specGroups: SpecGroupRecord[];
  equipmentProperties: EquipmentPropertyItem[];
}): ResolvedEquipmentLibGroup[] {
  const {
    selectedUnitKindId,
    selectedCategoryIds,
    categoryRecords,
    specGroups,
    equipmentProperties
  } = params;

  const activeLibGroups = specGroups
    .filter((g) => g.isActive && g.scope === 'equipment_library')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const chainsBySelected = selectedCategoryIds.map((catId) => ({
    catId,
    chain: resolveCategoryAncestorChain(catId, categoryRecords)
  }));

  if (selectedUnitKindId) {
    const unitKindMatched: ResolvedEquipmentLibGroup[] = [];

    for (const grp of activeLibGroups) {
      const grpHasUnitLink = (grp.linkedUnitKindIds ?? []).includes(selectedUnitKindId);
      const propsInGroup = equipmentProperties.filter((p) => p.groupId === grp.id);
      const propHasUnitLink = propsInGroup.some((p) =>
        (p.linkedUnitKindIds ?? []).includes(selectedUnitKindId)
      );

      if (!grpHasUnitLink && !propHasUnitLink) continue;

      const resolvedProps = propsInGroup
        .filter((p) => {
          const propKinds = p.linkedUnitKindIds ?? [];
          if (propKinds.length > 0) {
            return propKinds.includes(selectedUnitKindId);
          }
          // Property has no unit-kind restriction -> inherit group's unit-kind match
          return grpHasUnitLink;
        })
        .map((p) => ({
          ...p,
          inheritance: { status: 'direct' } as InheritanceResolution
        }));

      if (resolvedProps.length > 0 || grpHasUnitLink) {
        unitKindMatched.push({
          group: grp,
          inheritance: { status: 'direct' },
          properties: resolvedProps
        });
      }
    }

    if (unitKindMatched.length > 0) {
      return unitKindMatched;
    }
  }

  if (chainsBySelected.length === 0) return [];

  const categoryMatched: ResolvedEquipmentLibGroup[] = [];
  for (const grp of activeLibGroups) {
    let bestGrpRes: InheritanceResolution | null = null;
    const matchingCatChains: typeof chainsBySelected = [];

    for (const entry of chainsBySelected) {
      const res = evaluateCategoryInheritance(grp, entry.catId, entry.chain);
      if (isInheritanceCompatible(res)) {
        matchingCatChains.push(entry);
        if (!bestGrpRes || (bestGrpRes.status !== 'direct' && res.status === 'direct')) {
          bestGrpRes = res;
        }
      }
    }

    if (!bestGrpRes) continue;

    const propsInGrp = equipmentProperties
      .filter((p) => p.groupId === grp.id)
      .map((prop) => {
        const hasExplicitLinks =
          (prop.linkedCategoryIds && prop.linkedCategoryIds.length > 0) ||
          (prop.excludedCategoryIds && prop.excludedCategoryIds.length > 0);

        if (!hasExplicitLinks) {
          return { ...prop, inheritance: bestGrpRes! };
        }

        let bestPropRes: InheritanceResolution | null = null;
        for (const entry of matchingCatChains) {
          const pRes = evaluateCategoryInheritance(prop, entry.catId, entry.chain);
          if (isInheritanceCompatible(pRes)) {
            if (!bestPropRes || (bestPropRes.status !== 'direct' && pRes.status === 'direct')) {
              bestPropRes = pRes;
            }
          }
        }

        return bestPropRes ? { ...prop, inheritance: bestPropRes } : null;
      })
      .filter((item): item is EquipmentPropertyItem & { inheritance: InheritanceResolution } =>
        Boolean(item)
      );

    categoryMatched.push({
      group: grp,
      inheritance: bestGrpRes,
      properties: propsInGrp
    });
  }

  return categoryMatched;
}

