/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Globe,
  RefreshCw,
  FileText,
  X,
  ExternalLink,
  Languages,
} from 'lucide-react';
import { ChatMessage } from '../types';
import Spinner from './Spinner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useLanguage } from '../i18n/languageContext';
import { useTheme } from '../themes/themeContext';
import { Language } from '../i18n/translations';

interface ChatInterfaceProps {
  documentName: string;
  history: ChatMessage[];
  isQueryLoading: boolean;
  onSendMessage: (message: string) => void;
  onNewChat: () => void;
  exampleQuestions: string[];
  onRefreshSuggestions?: () => Promise<void> | void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  documentName,
  history,
  isQueryLoading,
  onSendMessage,
  onNewChat,
  exampleQuestions,
  onRefreshSuggestions,
}) => {
  const [query, setQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalContent, setModalContent] = useState<string | null>(null);

  // Translation state for individual messages
  const [translationsMap, setTranslationsMap] = useState<
    Record<number, { text: string; lang: Language; isShowingTranslated: boolean; isLoading: boolean }>
  >({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { t, language, translateTextLive } = useLanguage();
  const { activeColors, rainbowGradientStyle } = useTheme();

  // (suggestions are shown as a list now)
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isQueryLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isQueryLoading) {
      onSendMessage(query.trim());
      setQuery('');
    }
  };

  const handleTranslateMessage = async (msgIndex: number, originalText: string, targetLang: Language) => {
    const existing = translationsMap[msgIndex];
    if (existing && existing.lang === targetLang) {
      // Toggle between original and translated
      setTranslationsMap((prev) => ({
        ...prev,
        [msgIndex]: {
          ...existing,
          isShowingTranslated: !existing.isShowingTranslated,
        },
      }));
      return;
    }

    // Set loading
    setTranslationsMap((prev) => ({
      ...prev,
      [msgIndex]: {
        text: '',
        lang: targetLang,
        isShowingTranslated: true,
        isLoading: true,
      },
    }));

    try {
      const translated = await translateTextLive(originalText, targetLang);
      setTranslationsMap((prev) => ({
        ...prev,
        [msgIndex]: {
          text: translated,
          lang: targetLang,
          isShowingTranslated: true,
          isLoading: false,
        },
      }));
    } catch (err) {
      setTranslationsMap((prev) => ({
        ...prev,
        [msgIndex]: {
          text: originalText,
          lang: targetLang,
          isShowingTranslated: false,
          isLoading: false,
        },
      }));
    }
  };

  return (
    <div
      className="flex flex-col h-[calc(100dvh-3rem)] sm:h-[calc(100vh-3.5rem)] relative transition-colors"
      style={{
        backgroundColor: activeColors.bg,
        color: activeColors.textPrimary,
      }}
    >
      {/* Scrollable Chat Area */}
      <div className="flex-grow overflow-y-auto px-2 sm:px-6 pt-3 sm:pt-4 pb-52 sm:pb-56">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {history.length === 0 && (
            <div
              className="text-center py-12 px-4 rounded-2xl border"
              style={{
                backgroundColor: activeColors.surface,
                borderColor: activeColors.border,
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: activeColors.rainbow[0] }}
              >
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold mb-1">
                {t.chatWith} {documentName}
              </h2>
              <p className="text-sm max-w-md mx-auto opacity-75">
                {t.welcomeSubtitle}
              </p>
            </div>
          )}

          {history.map((message, index) => {
            const isUser = message.role === 'user';
            const originalText = message.parts[0]?.text || '';
            const transInfo = translationsMap[index];
            const textToDisplay =
              transInfo && transInfo.isShowingTranslated && transInfo.text
                ? transInfo.text
                : originalText;

            return (
              <div
                key={index}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
              >
                <div
                  className={`max-w-[92vw] sm:max-w-2xl lg:max-w-3xl px-3.5 py-3 sm:px-5 sm:py-4 rounded-2xl shadow-md transition-all border ${
                    isUser ? 'rounded-br-sm' : 'rounded-bl-sm'
                  }`}
                  style={{
                    backgroundColor: isUser ? activeColors.userBubble : activeColors.aiBubble,
                    color: isUser ? activeColors.userBubbleText : activeColors.aiBubbleText,
                    borderColor: isUser ? 'transparent' : activeColors.border,
                  }}
                >
                  {/* Role label & Live Translation buttons for AI */}
                  {!isUser && (
                    <div
                      className="flex items-center justify-between pb-2 mb-2 border-b text-xs select-none"
                      style={{ borderColor: `${activeColors.border}80` }}
                    >
                      <div className="flex items-center space-x-1.5 font-bold">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: activeColors.rainbow[1] }}
                        />
                        <span style={{ color: activeColors.accent }}>AI RAG</span>
                      </div>

                      {/* Live translation toggle */}
                      <div className="flex items-center space-x-1">
                        {transInfo?.isShowingTranslated ? (
                          <button
                            onClick={() =>
                              handleTranslateMessage(index, originalText, transInfo.lang)
                            }
                            className="text-[11px] px-2 py-0.5 rounded bg-black/20 hover:bg-black/30 transition-colors flex items-center gap-1"
                          >
                            <Languages className="w-3 h-3" />
                            <span>{t.showOriginal}</span>
                          </button>
                        ) : (
                          <>
                            <span className="text-[10px] opacity-60 hidden sm:inline">
                              {t.translateMessage}:
                            </span>
                            <button
                              onClick={() => handleTranslateMessage(index, originalText, 'ru')}
                              disabled={transInfo?.isLoading}
                              className="text-[11px] px-1.5 py-0.5 rounded hover:bg-black/20 transition-colors"
                              title="Перевести на русский"
                            >
                              🇷🇺 RU
                            </button>
                            <button
                              onClick={() => handleTranslateMessage(index, originalText, 'de')}
                              disabled={transInfo?.isLoading}
                              className="text-[11px] px-1.5 py-0.5 rounded hover:bg-black/20 transition-colors"
                              title="Auf Deutsch übersetzen"
                            >
                              🇩🇪 DE
                            </button>
                            <button
                              onClick={() => handleTranslateMessage(index, originalText, 'en')}
                              disabled={transInfo?.isLoading}
                              className="text-[11px] px-1.5 py-0.5 rounded hover:bg-black/20 transition-colors"
                              title="Translate to English"
                            >
                              🇬🇧 EN
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message Content: Rendered via MarkdownRenderer (Math, Code, Tables) */}
                  {transInfo?.isLoading ? (
                    <div className="py-4 flex items-center space-x-3 text-xs">
                      <Spinner />
                      <span>{t.translating}</span>
                    </div>
                  ) : (
                    <MarkdownRenderer content={textToDisplay} />
                  )}

                  {/* Sources button chips */}
                  {!isUser &&
                    message.groundingChunks &&
                    message.groundingChunks.length > 0 && (
                      <div
                        className="mt-4 pt-3 border-t text-xs flex flex-wrap items-center justify-between gap-2"
                        style={{ borderColor: `${activeColors.border}80` }}
                      >
                        <span className="font-semibold opacity-75">{t.sources}:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {message.groundingChunks.map(
                            (chunk, chunkIdx) =>
                              chunk.retrievedContext?.text && (
                                <button
                                  key={chunkIdx}
                                  onClick={() => setModalContent(chunk.retrievedContext!.text!)}
                                  className="px-2.5 py-1 rounded-md text-xs font-medium border transition-colors hover:bg-white/10 flex items-center gap-1"
                                  style={{ borderColor: activeColors.border }}
                                  title={t.sourceText}
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>
                                    {t.sources} #{chunkIdx + 1}
                                  </span>
                                </button>
                              )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            );
          })}

          {isQueryLoading && (!history.length || history[history.length - 1].role === 'user') && (
            <div className="flex justify-start">
              <div
                className="px-5 py-4 rounded-2xl rounded-bl-sm border flex items-center space-x-3 shadow-md"
                style={{
                  backgroundColor: activeColors.aiBubble,
                  color: activeColors.aiBubbleText,
                  borderColor: activeColors.border,
                }}
              >
                <Spinner />
                <span className="text-sm font-medium animate-pulse">
                  Searching manual index & synthesizing answer...
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Fixed Bottom Input Bar */}
      <div
        className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t backdrop-blur-lg"
        style={{
          backgroundColor: `${activeColors.surface}f2`,
          borderColor: activeColors.border,
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Suggestion chips (up to 6, one is refresh) */}
          {!isQueryLoading && exampleQuestions.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto sm:flex-wrap sm:justify-center pb-1 sm:pb-0 -mx-1 px-1">
              {exampleQuestions.slice(0, 5).map((q, idx) => (
                <button
                  key={`${q}-${idx}`}
                  onClick={() => {
                    setQuery(q);
                    inputRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border shadow-sm transition-all hover:scale-[1.01] active:scale-95 truncate max-w-[70vw] sm:max-w-full flex-shrink-0"
                  style={{
                    backgroundColor: activeColors.surfaceMuted,
                    borderColor: activeColors.border,
                    color: activeColors.textPrimary,
                  }}
                  title={q}
                >
                  <Sparkles
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: activeColors.accent }}
                  />
                  <span className="truncate">{q}</span>
                </button>
              ))}
              {onRefreshSuggestions && (
                <button
                  onClick={async () => {
                    if (isRefreshing) return;
                    setIsRefreshing(true);
                    try {
                      await onRefreshSuggestions();
                    } finally {
                      setIsRefreshing(false);
                    }
                  }}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border shadow-sm transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex-shrink-0"
                  style={{
                    backgroundColor: activeColors.surfaceMuted,
                    borderColor: activeColors.border,
                    color: activeColors.textPrimary,
                  }}
                  title="Refresh suggestions"
                >
                  <RefreshCw className={`w-3.5 h-3.5 flex-shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? '...' : 'Refresh'}</span>
                </button>
              )}
            </div>
          )}

          {/* Form with Input and Send Button */}
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.askPlaceholder}
              disabled={isQueryLoading}
              className="flex-grow rounded-xl py-2.5 px-3 sm:py-3 sm:px-4 border text-sm sm:text-base focus:outline-none transition-all shadow-inner"
              style={{
                backgroundColor: activeColors.surfaceMuted,
                borderColor: activeColors.border,
                color: activeColors.textPrimary,
              }}
            />
            <button
              type="submit"
              disabled={isQueryLoading || !query.trim()}
              className="p-2.5 sm:p-3 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: activeColors.accent }}
              title={t.send}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Source Text Modal */}
      {modalContent !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setModalContent(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden"
            style={{
              backgroundColor: activeColors.surface,
              borderColor: activeColors.border,
              color: activeColors.textPrimary,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-[3px] w-full" style={{ background: rainbowGradientStyle }} />
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: activeColors.border }}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" style={{ color: activeColors.accent }} />
                <h3 className="font-bold text-base">{t.sourceText}</h3>
              </div>
              <button
                onClick={() => setModalContent(null)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-grow text-sm leading-relaxed">
              <MarkdownRenderer content={modalContent} />
            </div>
            <div
              className="p-3 border-t flex justify-end"
              style={{ borderColor: activeColors.border }}
            >
              <button
                onClick={() => setModalContent(null)}
                className="px-4 py-2 rounded-lg text-white text-xs font-bold shadow"
                style={{ backgroundColor: activeColors.accent }}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
