import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { locales, Locale, Language } from '../i18n/locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: Locale;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    const storedLang = localStorage.getItem('appLanguage') as Language | null;
    if (storedLang && locales[storedLang]) {
      setLanguage(storedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    localStorage.setItem('appLanguage', lang);
    setLanguage(lang);
  };

  const value = {
    language,
    setLanguage: handleSetLanguage,
    translations: locales[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
