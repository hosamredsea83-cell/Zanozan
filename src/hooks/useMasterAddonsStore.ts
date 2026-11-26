import { useEffect, useState } from 'react';
import type { MasterAddonItem } from '../types/addon';
import type { AppUser } from '../types/auth';
import { ensureOneTimeV6CleanReset } from '../db/unifiedLocalDb';
import {
  buildCreateAuditTrail,
  buildUpdateAuditTrail,
  type LogAuditEventInput
} from './useAuditLogStore';

const MASTER_ADDONS_STORAGE_KEY = 'zanoza_master_addons_v6';
const MASTER_ADDONS_V6_FLAG = 'zanoza_v6_master_addons_clean_v1';

export function buildInitialMasterAddons(): MasterAddonItem[] {
  const now = '2026-11-01 · 08:00:00';
  return [
    {
      id: 'addon-photo-pro',
      title: 'باقة تصوير فوتوغرافي احترافي',
      category: 'تصوير وتوثيق',
      unitLabel: 'للفرد / الجلسة',
      suggestedPriceEGP: 450,
      suggestedPriceEUR: 15,
      description: 'تصوير 40 صورة احترافية معدّلة بالكامل تسلم رقمياً في نفس اليوم',
      isActive: true,
      linkedCategoryIds: ['cat-marine', 'cat-diving', 'cat-safari', 'cat-leisure'],
      excludedCategoryIds: [],
      createdById: 'user-ahmed',
      createdByName: 'أحمد الشناوي',
      createdByCompany: 'الشناوي مارين لليخوت والرحلات البحرية',
      createdAtTime: now,
      updatedById: 'user-ahmed',
      updatedByName: 'أحمد الشناوي',
      updatedByCompany: 'الشناوي مارين لليخوت والرحلات البحرية',
      updatedAtTime: now
    },
    {
      id: 'addon-drone-4k',
      title: 'تصوير فيديو سينمائي بالدرون 4K',
      category: 'تصوير وتوثيق',
      unitLabel: 'للرحلة / المجموعة',
      suggestedPriceEGP: 1200,
      suggestedPriceEUR: 35,
      description: 'مقطع فيديو مونتاج جوي عالي الدقة مع موسيقى وتصحيح ألوان',
      isActive: true,
      linkedCategoryIds: ['cat-marine-yacht-vip', 'cat-safari', 'cat-leisure-watersports'],
      excludedCategoryIds: ['cat-diving'],
      createdById: 'user-ahmed',
      createdByName: 'أحمد الشناوي',
      createdByCompany: 'الشناوي مارين لليخوت والرحلات البحرية',
      createdAtTime: now,
      updatedById: 'user-ahmed',
      updatedByName: 'أحمد الشناوي',
      updatedByCompany: 'الشناوي مارين لليخوت والرحلات البحرية',
      updatedAtTime: now
    },
    {
      id: 'addon-gopro-underwater',
      title: 'تأجير كاميرا GoPro مقاومة للماء مع ذاكرة',
      category: 'تصوير وتوثيق',
      unitLabel: 'لليوم',
      suggestedPriceEGP: 450,
      suggestedPriceEUR: 15,
      description: 'كاميرا أكشن مخصصة للتصوير تحت الماء مع بطاقة ذاكرة يحتفظ بها العميل',
      isActive: true,
      linkedCategoryIds: ['cat-diving', 'cat-marine', 'cat-leisure-glassboat'],
      excludedCategoryIds: ['cat-safari'],
      createdById: 'user-tarek',
      createdByName: 'طارق السويفي',
      createdByCompany: 'بلو أوشن للغوص والأنشطة البحرية',
      createdAtTime: now,
      updatedById: 'user-tarek',
      updatedByName: 'طارق السويفي',
      updatedByCompany: 'بلو أوشن للغوص والأنشطة البحرية',
      updatedAtTime: now
    },
    {
      id: 'addon-seafood-vip',
      title: 'وجبة سي فود VIP (جمبري واستاكوزا)',
      category: 'أطعمة ومشروبات',
      unitLabel: 'للفرد',
      suggestedPriceEGP: 650,
      suggestedPriceEUR: 20,
      description: 'ترقية وجبة الغداء البحري إلى قائمة مأكولات بحرية طازجة فاخرة',
      isActive: true,
      linkedCategoryIds: ['cat-marine'],
      excludedCategoryIds: ['cat-marine-speedboat'],
      createdById: 'user-ahmed',
      createdByName: 'أحمد الشناوي',
      createdByCompany: 'الشناوي مارين لليخوت والرحلات البحرية',
      createdAtTime: now,
      updatedById: 'user-ahmed',
      updatedByName: 'أحمد الشناوي',
      updatedByCompany: 'الشناوي مارين لليخوت والرحلات البحرية',
      updatedAtTime: now
    },
    {
      id: 'addon-open-bar',
      title: 'باقة مشروبات طازجة وعصائر طبيعية مفتوحة',
      category: 'أطعمة ومشروبات',
      unitLabel: 'للفرد',
      suggestedPriceEGP: 250,
      suggestedPriceEUR: 8,
      description: 'توفير عصائر موسمية طازجة ومشروبات باردة طوال مدة الرحلة البحرية',
      isActive: true,
      linkedCategoryIds: ['cat-marine', 'cat-leisure-glassboat'],
      excludedCategoryIds: [],
      createdById: 'user-ahmed',
      createdByName: 'أحمد الشناوي',
      createdByCompany: 'الشناوي مارين لليخوت والرحلات البحرية',
      createdAtTime: now,
      updatedById: 'user-ahmed',
      updatedByName: 'أحمد الشناوي',
      updatedByCompany: 'الشناوي مارين لليخوت والرحلات البحرية',
      updatedAtTime: now
    },
    {
      id: 'addon-nitrox-upgrade',
      title: 'ترقية أسطوانات الغوص إلى غاز النيتروكس (Nitrox)',
      category: 'معدات وتجهيزات',
      unitLabel: 'للفرد / الغطسة',
      suggestedPriceEGP: 350,
      suggestedPriceEUR: 12,
      description: 'خليط هواء مخصب بالأكسجين لإطالة زمن القاع الآمن للغواصين المعتمدين',
      isActive: true,
      linkedCategoryIds: ['cat-diving-pro'],
      excludedCategoryIds: ['cat-diving-intro', 'cat-diving-snorkel'],
      createdById: 'user-tarek',
      createdByName: 'طارق السويفي',
      createdByCompany: 'بلو أوشن للغوص والأنشطة البحرية',
      createdAtTime: now,
      updatedById: 'user-tarek',
      updatedByName: 'طارق السويفي',
      updatedByCompany: 'بلو أوشن للغوص والأنشطة البحرية',
      updatedAtTime: now
    },
    {
      id: 'addon-snorkel-pro-kit',
      title: 'طقم سنوركلينج وزعانف احترافي خاص',
      category: 'معدات وتجهيزات',
      unitLabel: 'للفرد',
      suggestedPriceEGP: 200,
      suggestedPriceEUR: 6,
      description: 'قناع بانورامي مضاد للضباب مع زعانف مرنة معقمة خاصة بالعميل',
      isActive: true,
      linkedCategoryIds: ['cat-diving', 'cat-marine'],
      excludedCategoryIds: [],
      createdById: 'user-tarek',
      createdByName: 'طارق السويفي',
      createdByCompany: 'بلو أوشن للغوص والأنشطة البحرية',
      createdAtTime: now,
      updatedById: 'user-tarek',
      updatedByName: 'طارق السويفي',
      updatedByCompany: 'بلو أوشن للغوص والأنشطة البحرية',
      updatedAtTime: now
    },
    {
      id: 'addon-bedouin-scarf-goggles',
      title: 'شال بدوي أصلي ونظارة واقية من أتربة الصحراء',
      category: 'معدات وتجهيزات',
      unitLabel: 'للفرد',
      suggestedPriceEGP: 150,
      suggestedPriceEUR: 5,
      description: 'شال قطني تقليدي ونظارة حماية مغلقة مخصصة لقيادة البيتش باجي',
      isActive: true,
      linkedCategoryIds: ['cat-safari'],
      excludedCategoryIds: [],
      createdById: 'user-mohamed',
      createdByName: 'محمد عبد الرحمن',
      createdByCompany: 'رد سي إكستريم لسفاري الصحراء والبيتش باجي',
      createdAtTime: now,
      updatedById: 'user-mohamed',
      updatedByName: 'محمد عبد الرحمن',
      updatedByCompany: 'رد سي إكستريم لسفاري الصحراء والبيتش باجي',
      updatedAtTime: now
    },
    {
      id: 'addon-private-transfer',
      title: 'نقل خاص VIP من وإلى الفندق (سيارة مكيفة)',
      category: 'نقل وضيافة VIP',
      unitLabel: 'ذهاب وعودة للسيارة',
      suggestedPriceEGP: 600,
      suggestedPriceEUR: 18,
      description: 'سيارة خاصة حديثة مع سائق ملتزم بموعد الفندق دون توقفات إضافية',
      isActive: true,
      linkedCategoryIds: ['cat-marine', 'cat-diving', 'cat-safari', 'cat-leisure'],
      excludedCategoryIds: [],
      createdById: 'user-mohamed',
      createdByName: 'محمد عبد الرحمن',
      createdByCompany: 'رد سي إكستريم لسفاري الصحراء والبيتش باجي',
      createdAtTime: now,
      updatedById: 'user-mohamed',
      updatedByName: 'محمد عبد الرحمن',
      updatedByCompany: 'رد سي إكستريم لسفاري الصحراء والبيتش باجي',
      updatedAtTime: now
    },
    {
      id: 'addon-private-guide',
      title: 'مدرب أو مرشد مرافق خاص بلغة العميل',
      category: 'خدمات إرشاد ومرافقة',
      unitLabel: 'للرحلة',
      suggestedPriceEGP: 850,
      suggestedPriceEUR: 25,
      description: 'مرافقة شخصية طوال مدة النشاط مع شرح سياحي وإشراف سلامة',
      isActive: true,
      linkedCategoryIds: ['cat-diving', 'cat-safari', 'cat-leisure-equestrian-nile'],
      excludedCategoryIds: [],
      createdById: 'user-tarek',
      createdByName: 'طارق السويفي',
      createdByCompany: 'بلو أوشن للغوص والأنشطة البحرية',
      createdAtTime: now,
      updatedById: 'user-tarek',
      updatedByName: 'طارق السويفي',
      updatedByCompany: 'بلو أوشن للغوص والأنشطة البحرية',
      updatedAtTime: now
    },
    {
      id: 'addon-celebration-decor',
      title: 'تجهيز وتزيين مناسبة خاصة (عيد ميلاد / شهر عسل)',
      category: 'نقل وضيافة VIP',
      unitLabel: 'للمناسبة',
      suggestedPriceEGP: 950,
      suggestedPriceEUR: 28,
      description: 'تزيين بالورود والبالونات مع تورتة احتفالية وموسيقى خاصة',
      isActive: true,
      linkedCategoryIds: ['cat-marine-yacht-vip', 'cat-leisure-equestrian-nile'],
      excludedCategoryIds: [],
      createdById: 'user-ahmed',
      createdByName: 'أحمد الشناوي',
      createdByCompany: 'الشناوي مارين لليخوت والرحلات البحرية',
      createdAtTime: now,
      updatedById: 'user-ahmed',
      updatedByName: 'أحمد الشناوي',
      updatedByCompany: 'الشناوي مارين لليخوت والرحلات البحرية',
      updatedAtTime: now
    },
    {
      id: 'addon-extra-insurance',
      title: 'تغطية تأمينية شاملة للمغامرات والمقتنيات',
      category: 'تأمين وحماية',
      unitLabel: 'للفرد',
      suggestedPriceEGP: 150,
      suggestedPriceEUR: 5,
      description: 'تغطية إضافية للحوادث الشخصية والمعدات أثناء النشاط',
      isActive: true,
      linkedCategoryIds: ['cat-diving', 'cat-safari', 'cat-leisure-watersports'],
      excludedCategoryIds: [],
      createdById: 'user-mohamed',
      createdByName: 'محمد عبد الرحمن',
      createdByCompany: 'رد سي إكستريم لسفاري الصحراء والبيتش باجي',
      createdAtTime: now,
      updatedById: 'user-mohamed',
      updatedByName: 'محمد عبد الرحمن',
      updatedByCompany: 'رد سي إكستريم لسفاري الصحراء والبيتش باجي',
      updatedAtTime: now
    }
  ];
}

function readStoredMasterAddons(): MasterAddonItem[] {
  ensureOneTimeV6CleanReset();
  if (typeof window === 'undefined') return buildInitialMasterAddons();
  try {
    const cleanDone = window.localStorage.getItem(MASTER_ADDONS_V6_FLAG);
    if (!cleanDone) {
      window.localStorage.removeItem('zanoza_master_addons_v1');
      window.localStorage.setItem(MASTER_ADDONS_V6_FLAG, '1');
      const seeded = buildInitialMasterAddons();
      window.localStorage.setItem(MASTER_ADDONS_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }

    const raw = window.localStorage.getItem(MASTER_ADDONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as MasterAddonItem[];
      }
    }
  } catch {
    // ignore storage errors
  }
  return buildInitialMasterAddons();
}

export function useMasterAddonsStore(
  currentUser: AppUser,
  onAuditLog: (input: LogAuditEventInput) => void
) {
  const [masterAddons, setMasterAddons] = useState<MasterAddonItem[]>(() =>
    readStoredMasterAddons()
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(MASTER_ADDONS_STORAGE_KEY, JSON.stringify(masterAddons));
    } catch {
      // ignore storage errors
    }
  }, [masterAddons]);

  const createMasterAddon = (
    payload: Omit<
      MasterAddonItem,
      | 'id'
      | 'createdById'
      | 'createdByName'
      | 'createdByCompany'
      | 'createdAtTime'
      | 'updatedById'
      | 'updatedByName'
      | 'updatedByCompany'
      | 'updatedAtTime'
    >
  ): MasterAddonItem => {
    const created: MasterAddonItem = {
      ...payload,
      linkedCategoryIds: payload.linkedCategoryIds ?? [],
      excludedCategoryIds: payload.excludedCategoryIds ?? [],
      id: `addon-${Date.now().toString().slice(-6)}`,
      ...buildCreateAuditTrail(currentUser)
    };
    setMasterAddons((prev) => [created, ...prev]);
    onAuditLog({
      actor: currentUser,
      action: 'create',
      domain: 'addon',
      entityId: created.id,
      entityName: created.title,
      summary: `أضاف ${currentUser.name} خدمة إضافية مركزية «${created.title}» إلى المرجع الموحد`
    });
    return created;
  };

  const updateMasterAddon = (id: string, patch: Partial<MasterAddonItem>) => {
    const existing = masterAddons.find((a) => a.id === id);
    if (!existing) return;
    const updated: MasterAddonItem = {
      ...existing,
      ...patch,
      id: existing.id,
      ...buildUpdateAuditTrail(currentUser, existing)
    };
    setMasterAddons((prev) => prev.map((a) => (a.id === id ? updated : a)));
    onAuditLog({
      actor: currentUser,
      action:
        patch.isActive !== undefined &&
        patch.isActive !== existing.isActive &&
        Object.keys(patch).length === 1
          ? 'status_change'
          : 'update',
      domain: 'addon',
      entityId: updated.id,
      entityName: updated.title,
      summary: `عدّل ${currentUser.name} بيانات الخدمة الإضافية «${updated.title}»`
    });
  };

  const deleteMasterAddon = (id: string) => {
    const target = masterAddons.find((a) => a.id === id);
    setMasterAddons((prev) => prev.filter((a) => a.id !== id));
    if (target) {
      onAuditLog({
        actor: currentUser,
        action: 'delete',
        domain: 'addon',
        entityId: target.id,
        entityName: target.title,
        summary: `حذف ${currentUser.name} الخدمة الإضافية «${target.title}» من المرجع الموحد`
      });
    }
  };

  const resetMasterAddonsCatalog = () => {
    const seeded = buildInitialMasterAddons();
    setMasterAddons(seeded);
    onAuditLog({
      actor: currentUser,
      action: 'update',
      domain: 'addon',
      entityId: 'master-addons-catalog',
      entityName: 'مكتبة الإضافات المركزية',
      summary: `أعاد ${currentUser.name} تحميل القائمة المرجعية للإضافات الاختيارية بالمرجع الموحد`
    });
    return seeded;
  };

  return {
    masterAddons,
    createMasterAddon,
    updateMasterAddon,
    deleteMasterAddon,
    resetMasterAddonsCatalog
  };
}
