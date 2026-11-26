import React from 'react';
import type { EquipmentItem, EquipmentOwnershipType } from '../../types/equipment';
import type { AppUser } from '../../types/auth';
import type { PartnerRecord } from '../../types/partner';
import type { PersonProfile } from '../../types/personProfile';
import { PARTNER_TYPE_LABELS } from './equipmentHelpers';
import { Building2, Phone, UserCheck, Users } from 'lucide-react';

interface EquipmentOwnershipSyncFieldProps {
  editingEquipment: EquipmentItem;
  setEditingEquipment: React.Dispatch<React.SetStateAction<EquipmentItem | null>>;
  currentUser: AppUser;
  partners: PartnerRecord[];
  personProfiles?: PersonProfile[];
  onOpenPartnersRegistry: () => void;
}

export const EquipmentOwnershipSyncField: React.FC<EquipmentOwnershipSyncFieldProps> = ({
  editingEquipment,
  setEditingEquipment,
  currentUser,
  partners,
  personProfiles = [],
  onOpenPartnersRegistry
}) => {
  const selectedPartner = partners.find((p) => p.id === editingEquipment.partnerId);
  const selectedProfile = personProfiles.find(
    (p) =>
      p.id === editingEquipment.personCustody?.personProfileId ||
      p.id === editingEquipment.partnerId
  );

  const handleOwnershipTypeChange = (nextType: EquipmentOwnershipType) => {
    if (nextType === 'owned') {
      setEditingEquipment({
        ...editingEquipment,
        ownershipType: 'owned',
        partnerId: undefined,
        partnerName: undefined,
        partnerCompanyName: undefined,
        personCustody: undefined,
        rentalContractRef: undefined,
        ownershipDetails: `صاحب النشاط: ${currentUser.name} — ${currentUser.companyName}`
      });
      return;
    }

    if (nextType === 'partner_shared') {
      const targetPartner = selectedPartner || partners[0];
      if (targetPartner) {
        setEditingEquipment({
          ...editingEquipment,
          ownershipType: 'partner_shared',
          partnerId: targetPartner.id,
          partnerName: targetPartner.name,
          partnerCompanyName: targetPartner.companyName,
          ownershipDetails: `مشاركة تشغيل مع الشريك: ${targetPartner.name} — ${targetPartner.companyName}`
        });
      } else {
        setEditingEquipment({
          ...editingEquipment,
          ownershipType: 'partner_shared',
          partnerId: undefined,
          partnerName: undefined,
          partnerCompanyName: undefined,
          ownershipDetails: ''
        });
      }
      return;
    }

    // rented
    const rentalSupplier =
      selectedPartner || partners.find((p) => p.partnerType === 'rental_supplier');
    setEditingEquipment({
      ...editingEquipment,
      ownershipType: 'rented',
      partnerId: rentalSupplier?.id,
      partnerName: rentalSupplier?.name,
      partnerCompanyName: rentalSupplier?.companyName,
      ownershipDetails: rentalSupplier
        ? `مستأجرة بعقد تشغيل — المؤجر: ${rentalSupplier.companyName} (${rentalSupplier.name})`
        : editingEquipment.rentalContractRef || `مستأجرة بعقد تشغيل — ${currentUser.companyName}`
    });
  };

  const handlePersonOrPartnerSelect = (value: string) => {
    if (value === '__OPEN_REGISTRY__') {
      onOpenPartnersRegistry();
      return;
    }
    if (!value) {
      setEditingEquipment({
        ...editingEquipment,
        partnerId: undefined,
        partnerName: undefined,
        partnerCompanyName: undefined,
        personCustody: undefined,
        ownershipDetails:
          editingEquipment.ownershipType === 'rented'
            ? 'مستأجرة بعقد تشغيل — مؤجر خارجي'
            : ''
      });
      return;
    }

    const chosenProfile = personProfiles.find((p) => p.id === value);
    if (chosenProfile) {
      const isIsolated =
        chosenProfile.subscriptionStatus === 'subscribed_isolated' ||
        chosenProfile.subscriptionStatus === 'native_member';
      setEditingEquipment({
        ...editingEquipment,
        partnerId: chosenProfile.id,
        partnerName: chosenProfile.name,
        partnerCompanyName: chosenProfile.companyName,
        personCustody: {
          personProfileId: chosenProfile.id,
          personName: chosenProfile.name,
          personStatus: isIsolated ? 'subscribed_isolated' : 'external_pending',
          addedByUserId: chosenProfile.addedByUserId || currentUser.id,
          addedByUserName: chosenProfile.addedByUserName || currentUser.name,
          claimedUserId: isIsolated ? chosenProfile.linkedUserId : undefined
        },
        ownershipDetails:
          editingEquipment.ownershipType === 'partner_shared'
            ? `مشاركة تشغيل مع المورد: ${chosenProfile.name} — ${chosenProfile.companyName}`
            : `مستأجرة بعقد تشغيل — المؤجر: ${chosenProfile.companyName} (${chosenProfile.name})`
      });
      return;
    }

    const chosen = partners.find((p) => p.id === value);
    if (!chosen) return;

    setEditingEquipment({
      ...editingEquipment,
      partnerId: chosen.id,
      partnerName: chosen.name,
      partnerCompanyName: chosen.companyName,
      ownershipDetails:
        editingEquipment.ownershipType === 'partner_shared'
          ? `مشاركة تشغيل مع الشريك: ${chosen.name} — ${chosen.companyName}`
          : `مستأجرة بعقد تشغيل — المؤجر: ${chosen.companyName} (${chosen.name})`
    });
  };

  const currentSelectValue =
    editingEquipment.personCustody?.personProfileId || editingEquipment.partnerId || '';

  return (
    <>
      {/* div:nth-of-type(5) — بيانات الملكية أو الاستخدام */}
      <div>
        <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
          بيانات الملكية أو الاستخدام
        </label>
        <select
          value={editingEquipment.ownershipType}
          onChange={(e) => handleOwnershipTypeChange(e.target.value as EquipmentOwnershipType)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500"
        >
          <option value="owned">ملكية خاصة لصاحب النشاط ({currentUser.name})</option>
          <option value="rented">مستأجرة بعقد تشغيل</option>
          <option value="partner_shared">
            مشاركة تشغيل مع شريك / مالك معدة ({personProfiles.length || partners.length})
          </option>
        </select>
      </div>

      {/* div:nth-of-type(6) — تفاصيل الملكية / المرجع المتزامنة */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] text-slate-300 block font-semibold">
            {editingEquipment.ownershipType === 'partner_shared'
              ? 'تفاصيل الملكية / اختيار المالك أو الشريك'
              : editingEquipment.ownershipType === 'rented'
              ? 'تفاصيل الملكية / الجهة المؤجرة والعقد'
              : 'تفاصيل الملكية / صاحب النشاط المرتبط'}
          </label>
          {editingEquipment.ownershipType === 'owned' ? (
            <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              <span>صاحب النشاط: {currentUser.name}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={onOpenPartnersRegistry}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Users className="w-3 h-3" />
              <span>الملفات الشخصية والموردين ({personProfiles.length || partners.length})</span>
            </button>
          )}
        </div>

        {/* Always keep direct input as first input child to preserve CSS selector div:nth-of-type(6) > input:nth-of-type(1) */}
        <input
          type="text"
          value={
            editingEquipment.ownershipType === 'owned' && !editingEquipment.ownershipDetails
              ? `صاحب النشاط: ${currentUser.name} — ${currentUser.companyName}`
              : editingEquipment.ownershipDetails || ''
          }
          onChange={(e) =>
            setEditingEquipment({ ...editingEquipment, ownershipDetails: e.target.value })
          }
          placeholder={
            editingEquipment.ownershipType === 'partner_shared'
              ? 'اختر المالك من الملفات الشخصية أو الشركاء بالأسفل...'
              : editingEquipment.ownershipType === 'rented'
              ? 'رقم عقد التشغيل أو اسم الجهة المؤجرة...'
              : `صاحب النشاط: ${currentUser.name}`
          }
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500"
        />

        {/* Synchronized Owner / Partners Registry Control */}
        {editingEquipment.ownershipType === 'owned' && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-200 font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{currentUser.name}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{currentUser.companyName}</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono" dir="ltr">
              {currentUser.phone}
            </span>
          </div>
        )}

        {(editingEquipment.ownershipType === 'partner_shared' ||
          editingEquipment.ownershipType === 'rented') && (
          <div className="space-y-1.5">
            <select
              value={currentSelectValue}
              onChange={(e) => handlePersonOrPartnerSelect(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="">
                -- اختر المالك من الملفات الشخصية والموردين --
              </option>
              {personProfiles.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.name} — {prof.companyName} ({prof.phone})
                </option>
              ))}
              {partners
                .filter((prt) => !personProfiles.some((prof) => prof.id === prt.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.companyName} ({PARTNER_TYPE_LABELS[p.partnerType]})
                  </option>
                ))}
              <option value="__OPEN_REGISTRY__">+ فتح الملفات الشخصية والموردين...</option>
            </select>

            {(selectedProfile || selectedPartner) && (
              <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-200 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-bold text-white truncate">
                    {selectedProfile?.name || selectedPartner?.name}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300 truncate">
                    {selectedProfile?.companyName || selectedPartner?.companyName}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(selectedProfile?.phone || selectedPartner?.phone) && (
                    <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1" dir="ltr">
                      <Phone className="w-3 h-3" />
                      {selectedProfile?.phone || selectedPartner?.phone}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

