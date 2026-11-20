import type { PartnerRecord } from '../types/partner';
import { openUnifiedLocalDb, PARTNERS_STORE_NAME } from './unifiedLocalDb';

const LS_PARTNERS_FALLBACK = 'zanoza_db_partners_v1';
const TODAY_ISO = new Date().toISOString().split('T')[0];

function buildInitialPartners(): PartnerRecord[] {
  return [
    {
      id: 'prt-001',
      ownerId: 'global',
      name: 'كابتن حسام الصياد',
      companyName: 'رد سي لليخوت ومارينز الغردقة',
      phone: '+201011223344',
      email: 'hossam@redseamarines.com',
      partnerType: 'operating_partner',
      tier: 'باقة كبار الشركاء VIP',
      shareOrContractNote: 'شراكة تشغيل بحري بنسبة 70% / 30%',
      notes: 'شريك تشغيل معتمد لليخوت والرحلات البحرية الخاصة في مارينا الغردقة',
      isActive: true,
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'prt-002',
      ownerId: 'global',
      name: 'م. إبراهيم البدوي',
      companyName: 'ديزرت سفاري إيجيبت والمغامرات الصحراوية',
      phone: '+201055667788',
      email: 'ibrahim@desertsafari-eg.com',
      partnerType: 'operating_partner',
      tier: 'باقة المحترفين الفضية',
      shareOrContractNote: 'اتفاقية تشغيل مشترك لرحلات البيتش باجي والسفاري',
      notes: 'تغطية مسارات جبال البحر الأحمر ومحطات السفاري البدوية',
      isActive: true,
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'prt-003',
      ownerId: 'global',
      name: 'د. نرمين الشافعي',
      companyName: 'مركز بلو هول للغوص والمغامرات المائية',
      phone: '+201099887766',
      email: 'nermeen@bluehole-diving.com',
      partnerType: 'operating_partner',
      tier: 'باقة المؤسسات الماسية',
      shareOrContractNote: 'تعاون تشغيلي لتجهيزات الغوص والسنوركلينج المعتمدة',
      notes: 'توفير معدات PADI وأسطوانات غوص مفحوصة دورياً',
      isActive: true,
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'prt-004',
      ownerId: 'global',
      name: 'كابتن منصور الهواري',
      companyName: 'إسطبلات ونادي فروسية الأصايل بالجونة',
      phone: '+201122334455',
      email: 'mansour@alasayel-club.com',
      partnerType: 'fleet_owner',
      tier: 'باقة الشركاء المعتمدين',
      shareOrContractNote: 'مشاركة خيول عربية أصيلة لرحلات الشاطئ والغروب',
      notes: 'إسطبلات معتمدة بإشراف بيطري وتأمين للفرسان',
      isActive: true,
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'prt-005',
      ownerId: 'global',
      name: 'أ. علاء الدين الجيار',
      companyName: 'سي وورلد لتأجير الغواصات والمراكب الزجاجية',
      phone: '+201288776655',
      email: 'alaa@seaworld-rentals.com',
      partnerType: 'rental_supplier',
      tier: 'باقة الشركاء الذهبية',
      shareOrContractNote: 'عقد تأجير موسمي للوحدات البحرية البانورامية',
      notes: 'مورد ومؤجر وحدات بحرية بعقود شهرية وسنوية',
      isActive: true,
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    }
  ];
}

function readFallback(): PartnerRecord[] {
  try {
    const raw = window.localStorage.getItem(LS_PARTNERS_FALLBACK);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFallback(items: PartnerRecord[]): void {
  try {
    window.localStorage.setItem(LS_PARTNERS_FALLBACK, JSON.stringify(items));
  } catch {
    // ignore storage quota errors
  }
}

export async function loadPartnersFromDb(): Promise<PartnerRecord[]> {
  try {
    const db = await openUnifiedLocalDb();
    const rows = await new Promise<PartnerRecord[]>((resolve, reject) => {
      const tx = db.transaction(PARTNERS_STORE_NAME, 'readonly');
      const store = tx.objectStore(PARTNERS_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
      req.onerror = () => reject(req.error);
    });

    if (rows.length > 0) {
      writeFallback(rows);
      return rows;
    }

    const fallbackRows = readFallback();
    if (fallbackRows.length > 0) {
      await savePartnersToDb(fallbackRows);
      return fallbackRows;
    }

    const seeded = buildInitialPartners();
    await savePartnersToDb(seeded);
    return seeded;
  } catch {
    const fallbackRows = readFallback();
    if (fallbackRows.length > 0) return fallbackRows;
    const seeded = buildInitialPartners();
    writeFallback(seeded);
    return seeded;
  }
}

export async function savePartnersToDb(items: PartnerRecord[]): Promise<void> {
  writeFallback(items);
  try {
    const db = await openUnifiedLocalDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PARTNERS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(PARTNERS_STORE_NAME);
      store.clear();
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // localStorage fallback already persisted
  }
}
