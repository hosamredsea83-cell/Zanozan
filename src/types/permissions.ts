export type FixedRoleGroupId =
  | 'super_admin'
  | 'admin'
  | 'subscriber'
  | 'employee'
  | 'driver'
  | 'tour_guide'
  | 'delegate'
  | 'customer';

export type SubscriptionTypeId =
  | 'gold_vip'
  | 'silver_pro'
  | 'enterprise_fleet'
  | 'basic_partner'
  | 'driver_field'
  | 'guide_field'
  | 'delegate_sales'
  | 'employee_seat'
  | 'customer_free';

export const SUBSCRIPTION_TYPE_LABELS: Record<SubscriptionTypeId, string> = {
  gold_vip: 'الباقة الذهبية VIP',
  silver_pro: 'باقة المحترفين الفضية',
  enterprise_fleet: 'باقة الشركات والأساطيل',
  basic_partner: 'الباقة الأساسية للشركاء',
  driver_field: 'اشتراك سائق نقل سياحي',
  guide_field: 'اشتراك مرشد / مرافق سياحي',
  delegate_sales: 'اشتراك مندوب مبيعات وعمولات',
  employee_seat: 'اشتراك موظف تشغيل',
  customer_free: 'حساب عميل / سائح'
};

export interface FixedPermissionOption {
  id: string;
  label: string;
  description: string;
}

export const FIXED_VISIBILITY_OPTIONS: FixedPermissionOption[] = [
  { id: 'view_dashboard', label: 'لوحة التحكم والإحصائيات', description: 'مشاهدة مؤشرات الأداء والإيرادات العامة' },
  { id: 'view_customer_store', label: 'بوابة العميل والمتجر', description: 'تصفح الأنشطة المنشورة والحجز المباشر' },
  { id: 'view_unified_ref', label: 'المرجع الموحد', description: 'الوصول إلى بيانات الفئات والمواصفات والبلاد' },
  { id: 'view_profiles', label: 'الملفات الشخصية والموردين', description: 'عرض جهات الاتصال وكشوف الحساب' },
  { id: 'view_activities', label: 'إدارة الأنشطة', description: 'مشاهدة الأنشطة والباقات والعروض والأسعار' },
  { id: 'view_equipments', label: 'إدارة المعدات والإشغال', description: 'رؤية المعدات وتقويم الصيانة والإشغال' },
  { id: 'view_logistics', label: 'إدارة اللوجستيات والسائق', description: 'رؤية المركبات والتحركات وتطبيق السائق' },
  { id: 'view_finance', label: 'المعاملات المالية والتكلفة', description: 'رؤية المحافظ والتحصيل والتكاليف' },
  { id: 'view_trips', label: 'إدارة الرحلات', description: 'رؤية الرحلات المجمعة والمقارنات والمواعيد' },
  { id: 'view_bookings', label: 'إدارة الحجوزات', description: 'رؤية حجوزات الأنشطة والرحلات وطلبات التنفيذ' },
  { id: 'view_governance', label: 'الاعتماد والتقارير والسجلات', description: 'رؤية تقارير الأرباح وسجل الرقابة والمظهر' },
  { id: 'view_user_management', label: 'إدارة المستخدمين والصلاحيات', description: 'الوصول إلى جدول المستخدمين ومصفوفة الصلاحيات' }
];

export const FIXED_ACTION_OPTIONS: FixedPermissionOption[] = [
  { id: 'act_create', label: 'إضافة وإنشاء', description: 'إنشاء أنشطة أو رحلات أو معدات أو حجوزات جديدة' },
  { id: 'act_edit', label: 'تعديل وتحديث', description: 'تعديل البيانات والحالات والجدول الزمني' },
  { id: 'act_delete', label: 'حذف وإزالة', description: 'حذف السجلات أو إلغاء الحجوزات' },
  { id: 'act_approve', label: 'اعتماد ورفض', description: 'اعتماد نشر الأنشطة وقبول الحجوزات والتسويات' },
  { id: 'act_finance_collect', label: 'تحصيل مالي وفواتير', description: 'إجراء التحصيل النقدي وتسجيل طلبات نهاية اليوم' },
  { id: 'act_pricing_edit', label: 'إدارة التسعير والخصومات', description: 'تعديل الأسعار والعروض ورسوم الخدمة' },
  { id: 'act_manage_users', label: 'إدارة المستخدمين والأدوار', description: 'تغيير أدوار المستخدمين وتخصيص صلاحياتهم' },
  { id: 'act_export_print', label: 'طباعة ومشاركة التذاكر', description: 'طباعة الفواتير وتذاكر الحجز ومشاركتها' }
];

export interface FixedRoleTemplate {
  id: FixedRoleGroupId;
  label: string;
  summary: string;
  defaultSubscription: SubscriptionTypeId;
  viewPermissions: string[];
  actionPermissions: string[];
}

export const DEFAULT_FIXED_ROLE_TEMPLATES: Record<FixedRoleGroupId, FixedRoleTemplate> = {
  super_admin: {
    id: 'super_admin',
    label: 'سوبر أدمن',
    summary: 'تحكم مطلق في جميع أقسام المنصة، المستخدمين، الماليات، والاعتماد.',
    defaultSubscription: 'gold_vip',
    viewPermissions: FIXED_VISIBILITY_OPTIONS.map((o) => o.id),
    actionPermissions: FIXED_ACTION_OPTIONS.map((o) => o.id)
  },
  admin: {
    id: 'admin',
    label: 'أدمن',
    summary: 'إدارة العمليات اليومية والأنشطة والاعتمادات والتقارير.',
    defaultSubscription: 'gold_vip',
    viewPermissions: [
      'view_dashboard',
      'view_customer_store',
      'view_unified_ref',
      'view_profiles',
      'view_activities',
      'view_equipments',
      'view_logistics',
      'view_finance',
      'view_trips',
      'view_bookings',
      'view_governance',
      'view_user_management'
    ],
    actionPermissions: [
      'act_create',
      'act_edit',
      'act_approve',
      'act_finance_collect',
      'act_pricing_edit',
      'act_export_print'
    ]
  },
  subscriber: {
    id: 'subscriber',
    label: 'مشترك',
    summary: 'صاحب نشاط أو شركة سياحية يدير أنشطته ورحلاته ومعداته وحجوزاته.',
    defaultSubscription: 'silver_pro',
    viewPermissions: [
      'view_dashboard',
      'view_customer_store',
      'view_unified_ref',
      'view_profiles',
      'view_activities',
      'view_equipments',
      'view_logistics',
      'view_finance',
      'view_trips',
      'view_bookings'
    ],
    actionPermissions: [
      'act_create',
      'act_edit',
      'act_delete',
      'act_finance_collect',
      'act_pricing_edit',
      'act_export_print'
    ]
  },
  employee: {
    id: 'employee',
    label: 'موظف',
    summary: 'موظف حجز وتشغيل يتابع الحجوزات وطلبات أثناء الرحلة والتحصيل.',
    defaultSubscription: 'employee_seat',
    viewPermissions: [
      'view_dashboard',
      'view_customer_store',
      'view_activities',
      'view_trips',
      'view_bookings',
      'view_finance',
      'view_equipments'
    ],
    actionPermissions: ['act_create', 'act_edit', 'act_finance_collect', 'act_export_print']
  },
  driver: {
    id: 'driver',
    label: 'سائق',
    summary: 'سائق نقل سياحي يرى مهام التوصيل، مستحقاته المالية، والتحصيل الميداني.',
    defaultSubscription: 'driver_field',
    viewPermissions: ['view_logistics', 'view_bookings', 'view_finance', 'view_profiles', 'view_customer_store'],
    actionPermissions: ['act_edit', 'act_finance_collect']
  },
  tour_guide: {
    id: 'tour_guide',
    label: 'مرشد سياحي',
    summary: 'مرشد ومرافق للأنشطة يرى الحجوزات، مواعيد الانطلاق، وطلبات أثناء الرحلة ومستحقاته.',
    defaultSubscription: 'guide_field',
    viewPermissions: ['view_bookings', 'view_trips', 'view_finance', 'view_profiles', 'view_customer_store'],
    actionPermissions: ['act_edit', 'act_finance_collect']
  },
  delegate: {
    id: 'delegate',
    label: 'مندوب مبيعات',
    summary: 'مندوب حجز ومبيعات يسجّل حجوزات العملاء، يحصّل العربون، ويتابع عمولاته.',
    defaultSubscription: 'delegate_sales',
    viewPermissions: ['view_activities', 'view_bookings', 'view_finance', 'view_profiles', 'view_customer_store'],
    actionPermissions: ['act_create', 'act_finance_collect', 'act_export_print']
  },
  customer: {
    id: 'customer',
    label: 'عميل',
    summary: 'عميل / سائح يتصفح المتجر ويحجز الأنشطة ويتابع تذاكره وتقييماته.',
    defaultSubscription: 'customer_free',
    viewPermissions: ['view_customer_store'],
    actionPermissions: ['act_create', 'act_export_print']
  }
};

export interface DynamicPermissionItem {
  id: string;
  label: string;
  navKey?: string;
  actionKind: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'operate';
}

export interface DynamicDepartmentGroup {
  id: string;
  title: string;
  viewGroupId: string;
  items: DynamicPermissionItem[];
}

export const DYNAMIC_DEPARTMENTS: DynamicDepartmentGroup[] = [
  {
    id: 'dept_core',
    title: 'الرئيسية والمرجع العام',
    viewGroupId: 'view_dashboard',
    items: [
      { id: 'dyn_dashboard_view', label: 'عرض لوحة التحكم العامة', navKey: 'dashboard', actionKind: 'view' },
      { id: 'dyn_favorites_manage', label: 'المفضلة وقوائم الاختيار', navKey: 'activity_favorites', actionKind: 'operate' },
      { id: 'dyn_storefront_view', label: 'بوابة العميل والمتجر', navKey: 'customer_storefront', actionKind: 'view' },
      { id: 'dyn_pricing_tool', label: 'أداة التسعير والضرائب', navKey: 'pricing_tool', actionKind: 'edit' },
      { id: 'dyn_unified_ref_view', label: 'عرض المرجع الموحد', navKey: 'unified_reference', actionKind: 'view' },
      { id: 'dyn_unified_ref_edit', label: 'إضافة وتعديل المرجع الموحد', navKey: 'unified_reference', actionKind: 'edit' },
      { id: 'dyn_profiles_manage', label: 'الملفات الشخصية والموردين', navKey: 'person_profiles', actionKind: 'operate' }
    ]
  },
  {
    id: 'dept_activities',
    title: 'إدارة الأنشطة',
    viewGroupId: 'view_activities',
    items: [
      { id: 'dyn_act_view', label: 'عرض سجل الأنشطة', navKey: 'activity_manage', actionKind: 'view' },
      { id: 'dyn_act_create', label: 'إضافة نشاط', navKey: 'activity_add', actionKind: 'create' },
      { id: 'dyn_act_edit', label: 'تعديل نشاط', navKey: 'activity_manage', actionKind: 'edit' },
      { id: 'dyn_act_delete', label: 'حذف نشاط', navKey: 'activity_manage', actionKind: 'delete' },
      { id: 'dyn_act_collections', label: 'إضافة مجموعات وباقات', navKey: 'activity_collections', actionKind: 'create' },
      { id: 'dyn_act_marketplace', label: 'متجر الأنشطة (السوق)', navKey: 'activity_marketplace', actionKind: 'view' },
      { id: 'dyn_act_offers', label: 'إدارة العروض الموسمية', navKey: 'activity_offers', actionKind: 'edit' },
      { id: 'dyn_act_discounts', label: 'التخفيضات والأسعار', navKey: 'activity_discounts', actionKind: 'edit' },
      { id: 'dyn_act_pricing_props', label: 'خصائص السعر', navKey: 'activity_pricing_properties', actionKind: 'edit' }
    ]
  },
  {
    id: 'dept_equipment',
    title: 'إدارة المعدات',
    viewGroupId: 'view_equipments',
    items: [
      { id: 'dyn_eq_view', label: 'عرض سجل المعدات', navKey: 'activity_equipment', actionKind: 'view' },
      { id: 'dyn_eq_create', label: 'إضافة معدة', navKey: 'activity_equipment_add', actionKind: 'create' },
      { id: 'dyn_eq_edit', label: 'تعديل وإدارة المعدات', navKey: 'activity_equipment_manage', actionKind: 'edit' },
      { id: 'dyn_eq_delete', label: 'حذف معدة', navKey: 'activity_equipment_manage', actionKind: 'delete' },
      { id: 'dyn_eq_occupancy', label: 'تقويم الإشغال والصيانة', navKey: 'equipment_occupancy', actionKind: 'view' },
      { id: 'dyn_eq_maint_block', label: 'جدولة صيانة وإيقاف تشغيل', navKey: 'equipment_occupancy', actionKind: 'operate' }
    ]
  },
  {
    id: 'dept_logistics',
    title: 'إدارة اللوجستيات والسائقين',
    viewGroupId: 'view_logistics',
    items: [
      { id: 'dyn_log_view', label: 'عرض سجل وسائل النقل', navKey: 'logistics_manage', actionKind: 'view' },
      { id: 'dyn_log_create', label: 'إضافة وسيلة نقل', navKey: 'logistics_add', actionKind: 'create' },
      { id: 'dyn_log_edit', label: 'تعديل وحذف وسيلة نقل', navKey: 'logistics_manage', actionKind: 'edit' },
      { id: 'dyn_log_transfers', label: 'تحركات ونقل الأنشطة', navKey: 'logistics_transfers', actionKind: 'operate' },
      { id: 'dyn_drv_portal', label: 'تطبيق السائق الميداني', navKey: 'driver_portal', actionKind: 'view' },
      { id: 'dyn_drv_status', label: 'تحديث حالة التوصيل الميداني', navKey: 'driver_portal', actionKind: 'operate' }
    ]
  },
  {
    id: 'dept_finance',
    title: 'المعاملات المالية والتكلفة',
    viewGroupId: 'view_finance',
    items: [
      { id: 'dyn_fin_partner_earnings', label: 'مستحقاتي وأرباحي المالية', navKey: 'partner_earnings', actionKind: 'view' },
      { id: 'dyn_fin_wallets', label: 'المحفظة والتوريد QR', navKey: 'finance_wallets', actionKind: 'view' },
      { id: 'dyn_fin_cashier', label: 'التحصيل اليدوي والتسويات', navKey: 'finance_cashier', actionKind: 'operate' },
      { id: 'dyn_fin_approve', label: 'اعتماد التحويلات والتسويات', navKey: 'finance_cashier', actionKind: 'approve' },
      { id: 'dyn_fin_op_costs', label: 'التكلفة التشغيلية', navKey: 'operational_costs', actionKind: 'edit' }
    ]
  },
  {
    id: 'dept_trips',
    title: 'إدارة الرحلات',
    viewGroupId: 'view_trips',
    items: [
      { id: 'dyn_trip_create', label: 'إنشاء رحلة', navKey: 'trip_add', actionKind: 'create' },
      { id: 'dyn_trip_edit', label: 'تعديل وحذف رحلة', navKey: 'trip_add', actionKind: 'edit' },
      { id: 'dyn_trip_compare', label: 'اختيار نشاط (مقارنة)', navKey: 'compare_activities', actionKind: 'view' },
      { id: 'dyn_trip_combo', label: 'الرحلات المجمعة (Combo)', navKey: 'trips_combo', actionKind: 'create' },
      { id: 'dyn_trip_schedule', label: 'جدول مواعيد الانطلاق', navKey: 'trips_schedule', actionKind: 'edit' }
    ]
  },
  {
    id: 'dept_bookings',
    title: 'إدارة الحجوزات',
    viewGroupId: 'view_bookings',
    items: [
      { id: 'dyn_bk_act_view', label: 'عرض حجوزات الأنشطة', navKey: 'bookings_activities', actionKind: 'view' },
      { id: 'dyn_bk_act_approve', label: 'اعتماد ورفض الحجوزات', navKey: 'bookings_activities', actionKind: 'approve' },
      { id: 'dyn_bk_trip_view', label: 'عرض وإدارة حجوزات الرحلات', navKey: 'bookings_trips', actionKind: 'operate' },
      { id: 'dyn_bk_create', label: 'تسجيل حجز جديد', navKey: 'bookings_activities', actionKind: 'create' },
      { id: 'dyn_bk_in_trip', label: 'طلبات أثناء الرحلة / النشاط', navKey: 'bookings_in_trip_requests', actionKind: 'operate' },
      { id: 'dyn_bk_print', label: 'طباعة تذاكر وفواتير نهاية اليوم', navKey: 'bookings_in_trip_requests', actionKind: 'operate' }
    ]
  },
  {
    id: 'dept_governance',
    title: 'الاعتماد والتقارير وإدارة المستخدمين',
    viewGroupId: 'view_governance',
    items: [
      { id: 'dyn_gov_approvals', label: 'الأداء واعتماد النشر', navKey: 'performance_approvals', actionKind: 'approve' },
      { id: 'dyn_gov_reports', label: 'التقارير المالية والتشغيلية', navKey: 'reports', actionKind: 'view' },
      { id: 'dyn_gov_audit', label: 'إدارة السجلات بالمنصة', navKey: 'platform_audit_logs', actionKind: 'view' },
      { id: 'dyn_gov_users_view', label: 'عرض إدارة المستخدمين', navKey: 'user_management', actionKind: 'view' },
      { id: 'dyn_gov_users_edit', label: 'تعديل المستخدمين والصلاحيات', navKey: 'user_management', actionKind: 'edit' },
      { id: 'dyn_gov_themes', label: 'القوالب والألوان والخطوط', navKey: 'owner_theme_studio', actionKind: 'edit' }
    ]
  }
];

export const ALL_DYNAMIC_PERMISSION_IDS: string[] = DYNAMIC_DEPARTMENTS.flatMap((d) =>
  d.items.map((it) => it.id)
);

export function deriveDynamicIdsFromFixedTemplate(tpl: FixedRoleTemplate): string[] {
  const views = new Set(tpl.viewPermissions);
  const actions = new Set(tpl.actionPermissions);

  const selected: string[] = [];
  for (const dept of DYNAMIC_DEPARTMENTS) {
    const canViewDept =
      dept.id === 'dept_governance'
        ? views.has('view_governance') || views.has('view_user_management')
        : dept.id === 'dept_core'
          ? views.has('view_dashboard') ||
            views.has('view_customer_store') ||
            views.has('view_unified_ref') ||
            views.has('view_profiles')
          : views.has(dept.viewGroupId);

    if (!canViewDept) continue;

    for (const item of dept.items) {
      if (item.navKey === 'customer_storefront' && !views.has('view_customer_store')) continue;
      if (item.navKey === 'unified_reference' && !views.has('view_unified_ref')) continue;
      if (item.navKey === 'person_profiles' && !views.has('view_profiles')) continue;
      if (item.navKey === 'user_management' && !views.has('view_user_management')) continue;
      if (item.navKey === 'pricing_tool' && !actions.has('act_pricing_edit') && tpl.id !== 'super_admin') continue;

      if (item.actionKind === 'view') {
        selected.push(item.id);
      } else if (item.actionKind === 'create' && actions.has('act_create')) {
        selected.push(item.id);
      } else if (item.actionKind === 'edit' && actions.has('act_edit')) {
        selected.push(item.id);
      } else if (item.actionKind === 'delete' && actions.has('act_delete')) {
        selected.push(item.id);
      } else if (item.actionKind === 'approve' && actions.has('act_approve')) {
        selected.push(item.id);
      } else if (
        item.actionKind === 'operate' &&
        (actions.has('act_edit') || actions.has('act_finance_collect') || actions.has('act_create'))
      ) {
        selected.push(item.id);
      }
    }
  }
  return Array.from(new Set(selected));
}

export interface ManagedUserPermissionRecord {
  userId: string;
  personNumber: string;
  personName: string;
  phone: string;
  email?: string;
  companyName: string;
  nationality?: string;
  customerScope?: 'platform' | 'company';
  registeredCompanyId?: string;
  registeredCompanyName?: string;
  registrationSource?: 'platform_signup' | 'company_page' | 'booking_clerk';
  fixedRole: FixedRoleGroupId;
  subscriptionType: SubscriptionTypeId;
  permissionMode: 'fixed_group' | 'dynamic_custom' | 'combined';
  customViewPermissions: string[];
  customActionPermissions: string[];
  dynamicPermissions: string[];
  isActive: boolean;
  updatedAt: string;
}

export interface UserPermissionsStoreState {
  fixedTemplates: Record<FixedRoleGroupId, FixedRoleTemplate>;
  managedUsers: ManagedUserPermissionRecord[];
}

export function computeEffectiveNavKeysForRecord(
  record: ManagedUserPermissionRecord,
  fixedTemplates: Record<FixedRoleGroupId, FixedRoleTemplate>
): Set<string> {
  const tpl = fixedTemplates[record.fixedRole] || DEFAULT_FIXED_ROLE_TEMPLATES.subscriber;
  if (record.fixedRole === 'super_admin' && record.permissionMode !== 'dynamic_custom') {
    const allNav = new Set<string>();
    DYNAMIC_DEPARTMENTS.forEach((d) =>
      d.items.forEach((it) => {
        if (it.navKey) allNav.add(it.navKey);
      })
    );
    return allNav;
  }

  const allowedDynamicIds = new Set<string>();
  if (record.permissionMode === 'fixed_group') {
    deriveDynamicIdsFromFixedTemplate({
      ...tpl,
      viewPermissions:
        record.customViewPermissions.length > 0 ? record.customViewPermissions : tpl.viewPermissions,
      actionPermissions:
        record.customActionPermissions.length > 0 ? record.customActionPermissions : tpl.actionPermissions
    }).forEach((id) => allowedDynamicIds.add(id));
  } else if (record.permissionMode === 'dynamic_custom') {
    record.dynamicPermissions.forEach((id) => allowedDynamicIds.add(id));
  } else {
    deriveDynamicIdsFromFixedTemplate(tpl).forEach((id) => allowedDynamicIds.add(id));
    record.dynamicPermissions.forEach((id) => allowedDynamicIds.add(id));
  }

  const navSet = new Set<string>();
  for (const dept of DYNAMIC_DEPARTMENTS) {
    for (const item of dept.items) {
      if (item.navKey && allowedDynamicIds.has(item.id)) {
        navSet.add(item.navKey);
      }
    }
  }
  return navSet;
}
