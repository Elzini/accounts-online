import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';
import { Language, Direction, TranslationKeys } from '@/i18n/types';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  t: TranslationKeys;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const translations: Record<Language, TranslationKeys> = { ar, en };

const LanguageContext = createContext<LanguageContextType>({
  language: 'ar',
  direction: 'rtl',
  t: ar,
  setLanguage: () => {},
  isRTL: true,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

// Convenience hook - just returns the translation object
export function useT() {
  const { t } = useContext(LanguageContext);
  return t;
}

const STORAGE_KEY = 'elzini-language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'ar' || stored === 'en') return stored;
    } catch {}
    return 'ar';
  });

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = language === 'ar';
  const t = translations[language];

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, []);

  // Apply direction and lang to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('dir', direction);
    html.setAttribute('lang', language);

    // Update font based on language
    if (language === 'en') {
      document.body.style.fontFamily = "'Inter', 'Cairo', sans-serif";
    } else {
      // Will be overridden by ThemeContext if custom font is set
      document.body.style.fontFamily = "'Cairo', sans-serif";
    }
  }, [language, direction]);

  return (
    <LanguageContext.Provider value={{ language, direction, t, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}
