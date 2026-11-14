/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  X,
  Trash2,
  Copy,
  Check,
  Square,
  Play,
  CornerDownLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useTerminal, TerminalLogItem } from './terminalContext';
import { useLanguage } from '../i18n/languageContext';
import { useTheme } from '../themes/themeContext';

export const TerminalDrawer: React.FC = () => {
  const {
    isOpen,
    closeTerminal,
    logs,
    isRunning,
    currentRunningCommand,
    currentStep,
    runCommandSequential,
    clearTerminal,
    stopExecution,
  } = useTerminal();

  const { t } = useLanguage();
  const { activeColors, rainbowGradientStyle } = useTheme();

  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen, logs, isRunning]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isRunning) return;
    const cmd = inputVal.trim();
    setCmdHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setInputVal('');
    runCommandSequential(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(cmdHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= cmdHistory.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    }
  };

  const handleCopyLogs = async () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.text}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLogs(true);
      setTimeout(() => setCopiedLogs(false), 2000);
    } catch (e) {
      console.error('Failed to copy logs', e);
    }
  };

  return (
    <>
      {/* Backdrop overlay for smaller screens */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40 transition-opacity"
          onClick={closeTerminal}
        />
      )}

      {/* Slide-out Terminal Window from the right */}
      <aside
        className={`fixed top-0 right-0 h-full z-50 flex flex-col shadow-2xl transition-all duration-300 ease-in-out border-l ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isExpanded ? 'w-full lg:w-4/5' : 'w-full sm:w-[560px] lg:w-[680px]'}`}
        style={{
          backgroundColor: '#0a0b12',
          borderColor: activeColors.border,
          color: '#e2e8f0',
        }}
        aria-label="Terminal Drawer"
      >
        {/* Rainbow top line */}
        <div className="h-[4px] w-full flex-shrink-0" style={{ background: rainbowGradientStyle }} />

        {/* Terminal Header */}
        <div
          className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0"
          style={{
            backgroundColor: '#111320',
            borderColor: activeColors.border,
          }}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className="p-1.5 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: activeColors.rainbow[0] }}
            >
              <TerminalIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-white tracking-wide truncate">
                  {t.terminalTitle}
                </h3>
                {isRunning ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {t.executing}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10">
                    idle
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                {t.terminalSubtitle}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1.5">
            {isRunning && (
              <button
                onClick={stopExecution}
                className="px-2.5 py-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                title={t.stopExecution}
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span className="hidden sm:inline">{t.stopExecution}</span>
              </button>
            )}

            <button
              onClick={clearTerminal}
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title={t.clearTerminal}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopyLogs}
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title={t.copyLogs}
            >
              {copiedLogs ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors hidden sm:block"
              title={isExpanded ? 'Minimize' : 'Expand width'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={closeTerminal}
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title={t.closeTerminal}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sequential Execution Banner */}
        <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-900/40 text-[11px] text-indigo-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="truncate">{t.sequentialExecutionNotice}</span>
          </div>
          {currentStep && (
            <span className="px-2 py-0.5 rounded bg-indigo-600/40 font-mono text-cyan-300 font-bold ml-2 flex-shrink-0">
              {currentStep.current} / {currentStep.total}
            </span>
          )}
        </div>

        {/* Current Command Live Banner */}
        {isRunning && currentRunningCommand && (
          <div className="px-4 py-2 bg-emerald-950/40 border-b border-emerald-800/40 text-xs font-mono text-emerald-300 flex items-center gap-2 flex-shrink-0 animate-pulse">
            <Play className="w-3.5 h-3.5 fill-emerald-400 flex-shrink-0" />
            <span className="truncate font-semibold">
              {t.runningLine}: {currentRunningCommand}
            </span>
          </div>
        )}

        {/* Terminal Output Logs */}
        <div className="flex-grow overflow-y-auto p-4 font-mono text-xs sm:text-sm space-y-2 select-text">
          {logs.map((log) => {
            if (log.type === 'command') {
              return (
                <div key={log.id} className="pt-2 border-t border-white/5">
                  <div className="flex items-start space-x-2 text-cyan-400 font-bold">
                    <span className="text-emerald-400 select-none">gls@manual:~/app$</span>
                    <span className="break-all text-white">{log.text.replace(/^\$\s*/, '')}</span>
                    <span className="text-slate-600 text-[11px] font-normal ml-auto select-none">
                      {log.timestamp}
                    </span>
                  </div>
                </div>
              );
            }

            if (log.type === 'stdout') {
              return (
                <pre
                  key={log.id}
                  className="text-slate-200 whitespace-pre-wrap font-mono pl-4 border-l-2 border-emerald-500/30 leading-relaxed break-words"
                >
                  {log.text}
                </pre>
              );
            }

            if (log.type === 'stderr') {
              return (
                <pre
                  key={log.id}
                  className="text-rose-400 whitespace-pre-wrap font-mono pl-4 border-l-2 border-rose-500/60 leading-relaxed break-words bg-rose-950/20 py-1 rounded-r"
                >
                  {log.text}
                </pre>
              );
            }

            if (log.type === 'system') {
              return (
                <div
                  key={log.id}
                  className="flex items-center space-x-2 text-slate-400 text-xs py-0.5 select-none"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{log.text}</span>
                  <span className="text-slate-600 text-[10px] ml-auto">{log.timestamp}</span>
                </div>
              );
            }

            return (
              <div
                key={log.id}
                className="text-indigo-300 text-xs py-1 border-y border-indigo-900/30 bg-indigo-950/20 px-2 rounded font-mono"
              >
                {log.text}
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>

        {/* Terminal Interactive Input Footer */}
        <div
          className="p-3 border-t flex-shrink-0"
          style={{
            backgroundColor: '#111320',
            borderColor: activeColors.border,
            paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          }}
        >
          <form onSubmit={handleManualSubmit} className="flex items-center space-x-2">
            <span className="text-emerald-400 font-mono font-bold select-none text-sm">$</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isRunning}
              placeholder={isRunning ? t.executing : t.runCommandPrompt}
              className="flex-grow bg-black/40 border border-white/10 rounded-lg py-2 px-3 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isRunning || !inputVal.trim()}
              className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow"
              title="Run command"
            >
              <CornerDownLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Enter</span>
            </button>
          </form>

          {/* Quick Command Suggestions */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto text-[11px] text-slate-400 select-none pb-0.5">
            <span className="text-slate-500 flex-shrink-0">Quick:</span>
            {['ls -la', 'pwd', 'node -v', 'git status', 'npm list --depth=0'].map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => {
                  setInputVal(cmd);
                  inputRef.current?.focus();
                }}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-[10px] transition-colors flex-shrink-0"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};
