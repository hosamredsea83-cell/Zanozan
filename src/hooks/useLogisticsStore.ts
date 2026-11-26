import { useEffect, useRef, useState } from 'react';
import type { AppUser } from '../types/auth';
import {
  LOGISTICS_CATEGORY_LABELS,
  LOGISTICS_STATUS_LABELS,
  LogisticsVehicle,
  LogisticsVehicleStatus
} from '../types/logistics';
import type { LogAuditEventInput } from './useAuditLogStore';
import { buildCreateAuditTrail, buildUpdateAuditTrail } from './useAuditLogStore';
import { fetchDomainStore, saveDomainStore } from '../services/serverStoreSync';

const LOGISTICS_VEHICLES_STORAGE_KEY = 'zanoza_logistics_vehicles_v1';

function readStoredLogisticsVehicles(): LogisticsVehicle[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOGISTICS_VEHICLES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LogisticsVehicle[]) : [];
  } catch {
    return [];
  }
}

export function useLogisticsStore(
  currentUser: AppUser,
  onAuditLog?: (input: LogAuditEventInput) => void
) {
  const [logisticsVehicles, setLogisticsVehicles] = useState<LogisticsVehicle[]>(() =>
    readStoredLogisticsVehicles()
  );
  const hasHydratedServer = useRef(false);

  useEffect(() => {
    let active = true;
    fetchDomainStore<LogisticsVehicle[]>('logistics_vehicles')
      .then((serverRows) => {
        if (!active) return;
        if (Array.isArray(serverRows)) {
          setLogisticsVehicles(serverRows);
        }
        hasHydratedServer.current = true;
      })
      .catch(() => {
        if (active) hasHydratedServer.current = true;
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LOGISTICS_VEHICLES_STORAGE_KEY,
        JSON.stringify(logisticsVehicles)
      );
    } catch {
      // ignore storage quota errors
    }
    if (hasHydratedServer.current) {
      void saveDomainStore('logistics_vehicles', logisticsVehicles);
    }
  }, [logisticsVehicles]);

  const createVehicle = (vehicle: LogisticsVehicle) => {
    const audit = buildCreateAuditTrail(currentUser);
    const stamped: LogisticsVehicle = {
      ...vehicle,
      ...audit
    };
    setLogisticsVehicles((prev) => [stamped, ...prev]);
    onAuditLog?.({
      actor: currentUser,
      action: 'create',
      domain: 'logistics',
      entityId: stamped.id,
      entityName: stamped.name,
      summary: `أضاف ${currentUser.name} وسيلة نقل جديدة «${stamped.name}»`,
      details: `الفئة: ${LOGISTICS_CATEGORY_LABELS[stamped.category]} · المدينة: ${stamped.city} · السعة: ${stamped.passengerCapacity} راكب`
    });
  };

  const updateVehicle = (updated: LogisticsVehicle) => {
    const existing = logisticsVehicles.find((v) => v.id === updated.id);
    const audit = buildUpdateAuditTrail(currentUser, existing);
    const stamped: LogisticsVehicle = {
      ...updated,
      ...audit
    };
    setLogisticsVehicles((prev) =>
      prev.map((v) => (v.id === stamped.id ? stamped : v))
    );
    onAuditLog?.({
      actor: currentUser,
      action: 'update',
      domain: 'logistics',
      entityId: stamped.id,
      entityName: stamped.name,
      summary: `عدّل ${currentUser.name} بيانات وسيلة النقل «${stamped.name}»`,
      details: `اللوحة/الكود: ${stamped.plateOrCode} · الحالة: ${LOGISTICS_STATUS_LABELS[stamped.status].label}`
    });
  };

  const deleteVehicle = (vehicleId: string) => {
    const target = logisticsVehicles.find((v) => v.id === vehicleId);
    setLogisticsVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    onAuditLog?.({
      actor: currentUser,
      action: 'delete',
      domain: 'logistics',
      entityId: vehicleId,
      entityName: target?.name || vehicleId,
      summary: `حذف ${currentUser.name} وسيلة النقل «${target?.name || vehicleId}»`,
      details: target ? `اللوحة/الكود: ${target.plateOrCode} · المدينة: ${target.city}` : undefined
    });
  };

  const changeVehicleStatus = (vehicleId: string, status: LogisticsVehicleStatus) => {
    const target = logisticsVehicles.find((v) => v.id === vehicleId);
    const audit = buildUpdateAuditTrail(currentUser, target);
    const today = new Date().toISOString().split('T')[0];
    setLogisticsVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId ? { ...v, status, updatedAt: today, ...audit } : v
      )
    );
    onAuditLog?.({
      actor: currentUser,
      action: 'status_change',
      domain: 'logistics',
      entityId: vehicleId,
      entityName: target?.name || vehicleId,
      summary: `غيّر ${currentUser.name} حالة وسيلة النقل «${target?.name || vehicleId}» إلى «${LOGISTICS_STATUS_LABELS[status].label}»`
    });
  };

  return {
    logisticsVehicles,
    hasLoadedLogistics: true,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    changeVehicleStatus
  };
}
