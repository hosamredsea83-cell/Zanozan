export interface AppUser {
  id: string;
  name: string;
  email: string;
  companyName: string;
  phone: string;
  role: string;
  tier: string;
  avatarColor: string;
  initials: string;
  avatarInitials: string;
}

export const SYSTEM_USERS: AppUser[] = [
  {
    id: 'user-ahmed',
    name: 'أحمد الشناوي',
    email: 'ahmed.shennawy@zanoza.com',
    companyName: 'الشناوي مارين لليخوت والرحلات البحرية',
    phone: '+201099234812',
    role: 'صاحب نشاط ومزوّد خدمة',
    tier: 'باقة المحترفين الذهبية',
    avatarColor: 'bg-cyan-600',
    initials: 'أش',
    avatarInitials: 'أش'
  },
  {
    id: 'user-mohamed',
    name: 'محمد عبد الرحمن',
    email: 'mohamed.abdelrahman@zanoza.com',
    companyName: 'رد سي إكستريم لسفاري الصحراء والبيتش باجي',
    phone: '+201011883390',
    role: 'صاحب نشاط ومزوّد خدمة',
    tier: 'باقة المحترفين الفضية',
    avatarColor: 'bg-amber-600',
    initials: 'مع',
    avatarInitials: 'مع'
  },
  {
    id: 'user-tarek',
    name: 'طارق السويفي',
    email: 'tarek.seweify@zanoza.com',
    companyName: 'بلو أوشن للغوص والأنشطة البحرية',
    phone: '+201055667788',
    role: 'صاحب نشاط ومزوّد خدمة',
    tier: 'باقة كبار الشركاء VIP',
    avatarColor: 'bg-emerald-600',
    initials: 'طس',
    avatarInitials: 'طس'
  }
];
