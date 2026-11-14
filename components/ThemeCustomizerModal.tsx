/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Palette,
  Type,
  Sliders,
  RotateCcw,
  Check,
  X,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  useTheme,
  THEMES,
  FONTS,
  ThemeId,
  FontFamilyId,
  ThemeColors,
} from '../themes/themeContext';
import { useLanguage } from '../i18n/languageContext';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({ isOpen, onClose }) => {
  const {
    themeId,
    setThemeId,
    fontId,
    setFontId,
    activeColors,
    setCustomColor,
    resetToThemeDefaults,
    rainbowGradientStyle,
  } = useTheme();

  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'themes' | 'fonts' | 'elements'>('themes');

  if (!isOpen) return null;

  const customizableElements: {
    key: keyof ThemeColors;
    label: string;
    description: string;
  }[] = [
    { key: 'bg', label: t.bgColor, description: 'Main application background color' },
    { key: 'surface', label: t.surfaceColor, description: 'Cards, headers, dialog surfaces' },
    { key: 'userBubble', label: t.userBubbleColor, description: 'Sent user message speech bubble' },
    { key: 'aiBubble', label: t.aiBubbleColor, description: 'Received AI / model response speech bubble' },
    { key: 'accent', label: t.accentColor, description: 'Primary action buttons, active tabs, highlights' },
    { key: 'textPrimary', label: t.textPrimaryColor, description: 'Main text headings, body content' },
    { key: 'textMuted', label: t.textSecondaryColor, description: 'Subtitles, timestamps, secondary labels' },
    { key: 'codeBg', label: t.codeBgColor, description: 'Background of code blocks and snippets' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border transition-all"
        style={{
          backgroundColor: activeColors.surface,
          borderColor: activeColors.border,
          color: activeColors.textPrimary,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Rainbow top line */}
        <div className="h-[4px] w-full flex-shrink-0" style={{ background: rainbowGradientStyle }} />

        {/* Modal Header */}
        <div
          className="px-5 py-4 flex items-center justify-between border-b flex-shrink-0"
          style={{ borderColor: activeColors.border }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-xl text-white shadow-md"
              style={{ backgroundColor: activeColors.rainbow[0] }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">{t.themeCustomizer}</h2>
              <p className="text-xs" style={{ color: activeColors.textMuted }}>
                {t.themes} • {t.fonts} • {t.colorPalette}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={resetToThemeDefaults}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors hover:bg-white/10"
              style={{ borderColor: activeColors.border }}
              title={t.resetDefaults}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.resetDefaults}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title={t.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          className="px-5 pt-3 flex space-x-2 border-b flex-shrink-0 bg-black/10"
          style={{ borderColor: activeColors.border }}
        >
          <button
            onClick={() => setActiveTab('themes')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'themes' ? 'border-current' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
            style={{ color: activeTab === 'themes' ? activeColors.accent : undefined }}
          >
            <Layers className="w-4 h-4" />
            <span>{t.themes} (8)</span>
          </button>

          <button
            onClick={() => setActiveTab('fonts')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'fonts' ? 'border-current' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
            style={{ color: activeTab === 'fonts' ? activeColors.accent : undefined }}
          >
            <Type className="w-4 h-4" />
            <span>{t.fonts}</span>
          </button>

          <button
            onClick={() => setActiveTab('elements')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'elements' ? 'border-current' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
            style={{ color: activeTab === 'elements' ? activeColors.accent : undefined }}
          >
            <Sliders className="w-4 h-4" />
            <span>{t.colorPalette} (RGB)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-grow overflow-y-auto p-3 sm:p-5 space-y-4 sm:space-y-6">
          {/* TAB 1: 8 Distinct Rainbow Themes */}
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <div className="text-xs" style={{ color: activeColors.textMuted }}>
                Every theme features a complete 7-color rainbow spectrum with unique contrast, ambiance, and aesthetics.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(Object.keys(THEMES) as ThemeId[]).map((id) => {
                  const theme = THEMES[id];
                  const isSelected = themeId === id;
                  const themeName = (t as any)[theme.nameKey] || id;
                  const themeDesc = (t as any)[theme.descKey] || '';

                  return (
                    <button
                      key={id}
                      onClick={() => setThemeId(id)}
                      className={`text-left p-3.5 rounded-xl border-2 transition-all relative overflow-hidden flex flex-col justify-between group ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-offset-black/50 shadow-lg scale-[1.01]'
                          : 'hover:border-white/40'
                      }`}
                      style={{
                        backgroundColor: theme.colors.surface,
                        borderColor: isSelected ? theme.colors.accent : activeColors.border,
                        color: theme.colors.textPrimary,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm truncate">{themeName}</span>
                        {isSelected && (
                          <span
                            className="p-1 rounded-full text-white"
                            style={{ backgroundColor: theme.colors.accent }}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <p className="text-xs mb-3 line-clamp-2" style={{ color: theme.colors.textMuted }}>
                        {themeDesc}
                      </p>

                      {/* Theme Rainbow Spectrum Ribbon */}
                      <div className="flex h-2.5 rounded-full overflow-hidden shadow-inner w-full mb-2">
                        {theme.colors.rainbow.map((c, cIdx) => (
                          <div key={cIdx} className="flex-1 h-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>

                      {/* Palette Dots */}
                      <div className="flex items-center space-x-1.5 pt-1 border-t border-white/10 text-[10px] opacity-75">
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: theme.colors.bg }}
                          title="Background"
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: theme.colors.userBubble }}
                          title="User bubble"
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: theme.colors.accent }}
                          title="Accent"
                        />
                        <span className="ml-auto font-mono text-[10px]">
                          {theme.isDark ? 'Dark Theme' : 'Light Theme'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Typography & Font Selector */}
          {activeTab === 'fonts' && (
            <div className="space-y-4">
              <div className="text-xs" style={{ color: activeColors.textMuted }}>
                Choose a typeface to instantly style the entire application and chat typography.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(FONTS) as FontFamilyId[]).map((fId) => {
                  const fontDef = FONTS[fId];
                  const isSelected = fontId === fId;

                  return (
                    <button
                      key={fId}
                      onClick={() => setFontId(fId)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-2 shadow-lg ring-1'
                          : 'hover:border-white/40'
                      }`}
                      style={{
                        backgroundColor: activeColors.surfaceMuted,
                        borderColor: isSelected ? activeColors.accent : activeColors.border,
                        fontFamily: fontDef.css,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">{fontDef.name}</span>
                        {isSelected && (
                          <span
                            className="p-1 rounded-full text-white"
                            style={{ backgroundColor: activeColors.accent }}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm opacity-90 truncate">
                        The quick brown fox jumps over the lazy dog. 1234567890
                      </p>
                      <p className="text-xs opacity-60 mt-1 font-mono">
                        CSS: {fontDef.css}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Full RGB Element Customizer */}
          {activeTab === 'elements' && (
            <div className="space-y-5">
              <div className="text-xs flex items-center justify-between" style={{ color: activeColors.textMuted }}>
                <span>
                  Adjust any element's RGB / Hex color in real time. Changes take effect across the entire UI immediately.
                </span>
                <button
                  onClick={resetToThemeDefaults}
                  className="text-xs underline hover:opacity-100 flex-shrink-0 ml-2"
                >
                  {t.resetDefaults}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customizableElements.map((elem) => {
                  const currentColor = (activeColors as any)[elem.key] || '#000000';

                  return (
                    <div
                      key={elem.key}
                      className="p-3.5 rounded-xl border flex flex-col justify-between"
                      style={{
                        backgroundColor: activeColors.surfaceMuted,
                        borderColor: activeColors.border,
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-xs">{elem.label}</label>
                          <span className="font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-black/20 text-slate-300">
                            {currentColor}
                          </span>
                        </div>
                        <p className="text-[11px] mb-3 opacity-70">{elem.description}</p>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        {/* HTML Color Picker */}
                        <div className="relative">
                          <input
                            type="color"
                            value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#3b82f6'}
                            onChange={(e) => setCustomColor(elem.key, e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 p-0.5 bg-transparent"
                            title={`Pick RGB color for ${elem.label}`}
                          />
                        </div>

                        {/* Text Hex input */}
                        <input
                          type="text"
                          value={currentColor}
                          onChange={(e) => setCustomColor(elem.key, e.target.value)}
                          className="flex-grow font-mono text-xs px-2.5 py-2 rounded-lg bg-black/30 border border-white/10 focus:outline-none focus:border-cyan-400"
                          placeholder="#RRGGBB"
                        />

                        {/* Quick swatch buttons */}
                        <div className="flex items-center space-x-1">
                          {['#00f0ff', '#ff0055', '#ffe600', '#00ff66', '#a855f7', '#ffffff'].map(
                            (hex) => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => setCustomColor(elem.key, hex)}
                                className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-110 active:scale-95"
                                style={{ backgroundColor: hex }}
                                title={`Set ${hex}`}
                              />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="px-5 py-3 border-t flex items-center justify-between flex-shrink-0 bg-black/10 text-xs"
          style={{ borderColor: activeColors.border }}
        >
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColors.accent }} />
            <span style={{ color: activeColors.textMuted }}>
              Current Theme: <strong>{THEMES[themeId]?.nameKey ? (t as any)[THEMES[themeId].nameKey] : themeId}</strong>
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-bold text-white shadow-md transition-all active:scale-95"
            style={{ backgroundColor: activeColors.accent }}
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
