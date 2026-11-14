/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Plug, CheckCircle2, AlertCircle } from 'lucide-react';
import * as aiService from '../services/aiService';
import { useTheme } from '../themes/themeContext';

interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  chatModel: string;
  embeddingModel: string;
}

const STORAGE_KEY = 'openai_provider_config';

const defaultConfig: ProviderConfig = {
  baseUrl: '',
  apiKey: '',
  chatModel: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
};

interface ProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProviderSettingsModal: React.FC<ProviderSettingsModalProps> = ({ isOpen, onClose }) => {
  const { activeColors, rainbowGradientStyle } = useTheme();
  const [config, setConfig] = useState<ProviderConfig>(defaultConfig);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig({ ...defaultConfig, ...JSON.parse(saved) });
      } else {
        aiService.getProviderConfig().then((c) => {
          setConfig({ ...defaultConfig, ...c });
        }).catch(() => {});
      }
    } catch {}
  }, [isOpen]);

  const update = (key: keyof ProviderConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const cfg = configRef.current;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      await aiService.setProviderConfig(cfg);
      setTestStatus('idle');
      setTestMessage('Saved');
    } catch (e: any) {
      setTestMessage(e?.message || 'Save failed');
    }
  };

  const handleTest = async () => {
    setTestStatus('testing');
    setTestMessage('');
    try {
      const cfg = configRef.current;
      await aiService.setProviderConfig(cfg);
      const res = await aiService.testProvider(cfg);
      if (res.ok) {
        setTestStatus('ok');
        setTestMessage(res.message || 'Connection OK');
      } else {
        setTestStatus('fail');
        setTestMessage(res.message || 'Connection failed');
      }
    } catch (e: any) {
      setTestStatus('fail');
      setTestMessage(e?.message || 'Connection failed');
    }
  };

  const handleGetModels = async () => {
    setLoadingModels(true);
    setTestMessage('');
    try {
      const cfg = configRef.current;
      await aiService.setProviderConfig(cfg);
      const list = await aiService.getProviderModels(cfg);
      setModels(list);
      if (list.length > 0) {
        update('chatModel', list[0]);
        const emb = list.find((m) => /embed/i.test(m)) || list[0];
        update('embeddingModel', emb);
      }
      if (list.length === 0) {
        setTestMessage('No models returned');
      } else {
        setTestMessage(`Loaded ${list.length} models`);
      }
    } catch (e: any) {
      setTestMessage(e?.message || 'Failed to load models');
    } finally {
      setLoadingModels(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl flex flex-col rounded-2xl shadow-2xl overflow-hidden border transition-all"
        style={{
          backgroundColor: activeColors.surface,
          borderColor: activeColors.border,
          color: activeColors.textPrimary,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[4px] w-full flex-shrink-0" style={{ background: rainbowGradientStyle }} />
        <div
          className="px-5 py-4 flex items-center justify-between border-b flex-shrink-0"
          style={{ borderColor: activeColors.border }}
        >
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-xl text-white shadow-md"
              style={{ backgroundColor: activeColors.rainbow[0] }}
            >
              <Plug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">AI Provider Settings</h2>
              <p className="text-xs" style={{ color: activeColors.textMuted }}>
                OpenAI-compatible endpoint
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Base URL</label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => update('baseUrl', e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full rounded-lg py-2 px-3 border text-sm"
              style={{
                backgroundColor: activeColors.surfaceMuted,
                borderColor: activeColors.border,
                color: activeColors.textPrimary,
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">API Key</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => update('apiKey', e.target.value)}
              placeholder="sk-..."
              className="w-full rounded-lg py-2 px-3 border text-sm"
              style={{
                backgroundColor: activeColors.surfaceMuted,
                borderColor: activeColors.border,
                color: activeColors.textPrimary,
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Chat Model</label>
            {models.length > 0 ? (
              <select
                value={config.chatModel}
                onChange={(e) => update('chatModel', e.target.value)}
                className="w-full rounded-lg py-2 px-3 border text-sm"
                style={{
                  backgroundColor: activeColors.surfaceMuted,
                  borderColor: activeColors.border,
                  color: activeColors.textPrimary,
                }}
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={config.chatModel}
                onChange={(e) => update('chatModel', e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full rounded-lg py-2 px-3 border text-sm"
              style={{
                backgroundColor: activeColors.surfaceMuted,
                borderColor: activeColors.border,
                color: activeColors.textPrimary,
              }}
            />
            )}
          </div>
          {models.length > 0 && (
            <datalist id="model-list">
              {models.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          )}

          {testMessage && (
            <div
              className={`text-xs flex items-center gap-2 p-2 rounded-lg ${
                testStatus === 'ok' ? 'text-emerald-300 bg-emerald-500/10' : testStatus === 'fail' ? 'text-rose-300 bg-rose-500/10' : ''
              }`}
            >
              {testStatus === 'ok' && <CheckCircle2 className="w-4 h-4" />}
              {testStatus === 'fail' && <AlertCircle className="w-4 h-4" />}
              <span>{testMessage}</span>
            </div>
          )}
        </div>

        <div
          className="px-5 py-3 border-t flex items-center justify-between flex-shrink-0 bg-black/10 text-xs"
          style={{ borderColor: activeColors.border }}
        >
          <button
            onClick={handleGetModels}
            disabled={loadingModels}
            className="px-4 py-2 rounded-lg border text-xs font-semibold transition-all hover:bg-white/10 disabled:opacity-50"
            style={{ borderColor: activeColors.border }}
          >
            {loadingModels ? 'Loading...' : 'Get model list'}
          </button>
          <button
            onClick={handleTest}
            disabled={testStatus === 'testing'}
            className="px-4 py-2 rounded-lg border text-xs font-semibold transition-all hover:bg-white/10 disabled:opacity-50"
            style={{ borderColor: activeColors.border }}
          >
            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg font-bold text-white shadow-md transition-all active:scale-95"
            style={{ backgroundColor: activeColors.accent }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderSettingsModal;