/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Palette,
  Terminal,
  Globe,
  RefreshCw,
  Sparkles,
  BookOpen,
  ChevronDown,
  Check,
  Database,
  Plug,
} from 'lucide-react';
import { useLanguage } from '../i18n/languageContext';
import { Language } from '../i18n/translations';
import { useTheme } from '../themes/themeContext';
import { useTerminal } from './terminalContext';

interface TopNavigationProps {
  onOpenCustomizer: () => void;
  onOpenRagManager?: () => void;
  onOpenProviderSettings?: () => void;
  onNewChat?: () => void;
  documentName?: string;
  isChatActive?: boolean;
}

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export const TopNavigation: React.FC<TopNavigationProps> = ({
  onOpenCustomizer,
  onOpenRagManager,
  onOpenProviderSettings,
  onNewChat,
  documentName,
  isChatActive,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { activeColors, rainbowGradientStyle } = useTheme();
  const { isOpen, toggleTerminal, isRunning, currentStep } = useTerminal();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <header
      className="sticky top-0 left-0 right-0 z-30 border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor: `${activeColors.surface}e6`,
        borderColor: activeColors.border,
        color: activeColors.textPrimary,
      }}
    >
      {/* Top rainbow banner */}
      <div className="h-[3px] w-full" style={{ background: rainbowGradientStyle }} />

      <div className="max-w-7xl mx-auto px-2 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Brand & Document Name */}
        <div className="flex items-center space-x-2 min-w-0">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-md flex-shrink-0"
            style={{ backgroundColor: activeColors.rainbow[0] }}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>

          <div className="min-w-0 max-w-[38vw] sm:max-w-[46vw] md:max-w-none">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xs sm:text-base tracking-tight truncate">
                {t.appTitle}
              </span>
              <span
                className="hidden md:inline text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-bold text-white shadow-sm"
                style={{ backgroundColor: activeColors.rainbow[4] }}
              >
                RAG + Shell
              </span>
            </div>

            {isChatActive && documentName && (
              <p
                className="text-[10px] sm:text-xs truncate font-medium flex items-center gap-1"
                style={{ color: activeColors.textMuted }}
                title={documentName}
              >
                <span>{t.chatWith}:</span>
                <span className="font-bold underline" style={{ color: activeColors.accent }}>
                  {documentName}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen((prev) => !prev)}
              className="px-2 py-2 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all hover:bg-white/10"
              style={{ borderColor: activeColors.border }}
              title={t.language}
              aria-haspopup="true"
              aria-expanded={langMenuOpen}
            >
              <span className="text-sm">{currentLang.flag}</span>
              <span className="hidden sm:inline">{currentLang.label}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {langMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setLangMenuOpen(false)} />
                <div
                  className="absolute right-0 mt-1.5 w-40 rounded-xl border shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95"
                  style={{
                    backgroundColor: activeColors.surface,
                    borderColor: activeColors.border,
                    color: activeColors.textPrimary,
                  }}
                >
                  <div
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b opacity-60"
                    style={{ borderColor: activeColors.border }}
                  >
                    {t.language}
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-white/10 transition-colors text-left font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {language === lang.code && (
                        <Check className="w-3.5 h-3.5" style={{ color: activeColors.accent }} />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* AI Provider Settings Button */}
          {onOpenProviderSettings && (
            <button
              onClick={onOpenProviderSettings}
              className="px-2 py-2 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all hover:bg-white/10"
              style={{ borderColor: activeColors.border }}
              title="AI Provider Settings"
            >
              <Plug className="w-4 h-4" style={{ color: activeColors.accent }} />
              <span className="hidden md:inline">AI Provider</span>
            </button>
          )}

          {/* RAG Store Manager Button */}
          {onOpenRagManager && (
            <button
              onClick={onOpenRagManager}
              className="px-2 py-2 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all hover:bg-white/10"
              style={{ borderColor: activeColors.border }}
              title="RAG Store Manager"
            >
              <Database className="w-4 h-4" style={{ color: activeColors.accent }} />
              <span className="hidden md:inline">RAG Stores</span>
            </button>
          )}

          {/* Theme & Palette Customizer Button */}
          <button
            onClick={onOpenCustomizer}
            className="px-2 py-2 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all hover:bg-white/10"
            style={{ borderColor: activeColors.border }}
            title={t.themeCustomizer}
          >
            <Palette className="w-4 h-4" style={{ color: activeColors.accent }} />
            <span className="hidden md:inline">{t.themeCustomizer}</span>
            <span
              className="w-2 h-2 rounded-full hidden sm:block animate-pulse"
              style={{ backgroundColor: activeColors.rainbow[2] }}
            />
          </button>

          {/* Slide-out Terminal Button */}
          <button
            onClick={toggleTerminal}
            className={`px-2 py-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all shadow-sm ${
              isOpen
                ? 'bg-emerald-600 text-white'
                : 'border hover:bg-white/10'
            }`}
            style={{
              borderColor: isOpen ? undefined : activeColors.border,
              backgroundColor: isOpen ? '#059669' : undefined,
            }}
            title={isOpen ? t.closeTerminal : t.openTerminal}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">{t.terminal}</span>
            {isRunning ? (
              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-400/20 text-emerald-300 font-mono animate-pulse">
                {currentStep ? `${currentStep.current}/${currentStep.total}` : '●'}
              </span>
            ) : null}
          </button>

          {/* New Chat Button */}
          {isChatActive && onNewChat && (
            <button
              onClick={onNewChat}
              className="px-2 py-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-md active:scale-95 flex items-center gap-1 sm:gap-1.5"
              style={{ backgroundColor: activeColors.accent }}
              title={t.newChat}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.newChat}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
