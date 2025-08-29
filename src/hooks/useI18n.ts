import { useState, useEffect } from 'react';
import { i18n, LanguageConfig } from '../lib/i18n';

interface UseI18nReturn {
  t: (key: string, variables?: Record<string, string | number>) => string;
  language: string;
  setLanguage: (language: string) => void;
  languages: Record<string, LanguageConfig>;
  isRTL: boolean;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatRelativeTime: (date: Date | string) => string;
}

export function useI18n(): UseI18nReturn {
  const [language, setLanguageState] = useState(i18n.getCurrentLanguage());

  useEffect(() => {
    const unsubscribe = i18n.subscribe((newLanguage) => {
      setLanguageState(newLanguage);
    });

    return unsubscribe;
  }, []);

  const setLanguage = (newLanguage: string) => {
    i18n.setLanguage(newLanguage);
  };

  const t = (key: string, variables?: Record<string, string | number>) => {
    return i18n.translate(key, variables);
  };

  return {
    t,
    language,
    setLanguage,
    languages: i18n.getSupportedLanguages(),
    isRTL: i18n.isRTL(),
    formatDate: i18n.formatDate.bind(i18n),
    formatNumber: i18n.formatNumber.bind(i18n),
    formatCurrency: i18n.formatCurrency.bind(i18n),
    formatRelativeTime: i18n.formatRelativeTime.bind(i18n)
  };
}

export default useI18n;
