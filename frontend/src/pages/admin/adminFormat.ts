import React from 'react';
import { format } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';

export function formatAdminDate(dateStr: string, language: string): string {
  const locale = language === 'ar' ? ar : enUS;
  try {
    return format(new Date(dateStr), 'PPpp', { locale });
  } catch {
    return dateStr;
  }
}

export function formatAdminShortDate(dateStr: string, language: string): string {
  const locale = language === 'ar' ? ar : enUS;
  try {
    return format(new Date(dateStr), 'PP', { locale });
  } catch {
    return dateStr;
  }
}

export function LtrBdi({ children }: { children: React.ReactNode }) {
  return React.createElement('bdi', { dir: 'ltr' }, children);
}
