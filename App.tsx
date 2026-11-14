/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppStatus, ChatMessage } from './types';
import * as aiService from './services/aiService';
import Spinner from './components/Spinner';
import WelcomeScreen from './components/WelcomeScreen';
import ProgressBar from './components/ProgressBar';
import ChatInterface from './components/ChatInterface';
import { TopNavigation } from './components/TopNavigation';
import { TerminalDrawer } from './components/TerminalDrawer';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { AdvancedRagModal } from './components/AdvancedRagModal';
import { ProviderSettingsModal } from './components/ProviderSettingsModal';
import { LanguageProvider, useLanguage } from './i18n/languageContext';
import { ThemeProvider, useTheme } from './themes/themeContext';
import { TerminalProvider } from './components/terminalContext';

declare global {
  interface AIStudio {
    openSelectKey: () => Promise<void>;
    hasSelectedApiKey: () => Promise<boolean>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const AppContent: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.Initializing);
  // API key handling removed: provider is configured via AI Provider settings
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    message?: string;
    fileName?: string;
  } | null>(null);
  const [activeRagStoreName, setActiveRagStoreName] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
  const [suggestionLevel, setSuggestionLevel] = useState(0);
  const [previousSuggestions, setPreviousSuggestions] = useState<string[]>([]);
  const [documentName, setDocumentName] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isRagManagerOpen, setIsRagManagerOpen] = useState(false);
  const [isProviderSettingsOpen, setIsProviderSettingsOpen] = useState(false);

  const ragStoreNameRef = useRef(activeRagStoreName);
  const { language, t } = useLanguage();
  const { activeColors } = useTheme();

  useEffect(() => {
    ragStoreNameRef.current = activeRagStoreName;
  }, [activeRagStoreName]);

  useEffect(() => {
    const handleUnload = () => {
      if (ragStoreNameRef.current) {
        aiService
          .deleteRagStore(ragStoreNameRef.current)
          .catch((err) => console.error('Error deleting RAG store on unload:', err));
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const handleError = (message: string, err: any) => {
    console.error(message, err);
    setError(`${message}${err ? `: ${err instanceof Error ? err.message : String(err)}` : ''}`);
    setStatus(AppStatus.Error);
  };

  const clearError = () => {
    setError(null);
    setStatus(AppStatus.Welcome);
  };

  useEffect(() => {
    setStatus(AppStatus.Welcome);
  }, []);

  useEffect(() => {
    // Sync saved provider config to server on app load
    try {
      const saved = localStorage.getItem('openai_provider_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.baseUrl) {
          aiService.setProviderConfig(parsed).catch(() => {});
        }
      }
    } catch {}
  }, []);

  const handleUploadAndStartChat = async () => {
    if (files.length === 0) return;

    try {
      // Sync client-side config to server if server has none
      let cfg = await aiService.getProviderConfig().catch(() => null);
      if (!cfg?.baseUrl) {
        try {
          const saved = localStorage.getItem('openai_provider_config');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed?.baseUrl) {
              await aiService.setProviderConfig(parsed);
              cfg = parsed;
            }
          }
        } catch {}
      }
      if (!cfg?.baseUrl) {
        setIsProviderSettingsOpen(true);
        throw new Error('Please configure an AI provider first (AI Provider button).');
      }
      aiService.initialize();
    } catch (err) {
      handleError('Initialization failed.', err);
      throw err;
    }

    setStatus(AppStatus.Uploading);
    const totalSteps = files.length + 2;
    setUploadProgress({ current: 0, total: totalSteps, message: 'Creating document index...' });

    try {
      const storeName = `chat-session-${Date.now()}`;
      const ragStoreName = await aiService.createRagStore(storeName);

      setUploadProgress({ current: 1, total: totalSteps, message: 'Generating embeddings...' });

      for (let i = 0; i < files.length; i++) {
        setUploadProgress((prev) => ({
          ...prev!,
          current: i + 1,
          message: 'Generating embeddings...',
          fileName: `(${i + 1}/${files.length}) ${files[i].name}`,
        }));
        await aiService.uploadToRagStore(ragStoreName, files[i]);
      }

      setUploadProgress({
        current: files.length + 1,
        total: totalSteps,
        message: 'Generating suggestions...',
        fileName: '',
      });
      const questions = await aiService.generateExampleQuestions(ragStoreName, language, 0, []);
      const seen = new Set<string>();
      const unique = questions.filter((q) => {
        const key = q.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setExampleQuestions(unique.slice(0, 6));
      setSuggestionLevel(0);
      setPreviousSuggestions(unique.slice(0, 6));

      setUploadProgress({ current: totalSteps, total: totalSteps, message: 'All set!', fileName: '' });
      await new Promise((resolve) => setTimeout(resolve, 400));

      let docName = '';
      if (files.length === 1) {
        docName = files[0].name;
      } else if (files.length === 2) {
        docName = `${files[0].name} & ${files[1].name}`;
      } else {
        docName = `${files.length} documents`;
      }
      setDocumentName(docName);

      setActiveRagStoreName(ragStoreName);
      setChatHistory([]);
      setStatus(AppStatus.Chatting);
      setFiles([]);
    } catch (err) {
      handleError('Failed to start chat session', err);
      throw err;
    } finally {
      setUploadProgress(null);
    }
  };

  const handleEndChat = () => {
    if (activeRagStoreName) {
      aiService.deleteRagStore(activeRagStoreName).catch((err) => {
        console.error('Failed to delete RAG store in background', err);
      });
    }
    setActiveRagStoreName(null);
    setChatHistory([]);
    setExampleQuestions([]);
    setSuggestionLevel(0);
    setPreviousSuggestions([]);
    setDocumentName('');
    setFiles([]);
    setStatus(AppStatus.Welcome);
  };

  const handleRegenerateSuggestions = async () => {
    if (!activeRagStoreName) return;
    try {
      const nextLevel = suggestionLevel + 1;
      const questions = await aiService.generateExampleQuestions(activeRagStoreName, language, nextLevel, previousSuggestions);
      const seen = new Set<string>();
      const allPrev = new Set(previousSuggestions.map((q) => q.trim().toLowerCase()));
      const unique = questions.filter((q) => {
        const key = q.trim().toLowerCase();
        if (seen.has(key) || allPrev.has(key)) return false;
        seen.add(key);
        return true;
      });
      const merged = [...unique.slice(0, 6)];
      setExampleQuestions(merged);
      setSuggestionLevel(nextLevel);
      setPreviousSuggestions((prev) => [...prev, ...merged]);
    } catch (err) {
      console.error('Failed to regenerate suggestions', err);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!activeRagStoreName) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
    setChatHistory((prev) => [...prev, userMessage]);
    setIsQueryLoading(true);

    const langInstructions: Record<string, string> = {
      ru: 'Отвечай на русском языке. Используй форматирование Markdown, математические формулы $...$ и блоки кода ```lang:filename ... ``` с точным именем файла и указанием языка. Если даешь команды терминала, используй ```bash:script.sh```.',
      de: 'Antworte auf Deutsch. Verwende Markdown-Formatierung, mathematische Formeln $...$ und Codeblöcke ```lang:filename ... ``` mit Dateinamen und Sprachangabe.',
      en: 'Answer clearly. Use Markdown, mathematical formulas $...$ and code blocks ```lang:filename ... ``` with language and recommended filename.',
    };

    const promptWithLang = `${message}\n\n[Instruction: ${langInstructions[language] || langInstructions.en} When providing code or terminal commands, ALWAYS specify the language and filename in the code fence format: \`\`\`lang:filepath/filename.ext]`;

    let accumulated = '';
    let started = false;
    const updateLast = (text: string, chunks?: any[]) => {
      setChatHistory((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = {
          ...last,
          parts: [{ text }],
          ...(chunks ? { groundingChunks: chunks } : {}),
        };
        return copy;
      });
    };

    try {
      for await (const event of aiService.fileSearchStream(activeRagStoreName, promptWithLang, language)) {
        if (event.error) throw new Error(event.error);
        if (event.text) {
          accumulated += event.text;
          if (!started) {
            started = true;
            setChatHistory((prev) => [...prev, { role: 'model', parts: [{ text: accumulated }] }]);
          } else {
            updateLast(accumulated);
          }
        }
        if (event.groundingChunks) {
          if (started) {
            updateLast(accumulated, event.groundingChunks);
          }
        }
      }
      if (!started) {
        setChatHistory((prev) => [...prev, { role: 'model', parts: [{ text: '' }] }]);
      }
    } catch (err) {
      const errorText =
        language === 'ru'
          ? 'Произошла ошибка при получении ответа. Пожалуйста, попробуйте еще раз.'
          : language === 'de'
          ? 'Beim Abrufen der Antwort ist ein Fehler aufgetreten. Bitte erneut versuchen.'
          : 'Sorry, I encountered an error. Please try again.';

      if (started) {
        updateLast(errorText);
      } else {
        setChatHistory((prev) => [...prev, { role: 'model', parts: [{ text: errorText }] }]);
      }
      handleError('Failed to get response', err);
    } finally {
      setIsQueryLoading(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case AppStatus.Initializing:
        return (
          <div className="flex items-center justify-center h-[calc(100dvh-3rem)] sm:h-[calc(100vh-3.5rem)]">
            <Spinner /> <span className="ml-4 text-xl">Initializing...</span>
          </div>
        );
      case AppStatus.Welcome:
        return (
          <WelcomeScreen
            onUpload={handleUploadAndStartChat}
            files={files}
            setFiles={setFiles}
          />
        );
      case AppStatus.Uploading:
        return (
          <ProgressBar
            progress={uploadProgress?.current || 0}
            total={uploadProgress?.total || 1}
            message={uploadProgress?.message || 'Preparing your chat...'}
            fileName={uploadProgress?.fileName}
          />
        );
      case AppStatus.Chatting:
        return (
          <ChatInterface
            documentName={documentName}
            history={chatHistory}
            isQueryLoading={isQueryLoading}
            onSendMessage={handleSendMessage}
            onNewChat={handleEndChat}
            exampleQuestions={exampleQuestions}
            onRefreshSuggestions={handleRegenerateSuggestions}
          />
        );
      case AppStatus.Error:
        return (
          <div className="flex flex-col items-center justify-center h-[calc(100dvh-3rem)] sm:h-[calc(100vh-3.5rem)] text-rose-300 p-6">
            <h1 className="text-3xl font-bold mb-4">Application Error</h1>
            <p className="max-w-md text-center mb-4 text-sm opacity-80">{error}</p>
            <button
              onClick={clearError}
              className="px-5 py-2.5 rounded-xl font-bold text-white shadow-lg"
              style={{ backgroundColor: activeColors.accent }}
            >
              Try Again
            </button>
          </div>
        );
      default:
        return (
          <WelcomeScreen
            onUpload={handleUploadAndStartChat}
            files={files}
            setFiles={setFiles}
          />
        );
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{
        backgroundColor: activeColors.bg,
        color: activeColors.textPrimary,
      }}
    >
      {/* Global Top Navbar */}
      <TopNavigation
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onOpenRagManager={() => setIsRagManagerOpen(true)}
        onOpenProviderSettings={() => setIsProviderSettingsOpen(true)}
        onNewChat={handleEndChat}
        documentName={documentName}
        isChatActive={status === AppStatus.Chatting}
      />

      {/* Main Content Area */}
      <main className="flex-grow">{renderContent()}</main>

      {/* Slide-out Terminal Drawer */}
      <TerminalDrawer />

      {/* Theme & RGB Palette Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />

      {/* Advanced RAG Store Manager Modal */}
      <AdvancedRagModal
        isOpen={isRagManagerOpen}
        onClose={() => setIsRagManagerOpen(false)}
      />

      <ProviderSettingsModal
        isOpen={isProviderSettingsOpen}
        onClose={() => setIsProviderSettingsOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <TerminalProvider>
          <AppContent />
        </TerminalProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;
