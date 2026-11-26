import { useEffect, useState } from 'react';
import type { AppUser } from '../types/auth';
import {
  getDefaultOwnerTheme,
  OwnerThemeSettings
} from '../types/theme';
import { formatAuditTimestamp } from '../types/audit';
import type { LogAuditEventInput } from './useAuditLogStore';

const OWNER_THEMES_STORAGE_KEY = 'zanoza_owner_themes_v1';

function readStoredOwnerThemes(): Record<string, OwnerThemeSettings> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(OWNER_THEMES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, OwnerThemeSettings>) : {};
  } catch {
    return {};
  }
}

export function useOwnerThemeStore(
  currentUser: AppUser,
  onAuditLog: (input: LogAuditEventInput) => void
) {
  const [themesByUser, setThemesByUser] = useState<Record<string, OwnerThemeSettings>>(() =>
    readStoredOwnerThemes()
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(OWNER_THEMES_STORAGE_KEY, JSON.stringify(themesByUser));
    } catch {
      // ignore storage errors
    }
  }, [themesByUser]);

  const currentTheme: OwnerThemeSettings =
    themesByUser[currentUser.id] || getDefaultOwnerTheme(currentUser.id);

  const updateCurrentUserTheme = (patch: Partial<OwnerThemeSettings>) => {
    const ts = formatAuditTimestamp();
    const next: OwnerThemeSettings = {
      ...currentTheme,
      ...patch,
      userId: currentUser.id,
      updatedAt: ts.formattedDateTime,
      updatedByName: currentUser.name
    };
    setThemesByUser((prev) => ({
      ...prev,
      [currentUser.id]: next
    }));
    onAuditLog({
      actor: currentUser,
      action: 'update',
      domain: 'theme',
      entityId: `theme-${currentUser.id}`,
      entityName: `تصميم ${currentUser.name}`,
      summary: `حدّث ${currentUser.name} تصميم القالب والألوان والخطوط الخاص بحسابه`,
      details: `القالب: ${next.templateId} · اللون: ${next.colorPreset} · الخط: ${next.fontFamily}`
    });
  };

  const resetCurrentUserTheme = () => {
    const ts = formatAuditTimestamp();
    const fallback = {
      ...getDefaultOwnerTheme(currentUser.id),
      updatedAt: ts.formattedDateTime,
      updatedByName: currentUser.name
    };
    setThemesByUser((prev) => ({
      ...prev,
      [currentUser.id]: fallback
    }));
    onAuditLog({
      actor: currentUser,
      action: 'update',
      domain: 'theme',
      entityId: `theme-${currentUser.id}`,
      entityName: `تصميم ${currentUser.name}`,
      summary: `استعاد ${currentUser.name} التصميم الافتراضي الخاص بحسابه`
    });
  };

  return {
    currentTheme,
    themesByUser,
    updateCurrentUserTheme,
    resetCurrentUserTheme
  };
}
