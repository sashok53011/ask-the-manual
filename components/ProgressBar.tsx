/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTheme } from '../themes/themeContext';

interface ProgressBarProps {
  progress: number;
  total: number;
  message: string;
  fileName?: string;
  icon?: React.ReactNode;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  total,
  message,
  fileName,
  icon,
}) => {
  const percentage = total > 0 ? (progress / total) * 100 : 0;
  const { activeColors, rainbowGradientStyle } = useTheme();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[calc(100dvh-3rem)] sm:min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 text-center transition-colors"
      style={{
        backgroundColor: activeColors.bg,
        color: activeColors.textPrimary,
      }}
    >
      {icon && <div className="mb-6">{icon}</div>}
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">{message}</h2>
      <p
        className="mb-6 h-6 truncate max-w-md px-4 text-sm font-mono"
        style={{ color: activeColors.textMuted }}
        title={fileName}
      >
        {fileName || ''}
      </p>

      <div
        className="w-full max-w-md rounded-full h-4 overflow-hidden border p-0.5 shadow-inner"
        style={{
          backgroundColor: activeColors.surface,
          borderColor: activeColors.border,
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-in-out"
          style={{
            width: `${percentage}%`,
            background: rainbowGradientStyle,
          }}
        />
      </div>

      <div className="mt-4 flex items-center space-x-2 font-mono text-sm font-bold">
        <span style={{ color: activeColors.accent }}>{progress}</span>
        <span className="opacity-40">/</span>
        <span>{total}</span>
        <span className="opacity-60 text-xs">({percentage.toFixed(0)}%)</span>
      </div>
    </div>
  );
};

export default ProgressBar;