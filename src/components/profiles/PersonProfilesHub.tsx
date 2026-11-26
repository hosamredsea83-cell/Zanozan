import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  Bike,
  Building2,
  Check,
  CheckCircle2,
  Coins,
  Compass,
  CreditCard,
  Edit3,
  Lock,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  X
} from 'lucide-react';
import type { Activity } from '../../types/activity';
import type { AppUser } from '../../types/auth';
import type { EquipmentItem } from '../../types/equipment';
import { LOGISTICS_CATEGORY_LABELS, type LogisticsVehicle } from '../../types/logistics';
import type { SupplierPricingJournalEntry } from '../../types/supplierJournal';
import type { TripRecord } from '../../types/trip';
import {
  type BilateralLedgerEntry,
  type BilateralLedgerEntryType,
  type PersonProfile,
  type PersonProfileRole,
  PERSON_ROLE_LABELS,
  PERSON_STATUS_LABELS,
  normalizePhoneNumber
} from '../../types/personProfile';
import {
  canEditPersonProfileControls,
  canViewPersonProfile
} from '../../utils/assetCustodyHelpers';
import type {
  CreateOrUpdateProfileInput,
  PhoneSignupClaimInput
} from '../../hooks/usePersonProfilesStore';
import type { NavigationItemKey } from '../layout/Sidebar';

interface PersonProfilesHubProps {
  currentUser: AppUser;
  allPlatformUsers: AppUser[];
  personProfiles: PersonProfile[];
  bilateralLedger: BilateralLedgerEntry[];
  pendingClaimsForCurrentUser: PersonProfile[];
  outgoingClaimsForCurrentUser: PersonProfile[];
  activities: Activity[];
  trips: TripRecord[];
  equipments: EquipmentItem[];
  logisticsVehicles: LogisticsVehicle[];
  supplierJournals?: SupplierPricingJournalEntry[];
  onCreateOrUpdateProfile: (input: CreateOrUpdateProfileInput) => Promise<PersonProfile>;
  onRequestPhoneSignup: (input: PhoneSignupClaimInput) => Promise<{
    outcome: 'claim_requested' | 'new_member' | 'already_subscribed';
    profile: PersonProfile;
    user: AppUser;
  }>;
  onApproveClaim: (profileId: string) => Promise<{
    profile: PersonProfile;
    user: AppUser;
    isolatedCounts: {
      activities: number;
      trips: number;
      equipments: number;
      vehicles: number;
      sharedLedgerEntries: number;
    };
  } | null>;
  onRejectClaim: (profileId: string) => Promise<void>;
  onAddLedgerEntry: (input: {
    profile: PersonProfile;
    entryType: BilateralLedgerEntryType;
    sourceType: 'manual_payment' | 'operational_cost' | 'equipment_rental' | 'vehicle_trip';
    amountEGP: number;
    currency: 'EGP' | 'EUR';
    originalAmount: number;
    entityName?: string;
    date?: string;
    notes?: string;
  }) => Promise<BilateralLedgerEntry>;
  onDeleteLedgerEntry: (entryId: string) => Promise<void>;
  onOpenAddEquipmentForProfile?: (profile: PersonProfile) => void;
  onOpenAddVehicleForProfile?: (profile: PersonProfile) => void;
  onSwitchUser?: (user: AppUser) => void;
  onNavigate?: (key: NavigationItemKey) => void;
}

type DetailTab = 'overview' | 'assets' | 'ledger';

const ALL_ROLES: PersonProfileRole[] = [
  'activity_owner',
  'equipment_owner',
  'quad_owner',
  'driver_vehicle_owner',
  'crew_rep',
  'platform_member'
];

export const PersonProfilesHub: React.FC<PersonProfilesHubProps> = ({
  currentUser,
  allPlatformUsers,
  personProfiles,
  bilateralLedger,
  pendingClaimsForCurrentUser,
  outgoingClaimsForCurrentUser,
  activities,
  trips,
  equipments,
  logisticsVehicles,
  supplierJournals = [],
  onCreateOrUpdateProfile,
  onRequestPhoneSignup,
  onApproveClaim,
  onRejectClaim,
  onAddLedgerEntry,
  onDeleteLedgerEntry,
  onOpenAddEquipmentForProfile,
  onOpenAddVehicleForProfile,
  onSwitchUser,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<PersonProfileRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Create / Edit Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | undefined>(undefined);
  const [profileForm, setProfileForm] = useState<{
    name: string;
    companyName: string;
    phone: string;
    email: string;
    tier: string;
    roles: PersonProfileRole[];
    notes: string;
  }>({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    tier: '',
    roles: ['activity_owner'],
    notes: ''
  });

  // Phone Signup Verification Modal State
  const [showPhoneSignupModal, setShowPhoneSignupModal] = useState(false);
  const [signupForm, setSignupForm] = useState<{
    name: string;
    companyName: string;
    phone: string;
    email: string;
    roles: PersonProfileRole[];
  }>({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    roles: ['driver_vehicle_owner']
  });

  // Quick Ledger Add Form State
  const [ledgerEntryType, setLedgerEntryType] = useState<BilateralLedgerEntryType>('debit_paid_to_person');
  const [ledgerAmount, setLedgerAmount] = useState<string>('');
  const [ledgerEntityName, setLedgerEntityName] = useState('');
  const [ledgerNotes, setLedgerNotes] = useState('');

  const notify = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 4200);
  };

  // Visible profiles for current user
  const visibleProfiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return personProfiles
      .filter((p) => canViewPersonProfile(p, currentUser))
      .filter((p) => {
        if (roleFilter !== 'all' && !p.roles.includes(roleFilter)) return false;
        if (statusFilter !== 'all' && p.subscriptionStatus !== statusFilter) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.companyName.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Pending claims first, then external_pending, then native/isolated
        const rank = (s: PersonProfile['subscriptionStatus']) =>
          s === 'claim_requested' ? 0 : s === 'external_pending' ? 1 : s === 'subscribed_isolated' ? 2 : 3;
        return rank(a.subscriptionStatus) - rank(b.subscriptionStatus);
      });
  }, [personProfiles, currentUser, searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    if (visibleProfiles.length === 0) {
      setSelectedProfileId(null);
      return;
    }
    if (!selectedProfileId || !visibleProfiles.some((p) => p.id === selectedProfileId)) {
      setSelectedProfileId(visibleProfiles[0].id);
    }
  }, [visibleProfiles, selectedProfileId]);

  const selectedProfile = useMemo(
    () => visibleProfiles.find((p) => p.id === selectedProfileId) || null,
    [visibleProfiles, selectedProfileId]
  );

  const canEditSelectedControls = selectedProfile
    ? canEditPersonProfileControls(selectedProfile, currentUser)
    : false;

  // Assets belonging to selectedProfile
  const profileAssets = useMemo(() => {
    if (!selectedProfile) {
      return {
        activities: [] as Activity[],
        trips: [] as TripRecord[],
        quads: [] as EquipmentItem[],
        equipments: [] as EquipmentItem[],
        vehicles: [] as LogisticsVehicle[]
      };
    }
    const cleanPhone = normalizePhoneNumber(selectedProfile.phone);

    const matchedActivities = activities.filter(
      (a) =>
        a.supplierCustody?.supplierId === selectedProfile.id ||
        a.owner?.id === selectedProfile.id ||
        (selectedProfile.linkedUserId && a.owner?.id === selectedProfile.linkedUserId) ||
        (cleanPhone && normalizePhoneNumber(a.owner?.phone) === cleanPhone)
    );

    const matchedTrips = trips.filter(
      (t) =>
        t.supplierCustody?.supplierId === selectedProfile.id ||
        t.owner?.id === selectedProfile.id ||
        (selectedProfile.linkedUserId && t.owner?.id === selectedProfile.linkedUserId) ||
        (cleanPhone && normalizePhoneNumber(t.owner?.phone) === cleanPhone)
    );

    const matchedEquipmentsAll = equipments.filter(
      (eq) =>
        eq.personCustody?.personProfileId === selectedProfile.id ||
        eq.partnerId === selectedProfile.id ||
        (selectedProfile.linkedUserId && eq.ownerId === selectedProfile.linkedUserId)
    );

    const quads = matchedEquipmentsAll.filter(
      (eq) =>
        eq.typeId === 'eqt-safari_vehicle' ||
        eq.linkedCategoryIds?.includes('cat-safari-quad') ||
        eq.classification.includes('باجي') ||
        eq.classification.includes('كواد')
    );

    const standardEquipments = matchedEquipmentsAll.filter((eq) => !quads.some((q) => q.id === eq.id));

    const matchedVehicles = logisticsVehicles.filter(
      (v) =>
        v.personCustody?.personProfileId === selectedProfile.id ||
        v.partnerId === selectedProfile.id ||
        (selectedProfile.linkedUserId && v.ownerId === selectedProfile.linkedUserId) ||
        (cleanPhone && normalizePhoneNumber(v.driverPhone) === cleanPhone)
    );

    return {
      activities: matchedActivities,
      trips: matchedTrips,
      quads,
      equipments: standardEquipments,
      vehicles: matchedVehicles
    };
  }, [selectedProfile, activities, trips, equipments, logisticsVehicles]);

  // Bilateral financial ledger entries visible for currentUser + selectedProfile
  const selectedLedgerEntries = useMemo(() => {
    if (!selectedProfile) return [];
    return bilateralLedger.filter((entry) => {
      if (entry.profileId !== selectedProfile.id) return false;
      // Show entries where currentUser is either the counterparty operator or the claimed owner
      return (
        entry.counterpartyUserId === currentUser.id ||
        entry.claimedUserId === currentUser.id ||
        selectedProfile.linkedUserId === currentUser.id ||
        selectedProfile.addedByUserId === currentUser.id
      );
    });
  }, [bilateralLedger, selectedProfile, currentUser.id]);

  const ledgerSummary = useMemo(() => {
    let totalCredit = 0; // له
    let totalDebit = 0; // عليه / سداد
    for (const e of selectedLedgerEntries) {
      if (e.entryType === 'credit_payable_to_person') totalCredit += e.amountEGP;
      else if (e.entryType === 'debit_paid_to_person') totalDebit += e.amountEGP;
    }
    return {
      totalCredit,
      totalDebit,
      netPayableToPerson: totalCredit - totalDebit
    };
  }, [selectedLedgerEntries]);

  const selectedJournals = useMemo(() => {
    if (!selectedProfile) return [];
    return supplierJournals.filter((j) => j.supplierId === selectedProfile.id);
  }, [supplierJournals, selectedProfile]);

  const openCreateModal = () => {
    setEditingProfileId(undefined);
    setProfileForm({
      name: '',
      companyName: '',
      phone: '+2010',
      email: '',
      tier: '',
      roles: ['activity_owner'],
      notes: ''
    });
    setShowProfileModal(true);
  };

  const openEditModal = (profile: PersonProfile) => {
    setEditingProfileId(profile.id);
    setProfileForm({
      name: profile.name,
      companyName: profile.companyName,
      phone: profile.phone,
      email: profile.email || '',
      tier: profile.tier || '',
      roles: profile.roles,
      notes: profile.notes || ''
    });
    setShowProfileModal(true);
  };

  const handleSaveProfileModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.phone.trim()) return;
    const saved = await onCreateOrUpdateProfile({
      id: editingProfileId,
      name: profileForm.name,
      companyName: profileForm.companyName,
      phone: profileForm.phone,
      email: profileForm.email,
      tier: profileForm.tier,
      roles: profileForm.roles.length > 0 ? profileForm.roles : ['activity_owner'],
      notes: profileForm.notes
    });
    setSelectedProfileId(saved.id);
    setShowProfileModal(false);
    notify(
      editingProfileId
        ? `تم تحديث الملف الشخصي لـ «${saved.name}».`
        : `تم إنشاء الملف الشخصي لـ «${saved.name}» بنجاح.`
    );
  };

  const handleSubmitPhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.name.trim() || !signupForm.phone.trim()) return;
    const res = await onRequestPhoneSignup({
      name: signupForm.name,
      companyName: signupForm.companyName,
      phone: signupForm.phone,
      email: signupForm.email,
      roles: signupForm.roles
    });
    setShowPhoneSignupModal(false);
    setSelectedProfileId(res.profile.id);
    if (res.outcome === 'claim_requested') {
      notify(
        `تمت مطابقة رقم الهاتف! أُرسلت رسالة التحقق إلى «${res.profile.addedByUserName}» لاعتماد عزل التحكم مع إبقاء الحسابات المالية مشتركة.`
      );
    } else if (res.outcome === 'new_member') {
      notify(`تم تسجيل اشتراك «${res.user.name}» وإنشاء ملفه الشخصي المباشر بالمنصة.`);
    } else {
      notify(`هذا الحساب مشترك ومعتمد بالفعل بالمنصة.`);
    }
  };

  const handleApproveClaimClick = async (profileId: string) => {
    const res = await onApproveClaim(profileId);
    if (!res) return;
    notify(
      `تم اعتماد المطابقة وعزل وحدات التحكم لـ «${res.profile.name}» (${res.isolatedCounts.activities} نشاط · ${res.isolatedCounts.equipments} معدة/باجي · ${res.isolatedCounts.vehicles} سيارة)، مع إبقاء كشف الحساب المشترك متصلًا.`
    );
  };

  const handleAddLedgerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    const val = parseFloat(ledgerAmount);
    if (!val || val <= 0) return;
    await onAddLedgerEntry({
      profile: selectedProfile,
      entryType: ledgerEntryType,
      sourceType: 'manual_payment',
      amountEGP: val,
      currency: 'EGP',
      originalAmount: val,
      entityName: ledgerEntityName,
      notes: ledgerNotes
    });
    setLedgerAmount('');
    setLedgerEntityName('');
    setLedgerNotes('');
    notify(
      ledgerEntryType === 'debit_paid_to_person'
        ? 'تم تسجيل دفعة السداد في كشف الحساب المشترك.'
        : 'تم تسجيل المستحق الجديد في كشف الحساب المشترك.'
    );
  };

  const toggleRoleInForm = (
    role: PersonProfileRole,
    currentRoles: PersonProfileRole[],
    setter: (next: PersonProfileRole[]) => void
  ) => {
    if (currentRoles.includes(role)) {
      if (currentRoles.length === 1) return;
      setter(currentRoles.filter((r) => r !== role));
    } else {
      setter([...currentRoles, role]);
    }
  };

  const linkedUserObj = selectedProfile?.linkedUserId
    ? allPlatformUsers.find((u) => u.id === selectedProfile.linkedUserId)
    : undefined;

  return (
    <div className="space-y-6 animate-fade-in">
      {toastMsg && (
        <aside
          role="status"
          className="fixed bottom-6 left-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 max-w-md"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </aside>
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>الملفات الشخصية والموردين</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            ملف شخصي موحد لكل فرد بالمنصة (مشترك، مالك نشاط، مالك معدة، مالك باتش باجي، سائق، أو طاقم تشغيل) مع التحقق بمطابقة الهاتف، وعزل وحدات التحكم بعد الموافقة مع بقاء كشف الحساب «ما له وما عليه» متصلاً بين الطرفين.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowPhoneSignupModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>تسجيل اشتراك بمطابقة الهاتف</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ إضافة ملف شخصي / مورد</span>
          </button>
        </div>
      </div>

      {/* Incoming Verification & Claim Approval Alerts (to Original Subscriber) */}
      {pendingClaimsForCurrentUser.length > 0 && (
        <div className="space-y-3">
          {pendingClaimsForCurrentUser.map((claimProfile) => (
            <div
              key={claimProfile.id}
              className="bg-amber-950/25 border border-amber-500/40 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>إشعار مطابقة هاتف وطلب عزل وحدات التحكم</span>
                  <span className="text-slate-500">·</span>
                  <span className="font-mono text-white" dir="ltr">
                    {claimProfile.pendingClaim?.requestedPhone}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {claimProfile.pendingClaim?.message}
                </p>
                <div className="text-[11px] text-slate-400">
                  المشترك المسجل: <strong className="text-white">{claimProfile.pendingClaim?.requestedUserName}</strong> ·{' '}
                  {claimProfile.pendingClaim?.requestedCompany} ·{' '}
                  عند القبول يتم عزل التعديل والأسعار والممتلكات لحسابه مع بقاء الحسابات المالية «ما له وما عليه» مشتركة بينكما.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleApproveClaimClick(claimProfile.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>قبول واعتماد عزل التحكم</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRejectClaim(claimProfile.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>رفض</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outgoing Pending Verification Banner (if new user is waiting on original subscriber approval) */}
      {outgoingClaimsForCurrentUser.length > 0 && (
        <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-4 space-y-1">
          {outgoingClaimsForCurrentUser.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 text-xs">
              <div className="text-slate-300">
                طلب ربط وعزل ملف <strong className="text-white">«{p.name}»</strong> بانتظار موافقة المشترك الأصلي{' '}
                <strong className="text-cyan-300">{p.addedByUserName}</strong>.
              </div>
              <span className="font-mono text-[11px] text-amber-300" dir="ltr">
                {p.phone}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Master-Detail Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Directory Column */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، الشركة، أو رقم الهاتف..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as PersonProfileRole | 'all')}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">كل الأدوار ({personProfiles.length})</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {PERSON_ROLE_LABELS[r]}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">كل الحالات</option>
              <option value="external_pending">مضاف لحين الاشتراك</option>
              <option value="claim_requested">طلب تحقق معلق</option>
              <option value="subscribed_isolated">مشترك ومعزول</option>
              <option value="native_member">عضو أساسي</option>
            </select>
          </div>

          <div className="divide-y divide-slate-800/70 max-h-[580px] overflow-y-auto">
            {visibleProfiles.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                لا توجد ملفات مطابقة لبحثك الحالي.
              </div>
            ) : (
              visibleProfiles.map((profile) => {
                const isSelected = profile.id === selectedProfile?.id;
                const cleanPh = normalizePhoneNumber(profile.phone);
                const personLedger = bilateralLedger.filter(
                  (e) =>
                    e.profileId === profile.id &&
                    (e.counterpartyUserId === currentUser.id ||
                      e.claimedUserId === currentUser.id ||
                      profile.addedByUserId === currentUser.id ||
                      profile.linkedUserId === currentUser.id)
                );
                const credit = personLedger
                  .filter((e) => e.entryType === 'credit_payable_to_person')
                  .reduce((s, e) => s + e.amountEGP, 0);
                const debit = personLedger
                  .filter((e) => e.entryType === 'debit_paid_to_person')
                  .reduce((s, e) => s + e.amountEGP, 0);
                const net = credit - debit;

                const eqCount = equipments.filter(
                  (eq) =>
                    eq.personCustody?.personProfileId === profile.id || eq.partnerId === profile.id
                ).length;
                const vehCount = logisticsVehicles.filter(
                  (v) =>
                    v.personCustody?.personProfileId === profile.id ||
                    v.partnerId === profile.id ||
                    (cleanPh && normalizePhoneNumber(v.driverPhone) === cleanPh)
                ).length;

                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => {
                      setSelectedProfileId(profile.id);
                    }}
                    className={`w-full text-right p-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/10 text-white'
                        : 'hover:bg-slate-950/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{profile.name}</span>
                          {profile.subscriptionStatus === 'subscribed_isolated' && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          {profile.subscriptionStatus === 'claim_requested' && (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {profile.companyName}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 shrink-0" dir="ltr">
                        {profile.phone}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                      <span className="truncate">
                        {profile.roles.map((r) => PERSON_ROLE_LABELS[r]).join(' · ')}
                      </span>
                      <span className="font-mono tabular-nums text-slate-300 shrink-0">
                        {eqCount + vehCount > 0 ? `${eqCount + vehCount} أصل` : PERSON_STATUS_LABELS[profile.subscriptionStatus]}
                        {net !== 0 && ` · صافي ${net.toLocaleString()} ج.م`}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="lg:col-span-8">
          {!selectedProfile ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">اختر شخصاً أو مورداً لعرض ملفه الشخصي</p>
              <p className="text-xs text-slate-400">
                يمكنك إضافة ملف شخصي جديد لأي مالك نشاط أو باتش باجي أو معدة أو سائق سيارة والبدء بإدارة أصوله وحسابه المالي المشترك.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Profile Top Header */}
              <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{selectedProfile.name}</h2>
                    <span className="text-slate-600">·</span>
                    <span
                      className={`text-xs font-semibold ${
                        selectedProfile.subscriptionStatus === 'subscribed_isolated'
                          ? 'text-emerald-400'
                          : selectedProfile.subscriptionStatus === 'claim_requested'
                          ? 'text-amber-300'
                          : selectedProfile.subscriptionStatus === 'native_member'
                          ? 'text-cyan-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {PERSON_STATUS_LABELS[selectedProfile.subscriptionStatus]}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>{selectedProfile.companyName}</span>
                    <span>·</span>
                    <span className="font-mono text-cyan-400" dir="ltr">
                      {selectedProfile.phone}
                    </span>
                    <span>·</span>
                    <span>{selectedProfile.roles.map((r) => PERSON_ROLE_LABELS[r]).join(' · ')}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {linkedUserObj && onSwitchUser && linkedUserObj.id !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => onSwitchUser(linkedUserObj)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>معاينة بحساب {linkedUserObj.name.split(' ')[0]}</span>
                    </button>
                  )}

                  {canEditSelectedControls && (
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedProfile)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل البيانات</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Control Isolation Status Notice */}
              {!canEditSelectedControls && (
                <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2.5 text-xs text-amber-300">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>
                    وحدات التحكم والتعديل والأسعار والأصول معزولة الآن تحت الإدارة المستقلة لحساب المشترك «{selectedProfile.name}». يظل <strong>كشف الحساب المشترك (ما له وما عليه)</strong> متصلاً ومتاحاً للمتابعة والتسوية بينكما.
                  </span>
                </div>
              )}

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-950/30">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'overview'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  البيانات والصلاحيات
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('assets')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'assets'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  الأصول والممتلكات (
                  {profileAssets.activities.length +
                    profileAssets.trips.length +
                    profileAssets.quads.length +
                    profileAssets.equipments.length +
                    profileAssets.vehicles.length}
                  )
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ledger')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'ledger'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  كشف الحساب المشترك «ما له وما عليه» ({selectedLedgerEntries.length})
                </button>
              </div>

              {/* TAB 1: Overview & Permissions */}
              {activeTab === 'overview' && (
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="text-[11px] text-slate-400">معلومات الهوية والتواصل</div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">الاسم الكامل</span>
                        <span className="font-bold text-white">{selectedProfile.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">الشركة / الجهة</span>
                        <span className="text-slate-200">{selectedProfile.companyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">رقم الهاتف المعتمد للمطابقة</span>
                        <span className="font-mono text-cyan-400" dir="ltr">
                          {selectedProfile.phone}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">التصنيف / الباقة</span>
                        <span className="text-slate-200">{selectedProfile.tier}</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="text-[11px] text-slate-400">حالة العهدة وعزل وحدات التحكم</div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">المشترك المُضيف</span>
                        <span className="text-slate-200">{selectedProfile.addedByUserName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">حالة الاشتراك</span>
                        <span className="font-semibold text-cyan-300">
                          {PERSON_STATUS_LABELS[selectedProfile.subscriptionStatus]}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">الحساب المستقل بالمنصة</span>
                        <span className="font-mono text-slate-300">
                          {selectedProfile.linkedUserId || 'غير مشترك بعد'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">الربط المحاسبي</span>
                        <span className="text-emerald-400 font-semibold">
                          متصل دائماً (ما له وما عليه)
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedProfile.notes && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
                      <span className="text-slate-500 block text-[11px] mb-1">ملاحظات الملف</span>
                      {selectedProfile.notes}
                    </div>
                  )}

                  {selectedProfile.subscriptionStatus === 'external_pending' && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-slate-300">
                        هذا الشخص مضاف مؤقتاً بواسطتك لحين اشتراكه بالمنصة برقم الهاتف{' '}
                        <span className="font-mono text-cyan-400" dir="ltr">
                          {selectedProfile.phone}
                        </span>
                        .
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSignupForm({
                            name: selectedProfile.name,
                            companyName: selectedProfile.companyName,
                            phone: selectedProfile.phone,
                            email: selectedProfile.email || '',
                            roles: selectedProfile.roles
                          });
                          setShowPhoneSignupModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>محاكاة اشتراكه بهذا الهاتف</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Assets (Direct Navigation to Equipment Management & Logistics) */}
              {activeTab === 'assets' && (
                <div className="p-5 space-y-5">
                  {canEditSelectedControls && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-200 block">
                          إضافة أصل تشغيلي وربطه تلقائياً بملف «{selectedProfile.name}»:
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          اختَر «إضافة معدة» لتحديد النوع (يخت · مركب · لانش · باتش باجي ...) من إدارة المعدات، أو «إضافة سيارة» في بند اللوجستيات.
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenAddEquipmentForProfile) {
                              onOpenAddEquipmentForProfile(selectedProfile);
                            } else {
                              onNavigate?.('activity_equipment_add');
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>+ إضافة معدة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenAddVehicleForProfile) {
                              onOpenAddVehicleForProfile(selectedProfile);
                            } else {
                              onNavigate?.('logistics_add');
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>+ إضافة سيارة / وسيلة نقل</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Linked Asset Groups */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Activities & Trips */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-cyan-400" />
                          <span>الأنشطة والرحلات ({profileAssets.activities.length + profileAssets.trips.length})</span>
                        </span>
                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => onNavigate('activity_manage')}
                            className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                          >
                            سجل الأنشطة
                          </button>
                        )}
                      </div>
                      {profileAssets.activities.length === 0 && profileAssets.trips.length === 0 ? (
                        <p className="text-[11px] text-slate-500">لا توجد أنشطة أو رحلات مرتبطة بعد.</p>
                      ) : (
                        <div className="divide-y divide-slate-800/70">
                          {profileAssets.activities.map((a) => (
                            <div key={a.id} className="py-2 flex items-center justify-between gap-2">
                              <span className="text-slate-200 font-medium truncate">{a.name}</span>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                نشاط · {a.pricing?.egyptianB2C?.adultEGP || 0} ج.م
                              </span>
                            </div>
                          ))}
                          {profileAssets.trips.map((t) => (
                            <div key={t.id} className="py-2 flex items-center justify-between gap-2">
                              <span className="text-slate-200 font-medium truncate">{t.name}</span>
                              <span className="text-[10px] font-mono text-amber-300 shrink-0">
                                رحلة · {t.pricing?.egyptianB2C?.adultEGP || 0} ج.م
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quads & Equipments */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Bike className="w-4 h-4 text-amber-400" />
                          <span>المعدات والباتش باجي ({profileAssets.quads.length + profileAssets.equipments.length})</span>
                        </span>
                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => onNavigate('activity_equipment_manage')}
                            className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                          >
                            سجل المعدات
                          </button>
                        )}
                      </div>
                      {profileAssets.quads.length === 0 && profileAssets.equipments.length === 0 ? (
                        <p className="text-[11px] text-slate-500">لا توجد معدات أو باتش باجي مسجلة لهذا الشخص.</p>
                      ) : (
                        <div className="divide-y divide-slate-800/70">
                          {profileAssets.quads.map((q) => (
                            <div key={q.id} className="py-2 flex items-center justify-between gap-2">
                              <span className="text-amber-200 font-medium truncate">{q.name}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                باتش باجي · {q.operationalData?.serialOrRegistrationNo || q.id}
                              </span>
                            </div>
                          ))}
                          {profileAssets.equipments.map((eq) => (
                            <div key={eq.id} className="py-2 flex items-center justify-between gap-2">
                              <span className="text-slate-200 font-medium truncate">{eq.name}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                معدة · {eq.classification || eq.id}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Vehicles */}
                    <div className="md:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-emerald-400" />
                          <span>السيارات ووسائل النقل ({profileAssets.vehicles.length})</span>
                        </span>
                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => onNavigate('logistics_manage')}
                            className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                          >
                            سجل اللوجستيات
                          </button>
                        )}
                      </div>
                      {profileAssets.vehicles.length === 0 ? (
                        <p className="text-[11px] text-slate-500">لا توجد سيارات أو وسائل نقل مسجلة لهذا الشخص.</p>
                      ) : (
                        <div className="divide-y divide-slate-800/70">
                          {profileAssets.vehicles.map((v) => (
                            <div key={v.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="text-white font-semibold">{v.name}</span>
                                <span className="text-slate-500 mx-1.5">·</span>
                                <span className="text-slate-400">{LOGISTICS_CATEGORY_LABELS[v.category]}</span>
                                <span className="text-slate-500 mx-1.5">·</span>
                                <span className="font-mono text-slate-400">{v.plateOrCode}</span>
                              </div>
                              <span className="text-[11px] font-mono text-emerald-400">
                                {v.pricePerTripEGP.toLocaleString()} ج.م / مشوار · {v.passengerCapacity} راكب
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Shared Bilateral Financial Ledger («ما له وما عليه») */}
              {activeTab === 'ledger' && (
                <div className="p-5 space-y-5">
                  {/* Continuous Shared Accounting Notice */}
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-200">
                      <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>كشف حساب مشترك متصل (ما له وما عليه):</strong> تُرحَّل إليه مستحقات «التكلفة التشغيلية» والمدفوعات اليدوية ويظل متاحاً للطرفين حتى بعد عزل وحدات التحكم.
                      </span>
                    </div>
                  </div>

                  {/* Summary KPIs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                      <span className="text-[11px] text-slate-400 block">إجمالي ما له (مستحقات)</span>
                      <span className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-1 block">
                        {ledgerSummary.totalCredit.toLocaleString()} ج.م
                      </span>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                      <span className="text-[11px] text-slate-400 block">إجمالي ما عليه / السداد</span>
                      <span className="text-lg font-bold font-mono tabular-nums text-amber-300 mt-1 block">
                        {ledgerSummary.totalDebit.toLocaleString()} ج.م
                      </span>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                      <span className="text-[11px] text-slate-400 block">الصافي المتبقي بينكما</span>
                      <span
                        className={`text-lg font-bold font-mono tabular-nums mt-1 block ${
                          ledgerSummary.netPayableToPerson >= 0 ? 'text-cyan-300' : 'text-rose-300'
                        }`}
                      >
                        {ledgerSummary.netPayableToPerson.toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>

                  {/* Quick Record Payment / Receivable Form (Always available to both counterparties!) */}
                  <form
                    onSubmit={handleAddLedgerSubmit}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs"
                  >
                    <div className="sm:col-span-3">
                      <label className="text-[11px] text-slate-400 block mb-1">نوع الحركة</label>
                      <select
                        value={ledgerEntryType}
                        onChange={(e) => setLedgerEntryType(e.target.value as BilateralLedgerEntryType)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                      >
                        <option value="debit_paid_to_person">سداد / دفعة منصرفة (عليه)</option>
                        <option value="credit_payable_to_person">مستحق جديد (له)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 block mb-1">المبلغ (ج.م)</label>
                      <input
                        type="number"
                        min={1}
                        step="any"
                        required
                        value={ledgerAmount}
                        onChange={(e) => setLedgerAmount(e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] text-slate-400 block mb-1">النشاط / المرجع</label>
                      <input
                        type="text"
                        value={ledgerEntityName}
                        onChange={(e) => setLedgerEntityName(e.target.value)}
                        placeholder="مثال: رحلة سفاري صباحية"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 block mb-1">بيان / ملاحظة</label>
                      <input
                        type="text"
                        value={ledgerNotes}
                        onChange={(e) => setLedgerNotes(e.target.value)}
                        placeholder="دفعة كاش / تحويل"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>قيد مالي</span>
                      </button>
                    </div>
                  </form>

                  {/* Ledger Table */}
                  {selectedLedgerEntries.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      لا توجد قيود مالية مسجلة بينك وبين «{selectedProfile.name}» بعد. يمكنك تعيين بنود من «التكلفة التشغيلية» أو إضافة قيد مالي مباشر أعلاه.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">التاريخ</th>
                            <th className="py-2.5 px-3">النوع</th>
                            <th className="py-2.5 px-3">النشاط / البيان</th>
                            <th className="py-2.5 px-3">القيمة (ج.م)</th>
                            <th className="py-2.5 px-3">سُجل بواسطة</th>
                            <th className="py-2.5 px-3 text-left">إجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                          {selectedLedgerEntries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-slate-950/50">
                              <td className="py-2.5 px-3 font-mono text-slate-400">{entry.date}</td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`font-bold ${
                                    entry.entryType === 'credit_payable_to_person'
                                      ? 'text-emerald-400'
                                      : 'text-amber-300'
                                  }`}
                                >
                                  {entry.entryType === 'credit_payable_to_person' ? 'له (مستحق)' : 'عليه (سداد)'}
                                </span>
                                <span className="text-slate-500 block text-[10px]">
                                  {entry.sourceType === 'operational_cost' ? 'التكلفة التشغيلية' : 'قيد مباشر'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-200">
                                {entry.entityName && <div className="font-semibold text-white">{entry.entityName}</div>}
                                <div className="text-[11px] text-slate-400">{entry.notes || '—'}</div>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold tabular-nums text-white">
                                {entry.amountEGP.toLocaleString()} ج.م
                              </td>
                              <td className="py-2.5 px-3 text-slate-400">{entry.recordedByUserName}</td>
                              <td className="py-2.5 px-3 text-left">
                                {entry.recordedByUserId === currentUser.id && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteLedgerEntry(entry.id)}
                                    className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                                    title="حذف القيد"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Legacy Supplier Pricing Journal Snapshot (if present) */}
                  {selectedJournals.length > 0 && (
                    <div className="border-t border-slate-800 pt-4 space-y-2">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                        <span>سجل يوميات تسعير الأنشطة والرحلات ({selectedJournals.length})</span>
                      </h4>
                      <div className="divide-y divide-slate-800/70 border border-slate-800 rounded-xl bg-slate-950/40">
                        {selectedJournals.map((j) => (
                          <div key={j.id} className="p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div>
                              <span className="font-bold text-white">{j.entityName}</span>
                              <span className="text-slate-500 mx-1.5">·</span>
                              <span className="text-slate-400">{j.notes}</span>
                            </div>
                            <span className="font-mono text-cyan-300">
                              {j.pricingSnapshot?.egyptianB2C?.adultEGP || 0} ج.م / €
                              {j.pricingSnapshot?.foreignerB2C?.adultEUR || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Create / Edit Person Profile */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProfileModal}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <span>{editingProfileId ? 'تعديل بيانات الملف الشخصي' : 'إضافة ملف شخصي / مورد جديد'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="مثال: أسامة محمد (سائق / مالك باجي)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">اسم الشركة / المكتب</label>
                <input
                  type="text"
                  value={profileForm.companyName}
                  onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                  placeholder="مثال: سفاري الغردقة جروب"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  رقم الهاتف (مفتاح المطابقة) *
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+2010..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">التصنيف / الاتفاق</label>
                <input
                  type="text"
                  value={profileForm.tier}
                  onChange={(e) => setProfileForm({ ...profileForm, tier: e.target.value })}
                  placeholder="مورد خارجي / متعاقد"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">الأدوار في المنصة</label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_ROLES.map((role) => {
                  const checked = profileForm.roles.includes(role);
                  return (
                    <label
                      key={role}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-colors ${
                        checked
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleRoleInForm(role, profileForm.roles, (next) =>
                            setProfileForm({ ...profileForm, roles: next })
                          )
                        }
                        className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                      />
                      <span>{PERSON_ROLE_LABELS[role]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">ملاحظات</label>
              <textarea
                rows={2}
                value={profileForm.notes}
                onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
                placeholder="تفاصيل التعاقد أو خطوط السير أو أسعار التشغيل المتفق عليها..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
              >
                حفظ الملف الشخصي
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 2: Phone-Matched Platform Signup & Verification Request */}
      {showPhoneSignupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitPhoneSignup}
            className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-5 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>تسجيل اشتراك جديد بمطابقة رقم الهاتف</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPhoneSignupModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              عند تسجيل شخص برقم هاتفه، تبحث المنصة تلقائياً عن ملفه المضاف مسبقاً؛ وإذا تطابق الرقم تُرسل رسالة تحقق إلى المشترك الذي أضافه لعزل وحدات التحكم بعد الموافقة مع بقاء الحساب المالي «ما له وما عليه» متصلاً.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">اسم المشترك الجديد *</label>
                <input
                  type="text"
                  required
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  placeholder="الاسم الكامل"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">اسم الشركة / النشاط</label>
                <input
                  type="text"
                  value={signupForm.companyName}
                  onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })}
                  placeholder="اسم الشركة"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1">
                  رقم الهاتف للمطابقة الفورية *
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={signupForm.phone}
                  onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  placeholder="+2010..."
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">نشاط المشترك</label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_ROLES.map((role) => {
                  const checked = signupForm.roles.includes(role);
                  return (
                    <label
                      key={role}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer ${
                        checked
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleRoleInForm(role, signupForm.roles, (next) =>
                            setSignupForm({ ...signupForm, roles: next })
                          )
                        }
                        className="rounded border-slate-700 bg-slate-900 text-amber-500"
                      />
                      <span>{PERSON_ROLE_LABELS[role]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPhoneSignupModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>تنفيذ التسجيل ومطابقة الهاتف</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
