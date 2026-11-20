import { useEffect, useState } from 'react';
import type { AppUser } from '../types/auth';
import {
  AuditActionType,
  AuditDomainType,
  AuditLogEntry,
  EntityAuditTrail,
  formatAuditTimestamp
} from '../types/audit';

const AUDIT_LOGS_STORAGE_KEY = 'zanoza_platform_audit_logs_v1';
const MAX_AUDIT_LOG_ENTRIES = 1000;

function readStoredAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AuditLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function buildCreateAuditTrail(user: AppUser): EntityAuditTrail {
  const ts = formatAuditTimestamp();
  return {
    createdById: user.id,
    createdByName: user.name,
    createdByCompany: user.companyName,
    createdAtTime: ts.formattedDateTime,
    updatedById: user.id,
    updatedByName: user.name,
    updatedByCompany: user.companyName,
    updatedAtTime: ts.formattedDateTime
  };
}

export function buildUpdateAuditTrail(
  user: AppUser,
  existing?: EntityAuditTrail
): EntityAuditTrail {
  const ts = formatAuditTimestamp();
  return {
    createdById: existing?.createdById || user.id,
    createdByName: existing?.createdByName || user.name,
    createdByCompany: existing?.createdByCompany || user.companyName,
    createdAtTime: existing?.createdAtTime,
    updatedById: user.id,
    updatedByName: user.name,
    updatedByCompany: user.companyName,
    updatedAtTime: ts.formattedDateTime
  };
}

export interface LogAuditEventInput {
  actor: AppUser;
  action: AuditActionType;
  domain: AuditDomainType;
  entityId: string;
  entityName: string;
  summary: string;
  details?: string;
}

export function useAuditLogStore() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => readStoredAuditLogs());

  useEffect(() => {
    try {
      window.localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(auditLogs));
    } catch {
      // ignore storage quota errors
    }
  }, [auditLogs]);

  const logAuditEvent = ({
    actor,
    action,
    domain,
    entityId,
    entityName,
    summary,
    details
  }: LogAuditEventInput) => {
    const ts = formatAuditTimestamp();
    const entry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      timestampIso: ts.timestampIso,
      formattedDate: ts.formattedDate,
      formattedTime: ts.formattedTime,
      formattedDateTime: ts.formattedDateTime,
      actorId: actor.id,
      actorName: actor.name,
      actorCompanyName: actor.companyName,
      actorInitials: actor.avatarInitials,
      action,
      domain,
      entityId: entityId || '—',
      entityName: entityName || 'عنصر غير مسمى',
      summary,
      details
    };
    setAuditLogs((prev) => [entry, ...prev].slice(0, MAX_AUDIT_LOG_ENTRIES));
  };

  return {
    auditLogs,
    logAuditEvent
  };
}
