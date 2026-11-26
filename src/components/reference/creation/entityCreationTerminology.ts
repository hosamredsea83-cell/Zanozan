import type React from 'react';
import type { Activity } from '../../../types/activity';

export type EntityKind = 'activity' | 'trip';

export interface EntityCreationOverrides {
  renderTopBanner?: (context: {
    formData: Activity;
    setFormData: React.Dispatch<React.SetStateAction<Activity>>;
  }) => React.ReactNode;
  renderAfterBasicInfo?: (context: {
    formData: Activity;
    setFormData: React.Dispatch<React.SetStateAction<Activity>>;
  }) => React.ReactNode;
  renderAfterPricing?: (context: {
    formData: Activity;
    setFormData: React.Dispatch<React.SetStateAction<Activity>>;
  }) => React.ReactNode;
  renderSidebarTop?: (context: {
    formData: Activity;
    setFormData: React.Dispatch<React.SetStateAction<Activity>>;
  }) => React.ReactNode;
  renderHubHeaderActions?: () => React.ReactNode;
  customValidate?: (formData: Activity) => string[];
  hiddenSections?: Array<'variants' | 'equipment' | 'seo' | 'collections' | 'themeTemplate'>;
}

export interface EntityTerminologyConfig {
  kind: EntityKind;
  noun: string;
  definiteNoun: string;
  pluralNoun: string;
  indefiniteTouristNoun: string;
  definitePluralNoun: string;
  englishNoun: string;
  skuPrefix: string;
  seoBasePath: string;
  seoSlugPlaceholder: string;

  // Hub: Empty state
  emptyPreviewReturnLabel: string;
  emptyBadgeLabel: string;
  emptyHeroTitle: string;
  emptyHeroDescription: string;
  emptyPrimaryCta: string;
  emptyTemplateButtonPrefix: string;
  emptyTemplateCategoryChoiceHint: string;

  // Hub: Registry header & controls
  hubBreadcrumb: string;
  hubTitle: string;
  hubCountBadgeSuffix: string;
  hubSubtitleTemplate: (userName: string, companyName: string) => string;
  hubAddButtonLabel: string;
  hubStatTotalLabel: string;
  hubStatPublishedLabel: string;
  hubStatDraftLabel: string;
  hubSearchFilterColPlaceholder: string;
  hubTableColNameHeader: string;
  hubTableColStatusHeader: string;
  hubDropdownNameTitle: string;
  hubDropdownStatusTitle: string;
  hubFallbackCategoryLabel: string;
  hubEditButtonTooltip: string;
  hubPreviewButtonTooltip: string;
  hubDeleteButtonTooltip: string;
  hubDeleteSuccessMessage: string;
  hubFooterQuestion: string;
  hubFooterSubtext: string;
  hubFooterCta: string;

  // Editor header, validation & alerts
  editorSystemLabel: string;
  editorIdLabel: string;
  editorDefaultNewTitle: string;
  validationMediaError: string;
  validationNameError: string;
  validationDescriptionError: string;
  validationPriceError: string;
  validationStatusError: string;
  validationAlertHeader: string;
  saveSuccessAlert: string;

  // Two-column form strings
  nameArPlaceholder: string;
  nameEnPlaceholder: string;
  descArPlaceholder: string;
  descEnPlaceholder: string;
  mediaSectionTitle: string;
  mediaStorageHint: string;
  youtubeListTitle: string;
  youtubeDefaultTitle: string;
  youtubeDuplicateWarning: string;
  categorySubtitle: string;
  categorySelectPlaceholder: string;
  taxLabelEn: string;
  taxLabelAr: string;
  inventoryDesc: string;
  skuLabel: string;
  skuPlaceholder: string;
  paymentDeadlineDesc: string;
  logisticsRequiresTransferLabel: string;
  logisticsOwnerTransferLabel: string;
  logisticsSeparateFeeLabel: string;
  waypointSightseeingLabel: string;
  variantsNewModalTitle: string;
  customSpecFallbackGroupTitle: string;
  specsSectionDesc: string;
  specsEmptyState: string;
  inclusionsFreeHeaderPrefix: string;
  notIncludedFallbackText: string;
  seoSubtitle: string;
  seoDefaultTitle: string;
  seoHandleLabel: string;

  // Sidebar status, publishing, product organization, vendor, collections, theme
  statusCardTitle: string;
  statusSelectPlaceholder: string;
  durationCardTitle: string;
  publishingSubtitle: string;
  publishingAvailabilityPrefix: string;
  customChannelDefaultDesc: string;
  channelOwnerStorefrontDesc: string;
  channelMarketplaceDesc: string;
  channelMobileAppDesc: string;
  channelB2bDesc: string;
  organizationCardTitle: string;
  ownerFallbackLabel: string;
  ownerAddButtonLabel: string;
  ownerAssignSaveLabel: string;
  ownerAssignSuccessMessage: (ownerName: string) => string;
  collectionsOwnerEmptyMessage: string;
  collectionsRemoveTooltip: string;
  collectionsAddChipPrefix: string;
  collectionsAddSuccessMessage: (colName: string, ownerName: string) => string;
  themeDefaultOptionLabel: string;
  themeHelperText: string;

  // Modals
  modalAddStatusTitle: string;
  modalAddOwnerTitle: string;
  modalAddOwnerSuccessMessage: (ownerName: string) => string;
  modalAddCategoryTitle: string;
  modalAddCategoryHelperText: string;

  // Equipment selector
  equipmentSectionTitle: string;
  equipmentUnlinkSuccess: (eqName: string) => string;
  equipmentLinkSuccess: (eqName: string, eqId: string) => string;
  equipmentShowToClientSuccess: string;
  equipmentHideFromClientSuccess: string;
  equipmentOtherUsageText: (count: number) => string;

  // Paid addons editor
  paidAddonsEnterPriceHint: string;
  paidAddonsEmptyText: string;

  // Dynamic pricing rules
  pricingAgeTiersTitle: string;
  pricingAgeTiersCountLabel: (count: number) => string;
  pricingAgeTiersHint: string;
  pricingDynamicChipsTitle: string;

  // Card sections & preview modal
  cardMediaDefaultVideoTitle: string;
  cardMediaEmptySubImages: string;
  cardSpecsHeaderTitle: string;
  cardPricingAgeTiersComment: string;
  cardLinkedEquipmentTitle: (count: number) => string;
  previewModalTitle: string;
}

export const ACTIVITY_TERMINOLOGY: EntityTerminologyConfig = {
  kind: 'activity',
  noun: 'نشاط',
  definiteNoun: 'النشاط',
  pluralNoun: 'أنشطة',
  indefiniteTouristNoun: 'نشاط سياحي',
  definitePluralNoun: 'الأنشطة',
  englishNoun: 'Activity',
  skuPrefix: 'ACT',
  seoBasePath: 'activities',
  seoSlugPlaceholder: 'activity-slug-url',

  emptyPreviewReturnLabel: 'العودة لسجل الأنشطة',
  emptyBadgeLabel: 'بند إضافة نشاط سياحي',
  emptyHeroTitle: 'ابدأ بإضافة أول نشاط سياحي لك على منصة ZanoZa',
  emptyHeroDescription:
    'صفحتك فارغة حالياً ولم تقم بإضافة أي أنشطة بعد. أنشئ نشاطك السياحي الآن وحدد مواعيد الانطلاق والأسعار والصور ليظهر فوراً للسياح ووكلاء السفر.',
  emptyPrimaryCta: 'زر إضافة نشاط جديد الآن',
  emptyTemplateButtonPrefix: '+ إضافة نشاط',
  emptyTemplateCategoryChoiceHint:
    'اضغط على أي تصنيف من الصور الأربعة أدناه لإنشاء النشاط المناسب مباشرة بقالب جاهز:',

  hubBreadcrumb: 'إدارة نشاط · سجل الأنشطة المضافة',
  hubTitle: 'سجل الأنشطة التي تم إضافتها',
  hubCountBadgeSuffix: 'أنشطة',
  hubSubtitleTemplate: (userName, companyName) =>
    `الأنشطة السياحية التابعة لحساب ${userName} (${companyName}). يمكنك تعديل، نشر، أو إضافة المزيد في أي وقت.`,
  hubAddButtonLabel: '+ إضافة نشاط جديد',
  hubStatTotalLabel: 'إجمالي الأنشطة المضافة',
  hubStatPublishedLabel: 'أنشطة منشورة في المتجر',
  hubStatDraftLabel: 'مسودات قيد الإعداد',
  hubSearchFilterColPlaceholder: 'اختر أو اكتب النشاط...',
  hubTableColNameHeader: 'النشاط والصورة',
  hubTableColStatusHeader: 'حالة النشاط',
  hubDropdownNameTitle: 'تحديد متعدد للنشاط والمعرّف',
  hubDropdownStatusTitle: 'تحديد متعدد لحالة النشاط',
  hubFallbackCategoryLabel: 'نشاط سياحي',
  hubEditButtonTooltip: 'فتح في محرر الأنشطة لتعديل كافة الحقول',
  hubPreviewButtonTooltip: 'معاينة النشاط',
  hubDeleteButtonTooltip: 'حذف النشاط',
  hubDeleteSuccessMessage: 'تم حذف النشاط بنجاح من السجل',
  hubFooterQuestion: 'هل ترغب في توسيع أنشطتك؟',
  hubFooterSubtext: 'أضف رحلات بحرية أو سفاري أو غوص جديدة لجذب المزيد من العملاء.',
  hubFooterCta: '+ إضافة نشاط سياحي جديد',

  editorSystemLabel: 'نظام إدارة الأنشطة المعتمد منصة ZanoZa',
  editorIdLabel: 'معرف النشاط',
  editorDefaultNewTitle: 'نشاط سياحي جديد',
  validationMediaError: 'إضافة صورة واحدة على الأقل للنشاط',
  validationNameError: 'إدخال اسم النشاط',
  validationDescriptionError: 'إدخال وصف النشاط',
  validationPriceError: 'تحديد سعر النشاط (قيمة أكبر من 0)',
  validationStatusError: 'تحديد حالة النشاط',
  validationAlertHeader: 'لا يمكن حفظ النشاط قبل استكمال البيانات الإلزامية التالية:',
  saveSuccessAlert: 'تم حفظ النشاط ومزامنة التعديلات بنجاح في قاعدة بيانات المنصة.',

  nameArPlaceholder: 'اكتب اسم النشاط بالعربية...',
  nameEnPlaceholder: 'Activity name in English...',
  descArPlaceholder: 'اكتب وصف النشاط بالعربية...',
  descEnPlaceholder: 'Activity description in English...',
  mediaSectionTitle: 'Media / وسائط وصور النشاط',
  mediaStorageHint:
    'الحدود مرتبطة بباقة صاحب النشاط. روابط YouTube لا تستهلك مساحة التخزين في المنصة.',
  youtubeListTitle: 'فيديوهات النشاط المرفقة من YouTube (0MB استهلاك مساحة):',
  youtubeDefaultTitle: 'فيديو استعراضي للنشاط على YouTube',
  youtubeDuplicateWarning:
    '⚠️ هذا الفيديو أو الرابط مضاف مسبقاً في وسائط النشاط (ممنوع تكرار الوسائط)',
  categorySubtitle: 'اختر مسار تصنيف النشاط عبر القائمة الهرمية المنسدلة، أو تصفح المستويات بالتتابع.',
  categorySelectPlaceholder: 'Choose a product category / اختر تصنيف النشاط...',
  taxLabelEn: 'Charge tax on this activity',
  taxLabelAr: 'حساب ضريبة القيمة المضافة المعتمدة على هذا النشاط',
  inventoryDesc: 'تتبع الأماكن الشاغرة وفترات التشغيل ومواعيد المغادرة وكود النشاط.',
  skuLabel: 'SKU (Stock Keeping Unit / كود النشاط)',
  skuPlaceholder: 'أدخل كود النشاط...',
  paymentDeadlineDesc: 'مهلة العميل بعد الموافقة؛ إذا انتهت دون دفع تعود الأماكن الشاغرة فوراً للنشاط.',
  logisticsRequiresTransferLabel: 'هل النشاط يحتاج إلى نقل؟',
  logisticsOwnerTransferLabel: 'هل النقل متوفر من صاحب النشاط؟',
  logisticsSeparateFeeLabel: 'تكلفة النقل منفصلة عن سعر النشاط (ج.م):',
  waypointSightseeingLabel: 'معلم يمر به النشاط',
  variantsNewModalTitle: 'إضافة باقة أو خيار جديد للنشاط',
  customSpecFallbackGroupTitle: 'المواصفات الفنية للنشاط',
  specsSectionDesc:
    'أضف وعدّل خصائص ومواصفات النشاط الخاصة به فقط (مستقلة تماماً عن صفات المعدات)، مع التحكم في إظهار كل خاصية للعميل أو إبقائها داخلية.',
  specsEmptyState:
    'لم تتم إضافة أي مواصفات فنية لهذا النشاط بعد. اختر مجموعة من المواصفات الفنية المسجلة بالأعلى ثم حدد تفاصيلها يدوياً.',
  inclusionsFreeHeaderPrefix: '✓ المشمول مجاناً في النشاط',
  notIncludedFallbackText: 'النشاط شامل كافة التكاليف المذكورة',
  seoSubtitle: 'معاينة كيفية ظهور هذا النشاط في نتائج بحث Google وشبكات التواصل.',
  seoDefaultTitle: 'عنوان النشاط',
  seoHandleLabel: 'URL handle / الرابط الدائم للنشاط',

  statusCardTitle: 'Status / حالة النشاط *',
  statusSelectPlaceholder: '-- اختر حالة النشاط * --',
  durationCardTitle: 'Duration / مدة النشاط',
  publishingSubtitle: 'تحديد منافذ نشر النشاط للعملاء',
  publishingAvailabilityPrefix: 'النشاط متاح في',
  customChannelDefaultDesc: 'قناة نشر مخصصة ومضافة بواسطة صاحب النشاط',
  channelOwnerStorefrontDesc:
    'نشر النشاط مباشرة على صفحة المتجر والموقع الإلكتروني الخاص بك لاستقبال الحجوزات المباشرة.',
  channelMarketplaceDesc:
    'عرض النشاط في متجر الأنشطة العام بالمنصة للشركات السياحية والوكلاء وجميع الزوار.',
  channelMobileAppDesc: 'إتاحة النشاط داخل تطبيق الهاتف الجوال للنزلاء في الفنادق والسياح.',
  channelB2bDesc: 'إتاحة النشاط لشركات السياحة والفنادق الشريكة بأسعار الجملة والعقود السنوية.',
  organizationCardTitle: 'Product Organization / تنظيم النشاط',
  ownerFallbackLabel: 'صاحب النشاط',
  ownerAddButtonLabel: '+ إضافة مالك آخر جديد للنشاط',
  ownerAssignSaveLabel: 'حفظ وإسناد النشاط له',
  ownerAssignSuccessMessage: (ownerName) =>
    `✓ تمت إضافة المالك "${ownerName}" وإسناد النشاط له بنجاح في قاعدة البيانات`,
  collectionsOwnerEmptyMessage:
    'لا توجد مجموعات مضافة من قِبل صاحب النشاط بعد. أضف مجموعات من قسم «إضافة مجموعات» أو اكتب اسم المجموعة هنا واضغط Enter.',
  collectionsRemoveTooltip: 'إزالة المجموعة من النشاط',
  collectionsAddChipPrefix: 'إضافة واختيار المجموعة لصاحب النشاط:',
  collectionsAddSuccessMessage: (colName, ownerName) =>
    `✓ تمت إضافة المجموعة "${colName}" لحساب ${ownerName} وتعيينها للنشاط`,
  themeDefaultOptionLabel: 'Default activity template (قالب النشاط الافتراضي)',
  themeHelperText: 'يحدد طريقة تنسيق وعرض بطاقة النشاط في واجهة المتجر وتطبيق الهواتف الذكية.',

  modalAddStatusTitle: 'إضافة حالة نشاط جديدة',
  modalAddOwnerTitle: 'إضافة صاحب نشاط جديد للمنظومة',
  modalAddOwnerSuccessMessage: (ownerName) =>
    `✓ تمت إضافة المالك "${ownerName}" وإسناد النشاط له`,
  modalAddCategoryTitle: 'إضافة تصنيف جديد في شجرة الأنشطة',
  modalAddCategoryHelperText:
    'سيتم حفظ هذا التصنيف داخل القوائم المنسدلة وشجرة الأنشطة المركزية ليتاح استخدامه فوراً في هذا النشاط وفي الأنشطة اللاحقة.',

  equipmentSectionTitle: 'المعدات المستخدمة في النشاط',
  equipmentUnlinkSuccess: (eqName) =>
    `تم فك ارتباط المعدة "${eqName}" بالنشاط (ملف المعدة الأصلي محفوظ)`,
  equipmentLinkSuccess: (eqName, eqId) =>
    `✓ تم ربط المعدة "${eqName}" (${eqId}) بالنشاط دون نسخ بياناتها`,
  equipmentShowToClientSuccess: '✓ تم تفعيل عرض المعدات ومواصفاتها العامة للعميل في هذا النشاط',
  equipmentHideFromClientSuccess: 'تم إخفاء تفاصيل المعدات عن واجهة العميل لهذا النشاط',
  equipmentOtherUsageText: (count) => `مستخدمة أيضاً في ${count} أنشطة أخرى`,

  paidAddonsEnterPriceHint: 'أدخل السعر الخاص بنشاطك فقط',
  paidAddonsEmptyText:
    'لا توجد إضافات اختيارية مدفوعة مضافة لهذا النشاط بعد — اضغط «إضافة خيار إضافي مدفوع» للاختيار من المرجع الموحد.',

  pricingAgeTiersTitle: 'اختيار الفئات العمرية المعتمدة لهذا النشاط (من خصائص السعر):',
  pricingAgeTiersCountLabel: (count) => `${count} فئة محددة للنشاط`,
  pricingAgeTiersHint:
    'اختر الفئات المناسبة لهذا النشاط فقط (مثلاً: «رضيع أقل من 2 سنة» لهذا النشاط أو «رضيع أقل من 3 سنوات» لنشاط آخر) لتظهر للعميل بدقة عند الحفظ.',
  pricingDynamicChipsTitle: 'خيارات التسعير الديناميكية (اختر القواعد المناسبة لنشاطك فقط):',

  cardMediaDefaultVideoTitle: 'فيديو تعريفي للنشاط',
  cardMediaEmptySubImages: 'لا توجد صور فرعية مرفوعة لهذا النشاط بعد',
  cardSpecsHeaderTitle: 'الخصائص والمواصفات الفنية للنشاط',
  cardPricingAgeTiersComment: 'الفئات العمرية المختارة والمحفوظة لهذا النشاط',
  cardLinkedEquipmentTitle: (count) => `المعدات المستخدمة ومواصفات كل معدة (${count})`,
  previewModalTitle: 'معاينة بطاقة النشاط الكاملة'
};

export const TRIP_TERMINOLOGY: EntityTerminologyConfig = {
  kind: 'trip',
  noun: 'رحلة',
  definiteNoun: 'الرحلة',
  pluralNoun: 'رحلات',
  indefiniteTouristNoun: 'رحلة سياحية',
  definitePluralNoun: 'الرحلات',
  englishNoun: 'Trip',
  skuPrefix: 'TRP',
  seoBasePath: 'trips',
  seoSlugPlaceholder: 'trip-slug-url',

  emptyPreviewReturnLabel: 'العودة لسجل الرحلات',
  emptyBadgeLabel: 'بند إنشاء رحلة سياحية',
  emptyHeroTitle: 'ابدأ بإنشاء أول رحلة سياحية لك على منصة ZanoZa',
  emptyHeroDescription:
    'صفحتك فارغة حالياً ولم تقم بإنشاء أي رحلات بعد. أنشئ رحلتك السياحية الآن وحدد مواعيد الانطلاق والأسعار والصور لتظهر فوراً للسياح ووكلاء السفر.',
  emptyPrimaryCta: 'إنشاء رحلة جديدة الآن',
  emptyTemplateButtonPrefix: '+ إنشاء رحلة',
  emptyTemplateCategoryChoiceHint:
    'اضغط على أي تصنيف من الصور الأربعة أدناه لإنشاء الرحلة المناسبة مباشرة بقالب جاهز:',

  hubBreadcrumb: 'إدارة الرحلات · سجل الرحلات المنشأة',
  hubTitle: 'سجل الرحلات التي تم إنشاؤها',
  hubCountBadgeSuffix: 'رحلات',
  hubSubtitleTemplate: (userName, companyName) =>
    `الرحلات السياحية التابعة لحساب ${userName} (${companyName}). يمكنك تعديل، نشر، أو إنشاء المزيد في أي وقت.`,
  hubAddButtonLabel: '+ إنشاء رحلة جديدة',
  hubStatTotalLabel: 'إجمالي الرحلات المنشأة',
  hubStatPublishedLabel: 'رحلات منشورة في المتجر',
  hubStatDraftLabel: 'مسودات قيد الإعداد',
  hubSearchFilterColPlaceholder: 'اختر أو اكتب الرحلة...',
  hubTableColNameHeader: 'الرحلة والصورة',
  hubTableColStatusHeader: 'حالة الرحلة',
  hubDropdownNameTitle: 'تحديد متعدد للرحلة والمعرّف',
  hubDropdownStatusTitle: 'تحديد متعدد لحالة الرحلة',
  hubFallbackCategoryLabel: 'رحلة سياحية',
  hubEditButtonTooltip: 'فتح في محرر الرحلات لتعديل كافة الحقول',
  hubPreviewButtonTooltip: 'معاينة الرحلة',
  hubDeleteButtonTooltip: 'حذف الرحلة',
  hubDeleteSuccessMessage: 'تم حذف الرحلة بنجاح من السجل',
  hubFooterQuestion: 'هل ترغب في توسيع رحلاتك؟',
  hubFooterSubtext: 'أضف رحلات بحرية أو سفاري أو غوص جديدة لجذب المزيد من العملاء.',
  hubFooterCta: '+ إنشاء رحلة سياحية جديدة',

  editorSystemLabel: 'نظام إدارة الرحلات المعتمد منصة ZanoZa',
  editorIdLabel: 'معرف الرحلة',
  editorDefaultNewTitle: 'رحلة سياحية جديدة',
  validationMediaError: 'إضافة صورة واحدة على الأقل للرحلة',
  validationNameError: 'إدخال اسم الرحلة',
  validationDescriptionError: 'إدخال وصف الرحلة',
  validationPriceError: 'تحديد سعر الرحلة (قيمة أكبر من 0)',
  validationStatusError: 'تحديد حالة الرحلة',
  validationAlertHeader: 'لا يمكن حفظ الرحلة قبل استكمال البيانات الإلزامية التالية:',
  saveSuccessAlert: 'تم حفظ الرحلة ومزامنة التعديلات بنجاح في قاعدة بيانات المنصة.',

  nameArPlaceholder: 'اكتب اسم الرحلة بالعربية...',
  nameEnPlaceholder: 'Trip name in English...',
  descArPlaceholder: 'اكتب وصف الرحلة بالعربية...',
  descEnPlaceholder: 'Trip description in English...',
  mediaSectionTitle: 'Media / وسائط وصور الرحلة',
  mediaStorageHint:
    'الحدود مرتبطة بباقة صاحب الرحلة. روابط YouTube لا تستهلك مساحة التخزين في المنصة.',
  youtubeListTitle: 'فيديوهات الرحلة المرفقة من YouTube (0MB استهلاك مساحة):',
  youtubeDefaultTitle: 'فيديو استعراضي للرحلة على YouTube',
  youtubeDuplicateWarning:
    '⚠️ هذا الفيديو أو الرابط مضاف مسبقاً في وسائط الرحلة (ممنوع تكرار الوسائط)',
  categorySubtitle: 'اختر مسار تصنيف الرحلة عبر القائمة الهرمية المنسدلة، أو تصفح المستويات بالتتابع.',
  categorySelectPlaceholder: 'Choose a trip category / اختر تصنيف الرحلة...',
  taxLabelEn: 'Charge tax on this trip',
  taxLabelAr: 'حساب ضريبة القيمة المضافة المعتمدة على هذه الرحلة',
  inventoryDesc: 'تتبع الأماكن الشاغرة وفترات التشغيل ومواعيد المغادرة وكود الرحلة.',
  skuLabel: 'SKU (Stock Keeping Unit / كود الرحلة)',
  skuPlaceholder: 'أدخل كود الرحلة...',
  paymentDeadlineDesc: 'مهلة العميل بعد الموافقة؛ إذا انتهت دون دفع تعود الأماكن الشاغرة فوراً للرحلة.',
  logisticsRequiresTransferLabel: 'هل الرحلة تحتاج إلى نقل؟',
  logisticsOwnerTransferLabel: 'هل النقل متوفر من صاحب الرحلة؟',
  logisticsSeparateFeeLabel: 'تكلفة النقل منفصلة عن سعر الرحلة (ج.م):',
  waypointSightseeingLabel: 'معلم تمر به الرحلة',
  variantsNewModalTitle: 'إضافة باقة أو خيار جديد للرحلة',
  customSpecFallbackGroupTitle: 'المواصفات الفنية للرحلة',
  specsSectionDesc:
    'أضف وعدّل خصائص ومواصفات الرحلة الخاصة بها فقط (مستقلة تماماً عن صفات المعدات)، مع التحكم في إظهار كل خاصية للعميل أو إبقائها داخلية.',
  specsEmptyState:
    'لم تتم إضافة أي مواصفات فنية لهذه الرحلة بعد. اختر مجموعة من المواصفات الفنية المسجلة بالأعلى ثم حدد تفاصيلها يدوياً.',
  inclusionsFreeHeaderPrefix: '✓ المشمول مجاناً في الرحلة',
  notIncludedFallbackText: 'الرحلة شاملة كافة التكاليف المذكورة',
  seoSubtitle: 'معاينة كيفية ظهور هذه الرحلة في نتائج بحث Google وشبكات التواصل.',
  seoDefaultTitle: 'عنوان الرحلة',
  seoHandleLabel: 'URL handle / الرابط الدائم للرحلة',

  statusCardTitle: 'Status / حالة الرحلة *',
  statusSelectPlaceholder: '-- اختر حالة الرحلة * --',
  durationCardTitle: 'Duration / مدة الرحلة',
  publishingSubtitle: 'تحديد منافذ نشر الرحلة للعملاء',
  publishingAvailabilityPrefix: 'الرحلة متاحة في',
  customChannelDefaultDesc: 'قناة نشر مخصصة ومضافة بواسطة صاحب الرحلة',
  channelOwnerStorefrontDesc:
    'نشر الرحلة مباشرة على صفحة المتجر والموقع الإلكتروني الخاص بك لاستقبال الحجوزات المباشرة.',
  channelMarketplaceDesc:
    'عرض الرحلة في سوق الرحلات العام بالمنصة للشركات السياحية والوكلاء وجميع الزوار.',
  channelMobileAppDesc: 'إتاحة الرحلة داخل تطبيق الهاتف الجوال للنزلاء في الفنادق والسياح.',
  channelB2bDesc: 'إتاحة الرحلة لشركات السياحة والفنادق الشريكة بأسعار الجملة والعقود السنوية.',
  organizationCardTitle: 'Product Organization / تنظيم الرحلة',
  ownerFallbackLabel: 'صاحب الرحلة',
  ownerAddButtonLabel: '+ إضافة مالك آخر جديد للرحلة',
  ownerAssignSaveLabel: 'حفظ وإسناد الرحلة له',
  ownerAssignSuccessMessage: (ownerName) =>
    `✓ تمت إضافة المالك "${ownerName}" وإسناد الرحلة له بنجاح في قاعدة البيانات`,
  collectionsOwnerEmptyMessage:
    'لا توجد مجموعات مضافة من قِبل صاحب الرحلة بعد. أضف مجموعات من قسم «إضافة مجموعات» أو اكتب اسم المجموعة هنا واضغط Enter.',
  collectionsRemoveTooltip: 'إزالة المجموعة من الرحلة',
  collectionsAddChipPrefix: 'إضافة واختيار المجموعة لصاحب الرحلة:',
  collectionsAddSuccessMessage: (colName, ownerName) =>
    `✓ تمت إضافة المجموعة "${colName}" لحساب ${ownerName} وتعيينها للرحلة`,
  themeDefaultOptionLabel: 'Default trip template (قالب الرحلة الافتراضي)',
  themeHelperText: 'يحدد طريقة تنسيق وعرض بطاقة الرحلة في واجهة المتجر وتطبيق الهواتف الذكية.',

  modalAddStatusTitle: 'إضافة حالة رحلة جديدة',
  modalAddOwnerTitle: 'إضافة صاحب رحلة جديد للمنظومة',
  modalAddOwnerSuccessMessage: (ownerName) =>
    `✓ تمت إضافة المالك "${ownerName}" وإسناد الرحلة له`,
  modalAddCategoryTitle: 'إضافة تصنيف جديد في شجرة الرحلات',
  modalAddCategoryHelperText:
    'سيتم حفظ هذا التصنيف داخل القوائم المنسدلة وشجرة التصنيفات المركزية ليتاح استخدامه فوراً في هذه الرحلة وفي الرحلات اللاحقة.',

  equipmentSectionTitle: 'المعدات المستخدمة في الرحلة',
  equipmentUnlinkSuccess: (eqName) =>
    `تم فك ارتباط المعدة "${eqName}" بالرحلة (ملف المعدة الأصلي محفوظ)`,
  equipmentLinkSuccess: (eqName, eqId) =>
    `✓ تم ربط المعدة "${eqName}" (${eqId}) بالرحلة دون نسخ بياناتها`,
  equipmentShowToClientSuccess: '✓ تم تفعيل عرض المعدات ومواصفاتها العامة للعميل في هذه الرحلة',
  equipmentHideFromClientSuccess: 'تم إخفاء تفاصيل المعدات عن واجهة العميل لهذه الرحلة',
  equipmentOtherUsageText: (count) => `مستخدمة أيضاً في ${count} رحلات أخرى`,

  paidAddonsEnterPriceHint: 'أدخل السعر الخاص برحلتك فقط',
  paidAddonsEmptyText:
    'لا توجد إضافات اختيارية مدفوعة مضافة لهذه الرحلة بعد — اضغط «إضافة خيار إضافي مدفوع» للاختيار من المرجع الموحد.',

  pricingAgeTiersTitle: 'اختيار الفئات العمرية المعتمدة لهذه الرحلة (من خصائص السعر):',
  pricingAgeTiersCountLabel: (count) => `${count} فئة محددة للرحلة`,
  pricingAgeTiersHint:
    'اختر الفئات المناسبة لهذه الرحلة فقط (مثلاً: «رضيع أقل من 2 سنة» لهذه الرحلة أو «رضيع أقل من 3 سنوات» لرحلة أخرى) لتظهر للعميل بدقة عند الحفظ.',
  pricingDynamicChipsTitle: 'خيارات التسعير الديناميكية (اختر القواعد المناسبة لرحلتك فقط):',

  cardMediaDefaultVideoTitle: 'فيديو تعريفي للرحلة',
  cardMediaEmptySubImages: 'لا توجد صور فرعية مرفوعة لهذه الرحلة بعد',
  cardSpecsHeaderTitle: 'الخصائص والمواصفات الفنية للرحلة',
  cardPricingAgeTiersComment: 'الفئات العمرية المختارة والمحفوظة لهذه الرحلة',
  cardLinkedEquipmentTitle: (count) => `المعدات المستخدمة ومواصفات كل معدة (${count})`,
  previewModalTitle: 'معاينة بطاقة الرحلة الكاملة'
};
