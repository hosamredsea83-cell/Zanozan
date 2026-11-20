import { useEffect, useMemo, useState } from 'react';
import type { CustomTechnicalSpecItem } from '../types/activity';
import type { AppUser } from '../types/auth';
import type {
  EquipmentItem,
  EquipmentPropertyItem,
  EquipmentStatus,
  EquipmentTypeDefinition
} from '../types/equipment';
import type { PartnerRecord } from '../types/partner';
import type { LogAuditEventInput } from './useAuditLogStore';
import { buildCreateAuditTrail, buildUpdateAuditTrail } from './useAuditLogStore';
import {
  loadCustomTechnicalSpecsFromDb,
  loadEquipmentPropertiesFromDb,
  loadEquipmentsFromDb,
  loadEquipmentTypesFromDb,
  resetAndReseedCustomTechnicalSpecsDb,
  resetAndReseedEquipmentPropertiesDb,
  saveCustomTechnicalSpecsToDb,
  saveEquipmentPropertiesToDb,
  saveEquipmentsToDb,
  saveEquipmentTypesToDb
} from '../db/localSpecsAndEquipmentDb';
import { loadPartnersFromDb, savePartnersToDb } from '../db/localPartnersDb';

const EQ_STATUS_AR: Record<EquipmentStatus, string> = {
  available: 'متاحة وجاهزة للتشغيل',
  in_use: 'قيد التشغيل في نشاط',
  maintenance: 'تحت الصيانة / الفحص',
  inactive: 'متوقفة مؤقتاً'
};

export function useEquipmentsStore(
  currentUser: AppUser,
  onAuditLog?: (input: LogAuditEventInput) => void
) {
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentTypeDefinition[]>([]);
  const [equipmentProperties, setEquipmentProperties] = useState<EquipmentPropertyItem[]>([]);
  const [customTechnicalSpecs, setCustomTechnicalSpecs] = useState<CustomTechnicalSpecItem[]>([]);
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [hasLoadedCatalogsFromDb, setHasLoadedCatalogsFromDb] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadEquipmentPropertiesFromDb(),
      loadEquipmentTypesFromDb(),
      loadEquipmentsFromDb(),
      loadCustomTechnicalSpecsFromDb(),
      loadPartnersFromDb()
    ])
      .then(([eqProps, eqTypes, eqItems, customSpecs, partnerRows]) => {
        if (!active) return;
        setEquipmentProperties(eqProps);
        setEquipmentTypes(eqTypes);
        setEquipments(eqItems);
        setCustomTechnicalSpecs(customSpecs);
        setPartners(partnerRows);
        setHasLoadedCatalogsFromDb(true);
      })
      .catch((err) => {
        console.error('Failed to load specs, equipment & partners catalogs from IndexedDB:', err);
        if (active) setHasLoadedCatalogsFromDb(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedCatalogsFromDb) return;
    void saveCustomTechnicalSpecsToDb(customTechnicalSpecs);
  }, [customTechnicalSpecs, hasLoadedCatalogsFromDb]);

  useEffect(() => {
    if (!hasLoadedCatalogsFromDb) return;
    void saveEquipmentPropertiesToDb(equipmentProperties);
  }, [equipmentProperties, hasLoadedCatalogsFromDb]);

  useEffect(() => {
    if (!hasLoadedCatalogsFromDb) return;
    void saveEquipmentsToDb(equipments);
  }, [equipments, hasLoadedCatalogsFromDb]);

  useEffect(() => {
    if (!hasLoadedCatalogsFromDb) return;
    void saveEquipmentTypesToDb(equipmentTypes);
  }, [equipmentTypes, hasLoadedCatalogsFromDb]);

  useEffect(() => {
    if (!hasLoadedCatalogsFromDb) return;
    void savePartnersToDb(partners);
  }, [partners, hasLoadedCatalogsFromDb]);

  const visiblePartners = useMemo(
    () =>
      partners.filter(
        (p) => p.ownerId === 'global' || p.ownerId === currentUser.id
      ),
    [partners, currentUser.id]
  );

  const createEquipment = (item: EquipmentItem) => {
    const audit = buildCreateAuditTrail(currentUser);
    const stamped: EquipmentItem = {
      ...item,
      ...audit
    };
    setEquipments((prev) => [stamped, ...prev]);
    onAuditLog?.({
      actor: currentUser,
      action: 'create',
      domain: 'equipment',
      entityId: stamped.id,
      entityName: stamped.name,
      summary: `أنشأ ${currentUser.name} معدة جديدة «${stamped.name}»`,
      details: `التصنيف: ${stamped.classification || 'غير محدد'} · الحالة: ${EQ_STATUS_AR[stamped.status]} · الشركة: ${currentUser.companyName}`
    });
  };

  const updateEquipment = (updated: EquipmentItem) => {
    const existing = equipments.find((eq) => eq.id === updated.id);
    const audit = buildUpdateAuditTrail(currentUser, existing);
    const stamped: EquipmentItem = {
      ...updated,
      ...audit
    };
    setEquipments((prev) => prev.map((eq) => (eq.id === stamped.id ? stamped : eq)));
    onAuditLog?.({
      actor: currentUser,
      action: 'update',
      domain: 'equipment',
      entityId: stamped.id,
      entityName: stamped.name,
      summary: `عدّل ${currentUser.name} بيانات المعدة «${stamped.name}»`,
      details: `الحالة: ${EQ_STATUS_AR[stamped.status]} · الملكية: ${stamped.ownershipType}`
    });
  };

  const deleteEquipment = (equipmentId: string) => {
    const target = equipments.find((eq) => eq.id === equipmentId);
    setEquipments((prev) => prev.filter((eq) => eq.id !== equipmentId));
    onAuditLog?.({
      actor: currentUser,
      action: 'delete',
      domain: 'equipment',
      entityId: equipmentId,
      entityName: target?.name || equipmentId,
      summary: `حذف ${currentUser.name} المعدة «${target?.name || equipmentId}»`,
      details: target
        ? `الشركة المالكة: ${target.ownerCompanyName} · أنشئت في: ${target.createdAtTime || target.createdAt}`
        : undefined
    });
  };

  const changeEquipmentStatus = (equipmentId: string, status: EquipmentStatus) => {
    const target = equipments.find((eq) => eq.id === equipmentId);
    const audit = buildUpdateAuditTrail(currentUser, target);
    const today = new Date().toISOString().split('T')[0];
    setEquipments((prev) =>
      prev.map((eq) =>
        eq.id === equipmentId
          ? { ...eq, status, updatedAt: today, ...audit }
          : eq
      )
    );
    onAuditLog?.({
      actor: currentUser,
      action: 'status_change',
      domain: 'equipment',
      entityId: equipmentId,
      entityName: target?.name || equipmentId,
      summary: `غيّر ${currentUser.name} حالة المعدة «${target?.name || equipmentId}» إلى «${EQ_STATUS_AR[status]}»`,
      details: target ? `الحالة السابقة: ${EQ_STATUS_AR[target.status]}` : undefined
    });
  };

  const updateEquipmentTypesWithAudit = (nextTypes: EquipmentTypeDefinition[]) => {
    const prevIds = new Set(equipmentTypes.map((t) => t.id));
    const nextIds = new Set(nextTypes.map((t) => t.id));
    const added = nextTypes.filter((t) => !prevIds.has(t.id));
    const removed = equipmentTypes.filter((t) => !nextIds.has(t.id));

    setEquipmentTypes(nextTypes);

    if (added.length > 0) {
      added.forEach((t) =>
        onAuditLog?.({
          actor: currentUser,
          action: 'create',
          domain: 'equipment_type',
          entityId: t.id,
          entityName: t.name,
          summary: `أضاف ${currentUser.name} نوع معدة جديد «${t.name}»`
        })
      );
    } else if (removed.length > 0) {
      removed.forEach((t) =>
        onAuditLog?.({
          actor: currentUser,
          action: 'delete',
          domain: 'equipment_type',
          entityId: t.id,
          entityName: t.name,
          summary: `حذف ${currentUser.name} نوع المعدة «${t.name}»`
        })
      );
    } else {
      onAuditLog?.({
        actor: currentUser,
        action: 'update',
        domain: 'equipment_type',
        entityId: 'types-catalog',
        entityName: 'أنواع المعدات والمواصفات',
        summary: `عدّل ${currentUser.name} قوالب ومواصفات أنواع المعدات (${nextTypes.length} نوع)`
      });
    }
  };

  const changeEquipmentProperties = (nextProps: EquipmentPropertyItem[]) => {
    const prevIds = new Set(equipmentProperties.map((p) => p.id));
    const nextIds = new Set(nextProps.map((p) => p.id));
    const added = nextProps.filter((p) => !prevIds.has(p.id));
    const removed = equipmentProperties.filter((p) => !nextIds.has(p.id));

    setEquipmentProperties(nextProps);
    const propById = new Map(nextProps.map((p) => [p.id, p]));
    const propByKey = new Map(nextProps.map((p) => [p.key, p]));
    setEquipmentTypes((prevTypes) =>
      prevTypes.map((eqType) => ({
        ...eqType,
        specGroups: eqType.specGroups.map((grp) => ({
          ...grp,
          fields: grp.fields.map((field) => {
            const matchedProp = propById.get(field.id) || propByKey.get(field.key);
            if (!matchedProp) return field;
            return {
              ...field,
              id: matchedProp.id,
              key: matchedProp.key,
              label: matchedProp.label,
              type: matchedProp.type,
              unit: matchedProp.unit,
              options: matchedProp.options,
              isRequired: matchedProp.isMandatoryDefault,
              isPublicForClient: matchedProp.isPublicDefault
            };
          })
        }))
      }))
    );

    if (added.length > 0) {
      added.forEach((p) =>
        onAuditLog?.({
          actor: currentUser,
          action: 'create',
          domain: 'equipment_property',
          entityId: p.id,
          entityName: p.label,
          summary: `أضاف ${currentUser.name} خاصية معدة «${p.label}»`
        })
      );
    } else if (removed.length > 0) {
      removed.forEach((p) =>
        onAuditLog?.({
          actor: currentUser,
          action: 'delete',
          domain: 'equipment_property',
          entityId: p.id,
          entityName: p.label,
          summary: `حذف ${currentUser.name} خاصية المعدة «${p.label}»`
        })
      );
    } else {
      onAuditLog?.({
        actor: currentUser,
        action: 'update',
        domain: 'equipment_property',
        entityId: 'properties-catalog',
        entityName: 'خصائص المعدات المركزية',
        summary: `حدّث ${currentUser.name} سجل خصائص المعدات (${nextProps.length} خاصية)`
      });
    }
  };

  const resetEquipmentPropertiesCatalog = async () => {
    const reseeded = await resetAndReseedEquipmentPropertiesDb();
    changeEquipmentProperties(reseeded);
  };

  const resetCustomTechnicalSpecsCatalog = async () => {
    const reseeded = await resetAndReseedCustomTechnicalSpecsDb();
    setCustomTechnicalSpecs(reseeded);
    onAuditLog?.({
      actor: currentUser,
      action: 'update',
      domain: 'activity',
      entityId: 'custom-specs-catalog',
      entityName: 'المواصفات الفنية المخصصة',
      summary: `أعاد ${currentUser.name} ضبط سجل المواصفات الفنية المخصصة للأنشطة`
    });
  };

  const createPartner = (
    payload: Omit<PartnerRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ): PartnerRecord => {
    const today = new Date().toISOString().split('T')[0];
    const audit = buildCreateAuditTrail(currentUser);
    const created: PartnerRecord = {
      ...payload,
      id: `prt-${Date.now().toString().slice(-5)}`,
      ownerId: currentUser.id,
      createdAt: today,
      updatedAt: today,
      ...audit
    };
    setPartners((prev) => [created, ...prev]);
    onAuditLog?.({
      actor: currentUser,
      action: 'create',
      domain: 'partner',
      entityId: created.id,
      entityName: `${created.name} (${created.companyName})`,
      summary: `أضاف ${currentUser.name} شريكاً جديداً «${created.name} — ${created.companyName}»`
    });
    return created;
  };

  const updatePartner = (updated: PartnerRecord) => {
    const today = new Date().toISOString().split('T')[0];
    const existing = partners.find((p) => p.id === updated.id);
    const audit = buildUpdateAuditTrail(currentUser, existing);
    const nextRecord: PartnerRecord = { ...updated, updatedAt: today, ...audit };
    setPartners((prev) => prev.map((p) => (p.id === nextRecord.id ? nextRecord : p)));
    setEquipments((prev) =>
      prev.map((eq) => {
        if (eq.partnerId !== nextRecord.id) return eq;
        return {
          ...eq,
          partnerName: nextRecord.name,
          partnerCompanyName: nextRecord.companyName,
          ownershipDetails:
            eq.ownershipType === 'partner_shared'
              ? `مشاركة تشغيل مع الشريك: ${nextRecord.name} — ${nextRecord.companyName}`
              : eq.ownershipType === 'rented'
              ? `مستأجرة بعقد تشغيل — المؤجر: ${nextRecord.companyName} (${nextRecord.name})`
              : eq.ownershipDetails,
          updatedAt: today
        };
      })
    );
    onAuditLog?.({
      actor: currentUser,
      action: 'update',
      domain: 'partner',
      entityId: nextRecord.id,
      entityName: `${nextRecord.name} (${nextRecord.companyName})`,
      summary: `عدّل ${currentUser.name} بيانات الشريك «${nextRecord.name} — ${nextRecord.companyName}»`
    });
  };

  const deletePartner = (partnerId: string) => {
    const target = partners.find((p) => p.id === partnerId);
    setPartners((prev) => prev.filter((p) => p.id !== partnerId));
    onAuditLog?.({
      actor: currentUser,
      action: 'delete',
      domain: 'partner',
      entityId: partnerId,
      entityName: target ? `${target.name} (${target.companyName})` : partnerId,
      summary: `حذف ${currentUser.name} الشريك «${target?.name || partnerId}» من سجل الشركاء`
    });
  };

  return {
    equipments,
    hasLoadedCatalogsFromDb,
    equipmentTypes,
    setEquipmentTypes: updateEquipmentTypesWithAudit,
    equipmentProperties,
    customTechnicalSpecs,
    setCustomTechnicalSpecs,
    partners: visiblePartners,
    allPartners: partners,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    changeEquipmentStatus,
    changeEquipmentProperties,
    resetEquipmentPropertiesCatalog,
    resetCustomTechnicalSpecsCatalog,
    createPartner,
    updatePartner,
    deletePartner
  };
}
