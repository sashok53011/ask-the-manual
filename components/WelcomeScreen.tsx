/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import {
  UploadCloud,
  FileText,
  Car,
  Disc,
  Trash2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import Spinner from './Spinner';
import { useLanguage } from '../i18n/languageContext';
import { useTheme } from '../themes/themeContext';

interface WelcomeScreenProps {
  onUpload: () => Promise<void>;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onUpload,
  files,
  setFiles,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const { t } = useLanguage();
  const { activeColors, rainbowGradientStyle } = useTheme();

  const sampleDocuments = [
    {
      id: 'hyundai',
      name: t.sampleCarManual,
      details: '562 pages, PDF • Safety, Electronics, Maintenance',
      url: 'https://www.hyundai.com/content/dam/hyundai/in/en/data/connect-to-service/owners-manual/2025/i20&i20nlineFromOct2023-Present.pdf',
      icon: <Car className="w-8 h-8" style={{ color: activeColors.rainbow[1] }} />,
      fileName: 'hyundai-i10-manual.pdf',
    },
    {
      id: 'washer',
      name: t.sampleWasherManual,
      details: '36 pages, PDF • Cycles, Troubleshooting, Specs',
      url: 'https://www.lg.com/us/support/products/documents/WM2077CW.pdf',
      icon: <Disc className="w-8 h-8" style={{ color: activeColors.rainbow[4] }} />,
      fileName: 'lg-washer-manual.pdf',
    },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles((prev) => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      if (event.dataTransfer.files) {
        setFiles((prev) => [...prev, ...Array.from(event.dataTransfer.files)]);
      }
    },
    [setFiles]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleSelectSample = async (name: string, url: string, fileName: string) => {
    if (loadingSample) return;
    setLoadingSample(name);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${name}: ${response.statusText}`);
      }
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type || 'application/pdf' });
      setFiles((prev) => [...prev, file]);
    } catch (error) {
      console.error('Error fetching sample file:', error);
      // Fallback: create mock manual file text so users can immediately test without CORS blocks
      const sampleText = `HYUNDAI OWNER'S MANUAL & SPECS
Model: i10 / i20 Premium
Engine: 1.2L Kappa Dual VTVT
Engine Oil: 0W-20 or 5W-30 Synthetic (3.6 Liters)
Tire Pressure: 33 PSI (front), 31 PSI (rear)
Fuse Box: Located behind the instrument panel left of steering column.
Maintenance Interval: Every 10,000 km or 12 months.
Brake Fluid: DOT 4 specification.
Troubleshooting Error Codes:
P0300: Random/Multiple Cylinder Misfire Detected
P0420: Catalyst System Efficiency Below Threshold`;
      const fallbackFile = new File([sampleText], fileName.replace('.pdf', '.txt'), {
        type: 'text/plain',
      });
      setFiles((prev) => [...prev, fallbackFile]);
    } finally {
      setLoadingSample(null);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div
      className="min-h-[calc(100dvh-3rem)] sm:min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 transition-colors"
      style={{
        backgroundColor: activeColors.bg,
        color: activeColors.textPrimary,
      }}
    >
      <div className="w-full max-w-3xl text-center space-y-6">
        {/* Rainbow Accent Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm text-xs font-semibold backdrop-blur-md"
          style={{
            backgroundColor: `${activeColors.surface}b3`,
            borderColor: activeColors.border,
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColors.rainbow[0] }} />
          <span>{t.appSubtitle}</span>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColors.rainbow[4] }} />
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          {t.welcomeTitle}
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base leading-relaxed" style={{ color: activeColors.textMuted }}>
          {t.welcomeSubtitle}
        </p>

        {/* Provider is configured via AI Provider settings in the top bar */}

        {/* Drag & Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all ${
            isDragging ? 'scale-[1.01] border-cyan-400 bg-cyan-500/10' : 'hover:border-white/40'
          }`}
          style={{
            backgroundColor: activeColors.surface,
            borderColor: isDragging ? activeColors.accent : activeColors.border,
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: activeColors.rainbow[0] }}
            >
              <UploadCloud className="w-8 h-8" />
            </div>

            <p className="text-sm sm:text-base font-medium max-w-sm" style={{ color: activeColors.textPrimary }}>
              {t.dragDropText}
            </p>

            <p className="text-xs" style={{ color: activeColors.textMuted }}>
              PDF, TXT, MD, JSON, TS, PY, CSV, SH (Multi-file RAG supported)
            </p>

            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.txt,.md,.json,.ts,.tsx,.js,.py,.csv,.sh,.html,.css"
            />

            <label
              htmlFor="file-upload"
              className="cursor-pointer px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white shadow-md transition-all hover:opacity-90 active:scale-95 flex items-center gap-2 mt-2"
              style={{ backgroundColor: activeColors.accent }}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t.browseFiles}</span>
            </label>
          </div>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div
            className="w-full max-w-xl mx-auto text-left rounded-xl p-4 border"
            style={{
              backgroundColor: activeColors.surface,
              borderColor: activeColors.border,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-xs sm:text-sm">
                {t.selectedFiles} ({files.length}):
              </h4>
            </div>

            <ul className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="text-xs p-2 rounded-lg flex justify-between items-center group transition-colors"
                  style={{ backgroundColor: activeColors.surfaceMuted }}
                >
                  <div className="flex items-center space-x-2 truncate min-w-0 pr-2">
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: activeColors.accent }} />
                    <span className="truncate font-medium" title={file.name}>
                      {file.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-[11px] opacity-60">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="p-1 text-rose-400 hover:text-rose-300 rounded transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload & Chat Button */}
        {files.length > 0 && (
          <div className="w-full max-w-xl mx-auto">
            <button
              onClick={onUpload}
              className="w-full py-3.5 px-6 rounded-xl text-white font-bold text-sm sm:text-base shadow-xl transition-all hover:opacity-95 active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: activeColors.accent }}
            >
              <span>{t.uploadAndChat}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t" style={{ borderColor: activeColors.border }} />
          <span className="px-4 text-xs font-bold tracking-wider opacity-60">
            {t.orDivider}
          </span>
          <div className="flex-grow border-t" style={{ borderColor: activeColors.border }} />
        </div>

        {/* Example Document Cards */}
        <div className="text-left">
          <p className="text-xs font-semibold mb-3" style={{ color: activeColors.textMuted }}>
            {t.tryExample}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {sampleDocuments.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleSelectSample(doc.name, doc.url, doc.fileName)}
                disabled={!!loadingSample}
                className="p-4 rounded-xl border text-left flex items-start space-x-3.5 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                style={{
                  backgroundColor: activeColors.surface,
                  borderColor: activeColors.border,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: activeColors.surfaceMuted }}
                >
                  {loadingSample === doc.name ? <Spinner /> : doc.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{doc.name}</p>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: activeColors.textMuted }}>
                    {doc.details}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
