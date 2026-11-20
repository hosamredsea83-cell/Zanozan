import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Truck,
  Plus,
  Edit3,
  Trash2,
  MapPin,
  Users,
  Phone,
  CheckCircle2,
  X,
  ArrowRight,
  Snowflake,
  Navigation,
  Compass,
  ExternalLink
} from 'lucide-react';
import type { Activity } from '../../types/activity';
import type { AppUser } from '../../types/auth';
import type { PartnerRecord } from '../../types/partner';
import type { Asset } from '../MediaUploadSection';
import { StandardMediaUploader } from '../shared/StandardMediaUploader';
import {
  RegistryColumnFilterDropdown,
  RegistryFilterOption,
  RegistryFilterSummaryBar,
  RegistrySortIcon,
  useRegistryTableState
} from '../shared/RegistryTableControls';
import {
  LOGISTICS_CATEGORY_LABELS,
  LOGISTICS_OWNERSHIP_LABELS,
  LOGISTICS_STATUS_LABELS,
  LogisticsMediaItem,
  LogisticsOwnershipType,
  LogisticsVehicle,
  LogisticsVehicleCategory,
  LogisticsVehicleStatus
} from '../../types/logistics';
import type { NavigationItemKey } from '../layout/Sidebar';

interface LogisticsManagementProps {
  mode: 'manage' | 'add' | 'transfers';
  currentUser: AppUser;
  logisticsVehicles: LogisticsVehicle[];
  activities: Activity[];
  partners: PartnerRecord[];
  onCreateVehicle: (vehicle: LogisticsVehicle) => void;
  onUpdateVehicle: (updated: LogisticsVehicle) => void;
  onDeleteVehicle: (vehicleId: string) => void;
  onChangeVehicleStatus: (vehicleId: string, status: LogisticsVehicleStatus) => void;
  onNavigate: (key: NavigationItemKey) => void;
  onOpenActivityInEditor?: (activity: Activity) => void;
}

type VehicleColKey =
  | 'name'
  | 'category'
  | 'city'
  | 'capacity'
  | 'driver'
  | 'ownership'
  | 'price'
  | 'status';

type TransferColKey =
  | 'activityName'
  | 'city'
  | 'pickup'
  | 'dropoff'
  | 'capacity'
  | 'driverOrVehicle'
  | 'provider'
  | 'fee';

const VEHICLE_COLUMNS: readonly VehicleColKey[] = [
  'name',
  'category',
  'city',
  'capacity',
  'driver',
  'ownership',
  'price',
  'status'
];

const TRANSFER_COLUMNS: readonly TransferColKey[] = [
  'activityName',
  'city',
  'pickup',
  'dropoff',
  'capacity',
  'driverOrVehicle',
  'provider',
  'fee'
];

const VEHICLE_COL_DROPDOWN_TITLES: Record<VehicleColKey, string> = {
  name: 'تحديد متعدد لاسم / كود المركبة',
  category: 'تحديد متعدد لفئة وسيلة النقل',
  city: 'تحديد متعدد للمدينة والمنطقة',
  capacity: 'تحديد متعدد لسعة الركاب',
  driver: 'تحديد متعدد للسائق',
  ownership: 'تحديد متعدد للملكية والشريك',
  price: 'تحديد متعدد للتكلفة',
  status: 'تحديد متعدد للحالة التشغيلية'
};

const TRANSFER_COL_DROPDOWN_TITLES: Record<TransferColKey, string> = {
  activityName: 'تحديد متعدد للنشاط السياحي',
  city: 'تحديد متعدد للمدينة',
  pickup: 'تحديد متعدد لنقطة الالتقاط',
  dropoff: 'تحديد متعدد لنقطة العودة',
  capacity: 'تحديد متعدد لسعة النقل',
  driverOrVehicle: 'تحديد متعدد للسائق / المركبة',
  provider: 'تحديد متعدد لجهة النقل',
  fee: 'تحديد متعدد لرسوم النقل'
};

interface VehicleFormState {
  name: string;
  category: LogisticsVehicleCategory;
  plateOrCode: string;
  modelYear: string;
  city: string;
  zone: string;
  passengerCapacity: number;
  driverName: string;
  driverPhone: string;
  ownershipType: LogisticsOwnershipType;
  partnerId: string;
  pricePerTripEGP: number;
  pricePerTripEUR: number;
  status: LogisticsVehicleStatus;
  hasAC: boolean;
  hasGPS: boolean;
  notes: string;
  media: LogisticsMediaItem[];
}

function buildEmptyForm(): VehicleFormState {
  return {
    name: '',
    category: 'hiace_van',
    plateOrCode: '',
    modelYear: String(new Date().getFullYear()),
    city: 'الغردقة',
    zone: 'الممشى السياحي',
    passengerCapacity: 12,
    driverName: '',
    driverPhone: '',
    ownershipType: 'owned',
    partnerId: '',
    pricePerTripEGP: 600,
    pricePerTripEUR: 12,
    status: 'available',
    hasAC: true,
    hasGPS: true,
    notes: '',
    media: []
  };
}

function toUploaderAssets(media: LogisticsMediaItem[]): Asset[] {
  return media.map((m) => ({
    id: m.id,
    url: m.url,
    name: m.name,
    extension: m.name.split('.').pop()?.toUpperCase() || 'IMG',
    sizeBytes: m.sizeBytes || 1200000,
    dateAdded: Date.now(),
    activityTag: 'وسيلة نقل لوجستية'
  }));
}

function fromUploaderAssets(assets: Asset[]): LogisticsMediaItem[] {
  return assets.map((a, idx) => ({
    id: a.id,
    url: a.url,
    name: a.name,
    sizeBytes: a.sizeBytes,
    isCover: idx === 0
  }));
}

export const LogisticsManagement: React.FC<LogisticsManagementProps> = ({
  mode,
  currentUser,
  logisticsVehicles,
  activities,
  partners,
  onCreateVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onChangeVehicleStatus,
  onNavigate,
  onOpenActivityInEditor
}) => {
  const [showInlineForm, setShowInlineForm] = useState<boolean>(mode === 'add');
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [formState, setFormState] = useState<VehicleFormState>(() => buildEmptyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mode === 'add') {
      setEditingVehicleId(null);
      setFormState(buildEmptyForm());
      setShowInlineForm(true);
    } else if (mode === 'manage') {
      setShowInlineForm(false);
    }
  }, [mode]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    window.setTimeout(() => {
      setFeedbackToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Fleet Registry Table State (Rule 1)
  const fleetTable = useRegistryTableState<VehicleColKey>(VEHICLE_COLUMNS);
  // Activity Transfers Registry Table State (Rule 1)
  const transferTable = useRegistryTableState<TransferColKey>(TRANSFER_COLUMNS);

  const activitiesRequiringTransfer = useMemo(
    () => activities.filter((a) => a.logistics?.requiresTransfer),
    [activities]
  );

  // Fleet Column Dropdown Options
  const fleetColumnOptions = useMemo<Record<VehicleColKey, RegistryFilterOption[]>>(() => {
    const buildCounts = (
      extractor: (v: LogisticsVehicle) => { value: string; label: string; subLabel?: string; dir?: 'ltr' | 'rtl' }
    ): RegistryFilterOption[] => {
      const map = new Map<string, RegistryFilterOption>();
      logisticsVehicles.forEach((v) => {
        const meta = extractor(v);
        const existing = map.get(meta.value);
        if (existing) existing.count += 1;
        else map.set(meta.value, { ...meta, count: 1 });
      });
      return Array.from(map.values());
    };

    return {
      name: buildCounts((v) => ({
        value: v.id,
        label: v.name,
        subLabel: v.plateOrCode || v.id
      })),
      category: buildCounts((v) => ({
        value: v.category,
        label: LOGISTICS_CATEGORY_LABELS[v.category]
      })),
      city: buildCounts((v) => ({
        value: v.city,
        label: v.city,
        subLabel: v.zone
      })),
      capacity: buildCounts((v) => ({
        value: String(v.passengerCapacity),
        label: `${v.passengerCapacity} راكب`,
        dir: 'rtl'
      })),
      driver: buildCounts((v) => ({
        value: v.driverName || 'غير محدد',
        label: v.driverName || 'غير محدد',
        subLabel: v.driverPhone
      })),
      ownership: buildCounts((v) => ({
        value: v.ownershipType,
        label: LOGISTICS_OWNERSHIP_LABELS[v.ownershipType],
        subLabel: v.partnerCompanyName || v.ownerCompanyName
      })),
      price: buildCounts((v) => ({
        value: String(v.pricePerTripEGP),
        label: `${v.pricePerTripEGP.toLocaleString()} ج.م / €${v.pricePerTripEUR}`,
        dir: 'rtl'
      })),
      status: buildCounts((v) => ({
        value: v.status,
        label: LOGISTICS_STATUS_LABELS[v.status].label
      }))
    };
  }, [logisticsVehicles]);

  // Filtered & Sorted Vehicles
  const filteredVehicles = useMemo(() => {
    const f = fleetTable.columnFilters;
    const sel = fleetTable.selectedColumnFilters;

    const rows = logisticsVehicles.filter((v) => {
      if (sel.name.length > 0 && !sel.name.includes(v.id)) return false;
      if (sel.category.length > 0 && !sel.category.includes(v.category)) return false;
      if (sel.city.length > 0 && !sel.city.includes(v.city)) return false;
      if (sel.capacity.length > 0 && !sel.capacity.includes(String(v.passengerCapacity))) return false;
      if (sel.driver.length > 0 && !sel.driver.includes(v.driverName || 'غير محدد')) return false;
      if (sel.ownership.length > 0 && !sel.ownership.includes(v.ownershipType)) return false;
      if (sel.price.length > 0 && !sel.price.includes(String(v.pricePerTripEGP))) return false;
      if (sel.status.length > 0 && !sel.status.includes(v.status)) return false;

      if (
        f.name.trim() &&
        !`${v.name} ${v.plateOrCode} ${v.id}`.toLowerCase().includes(f.name.trim().toLowerCase())
      )
        return false;
      if (
        f.category.trim() &&
        !LOGISTICS_CATEGORY_LABELS[v.category].toLowerCase().includes(f.category.trim().toLowerCase())
      )
        return false;
      if (
        f.city.trim() &&
        !`${v.city} ${v.zone}`.toLowerCase().includes(f.city.trim().toLowerCase())
      )
        return false;
      if (
        f.capacity.trim() &&
        !String(v.passengerCapacity).includes(f.capacity.trim())
      )
        return false;
      if (
        f.driver.trim() &&
        !`${v.driverName} ${v.driverPhone}`.toLowerCase().includes(f.driver.trim().toLowerCase())
      )
        return false;
      if (
        f.ownership.trim() &&
        !`${LOGISTICS_OWNERSHIP_LABELS[v.ownershipType]} ${v.partnerCompanyName || ''} ${v.ownerCompanyName}`
          .toLowerCase()
          .includes(f.ownership.trim().toLowerCase())
      )
        return false;
      if (
        f.price.trim() &&
        !`${v.pricePerTripEGP} ${v.pricePerTripEUR}`.includes(f.price.trim())
      )
        return false;
      if (
        f.status.trim() &&
        !LOGISTICS_STATUS_LABELS[v.status].label
          .toLowerCase()
          .includes(f.status.trim().toLowerCase())
      )
        return false;

      return true;
    });

    if (!fleetTable.sortColumn) return rows;
    const dir = fleetTable.sortDirection === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (fleetTable.sortColumn) {
        case 'name':
          return a.name.localeCompare(b.name, 'ar') * dir;
        case 'category':
          return (
            LOGISTICS_CATEGORY_LABELS[a.category].localeCompare(
              LOGISTICS_CATEGORY_LABELS[b.category],
              'ar'
            ) * dir
          );
        case 'city':
          return a.city.localeCompare(b.city, 'ar') * dir;
        case 'capacity':
          return (a.passengerCapacity - b.passengerCapacity) * dir;
        case 'driver':
          return a.driverName.localeCompare(b.driverName, 'ar') * dir;
        case 'ownership':
          return (
            LOGISTICS_OWNERSHIP_LABELS[a.ownershipType].localeCompare(
              LOGISTICS_OWNERSHIP_LABELS[b.ownershipType],
              'ar'
            ) * dir
          );
        case 'price':
          return (a.pricePerTripEGP - b.pricePerTripEGP) * dir;
        case 'status':
          return (
            LOGISTICS_STATUS_LABELS[a.status].label.localeCompare(
              LOGISTICS_STATUS_LABELS[b.status].label,
              'ar'
            ) * dir
          );
        default:
          return 0;
      }
    });
  }, [logisticsVehicles, fleetTable.columnFilters, fleetTable.selectedColumnFilters, fleetTable.sortColumn, fleetTable.sortDirection]);

  // Transfers Table Column Options
  const transferColumnOptions = useMemo<Record<TransferColKey, RegistryFilterOption[]>>(() => {
    const buildCounts = (
      extractor: (a: Activity) => { value: string; label: string; subLabel?: string }
    ): RegistryFilterOption[] => {
      const map = new Map<string, RegistryFilterOption>();
      activitiesRequiringTransfer.forEach((a) => {
        const meta = extractor(a);
        const existing = map.get(meta.value);
        if (existing) existing.count += 1;
        else map.set(meta.value, { ...meta, count: 1 });
      });
      return Array.from(map.values());
    };

    return {
      activityName: buildCounts((a) => ({
        value: a.id,
        label: a.name,
        subLabel: a.owner.companyName
      })),
      city: buildCounts((a) => ({
        value: a.location.city,
        label: a.location.city,
        subLabel: a.location.primarySite
      })),
      pickup: buildCounts((a) => ({
        value: a.logistics.pickupPoint || 'غير محدد',
        label: a.logistics.pickupPoint || 'غير محدد'
      })),
      dropoff: buildCounts((a) => ({
        value: a.logistics.dropoffPoint || 'غير محدد',
        label: a.logistics.dropoffPoint || 'غير محدد'
      })),
      capacity: buildCounts((a) => ({
        value: String(a.logistics.passengerCapacity),
        label: `${a.logistics.passengerCapacity} راكب`
      })),
      driverOrVehicle: buildCounts((a) => ({
        value: a.logistics.assignedDriverOrVehicle || 'غير معيّن بعد',
        label: a.logistics.assignedDriverOrVehicle || 'غير معيّن بعد'
      })),
      provider: buildCounts((a) => ({
        value: a.logistics.transferProvidedByOwner ? 'owner' : 'market',
        label: a.logistics.transferProvidedByOwner ? 'نقل بواسطة المالك' : 'طلب نقل من السوق'
      })),
      fee: buildCounts((a) => ({
        value: String(a.logistics.separateTransferFeeEGP),
        label:
          a.logistics.separateTransferFeeEGP > 0
            ? `${a.logistics.separateTransferFeeEGP} ج.م / €${a.logistics.separateTransferFeeEUR}`
            : 'مشمول بسعر النشاط'
      }))
    };
  }, [activitiesRequiringTransfer]);

  const filteredTransfers = useMemo(() => {
    const f = transferTable.columnFilters;
    const sel = transferTable.selectedColumnFilters;

    const rows = activitiesRequiringTransfer.filter((a) => {
      const providerKey = a.logistics.transferProvidedByOwner ? 'owner' : 'market';
      const providerLabel = a.logistics.transferProvidedByOwner
        ? 'نقل بواسطة المالك'
        : 'طلب نقل من السوق';
      const driverVal = a.logistics.assignedDriverOrVehicle || 'غير معيّن بعد';

      if (sel.activityName.length > 0 && !sel.activityName.includes(a.id)) return false;
      if (sel.city.length > 0 && !sel.city.includes(a.location.city)) return false;
      if (sel.pickup.length > 0 && !sel.pickup.includes(a.logistics.pickupPoint || 'غير محدد'))
        return false;
      if (sel.dropoff.length > 0 && !sel.dropoff.includes(a.logistics.dropoffPoint || 'غير محدد'))
        return false;
      if (sel.capacity.length > 0 && !sel.capacity.includes(String(a.logistics.passengerCapacity)))
        return false;
      if (sel.driverOrVehicle.length > 0 && !sel.driverOrVehicle.includes(driverVal)) return false;
      if (sel.provider.length > 0 && !sel.provider.includes(providerKey)) return false;
      if (sel.fee.length > 0 && !sel.fee.includes(String(a.logistics.separateTransferFeeEGP)))
        return false;

      if (
        f.activityName.trim() &&
        !`${a.name} ${a.owner.companyName}`.toLowerCase().includes(f.activityName.trim().toLowerCase())
      )
        return false;
      if (
        f.city.trim() &&
        !`${a.location.city} ${a.location.primarySite}`
          .toLowerCase()
          .includes(f.city.trim().toLowerCase())
      )
        return false;
      if (
        f.pickup.trim() &&
        !a.logistics.pickupPoint.toLowerCase().includes(f.pickup.trim().toLowerCase())
      )
        return false;
      if (
        f.dropoff.trim() &&
        !a.logistics.dropoffPoint.toLowerCase().includes(f.dropoff.trim().toLowerCase())
      )
        return false;
      if (
        f.capacity.trim() &&
        !String(a.logistics.passengerCapacity).includes(f.capacity.trim())
      )
        return false;
      if (
        f.driverOrVehicle.trim() &&
        !driverVal.toLowerCase().includes(f.driverOrVehicle.trim().toLowerCase())
      )
        return false;
      if (
        f.provider.trim() &&
        !providerLabel.toLowerCase().includes(f.provider.trim().toLowerCase())
      )
        return false;
      if (
        f.fee.trim() &&
        !`${a.logistics.separateTransferFeeEGP} ${a.logistics.separateTransferFeeEUR}`.includes(
          f.fee.trim()
        )
      )
        return false;

      return true;
    });

    if (!transferTable.sortColumn) return rows;
    const dir = transferTable.sortDirection === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (transferTable.sortColumn) {
        case 'activityName':
          return a.name.localeCompare(b.name, 'ar') * dir;
        case 'city':
          return a.location.city.localeCompare(b.location.city, 'ar') * dir;
        case 'pickup':
          return a.logistics.pickupPoint.localeCompare(b.logistics.pickupPoint, 'ar') * dir;
        case 'dropoff':
          return a.logistics.dropoffPoint.localeCompare(b.logistics.dropoffPoint, 'ar') * dir;
        case 'capacity':
          return (a.logistics.passengerCapacity - b.logistics.passengerCapacity) * dir;
        case 'driverOrVehicle':
          return (
            (a.logistics.assignedDriverOrVehicle || '').localeCompare(
              b.logistics.assignedDriverOrVehicle || '',
              'ar'
            ) * dir
          );
        case 'provider':
          return (
            (Number(a.logistics.transferProvidedByOwner) -
              Number(b.logistics.transferProvidedByOwner)) *
            dir
          );
        case 'fee':
          return (a.logistics.separateTransferFeeEGP - b.logistics.separateTransferFeeEGP) * dir;
        default:
          return 0;
      }
    });
  }, [
    activitiesRequiringTransfer,
    transferTable.columnFilters,
    transferTable.selectedColumnFilters,
    transferTable.sortColumn,
    transferTable.sortDirection
  ]);

  const handleOpenCreateInline = () => {
    setEditingVehicleId(null);
    setFormState(buildEmptyForm());
    setShowInlineForm(true);
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleOpenEditInline = (vehicle: LogisticsVehicle) => {
    setEditingVehicleId(vehicle.id);
    setFormState({
      name: vehicle.name,
      category: vehicle.category,
      plateOrCode: vehicle.plateOrCode,
      modelYear: vehicle.modelYear || '',
      city: vehicle.city,
      zone: vehicle.zone,
      passengerCapacity: vehicle.passengerCapacity,
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone,
      ownershipType: vehicle.ownershipType,
      partnerId: vehicle.partnerId || '',
      pricePerTripEGP: vehicle.pricePerTripEGP,
      pricePerTripEUR: vehicle.pricePerTripEUR,
      status: vehicle.status,
      hasAC: vehicle.hasAC,
      hasGPS: vehicle.hasGPS,
      notes: vehicle.notes,
      media: vehicle.media
    });
    setShowInlineForm(true);
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;
    const today = new Date().toISOString().split('T')[0];
    const selectedPartner = partners.find((p) => p.id === formState.partnerId);

    if (editingVehicleId) {
      const existing = logisticsVehicles.find((v) => v.id === editingVehicleId);
      const updated: LogisticsVehicle = {
        id: editingVehicleId,
        ownerId: existing?.ownerId || currentUser.id,
        ownerName: existing?.ownerName || currentUser.name,
        ownerCompanyName: existing?.ownerCompanyName || currentUser.companyName,
        name: formState.name.trim(),
        category: formState.category,
        plateOrCode: formState.plateOrCode.trim() || 'بدون لوحة',
        modelYear: formState.modelYear.trim(),
        city: formState.city.trim() || 'الغردقة',
        zone: formState.zone.trim() || 'عام',
        passengerCapacity: Math.max(1, formState.passengerCapacity),
        driverName: formState.driverName.trim(),
        driverPhone: formState.driverPhone.trim(),
        ownershipType: formState.ownershipType,
        partnerId:
          formState.ownershipType === 'owned' ? undefined : selectedPartner?.id || undefined,
        partnerName:
          formState.ownershipType === 'owned' ? undefined : selectedPartner?.name || undefined,
        partnerCompanyName:
          formState.ownershipType === 'owned'
            ? undefined
            : selectedPartner?.companyName || undefined,
        pricePerTripEGP: Math.max(0, formState.pricePerTripEGP),
        pricePerTripEUR: Math.max(0, formState.pricePerTripEUR),
        status: formState.status,
        hasAC: formState.hasAC,
        hasGPS: formState.hasGPS,
        notes: formState.notes.trim(),
        media: formState.media,
        createdAt: existing?.createdAt || today,
        updatedAt: today
      };
      onUpdateVehicle(updated);
      showToast(`تم تحديث وسيلة النقل «${updated.name}» بنجاح`);
    } else {
      const created: LogisticsVehicle = {
        id: `LOG-${Date.now().toString().slice(-5)}`,
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        ownerCompanyName: currentUser.companyName,
        name: formState.name.trim(),
        category: formState.category,
        plateOrCode: formState.plateOrCode.trim() || 'LOG-NEW',
        modelYear: formState.modelYear.trim(),
        city: formState.city.trim() || 'الغردقة',
        zone: formState.zone.trim() || 'عام',
        passengerCapacity: Math.max(1, formState.passengerCapacity),
        driverName: formState.driverName.trim(),
        driverPhone: formState.driverPhone.trim(),
        ownershipType: formState.ownershipType,
        partnerId:
          formState.ownershipType === 'owned' ? undefined : selectedPartner?.id || undefined,
        partnerName:
          formState.ownershipType === 'owned' ? undefined : selectedPartner?.name || undefined,
        partnerCompanyName:
          formState.ownershipType === 'owned'
            ? undefined
            : selectedPartner?.companyName || undefined,
        pricePerTripEGP: Math.max(0, formState.pricePerTripEGP),
        pricePerTripEUR: Math.max(0, formState.pricePerTripEUR),
        status: formState.status,
        hasAC: formState.hasAC,
        hasGPS: formState.hasGPS,
        notes: formState.notes.trim(),
        media: formState.media,
        createdAt: today,
        updatedAt: today
      };
      onCreateVehicle(created);
      showToast(`تمت إضافة وسيلة النقل «${created.name}» إلى سجل اللوجستيات والمفضلة`);
    }

    setEditingVehicleId(null);
    setShowInlineForm(false);
    if (mode === 'add') {
      onNavigate('logistics_manage');
    }
  };

  const availableVehiclesCount = logisticsVehicles.filter((v) => v.status === 'available').length;
  const onRouteCount = logisticsVehicles.filter((v) => v.status === 'on_route').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Feedback Toast */}
      {feedbackToast && (
        <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackToast(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Sub-Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-white">
                إدارة اللوجستيات ووسائل النقل السياحي
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/40 text-emerald-300 font-mono text-[11px] font-bold">
                {logisticsVehicles.length} وسيلة نقل مسجلة
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-700/40 text-cyan-300 font-mono text-[11px] font-bold">
                {activitiesRequiringTransfer.length} نشاط يتطلب نقل
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              إدارة أسطول الأتوبيسات والليموزين وسيارات السفاري وقوارب التوصيل، مع المزامنة المباشرة في بلوك «وسائل النقل (اللوجستيات)» بالمفضلة.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('logistics_manage')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              mode !== 'transfers'
                ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            سجل وسائل النقل ({logisticsVehicles.length})
          </button>
          <button
            type="button"
            onClick={() => onNavigate('logistics_transfers')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              mode === 'transfers'
                ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            تحركات ونقل الأنشطة ({activitiesRequiringTransfer.length})
          </button>
          {mode !== 'transfers' && (
            <button
              type="button"
              onClick={handleOpenCreateInline}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة وسيلة نقل</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] text-slate-400">إجمالي الأسطول المسجل</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {logisticsVehicles.length}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] text-slate-400">وسائل نقل جاهزة</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {availableVehiclesCount}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] text-slate-400">قيد التوصيل / في مهمة</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{onRouteCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] text-slate-400">أنشطة تتطلب خدمة نقل</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {activitiesRequiringTransfer.length}
          </div>
        </div>
      </div>

      {/* VIEW 1 & 2: Fleet Vehicles Management + Inline Form */}
      {mode !== 'transfers' && (
        <>
          {/* Inline Expandable Add / Edit Vehicle Section (Inside the page) */}
          {showInlineForm && (
            <div
              ref={formRef}
              className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 space-y-5 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    {editingVehicleId
                      ? 'تعديل بيانات وسيلة النقل واللوجستيات'
                      : 'إضافة وسيلة نقل لوجستية جديدة'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowInlineForm(false);
                    setEditingVehicleId(null);
                    if (mode === 'add') onNavigate('logistics_manage');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>إغلاق النموذج</span>
                </button>
              </div>

              <form onSubmit={handleSaveVehicle} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      اسم / موديل وسيلة النقل *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="مثال: تويوتا هاي إس سياحي سقف عالي"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      تصنيف وسيلة النقل
                    </label>
                    <select
                      value={formState.category}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          category: e.target.value as LogisticsVehicleCategory
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      {Object.entries(LOGISTICS_CATEGORY_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      رقم اللوحة / الكود التشغيلي
                    </label>
                    <input
                      type="text"
                      value={formState.plateOrCode}
                      onChange={(e) =>
                        setFormState({ ...formState, plateOrCode: e.target.value })
                      }
                      placeholder="مثال: ط ر ب 4821"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">المدينة</label>
                    <input
                      type="text"
                      value={formState.city}
                      onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                      placeholder="الغردقة / شرم الشيخ / الجونة..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">نطاق التغطية</label>
                    <input
                      type="text"
                      value={formState.zone}
                      onChange={(e) => setFormState({ ...formState, zone: e.target.value })}
                      placeholder="مثال: المطار - سهل حشيش - مكادي"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      سعة الركاب (مقعد)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formState.passengerCapacity}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          passengerCapacity: Math.max(1, Number(e.target.value) || 1)
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      اسم السائق / القبطان المسؤول
                    </label>
                    <input
                      type="text"
                      value={formState.driverName}
                      onChange={(e) => setFormState({ ...formState, driverName: e.target.value })}
                      placeholder="مثال: كابتن محمود السيد"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      رقم هاتف السائق
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={formState.driverPhone}
                      onChange={(e) => setFormState({ ...formState, driverPhone: e.target.value })}
                      placeholder="+2010..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      الحالة التشغيلية
                    </label>
                    <select
                      value={formState.status}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          status: e.target.value as LogisticsVehicleStatus
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      {Object.entries(LOGISTICS_STATUS_LABELS).map(([k, meta]) => (
                        <option key={k} value={k}>
                          {meta.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      نوع الملكية / التشغيل
                    </label>
                    <select
                      value={formState.ownershipType}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          ownershipType: e.target.value as LogisticsOwnershipType
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      {Object.entries(LOGISTICS_OWNERSHIP_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formState.ownershipType !== 'owned' && (
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        الشريك / المؤجر المرتبط
                      </label>
                      <select
                        value={formState.partnerId}
                        onChange={(e) => setFormState({ ...formState, partnerId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      >
                        <option value="">-- اختر من سجل الشركاء --</option>
                        {partners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.companyName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        تكلفة التوصيل (ج.م)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formState.pricePerTripEGP}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            pricePerTripEGP: Math.max(0, Number(e.target.value) || 0)
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        التكلفة (EUR €)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formState.pricePerTripEUR}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            pricePerTripEUR: Math.max(0, Number(e.target.value) || 0)
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.hasAC}
                      onChange={(e) => setFormState({ ...formState, hasAC: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950 text-cyan-500"
                    />
                    <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                    <span>تكييف مركزي متاح</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.hasGPS}
                      onChange={(e) => setFormState({ ...formState, hasGPS: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950 text-cyan-500"
                    />
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تتبع GPS ومراقبة المسار</span>
                  </label>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    ملاحظات تشغيلية / خطوط السير المعتمدة
                  </label>
                  <textarea
                    rows={2}
                    value={formState.notes}
                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                    placeholder="تفاصيل خط السير، مواعيد التحرك، أو اشتراطات التحميل..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                {/* Rule 2: StandardMediaUploader with Saved Library + Storage Quota Gauge */}
                <StandardMediaUploader
                  title="Media / وسائط وصور وسيلة النقل اللوجستية"
                  initialFiles={toUploaderAssets(formState.media)}
                  maxFiles={8}
                  ownerTier={currentUser.tier}
                  onUpdate={(assets) =>
                    setFormState((prev) => ({ ...prev, media: fromUploaderAssets(assets) }))
                  }
                />

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInlineForm(false);
                      setEditingVehicleId(null);
                      if (mode === 'add') onNavigate('logistics_manage');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                  >
                    {editingVehicleId ? 'حفظ التعديلات' : 'إضافة وسيلة النقل'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Fleet Registry Table (Rule 1: Per-column writable filter + multi-select dropdown + sort) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <RegistryFilterSummaryBar
              filteredCount={filteredVehicles.length}
              totalCount={logisticsVehicles.length}
              itemNoun="وسيلة نقل"
              sortColumn={fleetTable.sortColumn}
              sortDirection={fleetTable.sortDirection}
              hasActiveFilters={fleetTable.hasActiveFilters}
              onClearAll={fleetTable.handleClearAll}
            />

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-300">
                  <tr>
                    {[
                      { key: 'name' as VehicleColKey, label: 'وسيلة النقل / الكود' },
                      { key: 'category' as VehicleColKey, label: 'الفئة' },
                      { key: 'city' as VehicleColKey, label: 'المدينة والنطاق' },
                      { key: 'capacity' as VehicleColKey, label: 'السعة' },
                      { key: 'driver' as VehicleColKey, label: 'السائق / الهاتف' },
                      { key: 'ownership' as VehicleColKey, label: 'الملكية والشريك' },
                      { key: 'price' as VehicleColKey, label: 'التكلفة / الرحلة' },
                      { key: 'status' as VehicleColKey, label: 'الحالة' }
                    ].map((col) => (
                      <th key={col.key} className="px-3 py-3 font-bold whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => fleetTable.handleToggleSort(col.key)}
                          className="inline-flex items-center gap-1.5 hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          <span>{col.label}</span>
                          <RegistrySortIcon
                            column={col.key}
                            sortColumn={fleetTable.sortColumn}
                            sortDirection={fleetTable.sortDirection}
                          />
                        </button>
                      </th>
                    ))}
                    <th className="px-3 py-3 font-bold text-center whitespace-nowrap">إجراءات</th>
                  </tr>

                  {/* Column Writable Filter Inputs Row */}
                  <tr className="bg-slate-950/50 border-b border-slate-800">
                    {(
                      [
                        { key: 'name', placeholder: 'بحث / تحديد...' },
                        { key: 'category', placeholder: 'فئة المركبة...' },
                        { key: 'city', placeholder: 'المدينة...' },
                        { key: 'capacity', placeholder: 'السعة...' },
                        { key: 'driver', placeholder: 'السائق...' },
                        { key: 'ownership', placeholder: 'الملكية...' },
                        { key: 'price', placeholder: 'السعر...' },
                        { key: 'status', placeholder: 'الحالة...' }
                      ] as Array<{ key: VehicleColKey; placeholder: string }>
                    ).map((col) => (
                      <th key={col.key} className="px-2 py-2 font-normal">
                        <input
                          ref={(el) => {
                            fleetTable.filterInputRefs.current[col.key] = el;
                          }}
                          type="text"
                          value={fleetTable.columnFilters[col.key]}
                          onFocus={() => {
                            fleetTable.setOpenDropdownCol(col.key);
                            fleetTable.updateDropdownPosition(col.key, ['name', 'city', 'ownership']);
                          }}
                          onChange={(e) =>
                            fleetTable.setColumnFilters((prev) => ({
                              ...prev,
                              [col.key]: e.target.value
                            }))
                          }
                          placeholder={fleetTable.getSelectedSummaryPlaceholder(
                            col.key,
                            col.placeholder
                          )}
                          className="w-full min-w-[100px] bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </th>
                    ))}
                    <th className="px-2 py-2" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/70">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 space-y-2">
                        <Truck className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="font-bold text-slate-300">
                          {logisticsVehicles.length === 0
                            ? 'لا توجد وسائل نقل مسجلة بعد'
                            : 'لا توجد نتائج مطابقة للفلاتر'}
                        </p>
                        {logisticsVehicles.length === 0 && (
                          <button
                            type="button"
                            onClick={handleOpenCreateInline}
                            className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                          >
                            + إضافة أول وسيلة نقل
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((v) => {
                      const statusMeta = LOGISTICS_STATUS_LABELS[v.status];
                      const coverUrl = v.media[0]?.url;
                      return (
                        <tr
                          key={v.id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              {coverUrl ? (
                                <img
                                  src={coverUrl}
                                  alt={v.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                                  <Truck className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-white">{v.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {v.plateOrCode} · {v.id}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  أضافه: <strong className="text-slate-300">{v.createdByName || v.ownerName}</strong> ({v.createdAtTime || v.createdAt})
                                  {v.updatedAtTime && (
                                    <span className="text-cyan-400/80">
                                      {' '}· تعديل: {v.updatedByName || v.ownerName} ({v.updatedAtTime})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-cyan-300 font-semibold">
                            {LOGISTICS_CATEGORY_LABELS[v.category]}
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-white">{v.city}</div>
                            <div className="text-[10px] text-slate-400">{v.zone}</div>
                          </td>
                          <td className="px-3 py-3 font-mono font-bold text-slate-200">
                            {v.passengerCapacity} راكب
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-slate-200">{v.driverName || 'غير محدد'}</div>
                            {v.driverPhone && (
                              <div dir="ltr" className="text-[10px] text-slate-400 font-mono text-right">
                                {v.driverPhone}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-slate-200">
                              {LOGISTICS_OWNERSHIP_LABELS[v.ownershipType]}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {v.partnerCompanyName || v.ownerCompanyName}
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono">
                            <div className="text-emerald-400 font-bold">
                              {v.pricePerTripEGP.toLocaleString()} ج.م
                            </div>
                            <div className="text-[10px] text-cyan-400">€{v.pricePerTripEUR}</div>
                          </td>
                          <td className="px-3 py-3">
                            <select
                              value={v.status}
                              onChange={(e) =>
                                onChangeVehicleStatus(
                                  v.id,
                                  e.target.value as LogisticsVehicleStatus
                                )
                              }
                              className={`rounded-lg border px-2 py-1 text-[11px] font-semibold bg-slate-950 ${statusMeta.badgeCls}`}
                            >
                              {Object.entries(LOGISTICS_STATUS_LABELS).map(([k, m]) => (
                                <option key={k} value={k} className="bg-slate-900 text-white">
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditInline(v)}
                                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-400 cursor-pointer"
                                title="تعديل"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {confirmDeleteId === v.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteVehicle(v.id);
                                      setConfirmDeleteId(null);
                                      showToast(`تم حذف وسيلة النقل «${v.name}»`);
                                    }}
                                    className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                                  >
                                    تأكيد
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] cursor-pointer"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(v.id)}
                                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950 border border-slate-800 text-rose-400 cursor-pointer"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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

            {fleetTable.openDropdownCol && fleetTable.dropdownRect && (
              <RegistryColumnFilterDropdown
                activeCol={fleetTable.openDropdownCol}
                dropdownRect={fleetTable.dropdownRect}
                activeDropdownRef={fleetTable.activeDropdownRef}
                title={VEHICLE_COL_DROPDOWN_TITLES[fleetTable.openDropdownCol]}
                options={fleetColumnOptions[fleetTable.openDropdownCol]}
                filterText={fleetTable.columnFilters[fleetTable.openDropdownCol]}
                selectedValues={fleetTable.selectedColumnFilters[fleetTable.openDropdownCol]}
                onToggleValue={fleetTable.handleToggleColumnFilterValue}
                onClearCol={fleetTable.handleClearCol}
                onClose={() => fleetTable.setOpenDropdownCol(null)}
              />
            )}
          </div>
        </>
      )}

      {/* VIEW 3: Activity Transfers & Logistics Requirements Registry */}
      {mode === 'transfers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <RegistryFilterSummaryBar
            filteredCount={filteredTransfers.length}
            totalCount={activitiesRequiringTransfer.length}
            itemNoun="طلب نقل لوجستي بالأنشطة"
            sortColumn={transferTable.sortColumn}
            sortDirection={transferTable.sortDirection}
            hasActiveFilters={transferTable.hasActiveFilters}
            onClearAll={transferTable.handleClearAll}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-300">
                <tr>
                  {[
                    { key: 'activityName' as TransferColKey, label: 'النشاط والشركة' },
                    { key: 'city' as TransferColKey, label: 'المدينة' },
                    { key: 'pickup' as TransferColKey, label: 'نقطة الالتقاط' },
                    { key: 'dropoff' as TransferColKey, label: 'نقطة العودة' },
                    { key: 'capacity' as TransferColKey, label: 'السعة المطلوبة' },
                    { key: 'driverOrVehicle' as TransferColKey, label: 'السائق / المركبة' },
                    { key: 'provider' as TransferColKey, label: 'جهة التنفيذ' },
                    { key: 'fee' as TransferColKey, label: 'رسوم النقل' }
                  ].map((col) => (
                    <th key={col.key} className="px-3 py-3 font-bold whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => transferTable.handleToggleSort(col.key)}
                        className="inline-flex items-center gap-1.5 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        <span>{col.label}</span>
                        <RegistrySortIcon
                          column={col.key}
                          sortColumn={transferTable.sortColumn}
                          sortDirection={transferTable.sortDirection}
                        />
                      </button>
                    </th>
                  ))}
                  <th className="px-3 py-3 font-bold text-center whitespace-nowrap">النشاط</th>
                </tr>

                <tr className="bg-slate-950/50 border-b border-slate-800">
                  {(
                    [
                      { key: 'activityName', placeholder: 'النشاط...' },
                      { key: 'city', placeholder: 'المدينة...' },
                      { key: 'pickup', placeholder: 'الالتقاط...' },
                      { key: 'dropoff', placeholder: 'العودة...' },
                      { key: 'capacity', placeholder: 'السعة...' },
                      { key: 'driverOrVehicle', placeholder: 'المركبة...' },
                      { key: 'provider', placeholder: 'الجهة...' },
                      { key: 'fee', placeholder: 'الرسوم...' }
                    ] as Array<{ key: TransferColKey; placeholder: string }>
                  ).map((col) => (
                    <th key={col.key} className="px-2 py-2 font-normal">
                      <input
                        ref={(el) => {
                          transferTable.filterInputRefs.current[col.key] = el;
                        }}
                        type="text"
                        value={transferTable.columnFilters[col.key]}
                        onFocus={() => {
                          transferTable.setOpenDropdownCol(col.key);
                          transferTable.updateDropdownPosition(col.key, [
                            'activityName',
                            'pickup',
                            'dropoff'
                          ]);
                        }}
                        onChange={(e) =>
                          transferTable.setColumnFilters((prev) => ({
                            ...prev,
                            [col.key]: e.target.value
                          }))
                        }
                        placeholder={transferTable.getSelectedSummaryPlaceholder(
                          col.key,
                          col.placeholder
                        )}
                        className="w-full min-w-[95px] bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </th>
                  ))}
                  <th className="px-2 py-2" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/70">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      لا توجد أنشطة مسجلة تتطلب نقل لوجستي حالياً
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-3">
                        <div className="font-bold text-white">{act.name}</div>
                        <div className="text-[10px] text-slate-400">{act.owner.companyName}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-200">{act.location.city}</td>
                      <td className="px-3 py-3 text-slate-300">{act.logistics.pickupPoint}</td>
                      <td className="px-3 py-3 text-slate-300">{act.logistics.dropoffPoint}</td>
                      <td className="px-3 py-3 font-mono text-cyan-300 font-bold">
                        {act.logistics.passengerCapacity} راكب
                      </td>
                      <td className="px-3 py-3 text-slate-200">
                        {act.logistics.assignedDriverOrVehicle || 'غير معيّن بعد'}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            act.logistics.transferProvidedByOwner
                              ? 'bg-emerald-950/70 border-emerald-700/40 text-emerald-300'
                              : 'bg-amber-950/70 border-amber-700/40 text-amber-300'
                          }`}
                        >
                          {act.logistics.transferProvidedByOwner
                            ? 'نقل بواسطة المالك'
                            : 'طلب نقل من السوق'}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-emerald-400">
                        {act.logistics.separateTransferFeeEGP > 0
                          ? `${act.logistics.separateTransferFeeEGP} ج.م / €${act.logistics.separateTransferFeeEUR}`
                          : 'مشمول'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {onOpenActivityInEditor && (
                          <button
                            type="button"
                            onClick={() => onOpenActivityInEditor(act)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 text-[11px] font-semibold cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>فتح</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {transferTable.openDropdownCol && transferTable.dropdownRect && (
            <RegistryColumnFilterDropdown
              activeCol={transferTable.openDropdownCol}
              dropdownRect={transferTable.dropdownRect}
              activeDropdownRef={transferTable.activeDropdownRef}
              title={TRANSFER_COL_DROPDOWN_TITLES[transferTable.openDropdownCol]}
              options={transferColumnOptions[transferTable.openDropdownCol]}
              filterText={transferTable.columnFilters[transferTable.openDropdownCol]}
              selectedValues={transferTable.selectedColumnFilters[transferTable.openDropdownCol]}
              onToggleValue={transferTable.handleToggleColumnFilterValue}
              onClearCol={transferTable.handleClearCol}
              onClose={() => transferTable.setOpenDropdownCol(null)}
            />
          )}
        </div>
      )}
    </div>
  );
};
