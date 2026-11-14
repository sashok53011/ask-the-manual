/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState } from 'react';
import { Language, translations, TranslationStrings } from './translations';

export interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationStrings;
  translateTextLive: (text: string, targetLang: Language) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_language');
      if (saved === 'ru' || saved === 'de' || saved === 'en') return saved;
      const navLang = navigator.language.toLowerCase();
      if (navLang.startsWith('ru')) return 'ru';
      if (navLang.startsWith('de')) return 'de';
    } catch {}
    return 'ru'; // Default to Russian as per user prompt "dobav..." or English
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('app_language', lang);
    } catch {}
  };

  const translateTextLive = async (text: string, targetLang: Language): Promise<string> => {
    const langNames: Record<Language, string> = {
      en: 'English',
      ru: 'Russian (русский)',
      de: 'German (Deutsch)',
    };
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3-flash-preview',
          contents: `Translate the following markdown and text accurately into ${langNames[targetLang]}. Preserve markdown formatting, code blocks, math formulas and technical terms intact.\n\nText to translate:\n${text}`,
        }),
      });
      if (!res.ok) throw new Error('Live translation request failed');
      const data = await res.json();
      return data.text || text;
    } catch (err) {
      console.error('Error during live translation:', err);
      return text;
    }
  };

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateTextLive }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
