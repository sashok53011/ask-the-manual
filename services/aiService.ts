/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RagStore, Document, QueryResult, CustomMetadata } from '../types';

async function postJson(endpoint: string, body: any) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request to ${endpoint} failed with status ${res.status}`);
  }
  return res.json();
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function initialize() {
  // provider config is managed server-side; nothing to do here
}

export async function createRagStore(displayName: string): Promise<string> {
  const store = await postJson('/api/rag-create', { displayName });
  if (!store.name) throw new Error('Failed to create RAG store');
  return store.name;
}

export async function uploadToRagStore(ragStoreName: string, file: File, metadata?: CustomMetadata[]): Promise<void> {
  const base64Data = await fileToBase64(file);
  await postJson('/api/rag-upload', {
    fileSearchStoreName: ragStoreName,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    base64Data,
    customMetadata: metadata && metadata.length ? metadata : undefined,
  });
}

export async function fileSearch(ragStoreName: string, query: string, language: string = 'en'): Promise<QueryResult> {
  const result = await postJson('/api/rag-query', { storeName: ragStoreName, message: query, language });
  const groundingChunks = result.groundingChunks || [];
  return { text: result.text || '', groundingChunks };
}

export async function* fileSearchStream(
  ragStoreName: string,
  query: string,
  language: string = 'en'
): AsyncGenerator<{ text?: string; groundingChunks?: any[]; done?: boolean; error?: string }> {
  const res = await fetch('/api/rag-query-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeName: ragStoreName, message: query, language }),
  });
  if (!res.ok || !res.body) {
    let msg = `Stream request failed with status ${res.status}`;
    try {
      const err = await res.json();
      if (err.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';
    for (const ev of events) {
      const lines = ev.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          yield JSON.parse(data);
        } catch {}
      }
    }
  }
}

export async function generateExampleQuestions(ragStoreName: string, language: string = 'en', level: number = 0, previous: string[] = []): Promise<string[]> {
  try {
    const result = await postJson('/api/rag-example-questions', { storeName: ragStoreName, language, level, previous });
    return Array.isArray(result.questions) ? result.questions : [];
  } catch (e) {
    console.error('Failed to generate example questions', e);
    return [];
  }
}

export async function deleteRagStore(ragStoreName: string): Promise<void> {
  await postJson('/api/rag-delete', { name: ragStoreName });
}

export async function listRagStores(): Promise<RagStore[]> {
  const result = await postJson('/api/rag-stores-list', {});
  const stores = result.stores || [];
  return stores.map((s: any) => ({ name: s.name, displayName: s.displayName || s.name }));
}

export async function listDocuments(ragStoreName: string): Promise<Document[]> {
  const result = await postJson('/api/documents-list', { parent: ragStoreName });
  const docs = result.documents || [];
  return docs.map((d: any) => ({
    name: d.name,
    displayName: d.displayName || d.name,
    customMetadata: d.customMetadata,
  }));
}

export async function deleteDocument(ragStoreName: string, documentName: string): Promise<void> {
  await postJson('/api/document-delete', { storeName: ragStoreName, name: documentName });
}

export async function getProviderConfig(): Promise<any> {
  const res = await fetch('/api/provider-config');
  if (!res.ok) throw new Error('Failed to get provider config');
  return res.json();
}

export async function setProviderConfig(cfg: any): Promise<void> {
  await postJson('/api/provider-config', cfg);
}

export async function testProvider(cfg: any): Promise<{ ok: boolean; message: string }> {
  const result = await postJson('/api/provider-test', cfg);
  return { ok: Boolean(result.ok), message: result.message || result.error || '' };
}

export async function getProviderModels(cfg: any): Promise<string[]> {
  try {
    await setProviderConfig(cfg);
    const result = await postJson('/api/provider-models', cfg);
    return Array.isArray(result.models) ? result.models : [];
  } catch (e) {
    console.error('getProviderModels failed', e);
    return [];
  }
}