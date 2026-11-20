import React from 'react';
import {
  Heart,
  Wrench,
  Truck,
  MapPin,
  Phone,
  Users,
  Folder,
  ShieldCheck,
  Snowflake,
  Navigation
} from 'lucide-react';
import type {
  EquipmentItem,
  EquipmentOwnershipType,
  EquipmentStatus,
  EquipmentTypeDefinition
} from '../../types/equipment';
import {
  LOGISTICS_CATEGORY_LABELS,
  LOGISTICS_OWNERSHIP_LABELS,
  LOGISTICS_STATUS_LABELS,
  LogisticsVehicle
} from '../../types/logistics';
import type { FavoriteFolder, FavoriteFolderColor } from '../../types/favorites';

const FOLDER_COLOR_BADGE_MAP: Record<FavoriteFolderColor, string> = {
  cyan: 'bg-cyan-950/70 text-cyan-300 border-cyan-600/40',
  emerald: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40',
  amber: 'bg-amber-950/70 text-amber-300 border-amber-600/40',
  rose: 'bg-rose-950/70 text-rose-300 border-rose-600/40',
  violet: 'bg-violet-950/70 text-violet-300 border-violet-600/40'
};

const EQUIPMENT_STATUS_META: Record<EquipmentStatus, { label: string; cls: string }> = {
  available: {
    label: 'متاحة للتشغيل',
    cls: 'bg-emerald-950/75 text-emerald-300 border-emerald-700/50'
  },
  in_use: {
    label: 'قيد التشغيل',
    cls: 'bg-cyan-950/75 text-cyan-300 border-cyan-700/50'
  },
  maintenance: {
    label: 'تحت الصيانة',
    cls: 'bg-amber-950/75 text-amber-300 border-amber-700/50'
  },
  inactive: {
    label: 'متوقفة مؤقتاً',
    cls: 'bg-slate-900 text-slate-300 border-slate-700'
  }
};

const EQUIPMENT_OWNERSHIP_LABELS: Record<EquipmentOwnershipType, string> = {
  owned: 'ملكية خاصة',
  rented: 'مستأجرة بعقد',
  partner_shared: 'مشاركة تشغيل'
};

interface FavoriteEquipmentCardProps {
  equipment: EquipmentItem;
  equipmentTypes: EquipmentTypeDefinition[];
  isFav: boolean;
  itemFolders: FavoriteFolder[];
  onToggleFavorite: (id: string) => void;
  renderFolderPopover: () => React.ReactNode;
}

export const FavoriteEquipmentCard: React.FC<FavoriteEquipmentCardProps> = ({
  equipment,
  equipmentTypes,
  isFav,
  itemFolders,
  onToggleFavorite,
  renderFolderPopover
}) => {
  const coverUrl =
    equipment.media.find((m) => m.isCover && m.type === 'image')?.url ||
    equipment.media.find((m) => m.type === 'image')?.url;
  const typeDef = equipmentTypes.find((t) => t.id === equipment.typeId);
  const statusMeta = EQUIPMENT_STATUS_META[equipment.status];

  return (
    <div
      className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all ${
        isFav
          ? 'border-rose-500/35 shadow-md shadow-rose-950/10'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div>
        <div className="aspect-[16/9] bg-slate-950 relative overflow-hidden flex items-center justify-center">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={equipment.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-amber-400/70">
              <Wrench className="w-8 h-8" />
              <span className="text-[10px] text-slate-500 font-mono">{equipment.id}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-slate-950/85 border border-slate-700 text-[10px] font-bold text-amber-300">
            {typeDef?.name || equipment.classification || 'معدة تشغيلية'}
          </span>

          <button
            type="button"
            onClick={() => onToggleFavorite(equipment.id)}
            className={`absolute top-2.5 left-2.5 p-2 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
              isFav
                ? 'bg-rose-500/30 border-rose-400 text-white'
                : 'bg-slate-950/75 border-slate-700 text-slate-200 hover:text-rose-400'
            }`}
            title={isFav ? 'إزالة المعدة من المفضلة' : 'إضافة المعدة إلى المفضلة'}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <div className="absolute bottom-2.5 right-2.5 left-2.5 flex items-center justify-between text-[11px]">
            <span className="text-white font-semibold truncate">{equipment.ownerCompanyName}</span>
            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold shrink-0 ${statusMeta.cls}`}>
              {statusMeta.label}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          <div>
            <h4 className="text-sm font-bold text-white line-clamp-1">{equipment.name}</h4>
            {equipment.description && (
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                {equipment.description}
              </p>
            )}
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">الملكية:</span>
              <span className="text-cyan-300 font-semibold">
                {EQUIPMENT_OWNERSHIP_LABELS[equipment.ownershipType]}
              </span>
            </div>
            {equipment.partnerCompanyName && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">الشريك:</span>
                <span className="text-slate-200 truncate">
                  {equipment.partnerName} — {equipment.partnerCompanyName}
                </span>
              </div>
            )}
            {equipment.operationalData.capacityOrUnitLabel && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">السعة / الوحدة:</span>
                <span className="text-emerald-300 font-mono">
                  {equipment.operationalData.capacityOrUnitLabel}
                </span>
              </div>
            )}
          </div>

          {itemFolders.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {itemFolders.map((f) => (
                <span
                  key={f.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
                    FOLDER_COLOR_BADGE_MAP[f.color]
                  }`}
                >
                  <Folder className="w-2.5 h-2.5" />
                  {f.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-slate-800/80 flex items-center justify-between gap-2 bg-slate-950/40">
        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{equipment.id}</span>
        </span>
        {renderFolderPopover()}
      </div>
    </div>
  );
};

interface FavoriteLogisticsCardProps {
  vehicle: LogisticsVehicle;
  isFav: boolean;
  itemFolders: FavoriteFolder[];
  onToggleFavorite: (id: string) => void;
  renderFolderPopover: () => React.ReactNode;
}

export const FavoriteLogisticsCard: React.FC<FavoriteLogisticsCardProps> = ({
  vehicle,
  isFav,
  itemFolders,
  onToggleFavorite,
  renderFolderPopover
}) => {
  const coverUrl = vehicle.media[0]?.url;
  const statusMeta = LOGISTICS_STATUS_LABELS[vehicle.status];

  return (
    <div
      className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all ${
        isFav
          ? 'border-rose-500/35 shadow-md shadow-rose-950/10'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div>
        <div className="aspect-[16/9] bg-slate-950 relative overflow-hidden flex items-center justify-center">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={vehicle.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-emerald-400/75">
              <Truck className="w-8 h-8" />
              <span className="text-[10px] text-slate-500 font-mono">
                {vehicle.plateOrCode || vehicle.id}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-slate-950/85 border border-slate-700 text-[10px] font-bold text-emerald-300">
            {LOGISTICS_CATEGORY_LABELS[vehicle.category]}
          </span>

          <button
            type="button"
            onClick={() => onToggleFavorite(vehicle.id)}
            className={`absolute top-2.5 left-2.5 p-2 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
              isFav
                ? 'bg-rose-500/30 border-rose-400 text-white'
                : 'bg-slate-950/75 border-slate-700 text-slate-200 hover:text-rose-400'
            }`}
            title={isFav ? 'إزالة وسيلة النقل من المفضلة' : 'إضافة وسيلة النقل إلى المفضلة'}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <div className="absolute bottom-2.5 right-2.5 left-2.5 flex items-center justify-between text-[11px]">
            <span className="text-white font-semibold truncate">
              {vehicle.partnerCompanyName || vehicle.ownerCompanyName}
            </span>
            <span
              className={`px-2 py-0.5 rounded border text-[10px] font-bold shrink-0 ${statusMeta.badgeCls}`}
            >
              {statusMeta.label}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-white line-clamp-1">{vehicle.name}</h4>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {vehicle.plateOrCode}
              </span>
            </div>
            {vehicle.notes && (
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{vehicle.notes}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">
                {vehicle.city} · {vehicle.zone}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5 font-mono text-emerald-300 font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>{vehicle.passengerCapacity} راكب</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 space-y-1 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">السائق / القبطان:</span>
              <span className="text-slate-200 font-semibold">
                {vehicle.driverName || 'غير محدد'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">التشغيل:</span>
              <span className="text-cyan-300">
                {LOGISTICS_OWNERSHIP_LABELS[vehicle.ownershipType]}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">التكلفة / الرحلة:</span>
              <span className="font-mono font-bold text-emerald-400">
                {vehicle.pricePerTripEGP.toLocaleString()} ج.م / €{vehicle.pricePerTripEUR}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {vehicle.hasAC && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-cyan-300">
                <Snowflake className="w-3 h-3" />
                تكييف مركزي
              </span>
            )}
            {vehicle.hasGPS && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-emerald-300">
                <Navigation className="w-3 h-3" />
                GPS
              </span>
            )}
          </div>

          {itemFolders.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {itemFolders.map((f) => (
                <span
                  key={f.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
                    FOLDER_COLOR_BADGE_MAP[f.color]
                  }`}
                >
                  <Folder className="w-2.5 h-2.5" />
                  {f.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-slate-800/80 flex items-center justify-between gap-2 bg-slate-950/40">
        <div dir="ltr" className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
          <Phone className="w-2.5 h-2.5 text-slate-500" />
          <span>{vehicle.driverPhone || vehicle.id}</span>
        </div>
        {renderFolderPopover()}
      </div>
    </div>
  );
};
