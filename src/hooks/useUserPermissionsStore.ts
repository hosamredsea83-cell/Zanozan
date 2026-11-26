import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppUser,
  SYSTEM_USERS,
  UserRoleKey,
  resolveUserRoleKey
} from '../types/auth';
import {
  DEFAULT_FIXED_ROLE_TEMPLATES,
  FixedRoleGroupId,
  FixedRoleTemplate,
  ManagedUserPermissionRecord,
  SUBSCRIPTION_TYPE_LABELS,
  SubscriptionTypeId,
  UserPermissionsStoreState,
  computeEffectiveNavKeysForRecord,
  deriveDynamicIdsFromFixedTemplate
} from '../types/permissions';
import type { LogAuditEventInput } from './useAuditLogStore';
import { fetchDomainStore, saveDomainStore } from '../services/serverStoreSync';

const USER_PERMISSIONS_STORAGE_KEY = 'zanoza_user_permissions_v1';

const AVATAR_COLORS = [
  'bg-cyan-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-indigo-600',
  'bg-rose-600'
];

export function mapAuthRoleToFixedGroup(user: AppUser): FixedRoleGroupId {
  const rk = resolveUserRoleKey(user);
  if (rk === 'platform_admin') return 'super_admin';
  if (rk === 'employee') return 'employee';
  if (rk === 'driver') return 'driver';
  if (rk === 'tour_guide') return 'tour_guide';
  if (rk === 'delegate') return 'delegate';
  if (rk === 'customer') return 'customer';
  return 'subscriber';
}

export function mapFixedGroupToAuthRole(fixedRole: FixedRoleGroupId): UserRoleKey {
  if (fixedRole === 'super_admin' || fixedRole === 'admin') return 'platform_admin';
  if (fixedRole === 'employee') return 'employee';
  if (fixedRole === 'driver') return 'driver';
  if (fixedRole === 'tour_guide') return 'tour_guide';
  if (fixedRole === 'delegate') return 'delegate';
  if (fixedRole === 'customer') return 'customer';
  return 'subscriber_owner';
}

export function inferSubscriptionFromUser(
  user: AppUser,
  fixedRole: FixedRoleGroupId
): SubscriptionTypeId {
  const tierText = (user.tier || '').trim();
  if (tierText.includes('ذهبية') || tierText.includes('VIP')) return 'gold_vip';
  if (tierText.includes('فضية') || tierText.includes('محترفين')) return 'silver_pro';
  if (tierText.includes('أساطيل') || tierText.includes('شركات')) return 'enterprise_fleet';
  if (tierText.includes('موظف')) return 'employee_seat';
  if (tierText.includes('سائق')) return 'driver_field';
  if (tierText.includes('مرشد') || tierText.includes('مرافق')) return 'guide_field';
  if (tierText.includes('مندوب')) return 'delegate_sales';
  if (tierText.includes('عميل') || tierText.includes('سائح')) return 'customer_free';
  return DEFAULT_FIXED_ROLE_TEMPLATES[fixedRole].defaultSubscription;
}

function buildRecordFromAppUser(
  user: AppUser,
  index: number,
  fixedTemplates: Record<FixedRoleGroupId, FixedRoleTemplate>
): ManagedUserPermissionRecord {
  const fixedRole = mapAuthRoleToFixedGroup(user);
  const tpl = fixedTemplates[fixedRole] || DEFAULT_FIXED_ROLE_TEMPLATES.subscriber;
  return {
    userId: user.id,
    personNumber: `USR-${1001 + index}`,
    personName: user.name,
    phone: user.phone || '+201000000000',
    email: user.email || '',
    companyName: user.companyName || 'منصة ZanoZa',
    nationality: user.nationality,
    customerScope: user.customerScope || (fixedRole === 'customer' ? 'platform' : undefined),
    registeredCompanyId: user.registeredCompanyId,
    registeredCompanyName: user.registeredCompanyName,
    registrationSource: user.registrationSource,
    fixedRole,
    subscriptionType: inferSubscriptionFromUser(user, fixedRole),
    permissionMode: 'fixed_group',
    customViewPermissions: [...tpl.viewPermissions],
    customActionPermissions: [...tpl.actionPermissions],
    dynamicPermissions: deriveDynamicIdsFromFixedTemplate(tpl),
    isActive: true,
    updatedAt: new Date().toISOString()
  };
}

function createInitialState(): UserPermissionsStoreState {
  const fixedTemplates: Record<FixedRoleGroupId, FixedRoleTemplate> = {
    super_admin: { ...DEFAULT_FIXED_ROLE_TEMPLATES.super_admin },
    admin: { ...DEFAULT_FIXED_ROLE_TEMPLATES.admin },
    subscriber: { ...DEFAULT_FIXED_ROLE_TEMPLATES.subscriber },
    employee: { ...DEFAULT_FIXED_ROLE_TEMPLATES.employee },
    driver: { ...DEFAULT_FIXED_ROLE_TEMPLATES.driver },
    tour_guide: { ...DEFAULT_FIXED_ROLE_TEMPLATES.tour_guide },
    delegate: { ...DEFAULT_FIXED_ROLE_TEMPLATES.delegate },
    customer: { ...DEFAULT_FIXED_ROLE_TEMPLATES.customer }
  };

  const defaultDemoUsers: ManagedUserPermissionRecord[] = [
    ...SYSTEM_USERS.map((u, idx) => buildRecordFromAppUser(u, idx, fixedTemplates)),
    {
      userId: 'user-salma-employee',
      personNumber: 'USR-1004',
      personName: 'سلمى حسام الدين',
      phone: '+201022334455',
      email: 'salma.ops@zanoza.com',
      companyName: 'إدارة الحجوزات والتشغيل',
      fixedRole: 'employee',
      subscriptionType: 'employee_seat',
      permissionMode: 'fixed_group',
      customViewPermissions: [...fixedTemplates.employee.viewPermissions],
      customActionPermissions: [...fixedTemplates.employee.actionPermissions],
      dynamicPermissions: deriveDynamicIdsFromFixedTemplate(fixedTemplates.employee),
      isActive: true,
      updatedAt: new Date().toISOString()
    },
    {
      userId: 'user-karim-driver',
      personNumber: 'USR-1005',
      personName: 'كريم عبد العزيز',
      phone: '+201144556677',
      email: 'karim.driver@zanoza.com',
      companyName: 'أسطول النقل السياحي',
      fixedRole: 'driver',
      subscriptionType: 'driver_field',
      permissionMode: 'fixed_group',
      customViewPermissions: [...fixedTemplates.driver.viewPermissions],
      customActionPermissions: [...fixedTemplates.driver.actionPermissions],
      dynamicPermissions: deriveDynamicIdsFromFixedTemplate(fixedTemplates.driver),
      isActive: true,
      updatedAt: new Date().toISOString()
    },
    {
      userId: 'user-nour-customer',
      personNumber: 'USR-1006',
      personName: 'نور الهدى منصور',
      phone: '+201277889900',
      email: 'nour.guest@zanoza.com',
      companyName: 'حساب عميل منصة (جميع الشركات)',
      nationality: 'مصر',
      customerScope: 'platform',
      registrationSource: 'platform_signup',
      fixedRole: 'customer',
      subscriptionType: 'customer_free',
      permissionMode: 'fixed_group',
      customViewPermissions: [...fixedTemplates.customer.viewPermissions],
      customActionPermissions: [...fixedTemplates.customer.actionPermissions],
      dynamicPermissions: deriveDynamicIdsFromFixedTemplate(fixedTemplates.customer),
      isActive: true,
      updatedAt: new Date().toISOString()
    },
    {
      userId: 'user-max-company-customer',
      personNumber: 'USR-1007',
      personName: 'Max Müller (عميل شركة الشناوي)',
      phone: '+4915177429901',
      email: 'max.muller@zanoza.com',
      companyName: 'الشناوي مارين لليخوت والرحلات البحرية',
      nationality: 'ألمانيا',
      customerScope: 'company',
      registeredCompanyId: 'user-ahmed',
      registeredCompanyName: 'الشناوي مارين لليخوت والرحلات البحرية',
      registrationSource: 'company_page',
      fixedRole: 'customer',
      subscriptionType: 'customer_free',
      permissionMode: 'fixed_group',
      customViewPermissions: [...fixedTemplates.customer.viewPermissions],
      customActionPermissions: [...fixedTemplates.customer.actionPermissions],
      dynamicPermissions: deriveDynamicIdsFromFixedTemplate(fixedTemplates.customer),
      isActive: true,
      updatedAt: new Date().toISOString()
    },
    {
      userId: 'user-hassan-guide',
      personNumber: 'USR-1008',
      personName: 'حسن الشاذلي (مرشد سياحي)',
      phone: '+201033445566',
      email: 'hassan.guide@zanoza.com',
      companyName: 'فريق الإرشاد السياحي المعتمد',
      fixedRole: 'tour_guide',
      subscriptionType: 'guide_field',
      permissionMode: 'fixed_group',
      customViewPermissions: [...fixedTemplates.tour_guide.viewPermissions],
      customActionPermissions: [...fixedTemplates.tour_guide.actionPermissions],
      dynamicPermissions: deriveDynamicIdsFromFixedTemplate(fixedTemplates.tour_guide),
      isActive: true,
      updatedAt: new Date().toISOString()
    },
    {
      userId: 'user-youssef-delegate',
      personNumber: 'USR-1009',
      personName: 'يوسف المنصور (مندوب مبيعات)',
      phone: '+201066778899',
      email: 'youssef.sales@zanoza.com',
      companyName: 'شبكة مندوبي المبيعات والحجز',
      fixedRole: 'delegate',
      subscriptionType: 'delegate_sales',
      permissionMode: 'fixed_group',
      customViewPermissions: [...fixedTemplates.delegate.viewPermissions],
      customActionPermissions: [...fixedTemplates.delegate.actionPermissions],
      dynamicPermissions: deriveDynamicIdsFromFixedTemplate(fixedTemplates.delegate),
      isActive: true,
      updatedAt: new Date().toISOString()
    }
  ];

  return {
    fixedTemplates,
    managedUsers: defaultDemoUsers
  };
}

function normalizeStoreState(raw: unknown): UserPermissionsStoreState {
  const initial = createInitialState();
  if (!raw || typeof raw !== 'object') return initial;
  const candidate = raw as Partial<UserPermissionsStoreState>;

  const fixedTemplates: Record<FixedRoleGroupId, FixedRoleTemplate> = {
    ...initial.fixedTemplates
  };
  if (candidate.fixedTemplates && typeof candidate.fixedTemplates === 'object') {
    (Object.keys(initial.fixedTemplates) as FixedRoleGroupId[]).forEach((roleId) => {
      const incoming = candidate.fixedTemplates?.[roleId];
      if (incoming && typeof incoming === 'object') {
        fixedTemplates[roleId] = {
          ...initial.fixedTemplates[roleId],
          ...incoming,
          id: roleId,
          viewPermissions: Array.isArray(incoming.viewPermissions)
            ? incoming.viewPermissions
            : initial.fixedTemplates[roleId].viewPermissions,
          actionPermissions: Array.isArray(incoming.actionPermissions)
            ? incoming.actionPermissions
            : initial.fixedTemplates[roleId].actionPermissions
        };
      }
    });
  }

  const rawList = Array.isArray(candidate.managedUsers)
    ? candidate.managedUsers.filter((u): u is ManagedUserPermissionRecord =>
        Boolean(u && typeof u === 'object' && typeof u.userId === 'string')
      )
    : initial.managedUsers;

  const baseList = rawList.length > 0 ? rawList : initial.managedUsers;
  const managedUsers = baseList.map((u) => {
    if (u.userId === 'user-nour-customer' && !u.nationality) {
      return {
        ...u,
        nationality: 'مصر',
        customerScope: u.customerScope || ('platform' as const),
        registrationSource: u.registrationSource || ('platform_signup' as const)
      };
    }
    return u;
  });

  ['user-max-company-customer', 'user-karim-driver', 'user-hassan-guide', 'user-youssef-delegate'].forEach(
    (seedId) => {
      if (!managedUsers.some((u) => u.userId === seedId)) {
        const seedRecord = initial.managedUsers.find((u) => u.userId === seedId);
        if (seedRecord) {
          managedUsers.push(seedRecord);
        }
      }
    }
  );

  return {
    fixedTemplates,
    managedUsers
  };
}

function readStoredPermissionsState(): UserPermissionsStoreState {
  if (typeof window === 'undefined') return createInitialState();
  try {
    const raw = window.localStorage.getItem(USER_PERMISSIONS_STORAGE_KEY);
    if (!raw) return createInitialState();
    return normalizeStoreState(JSON.parse(raw));
  } catch {
    return createInitialState();
  }
}

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`;
  }
  return name.trim().slice(0, 2) || 'US';
}

export interface CreateManagedUserInput {
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
}

export function useUserPermissionsStore(
  currentUser: AppUser,
  externalPlatformUsers: AppUser[],
  logAuditEvent?: (input: LogAuditEventInput) => void
) {
  const [storeState, setStoreState] = useState<UserPermissionsStoreState>(() =>
    readStoredPermissionsState()
  );
  const hasHydratedRef = useRef(false);

  // Hydrate from server store on mount
  useEffect(() => {
    let active = true;
    fetchDomainStore<UserPermissionsStoreState>('user_permissions')
      .then((srvState) => {
        if (!active) return;
        if (srvState && typeof srvState === 'object') {
          setStoreState(normalizeStoreState(srvState));
        }
        hasHydratedRef.current = true;
      })
      .catch(() => {
        hasHydratedRef.current = true;
      });
    return () => {
      active = false;
    };
  }, []);

  // Persist to localStorage & server store after hydration
  useEffect(() => {
    try {
      window.localStorage.setItem(USER_PERMISSIONS_STORAGE_KEY, JSON.stringify(storeState));
    } catch {
      // ignore storage quota issues
    }
    if (hasHydratedRef.current) {
      void saveDomainStore('user_permissions', storeState);
    }
  }, [storeState]);

  // Synchronize newly registered / external users cleanly without overwriting customized records
  useEffect(() => {
    if (!externalPlatformUsers.length) return;
    setStoreState((prev) => {
      const existingIds = new Set(prev.managedUsers.map((u) => u.userId));
      const missing = externalPlatformUsers.filter((u) => !existingIds.has(u.id));
      if (missing.length === 0) return prev;
      let nextSeq = prev.managedUsers.length;
      const additions = missing.map((u) => {
        nextSeq += 1;
        return buildRecordFromAppUser(u, nextSeq - 1, prev.fixedTemplates);
      });
      return {
        ...prev,
        managedUsers: [...prev.managedUsers, ...additions]
      };
    });
  }, [externalPlatformUsers]);

  const addManagedUser = useCallback(
    (input: CreateManagedUserInput): ManagedUserPermissionRecord => {
      const tpl =
        storeState.fixedTemplates[input.fixedRole] || DEFAULT_FIXED_ROLE_TEMPLATES.subscriber;
      const userId = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const record: ManagedUserPermissionRecord = {
        userId,
        personNumber: input.personNumber.trim() || `USR-${1001 + storeState.managedUsers.length}`,
        personName: input.personName.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || '',
        companyName: input.companyName.trim() || 'حساب مشترك بالمنصة',
        nationality: input.nationality?.trim() || undefined,
        customerScope: input.customerScope,
        registeredCompanyId: input.registeredCompanyId,
        registeredCompanyName: input.registeredCompanyName,
        registrationSource: input.registrationSource,
        fixedRole: input.fixedRole,
        subscriptionType: input.subscriptionType,
        permissionMode: input.permissionMode,
        customViewPermissions: [...tpl.viewPermissions],
        customActionPermissions: [...tpl.actionPermissions],
        dynamicPermissions: deriveDynamicIdsFromFixedTemplate(tpl),
        isActive: true,
        updatedAt: new Date().toISOString()
      };

      setStoreState((prev) => ({
        ...prev,
        managedUsers: [record, ...prev.managedUsers]
      }));

      logAuditEvent?.({
        actor: currentUser,
        action: 'create',
        domain: 'partner',
        entityId: record.userId,
        entityName: record.personName,
        summary: `أضاف ${currentUser.name} مستخدمًا جديدًا «${record.personName}» (${record.personNumber}) بدور ${tpl.label}`
      });

      return record;
    },
    [currentUser, logAuditEvent, storeState.fixedTemplates, storeState.managedUsers.length]
  );

  const updateManagedUser = useCallback(
    (
      userId: string,
      patch: Partial<ManagedUserPermissionRecord>,
      auditSummary?: string
    ) => {
      setStoreState((prev) => {
        const nextUsers = prev.managedUsers.map((u) => {
          if (u.userId !== userId) return u;
          return {
            ...u,
            ...patch,
            updatedAt: new Date().toISOString()
          };
        });
        return {
          ...prev,
          managedUsers: nextUsers
        };
      });

      if (auditSummary) {
        logAuditEvent?.({
          actor: currentUser,
          action: 'update',
          domain: 'partner',
          entityId: userId,
          entityName: patch.personName || userId,
          summary: auditSummary
        });
      }
    },
    [currentUser, logAuditEvent]
  );

  const deleteManagedUser = useCallback(
    (userId: string) => {
      if (userId === 'user-ahmed') return;
      const target = storeState.managedUsers.find((u) => u.userId === userId);
      setStoreState((prev) => ({
        ...prev,
        managedUsers: prev.managedUsers.filter((u) => u.userId !== userId)
      }));
      if (target) {
        logAuditEvent?.({
          actor: currentUser,
          action: 'delete',
          domain: 'partner',
          entityId: userId,
          entityName: target.personName,
          summary: `حذف ${currentUser.name} المستخدم «${target.personName}» (${target.personNumber})`
        });
      }
    },
    [currentUser, logAuditEvent, storeState.managedUsers]
  );

  const updateFixedTemplate = useCallback(
    (roleId: FixedRoleGroupId, patch: Partial<FixedRoleTemplate>) => {
      setStoreState((prev) => {
        const currentTpl = prev.fixedTemplates[roleId] || DEFAULT_FIXED_ROLE_TEMPLATES[roleId];
        const nextTpl: FixedRoleTemplate = {
          ...currentTpl,
          ...patch,
          id: roleId
        };
        return {
          ...prev,
          fixedTemplates: {
            ...prev.fixedTemplates,
            [roleId]: nextTpl
          }
        };
      });
      logAuditEvent?.({
        actor: currentUser,
        action: 'update',
        domain: 'partner',
        entityId: `fixed-role-${roleId}`,
        entityName: DEFAULT_FIXED_ROLE_TEMPLATES[roleId].label,
        summary: `حدّث ${currentUser.name} صلاحيات المجموعة الثابتة «${DEFAULT_FIXED_ROLE_TEMPLATES[roleId].label}»`
      });
    },
    [currentUser, logAuditEvent]
  );

  const applyFixedTemplateToUser = useCallback(
    (userId: string, roleId: FixedRoleGroupId) => {
      setStoreState((prev) => {
        const tpl = prev.fixedTemplates[roleId] || DEFAULT_FIXED_ROLE_TEMPLATES[roleId];
        const derivedDynamic = deriveDynamicIdsFromFixedTemplate(tpl);
        return {
          ...prev,
          managedUsers: prev.managedUsers.map((u) =>
            u.userId === userId
              ? {
                  ...u,
                  fixedRole: roleId,
                  customViewPermissions: [...tpl.viewPermissions],
                  customActionPermissions: [...tpl.actionPermissions],
                  dynamicPermissions: derivedDynamic,
                  updatedAt: new Date().toISOString()
                }
              : u
          )
        };
      });
      logAuditEvent?.({
        actor: currentUser,
        action: 'update',
        domain: 'partner',
        entityId: userId,
        entityName: DEFAULT_FIXED_ROLE_TEMPLATES[roleId].label,
        summary: `طبّق ${currentUser.name} قالب المجموعة الثابتة «${DEFAULT_FIXED_ROLE_TEMPLATES[roleId].label}» على المستخدم`
      });
    },
    [currentUser, logAuditEvent]
  );

  const getAllowedNavKeysForUser = useCallback(
    (user?: AppUser): Set<string> | null => {
      if (!user) return null;
      const record = storeState.managedUsers.find((r) => r.userId === user.id);
      if (!record) return null;
      if (!record.isActive) {
        return new Set<string>(['customer_storefront']);
      }
      return computeEffectiveNavKeysForRecord(record, storeState.fixedTemplates);
    },
    [storeState.fixedTemplates, storeState.managedUsers]
  );

  const managedUsersAsAppUsers = useMemo<AppUser[]>(() => {
    const systemMap = new Map(SYSTEM_USERS.map((u) => [u.id, u]));
    return storeState.managedUsers
      .filter((r) => r.isActive)
      .map((r, idx) => {
        const existingSys = systemMap.get(r.userId);
        const initials = makeInitials(r.personName);
        const tpl =
          storeState.fixedTemplates[r.fixedRole] || DEFAULT_FIXED_ROLE_TEMPLATES[r.fixedRole];
        return {
          id: r.userId,
          name: r.personName,
          email: r.email || existingSys?.email || `${r.personNumber.toLowerCase()}@zanoza.com`,
          companyName: r.companyName || existingSys?.companyName || 'منصة ZanoZa',
          phone: r.phone,
          role: tpl.label,
          roleKey: existingSys?.roleKey || mapFixedGroupToAuthRole(r.fixedRole),
          tier: SUBSCRIPTION_TYPE_LABELS[r.subscriptionType] || existingSys?.tier || 'اشتراك قياسي',
          avatarColor: existingSys?.avatarColor || AVATAR_COLORS[idx % AVATAR_COLORS.length],
          initials,
          avatarInitials: initials,
          nationality: r.nationality,
          customerScope: r.customerScope,
          registeredCompanyId: r.registeredCompanyId,
          registeredCompanyName: r.registeredCompanyName,
          registrationSource: r.registrationSource
        };
      });
  }, [storeState.fixedTemplates, storeState.managedUsers]);

  const upsertCompanyCustomerFromClerk = useCallback(
    (input: {
      name: string;
      phone: string;
      nationality: string;
      companyUser: AppUser;
    }) => {
      const cleanPhone = input.phone.replace(/[^\d]/g, '').trim();
      if (!input.name.trim() || !cleanPhone) return;
      const existing = storeState.managedUsers.find(
        (u) =>
          u.fixedRole === 'customer' &&
          u.phone.replace(/[^\d]/g, '').trim() === cleanPhone
      );
      if (existing) {
        updateManagedUser(
          existing.userId,
          {
            personName: input.name.trim(),
            nationality: input.nationality,
            customerScope: 'company',
            registeredCompanyId: input.companyUser.id,
            registeredCompanyName: input.companyUser.companyName,
            registrationSource: 'booking_clerk'
          },
          `حدّث موظف الحجز (${input.companyUser.name}) ملف العميل «${input.name.trim()}» بجنسية ${input.nationality} (عميل شركة)`
        );
        return;
      }
      addManagedUser({
        personNumber: `CUS-${1001 + storeState.managedUsers.length}`,
        personName: input.name.trim(),
        phone: input.phone.trim(),
        companyName: input.companyUser.companyName || 'حساب عميل شركة',
        nationality: input.nationality,
        customerScope: 'company',
        registeredCompanyId: input.companyUser.id,
        registeredCompanyName: input.companyUser.companyName,
        registrationSource: 'booking_clerk',
        fixedRole: 'customer',
        subscriptionType: 'customer_free',
        permissionMode: 'fixed_group'
      });
    },
    [addManagedUser, storeState.managedUsers, updateManagedUser]
  );

  return {
    fixedTemplates: storeState.fixedTemplates,
    managedUsers: storeState.managedUsers,
    managedUsersAsAppUsers,
    addManagedUser,
    updateManagedUser,
    deleteManagedUser,
    updateFixedTemplate,
    applyFixedTemplateToUser,
    getAllowedNavKeysForUser,
    upsertCompanyCustomerFromClerk
  };
}
