/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

export interface TerminalLogItem {
  id: string;
  type: 'command' | 'stdout' | 'stderr' | 'system' | 'info';
  text: string;
  exitCode?: number;
  durationMs?: number;
  timestamp: string;
  stepIndex?: number;
  totalSteps?: number;
}

export interface TerminalContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openTerminal: () => void;
  closeTerminal: () => void;
  toggleTerminal: () => void;
  logs: TerminalLogItem[];
  isRunning: boolean;
  currentRunningCommand: string | null;
  currentStep: { current: number; total: number } | null;
  runCommandSequential: (commandOrLines: string | string[]) => Promise<void>;
  clearTerminal: () => void;
  stopExecution: () => void;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

export const TerminalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<TerminalLogItem[]>([
    {
      id: 'init',
      type: 'system',
      text: 'Remix Ask the Manual Terminal v2.5 initialized. Ready for shell executions.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentRunningCommand, setCurrentRunningCommand] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<{ current: number; total: number } | null>(null);

  const abortControllerRef = useRef<boolean>(false);

  const openTerminal = useCallback(() => setIsOpen(true), []);
  const closeTerminal = useCallback(() => setIsOpen(false), []);
  const toggleTerminal = useCallback(() => setIsOpen((prev) => !prev), []);

  const clearTerminal = useCallback(() => {
    setLogs([
      {
        id: `clear-${Date.now()}`,
        type: 'system',
        text: 'Terminal output cleared.',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  const stopExecution = useCallback(() => {
    abortControllerRef.current = true;
    setIsRunning(false);
    setCurrentRunningCommand(null);
    setCurrentStep(null);
    setLogs((prev) => [
      ...prev,
      {
        id: `stop-${Date.now()}`,
        type: 'stderr',
        text: '--- Execution stopped by user ---',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  /**
   * Sequential execution of commands line by line.
   * If there are multiple lines, each line runs only after the previous line completes!
   */
  const runCommandSequential = useCallback(async (commandOrLines: string | string[]) => {
    // Automatically slide out the terminal window from right if not already open!
    setIsOpen(true);

    abortControllerRef.current = false;
    setIsRunning(true);

    let lines: string[] = [];
    if (Array.isArray(commandOrLines)) {
      lines = commandOrLines.map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('#'));
    } else {
      lines = commandOrLines
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith('#'));
    }

    if (lines.length === 0) {
      setIsRunning(false);
      return;
    }

    const totalSteps = lines.length;

    setLogs((prev) => [
      ...prev,
      {
        id: `queue-${Date.now()}`,
        type: 'info',
        text: `>>> Starting sequential execution of ${totalSteps} command(s)...`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    for (let i = 0; i < totalSteps; i++) {
      if (abortControllerRef.current) {
        break;
      }

      const line = lines[i];
      const stepIndex = i + 1;

      setCurrentStep({ current: stepIndex, total: totalSteps });
      setCurrentRunningCommand(line);

      // Log the command invocation with prompt
      setLogs((prev) => [
        ...prev,
        {
          id: `cmd-${Date.now()}-${stepIndex}`,
          type: 'command',
          text: `$ ${line}`,
          stepIndex,
          totalSteps,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      try {
        const response = await fetch('/api/terminal/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: line }),
        });

        const result = await response.json();

        if (result.stdout) {
          setLogs((prev) => [
            ...prev,
            {
              id: `out-${Date.now()}-${stepIndex}`,
              type: 'stdout',
              text: result.stdout,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        }

        if (result.stderr) {
          setLogs((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}-${stepIndex}`,
              type: 'stderr',
              text: result.stderr,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        }

        const exitCode = result.exitCode ?? 0;
        const durationMs = result.durationMs ?? 0;

        setLogs((prev) => [
          ...prev,
          {
            id: `status-${Date.now()}-${stepIndex}`,
            type: exitCode === 0 ? 'system' : 'stderr',
            text: `[Line ${stepIndex}/${totalSteps}] Exit code: ${exitCode} (${durationMs}ms)`,
            exitCode,
            durationMs,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);

        // If stopped in between
        if (abortControllerRef.current) break;

        // Brief natural pause between sequential lines so output settles visibly
        if (i < totalSteps - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      } catch (err: any) {
        setLogs((prev) => [
          ...prev,
          {
            id: `fetch-err-${Date.now()}-${stepIndex}`,
            type: 'stderr',
            text: `Execution failed: ${err.message || String(err)}`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        break;
      }
    }

    setIsRunning(false);
    setCurrentRunningCommand(null);
    setCurrentStep(null);
  }, []);

  return (
    <TerminalContext.Provider
      value={{
        isOpen,
        setIsOpen,
        openTerminal,
        closeTerminal,
        toggleTerminal,
        logs,
        isRunning,
        currentRunningCommand,
        currentStep,
        runCommandSequential,
        clearTerminal,
        stopExecution,
      }}
    >
      {children}
    </TerminalContext.Provider>
  );
};

export const useTerminal = () => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
};
