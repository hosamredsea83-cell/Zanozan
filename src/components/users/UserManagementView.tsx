import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  Download,
  Edit3,
  Eye,
  KeyRound,
  Layers,
  Lock,
  PlusCircle,
  RefreshCw,
  Search,
  Shield,
  Sliders,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import type { AppUser } from '../../types/auth';
import {
  ALL_DYNAMIC_PERMISSION_IDS,
  DEFAULT_FIXED_ROLE_TEMPLATES,
  DYNAMIC_DEPARTMENTS,
  FIXED_ACTION_OPTIONS,
  FIXED_VISIBILITY_OPTIONS,
  FixedRoleGroupId,
  FixedRoleTemplate,
  ManagedUserPermissionRecord,
  SUBSCRIPTION_TYPE_LABELS,
  SubscriptionTypeId,
  computeEffectiveNavKeysForRecord,
  deriveDynamicIdsFromFixedTemplate
} from '../../types/permissions';
import type { CreateManagedUserInput } from '../../hooks/useUserPermissionsStore';
import {
  CUSTOMER_NATIONALITY_OPTIONS,
  isEgyptianNationality
} from '../../utils/customerEligibility';

interface UserManagementViewProps {
  currentUser: AppUser;
  fixedTemplates: Record<FixedRoleGroupId, FixedRoleTemplate>;
  managedUsers: ManagedUserPermissionRecord[];
  onAddUser: (input: CreateManagedUserInput) => ManagedUserPermissionRecord;
  onUpdateUser: (
    userId: string,
    patch: Partial<ManagedUserPermissionRecord>,
    auditSummary?: string
  ) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateFixedTemplate: (roleId: FixedRoleGroupId, patch: Partial<FixedRoleTemplate>) => void;
  onApplyFixedTemplateToUser: (userId: string, roleId: FixedRoleGroupId) => void;
  onSwitchToUser?: (userId: string) => void;
}

const FIXED_ROLE_ORDER: FixedRoleGroupId[] = [
  'super_admin',
  'admin',
  'subscriber',
  'employee',
  'driver',
  'tour_guide',
  'delegate',
  'customer'
];

const PERMISSION_MODE_LABELS: Record<
  ManagedUserPermissionRecord['permissionMode'],
  { label: string; hint: string }
> = {
  fixed_group: {
    label: 'المجموعة الثابتة',
    hint: 'يعتمد على صلاحيات الدور الثابت (ما يراه + ما يفعله)'
  },
  dynamic_custom: {
    label: 'المجموعة الديناميكية',
    hint: 'يعتمد بدقة على شجرة الإدارات وبنودها المحددة أدناه'
  },
  combined: {
    label: 'دمج (ثابتة + ديناميكية)',
    hint: 'يجمع صلاحيات المجموعة الثابتة مع الإضافات الديناميكية المخصصة'
  }
};

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  fixedTemplates,
  managedUsers,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onUpdateFixedTemplate,
  onApplyFixedTemplateToUser,
  onSwitchToUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | FixedRoleGroupId>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | SubscriptionTypeId>('all');

  // Selected user in the Dual Permissions Workspace
  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    return managedUsers[0]?.userId || 'user-ahmed';
  });

  // Active group tab in permissions workspace ('fixed' | 'dynamic')
  const [activePermissionGroupTab, setActivePermissionGroupTab] = useState<'fixed' | 'dynamic'>(
    'fixed'
  );

  // Within Fixed Groups tab: whether admin edits the Global Role Template or Selected User's fixed view/action overrides
  const [fixedTargetMode, setFixedTargetMode] = useState<'user_scope' | 'role_template'>(
    'user_scope'
  );
  const [editingTemplateRoleId, setEditingTemplateRoleId] =
    useState<FixedRoleGroupId>('subscriber');

  // Add / Edit User Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formPersonNumber, setFormPersonNumber] = useState('');
  const [formPersonName, setFormPersonName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formFixedRole, setFormFixedRole] = useState<FixedRoleGroupId>('subscriber');
  const [formSubscriptionType, setFormSubscriptionType] =
    useState<SubscriptionTypeId>('silver_pro');
  const [formPermissionMode, setFormPermissionMode] =
    useState<ManagedUserPermissionRecord['permissionMode']>('fixed_group');
  const [formNationality, setFormNationality] = useState<string>('مصر');
  const [formCustomerScope, setFormCustomerScope] = useState<'platform' | 'company'>('platform');
  const [formRegisteredCompanyId, setFormRegisteredCompanyId] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Confirm delete inline state
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  const availableCompanies = useMemo(() => {
    const map = new Map<string, { id: string; companyName: string; ownerName: string }>();
    managedUsers.forEach((u) => {
      if (
        (u.fixedRole === 'subscriber' || u.fixedRole === 'super_admin' || u.fixedRole === 'admin') &&
        u.companyName
      ) {
        map.set(u.userId, {
          id: u.userId,
          companyName: u.companyName,
          ownerName: u.personName
        });
      }
    });
    return Array.from(map.values());
  }, [managedUsers]);

  const selectedUserRecord = useMemo(() => {
    return managedUsers.find((u) => u.userId === selectedUserId) || managedUsers[0];
  }, [managedUsers, selectedUserId]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return managedUsers.filter((u) => {
      if (roleFilter !== 'all' && u.fixedRole !== roleFilter) return false;
      if (subscriptionFilter !== 'all' && u.subscriptionType !== subscriptionFilter) return false;
      if (!q) return true;
      return (
        u.personNumber.toLowerCase().includes(q) ||
        u.personName.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.companyName.toLowerCase().includes(q)
      );
    });
  }, [managedUsers, roleFilter, searchQuery, subscriptionFilter]);

  const roleCounts = useMemo(() => {
    const map: Record<FixedRoleGroupId, number> = {
      super_admin: 0,
      admin: 0,
      subscriber: 0,
      employee: 0,
      driver: 0,
      tour_guide: 0,
      delegate: 0,
      customer: 0
    };
    managedUsers.forEach((u) => {
      map[u.fixedRole] = (map[u.fixedRole] || 0) + 1;
    });
    return map;
  }, [managedUsers]);

  const activeUsersCount = useMemo(
    () => managedUsers.filter((u) => u.isActive).length,
    [managedUsers]
  );

  const openCreateUserModal = () => {
    const nextNum = 1001 + managedUsers.length;
    setEditingUserId(null);
    setFormPersonNumber(`USR-${nextNum}`);
    setFormPersonName('');
    setFormPhone('');
    setFormEmail('');
    setFormCompanyName('');
    setFormFixedRole('subscriber');
    setFormSubscriptionType('silver_pro');
    setFormPermissionMode('fixed_group');
    setFormNationality('مصر');
    setFormCustomerScope('platform');
    setFormRegisteredCompanyId(availableCompanies[0]?.id || '');
    setFormError(null);
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (record: ManagedUserPermissionRecord) => {
    setEditingUserId(record.userId);
    setFormPersonNumber(record.personNumber);
    setFormPersonName(record.personName);
    setFormPhone(record.phone);
    setFormEmail(record.email || '');
    setFormCompanyName(record.companyName);
    setFormFixedRole(record.fixedRole);
    setFormSubscriptionType(record.subscriptionType);
    setFormPermissionMode(record.permissionMode);
    setFormNationality(record.nationality || 'مصر');
    setFormCustomerScope(record.customerScope || 'platform');
    setFormRegisteredCompanyId(record.registeredCompanyId || availableCompanies[0]?.id || '');
    setFormError(null);
    setIsUserModalOpen(true);
  };

  const handleSaveUserModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPersonName.trim()) {
      setFormError('يرجى إدخال اسم الشخص.');
      return;
    }
    if (!formPersonNumber.trim()) {
      setFormError('يرجى إدخال رقم الشخص.');
      return;
    }

    const linkedCompany =
      availableCompanies.find((c) => c.id === formRegisteredCompanyId) || availableCompanies[0];
    const customerFields =
      formFixedRole === 'customer'
        ? {
            nationality: formNationality.trim() || 'مصر',
            customerScope: formCustomerScope,
            registeredCompanyId: formCustomerScope === 'company' ? linkedCompany?.id : undefined,
            registeredCompanyName:
              formCustomerScope === 'company'
                ? linkedCompany?.companyName || formCompanyName.trim()
                : undefined,
            registrationSource:
              formCustomerScope === 'company'
                ? ('company_page' as const)
                : ('platform_signup' as const)
          }
        : {};

    if (editingUserId) {
      const prevRecord = managedUsers.find((u) => u.userId === editingUserId);
      const roleChanged = prevRecord && prevRecord.fixedRole !== formFixedRole;
      const tpl = fixedTemplates[formFixedRole];
      onUpdateUser(
        editingUserId,
        {
          personNumber: formPersonNumber.trim(),
          personName: formPersonName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          companyName:
            formFixedRole === 'customer' && formCustomerScope === 'company'
              ? linkedCompany?.companyName || formCompanyName.trim() || 'عميل شركة'
              : formCompanyName.trim() || 'حساب مشترك بالمنصة',
          fixedRole: formFixedRole,
          subscriptionType: formSubscriptionType,
          permissionMode: formPermissionMode,
          ...customerFields,
          ...(roleChanged
            ? {
                customViewPermissions: [...tpl.viewPermissions],
                customActionPermissions: [...tpl.actionPermissions],
                dynamicPermissions: deriveDynamicIdsFromFixedTemplate(tpl)
              }
            : {})
        },
        `حدّث ${currentUser.name} بيانات المستخدم «${formPersonName.trim()}» (${formPersonNumber.trim()})`
      );
      setSelectedUserId(editingUserId);
    } else {
      const created = onAddUser({
        personNumber: formPersonNumber.trim(),
        personName: formPersonName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        companyName:
          formFixedRole === 'customer' && formCustomerScope === 'company'
            ? linkedCompany?.companyName || formCompanyName.trim() || 'عميل شركة'
            : formCompanyName.trim() || 'حساب مشترك بالمنصة',
        fixedRole: formFixedRole,
        subscriptionType: formSubscriptionType,
        permissionMode: formPermissionMode,
        ...customerFields
      });
      setSelectedUserId(created.userId);
    }
    setIsUserModalOpen(false);
  };

  // Fixed Permissions helpers (works for either Selected User OR Role Template)
  const activeFixedTemplate =
    fixedTemplates[editingTemplateRoleId] || DEFAULT_FIXED_ROLE_TEMPLATES[editingTemplateRoleId];

  const currentFixedViews: string[] =
    fixedTargetMode === 'role_template'
      ? activeFixedTemplate.viewPermissions
      : selectedUserRecord?.customViewPermissions || [];

  const currentFixedActions: string[] =
    fixedTargetMode === 'role_template'
      ? activeFixedTemplate.actionPermissions
      : selectedUserRecord?.customActionPermissions || [];

  const handleToggleFixedView = (viewId: string) => {
    const exists = currentFixedViews.includes(viewId);
    const nextViews = exists
      ? currentFixedViews.filter((id) => id !== viewId)
      : [...currentFixedViews, viewId];

    if (fixedTargetMode === 'role_template') {
      onUpdateFixedTemplate(editingTemplateRoleId, { viewPermissions: nextViews });
    } else if (selectedUserRecord) {
      onUpdateUser(
        selectedUserRecord.userId,
        { customViewPermissions: nextViews },
        `عدّل ${currentUser.name} صلاحيات الرؤية للمستخدم «${selectedUserRecord.personName}»`
      );
    }
  };

  const handleToggleFixedAction = (actionId: string) => {
    const exists = currentFixedActions.includes(actionId);
    const nextActions = exists
      ? currentFixedActions.filter((id) => id !== actionId)
      : [...currentFixedActions, actionId];

    if (fixedTargetMode === 'role_template') {
      onUpdateFixedTemplate(editingTemplateRoleId, { actionPermissions: nextActions });
    } else if (selectedUserRecord) {
      onUpdateUser(
        selectedUserRecord.userId,
        { customActionPermissions: nextActions },
        `عدّل ${currentUser.name} صلاحيات الإجراءات للمستخدم «${selectedUserRecord.personName}»`
      );
    }
  };

  const handleSelectAllFixedViews = (selectAll: boolean) => {
    const nextViews = selectAll ? FIXED_VISIBILITY_OPTIONS.map((o) => o.id) : [];
    if (fixedTargetMode === 'role_template') {
      onUpdateFixedTemplate(editingTemplateRoleId, { viewPermissions: nextViews });
    } else if (selectedUserRecord) {
      onUpdateUser(selectedUserRecord.userId, { customViewPermissions: nextViews });
    }
  };

  const handleSelectAllFixedActions = (selectAll: boolean) => {
    const nextActions = selectAll ? FIXED_ACTION_OPTIONS.map((o) => o.id) : [];
    if (fixedTargetMode === 'role_template') {
      onUpdateFixedTemplate(editingTemplateRoleId, { actionPermissions: nextActions });
    } else if (selectedUserRecord) {
      onUpdateUser(selectedUserRecord.userId, { customActionPermissions: nextActions });
    }
  };

  // Dynamic Permissions helpers (per selected user)
  const selectedUserDynamicSet = useMemo(() => {
    return new Set(selectedUserRecord?.dynamicPermissions || []);
  }, [selectedUserRecord]);

  const handleToggleDynamicItem = (permId: string) => {
    if (!selectedUserRecord) return;
    const exists = selectedUserDynamicSet.has(permId);
    const nextDynamic = exists
      ? selectedUserRecord.dynamicPermissions.filter((id) => id !== permId)
      : [...selectedUserRecord.dynamicPermissions, permId];

    // If user is strictly in fixed_group mode and edits dynamic checkboxes, automatically move to dynamic_custom or combined
    const nextMode =
      selectedUserRecord.permissionMode === 'fixed_group'
        ? 'dynamic_custom'
        : selectedUserRecord.permissionMode;

    onUpdateUser(
      selectedUserRecord.userId,
      {
        dynamicPermissions: nextDynamic,
        permissionMode: nextMode
      },
      `حدّث ${currentUser.name} الصلاحيات الديناميكية للمستخدم «${selectedUserRecord.personName}»`
    );
  };

  const handleToggleDepartmentAll = (deptId: string, selectAll: boolean) => {
    if (!selectedUserRecord) return;
    const dept = DYNAMIC_DEPARTMENTS.find((d) => d.id === deptId);
    if (!dept) return;
    const deptItemIds = dept.items.map((it) => it.id);
    const deptSet = new Set(deptItemIds);
    const baseWithoutDept = selectedUserRecord.dynamicPermissions.filter((id) => !deptSet.has(id));
    const nextDynamic = selectAll ? [...baseWithoutDept, ...deptItemIds] : baseWithoutDept;
    const nextMode =
      selectedUserRecord.permissionMode === 'fixed_group'
        ? 'dynamic_custom'
        : selectedUserRecord.permissionMode;

    onUpdateUser(
      selectedUserRecord.userId,
      {
        dynamicPermissions: nextDynamic,
        permissionMode: nextMode
      },
      `${selectAll ? 'فعّل' : 'ألغى'} ${currentUser.name} جميع صلاحيات قسم «${dept.title}» للمستخدم «${selectedUserRecord.personName}»`
    );
  };

  const handleSyncDynamicFromFixed = () => {
    if (!selectedUserRecord) return;
    const tpl = fixedTemplates[selectedUserRecord.fixedRole];
    const derived = deriveDynamicIdsFromFixedTemplate({
      ...tpl,
      viewPermissions:
        selectedUserRecord.customViewPermissions.length > 0
          ? selectedUserRecord.customViewPermissions
          : tpl.viewPermissions,
      actionPermissions:
        selectedUserRecord.customActionPermissions.length > 0
          ? selectedUserRecord.customActionPermissions
          : tpl.actionPermissions
    });
    onUpdateUser(
      selectedUserRecord.userId,
      { dynamicPermissions: derived },
      `زامن ${currentUser.name} البنود الديناميكية مع المجموعة الثابتة للمستخدم «${selectedUserRecord.personName}»`
    );
  };

  const selectedEffectiveNavCount = useMemo(() => {
    if (!selectedUserRecord) return 0;
    return computeEffectiveNavKeysForRecord(selectedUserRecord, fixedTemplates).size;
  }, [fixedTemplates, selectedUserRecord]);

  const handleExportCsv = () => {
    const headers = ['رقم الشخص', 'اسم الشخص', 'الهاتف', 'الشركة', 'الدور', 'نوع الاشتراك', 'نمط الصلاحيات', 'الحالة'];
    const rows = filteredUsers.map((u) => [
      u.personNumber,
      u.personName,
      u.phone,
      u.companyName,
      fixedTemplates[u.fixedRole]?.label || u.fixedRole,
      SUBSCRIPTION_TYPE_LABELS[u.subscriptionType] || u.subscriptionType,
      PERMISSION_MODE_LABELS[u.permissionMode].label,
      u.isActive ? 'نشط' : 'موقوف'
    ]);
    const csv =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zanoza-users-permissions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                إدارة المستخدمين ومصفوفة الصلاحيات
              </h1>
              <p className="text-xs text-slate-400">
                دليل المستخدمين (رقم الشخص، الاسم، الدور، نوع الاشتراك) مع نظام صلاحيات مزدوج: مجموعات ثابتة ومجموعة إدارات ديناميكية.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>تصدير CSV</span>
          </button>
          <button
            type="button"
            onClick={openCreateUserModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ إضافة مستخدم</span>
          </button>
        </div>
      </div>

      {/* Compact KPI Strip (3 metrics max per discipline) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">إجمالي المستخدمين</div>
            <div className="text-2xl font-bold text-white tabular-nums mt-1">
              {managedUsers.length}
            </div>
          </div>
          <div className="text-xs text-slate-400 tabular-nums">
            {activeUsersCount} حساب نشط
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">المجموعات الثابتة المعتمدة</div>
            <div className="text-2xl font-bold text-cyan-400 tabular-nums mt-1">
              {FIXED_ROLE_ORDER.length}
            </div>
          </div>
          <div className="text-xs text-slate-400">
            سوبر أدمن · أدمن · مشترك · موظف · سائق · مرشد · مندوب · عميل
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">المجموعة الديناميكية (إدارات الشريط الجانبي)</div>
            <div className="text-2xl font-bold text-emerald-400 tabular-nums mt-1">
              {DYNAMIC_DEPARTMENTS.length} إدارات
            </div>
          </div>
          <div className="text-xs text-slate-400 tabular-nums">
            {ALL_DYNAMIC_PERMISSION_IDS.length} بند صلاحية فرعي
          </div>
        </div>
      </div>

      {/* Section 1: Users Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                roleFilter === 'all'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              الكل ({managedUsers.length})
            </button>
            {FIXED_ROLE_ORDER.map((rId) => (
              <button
                key={rId}
                type="button"
                onClick={() => setRoleFilter(rId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap tabular-nums ${
                  roleFilter === rId
                    ? 'bg-cyan-600/25 border border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {fixedTemplates[rId].label} ({roleCounts[rId] || 0})
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم الشخص أو الاسم أو الهاتف..."
                className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={subscriptionFilter}
              onChange={(e) =>
                setSubscriptionFilter(e.target.value as 'all' | SubscriptionTypeId)
              }
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">جميع أنواع الاشتراكات</option>
              {(Object.keys(SUBSCRIPTION_TYPE_LABELS) as SubscriptionTypeId[]).map((subId) => (
                <option key={subId} value={subId}>
                  {SUBSCRIPTION_TYPE_LABELS[subId]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clean High-Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                <th className="py-3 px-4 whitespace-nowrap">رقم الشخص</th>
                <th className="py-3 px-4 whitespace-nowrap">اسم الشخص</th>
                <th className="py-3 px-4 whitespace-nowrap">الدور</th>
                <th className="py-3 px-4 whitespace-nowrap">نوع الاشتراك</th>
                <th className="py-3 px-4 whitespace-nowrap">ملخص الصلاحيات</th>
                <th className="py-3 px-4 whitespace-nowrap">الحالة</th>
                <th className="py-3 px-4 whitespace-nowrap text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    لا توجد نتائج مطابقة للبحث أو الفلاتر الحالية.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((record) => {
                  const isSelected = selectedUserRecord?.userId === record.userId;
                  const isCurrentSession = currentUser.id === record.userId;
                  const effNavCount = computeEffectiveNavKeysForRecord(
                    record,
                    fixedTemplates
                  ).size;

                  return (
                    <tr
                      key={record.userId}
                      onClick={() => setSelectedUserId(record.userId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/25'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-cyan-300 font-semibold tabular-nums whitespace-nowrap">
                        {record.personNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{record.personName}</span>
                          {isCurrentSession && (
                            <span className="text-[10px] font-normal text-emerald-400">
                              · الجلسة النشطة
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {record.companyName} · <span className="font-mono tabular-nums">{record.phone}</span>
                          {record.fixedRole === 'customer' && (
                            <span className="text-cyan-300">
                              {' '}· {record.nationality || 'غير محددة'} (
                              {isEgyptianNationality(record.nationality) ? 'السعر المصري' : 'السعر الأجنبي'})
                              {' · '}
                              {record.customerScope === 'company'
                                ? `عميل شركة`
                                : 'عميل منصة'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-200 font-medium whitespace-nowrap">
                        {fixedTemplates[record.fixedRole]?.label || record.fixedRole}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        {SUBSCRIPTION_TYPE_LABELS[record.subscriptionType]}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium">
                          {PERMISSION_MODE_LABELS[record.permissionMode].label}
                        </div>
                        <div className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                          {effNavCount} شاشة متاحة · {record.dynamicPermissions.length} بند ديناميكي
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (record.userId === 'user-ahmed') return;
                            onUpdateUser(
                              record.userId,
                              { isActive: !record.isActive },
                              `${!record.isActive ? 'فعّل' : 'أوقف'} ${currentUser.name} حساب «${record.personName}»`
                            );
                          }}
                          disabled={record.userId === 'user-ahmed'}
                          className={`text-xs font-semibold transition-colors ${
                            record.isActive
                              ? 'text-emerald-400 hover:text-emerald-300'
                              : 'text-rose-400 hover:text-rose-300'
                          } disabled:opacity-60`}
                        >
                          {record.isActive ? 'نشط' : 'موقوف'}
                        </button>
                      </td>
                      <td
                        className="py-3 px-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(record.userId)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap ${
                              isSelected
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                            title="تخصيص صلاحيات هذا الشخص"
                          >
                            الصلاحيات
                          </button>
                          {onSwitchToUser && record.isActive && (
                            <button
                              type="button"
                              onClick={() => onSwitchToUser(record.userId)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-700/40 text-emerald-300 text-[11px] font-semibold transition-colors whitespace-nowrap"
                              title="التبديل إلى هذا الحساب لمعاينة ما يراه في الشريط الجانبي"
                            >
                              معاينة الحساب
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditUserModal(record)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="تعديل بيانات المستخدم"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {record.userId !== 'user-ahmed' && (
                            confirmDeleteUserId === record.userId ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteUser(record.userId);
                                    setConfirmDeleteUserId(null);
                                  }}
                                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold whitespace-nowrap"
                                >
                                  تأكيد
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteUserId(null)}
                                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px]"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteUserId(record.userId)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-colors"
                                title="حذف المستخدم"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Dual Permissions Engine (المجموعات الثابتة + المجموعة الديناميكية) */}
      {selectedUserRecord && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Active User & Permission Mode Banner */}
          <div className="p-5 border-b border-slate-800 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-400 font-semibold">
                <KeyRound className="w-4 h-4" />
                <span>المستخدم المحدد للتحكم بالصلاحيات:</span>
                <span className="text-white font-bold">{selectedUserRecord.personName}</span>
                <span className="font-mono text-slate-400 tabular-nums">
                  ({selectedUserRecord.personNumber})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                الدور: <strong className="text-slate-200">{fixedTemplates[selectedUserRecord.fixedRole]?.label}</strong>
                {' · '}
                الاشتراك: <strong className="text-slate-200">{SUBSCRIPTION_TYPE_LABELS[selectedUserRecord.subscriptionType]}</strong>
                {' · '}
                الشاشات المسموح ظهورها في الشريط الجانبي:{' '}
                <strong className="text-emerald-400 tabular-nums">{selectedEffectiveNavCount}</strong> شاشة
              </p>
            </div>

            {/* Permission Mode Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 ml-1">آلية احتساب الصلاحية:</span>
              {(['fixed_group', 'dynamic_custom', 'combined'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    onUpdateUser(
                      selectedUserRecord.userId,
                      { permissionMode: mode },
                      `غيّر ${currentUser.name} آلية صلاحيات «${selectedUserRecord.personName}» إلى ${PERMISSION_MODE_LABELS[mode].label}`
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    selectedUserRecord.permissionMode === mode
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                  title={PERMISSION_MODE_LABELS[mode].hint}
                >
                  {PERMISSION_MODE_LABELS[mode].label}
                </button>
              ))}
            </div>
          </div>

          {/* Two Permission Groups Switcher (المجموعات الثابتة | المجموعة الديناميكية) */}
          <div className="px-5 pt-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActivePermissionGroupTab('fixed')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activePermissionGroupTab === 'fixed'
                    ? 'border-cyan-400 text-cyan-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>المجموعة الأولى: المجموعات الثابتة (ما يراه وما يستطيع أن يفعله)</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePermissionGroupTab('dynamic')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activePermissionGroupTab === 'dynamic'
                    ? 'border-emerald-400 text-emerald-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>
                  المجموعة الثانية: المجموعة الديناميكية (إدارات الشريط الجانبي ·{' '}
                  <span className="tabular-nums">{selectedUserRecord.dynamicPermissions.length}</span>)
                </span>
              </button>
            </div>
          </div>

          {/* Group 1: Fixed Role Groups (سوبر أدمن، أدمن، مشترك، موظف، سائق، عميل) */}
          {activePermissionGroupTab === 'fixed' && (
            <div className="p-5 space-y-5">
              {/* Target Scope Toggle + Fixed Role Group Selector */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">
                    نطاق التعديل في المجموعات الثابتة
                  </div>
                  <p className="text-[11px] text-slate-400">
                    يمكنك تعديل القالب الثابت العام لأي مجموعة (سوبر أدمن، أدمن، مشترك، موظف، سائق، مرشد، مندوب، عميل) أو تخصيص المجموعة مباشرة على «{selectedUserRecord.personName}».
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFixedTargetMode('user_scope')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      fixedTargetMode === 'user_scope'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    صلاحيات المستخدم المحدد ({selectedUserRecord.personName})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFixedTargetMode('role_template');
                      setEditingTemplateRoleId(selectedUserRecord.fixedRole);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      fixedTargetMode === 'role_template'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    تعديل القوالب الثابتة العامة
                  </button>
                </div>
              </div>

              {/* 6 Fixed Role Group Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {FIXED_ROLE_ORDER.map((rId) => {
                  const tpl = fixedTemplates[rId];
                  const isRoleActive =
                    fixedTargetMode === 'role_template'
                      ? editingTemplateRoleId === rId
                      : selectedUserRecord.fixedRole === rId;
                  return (
                    <button
                      key={rId}
                      type="button"
                      onClick={() => {
                        if (fixedTargetMode === 'role_template') {
                          setEditingTemplateRoleId(rId);
                        } else {
                          onApplyFixedTemplateToUser(selectedUserRecord.userId, rId);
                        }
                      }}
                      className={`text-right p-3 rounded-xl border transition-all ${
                        isRoleActive
                          ? 'bg-cyan-600/15 border-cyan-500/50 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold">{tpl.label}</span>
                        {isRoleActive && <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                        {tpl.viewPermissions.length} رؤية · {tpl.actionPermissions.length} إجراء
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action bar for fixed template */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-slate-300">
                  {fixedTargetMode === 'role_template' ? (
                    <>
                      تعديل القالب العام لمجموعة:{' '}
                      <strong className="text-amber-300">{activeFixedTemplate.label}</strong> —{' '}
                      <span className="text-slate-400">{activeFixedTemplate.summary}</span>
                    </>
                  ) : (
                    <>
                      قائمة الصلاحيات الثابتة الخاصة بـ{' '}
                      <strong className="text-cyan-300">{selectedUserRecord.personName}</strong>{' '}
                      (المجموعة: {fixedTemplates[selectedUserRecord.fixedRole].label})
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {fixedTargetMode === 'role_template' ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onApplyFixedTemplateToUser(
                            selectedUserRecord.userId,
                            editingTemplateRoleId
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        تطبيق قالب «{activeFixedTemplate.label}» على {selectedUserRecord.personName}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateFixedTemplate(
                            editingTemplateRoleId,
                            DEFAULT_FIXED_ROLE_TEMPLATES[editingTemplateRoleId]
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        استعادة الافتراضي
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onApplyFixedTemplateToUser(
                          selectedUserRecord.userId,
                          selectedUserRecord.fixedRole
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>إعادة ضبط حسب قالب {fixedTemplates[selectedUserRecord.fixedRole].label}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* TWO SIDE-BY-SIDE CHECKBOX GROUPS: (1) ما يراه الشخص | (2) ما يستطيع أن يفعله */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Box 1: ما يراه الشخص */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          ما يراه الشخص (صلاحيات الرؤية والعرض)
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          مفعّل <span className="tabular-nums font-semibold text-cyan-300">{currentFixedViews.length}</span> من {FIXED_VISIBILITY_OPTIONS.length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectAllFixedViews(true)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-300 font-semibold"
                      >
                        الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAllFixedViews(false)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-400 font-semibold"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FIXED_VISIBILITY_OPTIONS.map((opt) => {
                      const checked = currentFixedViews.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? 'bg-cyan-950/30 border-cyan-500/40 text-white'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleFixedView(opt.id)}
                            className="mt-0.5 w-4 h-4 rounded accent-cyan-500 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-snug">{opt.label}</div>
                            <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                              {opt.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Box 2: ما يستطيع أن يفعله */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          ما يستطيع أن يفعله (صلاحيات الأفعال والتنفيذ)
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          مفعّل <span className="tabular-nums font-semibold text-emerald-300">{currentFixedActions.length}</span> من {FIXED_ACTION_OPTIONS.length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectAllFixedActions(true)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-300 font-semibold"
                      >
                        الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAllFixedActions(false)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-400 font-semibold"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {FIXED_ACTION_OPTIONS.map((opt) => {
                      const checked = currentFixedActions.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? 'bg-emerald-950/25 border-emerald-500/40 text-white'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleFixedAction(opt.id)}
                            className="mt-0.5 w-4 h-4 rounded accent-emerald-500 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-snug">{opt.label}</div>
                            <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                              {opt.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Group 2: Dynamic Department Hierarchy (مجموعة مكونة من جميع الإدارات الموجودة في الشريط الجانبي) */}
          {activePermissionGroupTab === 'dynamic' && (
            <div className="p-5 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>
                      شجرة الصلاحيات الديناميكية لـ «{selectedUserRecord.personName}»
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    مجموعة مكونة من مجموعات الإدارات الموجودة في الشريط الجانبي؛ تحت كل إدارة مجموعة من مربعات الاختيار (Checkboxes) للإضافة والتعديل والحذف والعرض.
                    {selectedUserRecord.permissionMode === 'fixed_group' && (
                      <span className="text-amber-300 font-semibold mr-1">
                        (عند تعديل أي بند هنا سيتم تفعيل نمط «المجموعة الديناميكية» للمستخدم تلقائيًا)
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncDynamicFromFixed}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>مزامنة من المجموعة الثابتة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateUser(
                        selectedUserRecord.userId,
                        {
                          dynamicPermissions: [...ALL_DYNAMIC_PERMISSION_IDS],
                          permissionMode:
                            selectedUserRecord.permissionMode === 'fixed_group'
                              ? 'dynamic_custom'
                              : selectedUserRecord.permissionMode
                        },
                        `فعّل ${currentUser.name} جميع الصلاحيات الديناميكية للمستخدم «${selectedUserRecord.personName}»`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold whitespace-nowrap"
                  >
                    تحديد جميع الإدارات
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateUser(
                        selectedUserRecord.userId,
                        {
                          dynamicPermissions: [],
                          permissionMode: 'dynamic_custom'
                        },
                        `ألغى ${currentUser.name} جميع الصلاحيات الديناميكية للمستخدم «${selectedUserRecord.personName}»`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold whitespace-nowrap"
                  >
                    إلغاء الكل
                  </button>
                </div>
              </div>

              {/* Dynamic Departments Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DYNAMIC_DEPARTMENTS.map((dept) => {
                  const checkedCount = dept.items.filter((it) =>
                    selectedUserDynamicSet.has(it.id)
                  ).length;
                  const allSelected = checkedCount === dept.items.length;

                  return (
                    <div
                      key={dept.id}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <CheckSquare
                            className={`w-4 h-4 shrink-0 ${
                              checkedCount > 0 ? 'text-emerald-400' : 'text-slate-500'
                            }`}
                          />
                          <h4 className="text-sm font-bold text-white">{dept.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                            {checkedCount}/{dept.items.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleDepartmentAll(dept.id, !allSelected)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap ${
                              allSelected
                                ? 'bg-slate-800 text-slate-300 hover:text-white'
                                : 'bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30'
                            }`}
                          >
                            {allSelected ? 'إلغاء الإدارة' : 'تحديد الكل'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {dept.items.map((item) => {
                          const isChecked = selectedUserDynamicSet.has(item.id);
                          return (
                            <label
                              key={item.id}
                              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-emerald-950/25 border-emerald-500/40 text-white'
                                  : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleDynamicItem(item.id)}
                                className="w-4 h-4 rounded accent-emerald-500 shrink-0"
                              />
                              <span className="text-xs font-medium leading-tight">
                                {item.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">
                  {editingUserId ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserModal} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-700/50 text-rose-300 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    رقم الشخص *
                  </label>
                  <input
                    type="text"
                    value={formPersonNumber}
                    onChange={(e) => setFormPersonNumber(e.target.value)}
                    placeholder="مثال: USR-1007"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    اسم الشخص *
                  </label>
                  <input
                    type="text"
                    value={formPersonName}
                    onChange={(e) => setFormPersonName(e.target.value)}
                    placeholder="الاسم الكامل للمستخدم"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    الدور (المجموعة الثابتة)
                  </label>
                  <select
                    value={formFixedRole}
                    onChange={(e) => {
                      const nextRole = e.target.value as FixedRoleGroupId;
                      setFormFixedRole(nextRole);
                      setFormSubscriptionType(fixedTemplates[nextRole].defaultSubscription);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {FIXED_ROLE_ORDER.map((rId) => (
                      <option key={rId} value={rId}>
                        {fixedTemplates[rId].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    نوع الاشتراك
                  </label>
                  <select
                    value={formSubscriptionType}
                    onChange={(e) =>
                      setFormSubscriptionType(e.target.value as SubscriptionTypeId)
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {(Object.keys(SUBSCRIPTION_TYPE_LABELS) as SubscriptionTypeId[]).map(
                      (subId) => (
                        <option key={subId} value={subId}>
                          {SUBSCRIPTION_TYPE_LABELS[subId]}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+2010..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    الجهة / الشركة / القسم
                  </label>
                  <input
                    type="text"
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                    placeholder="اسم الشركة أو القسم التابع له"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {formFixedRole === 'customer' && (
                  <>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">
                        الجنسية (تحدد السعر تلقائياً) *
                      </label>
                      <select
                        value={formNationality}
                        onChange={(e) => setFormNationality(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        {CUSTOMER_NATIONALITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.labelAr}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-cyan-300 mt-1">
                        {isEgyptianNationality(formNationality)
                          ? 'يعرض له السعر المصري فقط (ج.م)'
                          : 'يعرض له السعر الأجنبي فقط (€)'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">
                        نطاق العميل *
                      </label>
                      <select
                        value={formCustomerScope}
                        onChange={(e) =>
                          setFormCustomerScope(e.target.value as 'platform' | 'company')
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="platform">عميل منصة (يرى جميع أنشطة الشركات بالسوق العام)</option>
                        <option value="company">عميل شركة (يرى أنشطة ورحلات الشركة فقط)</option>
                      </select>
                    </div>

                    {formCustomerScope === 'company' && availableCompanies.length > 0 && (
                      <div className="sm:col-span-2">
                        <label className="block text-slate-300 font-semibold mb-1.5">
                          الشركة المسجل لديها العميل *
                        </label>
                        <select
                          value={formRegisteredCompanyId}
                          onChange={(e) => setFormRegisteredCompanyId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                        >
                          {availableCompanies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.companyName} ({c.ownerName})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    آلية احتساب الصلاحيات
                  </label>
                  <select
                    value={formPermissionMode}
                    onChange={(e) =>
                      setFormPermissionMode(
                        e.target.value as ManagedUserPermissionRecord['permissionMode']
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="fixed_group">
                      المجموعة الثابتة (ما يراه + ما يفعله حسب الدور)
                    </option>
                    <option value="dynamic_custom">
                      المجموعة الديناميكية (حسب الإدارات المحددة)
                    </option>
                    <option value="combined">
                      مدمجة (المجموعة الثابتة + البنود الديناميكية)
                    </option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{editingUserId ? 'حفظ التعديلات' : 'حفظ وإضافة المستخدم'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
