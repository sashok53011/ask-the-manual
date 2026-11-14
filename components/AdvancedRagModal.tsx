/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Database } from 'lucide-react';
import * as aiService from '../services/aiService';
import RagStoreList from './RagStoreList';
import DocumentList from './DocumentList';
import QueryInterface from './QueryInterface';
import { RagStore, Document, QueryResult } from '../types';
import Spinner from './Spinner';
import { useLanguage } from '../i18n/languageContext';
import { useTheme } from '../themes/themeContext';

interface AdvancedRagModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedRagModal: React.FC<AdvancedRagModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const { activeColors, rainbowGradientStyle } = useTheme();

  const [stores, setStores] = useState<RagStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<RagStore | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isQueryLoading, setIsQueryLoading] = useState(false);

  const refreshStores = useCallback(async () => {
    setIsLoading(true);
    try {
      aiService.initialize();
      const list = await aiService.listRagStores();
      setStores(list);
    } catch (e) {
      console.error('Failed to list RAG stores', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDocuments = useCallback(async (store: RagStore | null) => {
    if (!store) {
      setDocuments([]);
      return;
    }
    setIsLoading(true);
    try {
      const docs = await aiService.listDocuments(store.name);
      setDocuments(docs);
    } catch (e) {
      console.error('Failed to list documents', e);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshStores();
      setResult(null);
    }
  }, [isOpen, refreshStores]);

  useEffect(() => {
    loadDocuments(selectedStore);
  }, [selectedStore, loadDocuments]);

  const handleCreate = async (displayName: string) => {
    try {
      aiService.initialize();
      await aiService.createRagStore(displayName);
      await refreshStores();
    } catch (e) {
      console.error('Failed to create store', e);
    }
  };

  const handleSelect = (store: RagStore) => {
    setSelectedStore(store);
    setResult(null);
  };

  const handleDeleteStore = async (name: string) => {
    try {
      await aiService.deleteRagStore(name);
      if (selectedStore?.name === name) {
        setSelectedStore(null);
        setDocuments([]);
      }
      await refreshStores();
    } catch (e) {
      console.error('Failed to delete store', e);
    }
  };

  const handleUpload = async (file: File, metadata: any[]) => {
    if (!selectedStore) return;
    setProcessingFile(file.name);
    try {
      await aiService.uploadToRagStore(selectedStore.name, file, metadata);
      await loadDocuments(selectedStore);
    } catch (e) {
      console.error('Failed to upload document', e);
    } finally {
      setProcessingFile(null);
    }
  };

  const handleDeleteDoc = async (name: string) => {
    try {
      await aiService.deleteDocument(selectedStore?.name || '', name);
      await loadDocuments(selectedStore);
    } catch (e) {
      console.error('Failed to delete document', e);
    }
  };

  const handleQuery = async (query: string) => {
    if (!selectedStore) return;
    setIsQueryLoading(true);
    try {
      const res = await aiService.fileSearch(selectedStore.name, query, language);
      setResult(res);
    } catch (e) {
      console.error('Failed to query', e);
    } finally {
      setIsQueryLoading(false);
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
        className="relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border transition-all"
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
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">RAG Store Manager (Advanced)</h2>
              <p className="text-xs" style={{ color: activeColors.textMuted }}>
                Manage stores, documents, metadata and run queries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-3 sm:p-5">
          {isLoading && stores.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              <div className="min-h-[300px]">
                <RagStoreList
                  stores={stores}
                  selectedStore={selectedStore}
                  isLoading={isLoading}
                  onCreate={handleCreate}
                  onSelect={handleSelect}
                  onDelete={handleDeleteStore}
                  onRefresh={refreshStores}
                />
              </div>
              <div className="flex flex-col gap-4 min-h-[300px]">
                <div className="flex-1 min-h-[200px]">
                  <DocumentList
                    selectedStore={selectedStore}
                    documents={documents}
                    isLoading={isLoading}
                    processingFile={processingFile}
                    onUpload={handleUpload}
                    onDelete={handleDeleteDoc}
                  />
                </div>
                <div className="flex-1 min-h-[200px]">
                  <QueryInterface
                    selectedStore={selectedStore}
                    isLoading={isQueryLoading}
                    result={result}
                    onQuery={handleQuery}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedRagModal;