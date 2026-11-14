/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, Play, Save, FileCode, Terminal, Download } from 'lucide-react';
import { useTerminal } from './terminalContext';
import { useLanguage } from '../i18n/languageContext';
import { useTheme } from '../themes/themeContext';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

// Maps languages to common default filenames if none is provided
export function getDefaultFilename(lang: string, code: string): string {
  const l = (lang || '').toLowerCase().trim();
  if (l === 'bash' || l === 'sh' || l === 'shell' || l === 'zsh') {
    if (code.includes('npm install') || code.includes('pip install')) return 'scripts/setup.sh';
    if (code.includes('build') || code.includes('deploy')) return 'scripts/deploy.sh';
    return 'script.sh';
  }
  if (l === 'typescript' || l === 'ts') return 'src/app.ts';
  if (l === 'tsx') return 'src/components/App.tsx';
  if (l === 'javascript' || l === 'js') return 'index.js';
  if (l === 'jsx') return 'src/Component.jsx';
  if (l === 'python' || l === 'py') return 'main.py';
  if (l === 'json') return 'config.json';
  if (l === 'html') return 'index.html';
  if (l === 'css') return 'styles.css';
  if (l === 'sql') return 'schema.sql';
  if (l === 'markdown' || l === 'md') return 'README.md';
  if (l === 'rust' || l === 'rs') return 'src/main.rs';
  if (l === 'go') return 'main.go';
  if (l === 'c' || l === 'cpp') return 'main.cpp';
  if (l === 'yaml' || l === 'yml') return 'config.yaml';
  return 'file.txt';
}

export function isShellLanguage(lang?: string, code?: string): boolean {
  const l = (lang || '').toLowerCase().trim();
  if (['bash', 'sh', 'shell', 'zsh', 'terminal', 'cmd', 'ps1', 'powershell'].includes(l)) {
    return true;
  }
  // Heuristic: check if typical shell command
  if (!l || l === 'text' || l === 'console') {
    const lines = (code || '').split('\n').filter((x) => x.trim());
    if (lines.length > 0 && lines.every((line) => line.startsWith('$') || line.startsWith('npm ') || line.startsWith('git ') || line.startsWith('cd ') || line.startsWith('ls ') || line.startsWith('node ') || line.startsWith('python '))) {
      return true;
    }
  }
  return false;
}

// Simple fast regex-based token coloring for syntax
function renderHighlightedLine(line: string, lang: string): React.ReactNode {
  if (!line) return <span>&nbsp;</span>;

  // Comment check
  if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('--')) {
    return <span className="text-emerald-400/80 italic">{line}</span>;
  }

  // Tokenize line by keywords, strings, numbers, functions
  const parts: React.ReactNode[] = [];
  const tokenRegex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:const|let|var|function|return|if|else|for|while|import|export|from|default|class|extends|interface|type|async|await|def|class|print|echo|select|from|where|insert|delete|update)\b)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][A-Za-z0-9_$]*(?=\s*\())|([{}()[\].,;:+\-*/%=<>!&|^~?]+)|([A-Za-z_$][A-Za-z0-9_$]*)|(\s+)/g;

  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIdx) {
      parts.push(line.slice(lastIdx, match.index));
    }

    const [full, str, kw, num, fn, op, ident, space] = match;

    if (str) {
      parts.push(<span key={match.index} className="text-amber-300">{str}</span>);
    } else if (kw) {
      parts.push(<span key={match.index} className="text-pink-400 font-medium">{kw}</span>);
    } else if (num) {
      parts.push(<span key={match.index} className="text-orange-400 font-semibold">{num}</span>);
    } else if (fn) {
      parts.push(<span key={match.index} className="text-cyan-400 font-medium">{fn}</span>);
    } else if (op) {
      parts.push(<span key={match.index} className="text-sky-300/80">{op}</span>);
    } else if (ident) {
      // Check if titlecase (type/class)
      if (/^[A-Z]/.test(ident)) {
        parts.push(<span key={match.index} className="text-yellow-200">{ident}</span>);
      } else {
        parts.push(<span key={match.index} className="text-slate-200">{ident}</span>);
      }
    } else if (space) {
      parts.push(space);
    }

    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < line.length) {
    parts.push(line.slice(lastIdx));
  }

  return <>{parts}</>;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, filename }) => {
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [filePath, setFilePath] = useState(() => {
    return filename || getDefaultFilename(language || 'text', code);
  });

  const { runCommandSequential } = useTerminal();
  const { t } = useLanguage();
  const { activeColors, rainbowGradientStyle } = useTheme();

  const cleanLang = (language || 'code').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
  const isShell = isShellLanguage(cleanLang, code);
  const lines = code.trimEnd().split('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleSaveToProject = async () => {
    setSaveStatus('saving');
    try {
      // 1. Save directly to project disk via server endpoint
      const response = await fetch('/api/save-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, content: code }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setSaveStatus('saved');
        setSavedNotice(`${t.savedFile} (${data.savedPath})`);
        setTimeout(() => {
          setSaveStatus('idle');
          setSavedNotice(null);
        }, 3500);
      } else {
        throw new Error(data.error || 'Failed to save');
      }

      // Also trigger browser file download backup
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'code.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to save file:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleRunInTerminal = () => {
    // Strip leading '$ ' prompt if present before running
    const cleanCommands = lines
      .map((l) => l.trim())
      .map((l) => (l.startsWith('$ ') ? l.slice(2) : l))
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    runCommandSequential(cleanCommands);
  };

  return (
    <div
      className="my-4 rounded-xl overflow-hidden border shadow-lg transition-all"
      style={{
        backgroundColor: activeColors.codeBg,
        borderColor: activeColors.border,
      }}
    >
      {/* Rainbow line on top of codeblock */}
      <div className="h-[3px] w-full" style={{ background: rainbowGradientStyle }} />

      {/* Code Header Bar */}
      <div
        className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b text-xs select-none"
        style={{
          backgroundColor: activeColors.codeHeaderBg,
          borderColor: activeColors.border,
        }}
      >
        {/* Left: Language & File Info */}
        <div className="flex items-center space-x-2.5 flex-wrap">
          {/* Language tag */}
          <span
            className="px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider text-[11px] shadow-sm flex items-center gap-1 text-white"
            style={{ backgroundColor: activeColors.rainbow[0] }}
          >
            <FileCode className="w-3.5 h-3.5" />
            {cleanLang || 'CODE'}
          </span>

          {/* Filename indicator & path */}
          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] bg-black/25 px-2 py-0.5 rounded border border-white/10">
            <span className="text-slate-400">{t.fileLabel}:</span>
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              className="bg-transparent text-emerald-300 hover:text-white focus:text-white focus:outline-none focus:bg-white/10 px-1 rounded transition-colors"
              title="Click to rename or change target path"
            />
          </div>

          <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">
            {lines.length} {t.linesLabel}
          </span>
        </div>

        {/* Right: Action Buttons (Run, Save, Copy) */}
        <div className="flex items-center space-x-1.5">
          {/* Shell Run Button */}
          {isShell && (
            <button
              onClick={handleRunInTerminal}
              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition-all shadow-md active:scale-95 text-xs hover:shadow-emerald-500/25"
              title="Run sequential commands in slide-out terminal"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{t.runInTerminal}</span>
            </button>
          )}

          {/* Save to Project Button */}
          <button
            onClick={handleSaveToProject}
            disabled={saveStatus === 'saving'}
            className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 font-medium flex items-center gap-1.5 transition-colors text-xs disabled:opacity-50"
            title={`Save file as ${filePath} in project`}
          >
            {saveStatus === 'saved' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">{t.savedFile}</span>
              </>
            ) : saveStatus === 'saving' ? (
              <>
                <Save className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>{t.savingFile}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">{t.saveToProject}</span>
              </>
            )}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 font-medium flex items-center gap-1.5 transition-colors text-xs active:scale-95"
            title={t.copyCode}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>{t.copyCode}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Notification Toast Banner */}
      {savedNotice && (
        <div className="bg-emerald-500/20 text-emerald-200 px-3 py-1.5 text-xs border-b border-emerald-500/30 flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="truncate">{savedNotice}</span>
        </div>
      )}

      {/* Code Display with Line Numbers */}
      <div className="p-3 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-white/5 rounded transition-colors group">
                <td className="w-10 pr-3 text-right select-none text-slate-500/60 font-mono text-[11px] group-hover:text-slate-400 border-r border-white/10">
                  {idx + 1}
                </td>
                <td className="pl-3 py-0.5 whitespace-pre font-mono">
                  {renderHighlightedLine(line, cleanLang)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
