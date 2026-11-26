import type { CustomTechnicalSpecItem } from '../types/activity';
import type { EquipmentPropertyItem } from '../types/equipment';
import { REAL_EQUIPMENT_CATEGORIES } from '../db/localSpecsAndEquipmentDb';

export type CategoryDomainTag =
  | 'marine_yacht'
  | 'diving'
  | 'safari'
  | 'leisure'
  | 'general';

export const CATEGORY_COMPATIBILITY_OPTIONS: Array<{
  id: CategoryDomainTag;
  label: string;
}> = [
  { id: 'marine_yacht', label: 'الأنشطة البحرية واليخوت' },
  { id: 'diving', label: 'الغوص والسنوركلينج' },
  { id: 'safari', label: 'السفاري والمغامرات الصحراوية' },
  { id: 'leisure', label: 'الجولات الترفيهية والنيلية والمائية' },
  { id: 'general', label: 'عام (متوافق مع جميع التصنيفات)' }
];

export function detectCategoryDomains(categoryPath: string[]): CategoryDomainTag[] {
  if (!categoryPath || categoryPath.length === 0) return [];
  const joined = categoryPath.join(' ').toLowerCase();
  const matched = new Set<CategoryDomainTag>();

  if (/غوص|سنوركل|dive|diving|snorkel|padi|ssi|intro/.test(joined)) {
    matched.add('diving');
  }

  if (/سفاري|صحر|بيتش باجي|كواد|دفع رباعي|بدوي|نجوم|safari|desert|quad|4x4|bedouin/.test(joined)) {
    matched.add('safari');
  }

  if (
    /غواص|مراكب زجاج|ألعاب مائية|باراشوت|فروسي|خيل|نيل|فلوكة|leisure|glass|watersport|parasail|equestrian|felucca/.test(
      joined
    )
  ) {
    matched.add('leisure');
  }

  if (/بحر|يخت|يخوت|قوارب سريعة|سبيد بوت|جزير|marine|yacht|speedboat/.test(joined)) {
    matched.add('marine_yacht');
  }

  if (matched.size === 0) {
    matched.add('general');
  }

  return Array.from(matched);
}

function inferSpecDomains(spec: CustomTechnicalSpecItem): CategoryDomainTag[] {
  if (spec.linkedCategories && spec.linkedCategories.length > 0) {
    return spec.linkedCategories as CategoryDomainTag[];
  }
  if (spec.linkedCategoryIds && spec.linkedCategoryIds.length > 0) {
    const out = new Set<CategoryDomainTag>();
    spec.linkedCategoryIds.forEach((id) => {
      if (id.startsWith('cat-marine')) out.add('marine_yacht');
      if (id.startsWith('cat-diving')) out.add('diving');
      if (id.startsWith('cat-safari')) out.add('safari');
      if (id.startsWith('cat-leisure')) out.add('leisure');
    });
    if (out.size === 4) out.add('general');
    return Array.from(out);
  }
  return ['general'];
}

function inferEquipmentCategoryDomains(equipmentCategoryId: string): CategoryDomainTag[] {
  switch (equipmentCategoryId) {
    case 'yacht':
      return ['marine_yacht'];
    case 'diving_gear':
      return ['diving'];
    case 'safari_vehicle':
      return ['safari'];
    case 'leisure_gear':
      return ['leisure'];
    default:
      return ['general'];
  }
}

export interface MatchedSpecGroup {
  title: string;
  specs: CustomTechnicalSpecItem[];
  matchType: 'exact_specialty' | 'general_companion' | 'other';
}

export interface MatchedCentralLibraryGroup {
  categoryId: string;
  categoryLabel: string;
  icon: string;
  properties: EquipmentPropertyItem[];
  isCompatible: boolean;
}

export function matchSpecsAndLibraryToCategory(
  categoryPath: string[],
  activeCustomSpecs: CustomTechnicalSpecItem[],
  equipmentProperties: EquipmentPropertyItem[]
): {
  hasCategorySelected: boolean;
  detectedDomains: CategoryDomainTag[];
  compatibleCustomGroups: MatchedSpecGroup[];
  otherCustomGroups: MatchedSpecGroup[];
  compatibleLibraryGroups: MatchedCentralLibraryGroup[];
  otherLibraryGroups: MatchedCentralLibraryGroup[];
} {
  const hasCategorySelected = categoryPath.length > 0;
  if (!hasCategorySelected) {
    return {
      hasCategorySelected: false,
      detectedDomains: [],
      compatibleCustomGroups: [],
      otherCustomGroups: [],
      compatibleLibraryGroups: [],
      otherLibraryGroups: []
    };
  }

  const detectedDomains = detectCategoryDomains(categoryPath);

  const rawGroups = activeCustomSpecs.reduce<
    Array<{ title: string; specs: CustomTechnicalSpecItem[] }>
  >((acc, spec) => {
    const title = (spec.groupTitle || 'المواصفات الفنية للنشاط').trim();
    const existing = acc.find((g) => g.title.toLowerCase() === title.toLowerCase());
    if (existing) existing.specs.push(spec);
    else acc.push({ title, specs: [spec] });
    return acc;
  }, []);

  const compatibleCustomGroups: MatchedSpecGroup[] = [];
  const otherCustomGroups: MatchedSpecGroup[] = [];

  for (const grp of rawGroups) {
    const groupDomains = new Set<CategoryDomainTag>();
    grp.specs.forEach((s) => inferSpecDomains(s).forEach((d) => groupDomains.add(d)));

    const isDirectMatch = detectedDomains.some((d) => d !== 'general' && groupDomains.has(d));
    const isGeneralCompanion = groupDomains.has('general');

    if (isDirectMatch) {
      compatibleCustomGroups.push({ ...grp, matchType: 'exact_specialty' });
    } else if (isGeneralCompanion) {
      compatibleCustomGroups.push({ ...grp, matchType: 'general_companion' });
    } else {
      otherCustomGroups.push({ ...grp, matchType: 'other' });
    }
  }

  const categoryIds = new Set<string>([
    ...REAL_EQUIPMENT_CATEGORIES.map((c) => c.id),
    ...equipmentProperties.map((p) => p.category)
  ]);

  const compatibleLibraryGroups: MatchedCentralLibraryGroup[] = [];
  const otherLibraryGroups: MatchedCentralLibraryGroup[] = [];

  categoryIds.forEach((catId) => {
    const props = equipmentProperties.filter((p) => p.category === catId);
    if (props.length === 0) return;
    const catMeta = REAL_EQUIPMENT_CATEGORIES.find((c) => c.id === catId);
    const domains = inferEquipmentCategoryDomains(catId);
    const isCompatible =
      detectedDomains.some((d) => d !== 'general' && domains.includes(d)) ||
      (detectedDomains.includes('general') && domains.includes('general'));

    const item: MatchedCentralLibraryGroup = {
      categoryId: catId,
      categoryLabel: catMeta?.label || catId,
      icon: catMeta?.icon || '⚙️',
      properties: props,
      isCompatible
    };

    if (isCompatible) {
      compatibleLibraryGroups.push(item);
    } else {
      otherLibraryGroups.push(item);
    }
  });

  return {
    hasCategorySelected,
    detectedDomains,
    compatibleCustomGroups,
    otherCustomGroups,
    compatibleLibraryGroups,
    otherLibraryGroups
  };
}
