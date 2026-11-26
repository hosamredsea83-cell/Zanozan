export type ThemeTemplateId =
  | 'classic_dark'
  | 'coastal_compact'
  | 'resort_modern'
  | 'luxury_light'
  | 'my_eand';

export type ThemeColorPresetId =
  | 'cyan'
  | 'emerald'
  | 'amber'
  | 'violet'
  | 'rose'
  | 'e_and_red';

export type ThemeFontId =
  | 'Tajawal'
  | 'Cairo'
  | 'IBM Plex Sans Arabic'
  | 'Almarai'
  | 'Readex Pro';

export type ThemeFontScale = 'compact' | 'standard' | 'comfortable';
export type ThemeRadiusMode = 'sharp' | 'balanced' | 'rounded';

export interface OwnerThemeSettings {
  userId: string;
  templateId: ThemeTemplateId;
  colorPreset: ThemeColorPresetId;
  fontFamily: ThemeFontId;
  fontScale: ThemeFontScale;
  radiusMode: ThemeRadiusMode;
  updatedAt?: string;
  updatedByName?: string;
}

export interface ThemeTemplateMeta {
  id: ThemeTemplateId;
  name: string;
  subtitle: string;
  isLight: boolean;
  previewBg: string;
  previewCard: string;
  previewBorder: string;
  previewBrandBadge?: string;
  recommendedColorPreset?: ThemeColorPresetId;
  recommendedFontFamily?: ThemeFontId;
  recommendedRadiusMode?: ThemeRadiusMode;
}

export const THEME_TEMPLATES: ThemeTemplateMeta[] = [
  {
    id: 'classic_dark',
    name: 'القالب القياسي الداكن',
    subtitle: 'واجهة تشغيل عالية التباين لإدارة الأنشطة والمعدات',
    isLight: false,
    previewBg: '#020617',
    previewCard: '#0f172a',
    previewBorder: '#1e293b'
  },
  {
    id: 'coastal_compact',
    name: 'القالب البحري المدمج',
    subtitle: 'خلفية محيطية عميقة بمساحات مريحة للعرض والتحليل',
    isLight: false,
    previewBg: '#06131f',
    previewCard: '#0b2033',
    previewBorder: '#163854'
  },
  {
    id: 'resort_modern',
    name: 'قالب المنتجعات الملكي',
    subtitle: 'طابع ليلي دافئ مخصص للرحلات والضيافة الفاخرة',
    isLight: false,
    previewBg: '#0d0f17',
    previewCard: '#161a26',
    previewBorder: '#283044'
  },
  {
    id: 'luxury_light',
    name: 'القالب الفاخر الفاتح',
    subtitle: 'واجهة نهارية مشرقة بنقاء بصري عالي الوضوح',
    isLight: true,
    previewBg: '#f1f5f9',
    previewCard: '#ffffff',
    previewBorder: '#cbd5e1'
  },
  {
    id: 'my_eand',
    name: 'قالب ماي إي آند — My e& (اتصالات)',
    subtitle: 'تصميم مستوحى من تطبيق My e& لشركة اتصالات باللون الأحمر المميز وبطاقات ناصعة البياض',
    isLight: true,
    previewBg: '#f4f5f7',
    previewCard: '#ffffff',
    previewBorder: '#e2e4e9',
    previewBrandBadge: 'My e& · اتصالات',
    recommendedColorPreset: 'e_and_red',
    recommendedFontFamily: 'Cairo',
    recommendedRadiusMode: 'rounded'
  }
];

export interface ThemeColorPresetMeta {
  id: ThemeColorPresetId;
  name: string;
  primaryHex: string;
  hoverHex: string;
  softHex: string;
  borderHex: string;
  textHex: string;
}

export const THEME_COLOR_PRESETS: ThemeColorPresetMeta[] = [
  {
    id: 'cyan',
    name: 'سيان محيطي',
    primaryHex: '#0891b2',
    hoverHex: '#06b6d4',
    softHex: 'rgba(6, 182, 212, 0.16)',
    borderHex: 'rgba(6, 182, 212, 0.38)',
    textHex: '#67e8f9'
  },
  {
    id: 'emerald',
    name: 'زمردي فاخر',
    primaryHex: '#059669',
    hoverHex: '#10b981',
    softHex: 'rgba(16, 185, 129, 0.16)',
    borderHex: 'rgba(16, 185, 129, 0.38)',
    textHex: '#6ee7b7'
  },
  {
    id: 'amber',
    name: 'كهرماني ذهبي',
    primaryHex: '#d97706',
    hoverHex: '#f59e0b',
    softHex: 'rgba(245, 158, 11, 0.16)',
    borderHex: 'rgba(245, 158, 11, 0.38)',
    textHex: '#fcd34d'
  },
  {
    id: 'violet',
    name: 'بنفسجي ملكي',
    primaryHex: '#7c3aed',
    hoverHex: '#8b5cf6',
    softHex: 'rgba(139, 92, 246, 0.16)',
    borderHex: 'rgba(139, 92, 246, 0.38)',
    textHex: '#c4b5fd'
  },
  {
    id: 'rose',
    name: 'ياقوتي دافئ',
    primaryHex: '#e11d48',
    hoverHex: '#f43f5e',
    softHex: 'rgba(244, 63, 94, 0.16)',
    borderHex: 'rgba(244, 63, 94, 0.38)',
    textHex: '#fda4af'
  },
  {
    id: 'e_and_red',
    name: 'أحمر ماي إي آند (e&)',
    primaryHex: '#e00800',
    hoverHex: '#c40700',
    softHex: 'rgba(224, 8, 0, 0.14)',
    borderHex: 'rgba(224, 8, 0, 0.35)',
    textHex: '#ff4d4d'
  }
];

export interface ThemeFontMeta {
  id: ThemeFontId;
  name: string;
  description: string;
  sample: string;
}

export const THEME_FONTS: ThemeFontMeta[] = [
  {
    id: 'Tajawal',
    name: 'Tajawal · تجوال',
    description: 'الخط الافتراضي الواضح والمتوازن للجداول والنماذج',
    sample: 'تجربة سياحية بحرية متكاملة'
  },
  {
    id: 'Cairo',
    name: 'Cairo · كايرو',
    description: 'خط هندسي حديث وعريض مناسب للعناوين ولوحات المتابعة',
    sample: 'تجربة سياحية بحرية متكاملة'
  },
  {
    id: 'IBM Plex Sans Arabic',
    name: 'IBM Plex Arabic · آي بي إم',
    description: 'خط مؤسسي دقيق القراءة مثالي للبيانات والأرقام',
    sample: 'تجربة سياحية بحرية متكاملة'
  },
  {
    id: 'Almarai',
    name: 'Almarai · المراعي',
    description: 'خط عربي عصري مدمج ومريح للقراءة السريعة',
    sample: 'تجربة سياحية بحرية متكاملة'
  },
  {
    id: 'Readex Pro',
    name: 'Readex Pro · ريدكس برو',
    description: 'خط ناعم بمسافات متناسقة للبطاقات والعروض',
    sample: 'تجربة سياحية بحرية متكاملة'
  }
];

export function getDefaultOwnerTheme(userId: string): OwnerThemeSettings {
  if (userId === 'usr-mohamed') {
    return {
      userId,
      templateId: 'coastal_compact',
      colorPreset: 'emerald',
      fontFamily: 'Cairo',
      fontScale: 'standard',
      radiusMode: 'balanced'
    };
  }
  if (userId === 'usr-tarek') {
    return {
      userId,
      templateId: 'resort_modern',
      colorPreset: 'amber',
      fontFamily: 'IBM Plex Sans Arabic',
      fontScale: 'standard',
      radiusMode: 'rounded'
    };
  }
  return {
    userId,
    templateId: 'classic_dark',
    colorPreset: 'cyan',
    fontFamily: 'Tajawal',
    fontScale: 'standard',
    radiusMode: 'balanced'
  };
}
