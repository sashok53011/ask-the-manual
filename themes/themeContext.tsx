/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId =
  | 'cyber-neon'
  | 'sunset-twilight'
  | 'ocean-aurora'
  | 'pastel-dream'
  | 'monokai-vivid'
  | 'cosmic-starlight'
  | 'arcade-80s'
  | 'emerald-canopy';

export type FontFamilyId =
  | 'inter'
  | 'jetbrains'
  | 'fira'
  | 'outfit'
  | 'merriweather'
  | 'orbitron'
  | 'caveat';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  userBubble: string;
  userBubbleText: string;
  aiBubble: string;
  aiBubbleText: string;
  accent: string;
  textPrimary: string;
  textMuted: string;
  codeBg: string;
  codeHeaderBg: string;
  rainbow: [string, string, string, string, string, string, string]; // Red, Orange, Yellow, Green, Cyan, Blue, Violet
}

export interface ThemeDefinition {
  id: ThemeId;
  nameKey: string;
  descKey: string;
  isDark: boolean;
  colors: ThemeColors;
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  'cyber-neon': {
    id: 'cyber-neon',
    nameKey: 'themeNameCyber',
    descKey: 'themeDescCyber',
    isDark: true,
    colors: {
      bg: '#0a0c14',
      surface: '#111422',
      surfaceMuted: '#1a1f33',
      border: '#28304f',
      userBubble: '#00f0ff',
      userBubbleText: '#0a0c14',
      aiBubble: '#13182b',
      aiBubbleText: '#e2e8f0',
      accent: '#00f0ff',
      textPrimary: '#f8fafc',
      textMuted: '#94a3b8',
      codeBg: '#0e1220',
      codeHeaderBg: '#171e35',
      rainbow: ['#ff0055', '#ff7700', '#ffe600', '#00ff66', '#00f0ff', '#3b82f6', '#d946ef'],
    },
  },
  'sunset-twilight': {
    id: 'sunset-twilight',
    nameKey: 'themeNameSunset',
    descKey: 'themeDescSunset',
    isDark: true,
    colors: {
      bg: '#180e28',
      surface: '#24143a',
      surfaceMuted: '#321d4f',
      border: '#4a2b75',
      userBubble: '#f97316',
      userBubbleText: '#ffffff',
      aiBubble: '#2b1747',
      aiBubbleText: '#fdf4ff',
      accent: '#f43f5e',
      textPrimary: '#fff1f2',
      textMuted: '#cbd5e1',
      codeBg: '#1c1031',
      codeHeaderBg: '#2d184f',
      rainbow: ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#818cf8', '#e879f9'],
    },
  },
  'ocean-aurora': {
    id: 'ocean-aurora',
    nameKey: 'themeNameOcean',
    descKey: 'themeDescOcean',
    isDark: true,
    colors: {
      bg: '#051020',
      surface: '#0c1b33',
      surfaceMuted: '#142a4d',
      border: '#1e3d6b',
      userBubble: '#0284c7',
      userBubbleText: '#ffffff',
      aiBubble: '#0f2240',
      aiBubbleText: '#e0f2fe',
      accent: '#06b6d4',
      textPrimary: '#f0f9ff',
      textMuted: '#7dd3fc',
      codeBg: '#09152b',
      codeHeaderBg: '#13284f',
      rainbow: ['#f87171', '#fb923c', '#fde047', '#34d399', '#38bdf8', '#60a5fa', '#a78bfa'],
    },
  },
  'pastel-dream': {
    id: 'pastel-dream',
    nameKey: 'themeNamePastel',
    descKey: 'themeDescPastel',
    isDark: false,
    colors: {
      bg: '#faf7f5',
      surface: '#ffffff',
      surfaceMuted: '#f1ede9',
      border: '#e2dad2',
      userBubble: '#6366f1',
      userBubbleText: '#ffffff',
      aiBubble: '#ffffff',
      aiBubbleText: '#1e293b',
      accent: '#4f46e5',
      textPrimary: '#0f172a',
      textMuted: '#64748b',
      codeBg: '#f8fafc',
      codeHeaderBg: '#eef2f6',
      rainbow: ['#fb7185', '#fdba74', '#fde047', '#86efac', '#67e8f9', '#93c5fd', '#d8b4fe'],
    },
  },
  'monokai-vivid': {
    id: 'monokai-vivid',
    nameKey: 'themeNameMonokai',
    descKey: 'themeDescMonokai',
    isDark: true,
    colors: {
      bg: '#1c1d22',
      surface: '#27282e',
      surfaceMuted: '#32343d',
      border: '#454754',
      userBubble: '#f92672',
      userBubbleText: '#ffffff',
      aiBubble: '#24252c',
      aiBubbleText: '#f8f8f2',
      accent: '#a6e22e',
      textPrimary: '#f8f8f2',
      textMuted: '#939293',
      codeBg: '#18191d',
      codeHeaderBg: '#2d2e36',
      rainbow: ['#f92672', '#fd971f', '#e6db74', '#a6e22e', '#66d9ef', '#388bfd', '#ae81ff'],
    },
  },
  'cosmic-starlight': {
    id: 'cosmic-starlight',
    nameKey: 'themeNameCosmic',
    descKey: 'themeDescCosmic',
    isDark: true,
    colors: {
      bg: '#0d061f',
      surface: '#170c36',
      surfaceMuted: '#241452',
      border: '#3b2282',
      userBubble: '#8b5cf6',
      userBubbleText: '#ffffff',
      aiBubble: '#1b0e3f',
      aiBubbleText: '#f5f3ff',
      accent: '#c084fc',
      textPrimary: '#faf5ff',
      textMuted: '#a78bfa',
      codeBg: '#12092a',
      codeHeaderBg: '#261356',
      rainbow: ['#ff4d8d', '#ff9248', '#ffea62', '#41e2ba', '#34d4fc', '#818cf8', '#c084fc'],
    },
  },
  'arcade-80s': {
    id: 'arcade-80s',
    nameKey: 'themeNameArcade',
    descKey: 'themeDescArcade',
    isDark: true,
    colors: {
      bg: '#08070e',
      surface: '#121021',
      surfaceMuted: '#1d1933',
      border: '#332c58',
      userBubble: '#ff007f',
      userBubbleText: '#ffffff',
      aiBubble: '#161329',
      aiBubbleText: '#00f6ff',
      accent: '#ffe600',
      textPrimary: '#ffffff',
      textMuted: '#a5a0c9',
      codeBg: '#0d0b17',
      codeHeaderBg: '#201b3b',
      rainbow: ['#ff0055', '#ff6600', '#ffe600', '#00ff66', '#00f6ff', '#4d7cff', '#cc00ff'],
    },
  },
  'emerald-canopy': {
    id: 'emerald-canopy',
    nameKey: 'themeNameEmerald',
    descKey: 'themeDescEmerald',
    isDark: true,
    colors: {
      bg: '#051812',
      surface: '#0b261e',
      surfaceMuted: '#12382c',
      border: '#1c5241',
      userBubble: '#10b981',
      userBubbleText: '#051812',
      aiBubble: '#0c2a21',
      aiBubbleText: '#ecfdf5',
      accent: '#34d399',
      textPrimary: '#f0fdf4',
      textMuted: '#6ee7b7',
      codeBg: '#071f17',
      codeHeaderBg: '#143b2f',
      rainbow: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#8b5cf6'],
    },
  },
};

export const FONTS: Record<FontFamilyId, { name: string; css: string }> = {
  inter: { name: 'Inter (Modern Sans)', css: 'Inter, system-ui, sans-serif' },
  jetbrains: { name: 'JetBrains Mono (Hacker / Code)', css: '"JetBrains Mono", monospace' },
  fira: { name: 'Fira Code (Ligatures)', css: '"Fira Code", monospace' },
  outfit: { name: 'Outfit (Clean Geometric)', css: 'Outfit, sans-serif' },
  merriweather: { name: 'Merriweather (Editorial Serif)', css: 'Merriweather, serif' },
  orbitron: { name: 'Orbitron (Futuristic Sci-Fi)', css: 'Orbitron, sans-serif' },
  caveat: { name: 'Caveat (Casual / Playful)', css: 'Caveat, cursive' },
};

export interface ThemeContextValue {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  fontId: FontFamilyId;
  setFontId: (id: FontFamilyId) => void;
  activeColors: ThemeColors;
  customColors: Partial<ThemeColors>;
  setCustomColor: (key: keyof ThemeColors, value: string) => void;
  resetToThemeDefaults: () => void;
  rainbowGradientStyle: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('app_theme_id');
      if (saved && saved in THEMES) return saved as ThemeId;
    } catch {}
    return 'cyber-neon';
  });

  const [fontId, setFontIdState] = useState<FontFamilyId>(() => {
    try {
      const saved = localStorage.getItem('app_font_id');
      if (saved && saved in FONTS) return saved as FontFamilyId;
    } catch {}
    return 'inter';
  });

  const [customColors, setCustomColors] = useState<Partial<ThemeColors>>(() => {
    try {
      const saved = localStorage.getItem('app_custom_colors');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const setThemeId = (id: ThemeId) => {
    setThemeIdState(id);
    try {
      localStorage.setItem('app_theme_id', id);
    } catch {}
  };

  const setFontId = (id: FontFamilyId) => {
    setFontIdState(id);
    try {
      localStorage.setItem('app_font_id', id);
    } catch {}
  };

  const setCustomColor = (key: keyof ThemeColors, value: string) => {
    setCustomColors((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem('app_custom_colors', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const resetToThemeDefaults = () => {
    setCustomColors({});
    try {
      localStorage.removeItem('app_custom_colors');
    } catch {}
  };

  const baseTheme = THEMES[themeId] || THEMES['cyber-neon'];
  const activeColors: ThemeColors = {
    ...baseTheme.colors,
    ...customColors,
    rainbow: baseTheme.colors.rainbow, // Keep full 7-color rainbow preserved
  };

  const rainbowGradientStyle = `linear-gradient(90deg, ${activeColors.rainbow.join(', ')})`;

  // Update CSS root variables and font family dynamically
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--app-bg', activeColors.bg);
    root.style.setProperty('--app-surface', activeColors.surface);
    root.style.setProperty('--app-surface-muted', activeColors.surfaceMuted);
    root.style.setProperty('--app-border', activeColors.border);
    root.style.setProperty('--app-user-bubble', activeColors.userBubble);
    root.style.setProperty('--app-user-bubble-text', activeColors.userBubbleText);
    root.style.setProperty('--app-ai-bubble', activeColors.aiBubble);
    root.style.setProperty('--app-ai-bubble-text', activeColors.aiBubbleText);
    root.style.setProperty('--app-accent', activeColors.accent);
    root.style.setProperty('--app-text-primary', activeColors.textPrimary);
    root.style.setProperty('--app-text-muted', activeColors.textMuted);
    root.style.setProperty('--app-code-bg', activeColors.codeBg);
    root.style.setProperty('--app-code-header-bg', activeColors.codeHeaderBg);

    const fontDef = FONTS[fontId] || FONTS.inter;
    document.body.style.fontFamily = fontDef.css;
    document.body.style.backgroundColor = activeColors.bg;
    document.body.style.color = activeColors.textPrimary;
  }, [activeColors, fontId]);

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        setThemeId,
        fontId,
        setFontId,
        activeColors,
        customColors,
        setCustomColor,
        resetToThemeDefaults,
        rainbowGradientStyle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
