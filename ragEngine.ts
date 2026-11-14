import fs from 'fs';
import path from 'path';

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = (baseUrl || '').trim().replace(/\/$/, '');
  if (!trimmed) return trimmed;
  if (/\/v1$/i.test(trimmed) || /\/v1\//i.test(trimmed)) return trimmed;
  return trimmed + '/v1';
}

export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  chatModel: string;
  embeddingModel: string;
}

export interface Chunk {
  text: string;
  embedding: number[];
  fileName: string;
}

export interface RagDocument {
  name: string;
  displayName: string;
}

export interface RagStore {
  name: string;
  displayName: string;
  chunks: Chunk[];
  documents: RagDocument[];
  useKeyword: boolean;
}

const stores = new Map<string, RagStore>();

const CONFIG_FILE = path.join(process.cwd(), 'provider-config.json');

let providerConfig: ProviderConfig = {
  baseUrl: process.env.OPENAI_BASE_URL || '',
  apiKey: process.env.OPENAI_API_KEY || process.env.API_KEY || '',
  chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
};

// Load persisted config from disk if present
try {
  if (fs.existsSync(CONFIG_FILE)) {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    providerConfig = { ...providerConfig, ...parsed };
  }
} catch (e) {
  console.warn('Failed to load provider config from disk:', e);
}

export function getProviderConfig(): ProviderConfig {
  return { ...providerConfig };
}

export function setProviderConfig(cfg: Partial<ProviderConfig>) {
  providerConfig = { ...providerConfig, ...cfg };
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(providerConfig, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to persist provider config:', e);
  }
}

export async function listModels(cfg?: Partial<ProviderConfig>): Promise<string[]> {
  const c = { ...providerConfig, ...(cfg || {}) };
  if (!c.baseUrl) return [];
  const url = normalizeBaseUrl(c.baseUrl) + '/models';
  try {
    const res = await fetch(url, {
      headers: c.apiKey ? { Authorization: `Bearer ${c.apiKey}` } : {},
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const arr = data?.data || data?.models || data?.model || [];
    return (Array.isArray(arr) ? arr : []).map((m: any) => (typeof m === 'string' ? m : m?.id || m?.name || m?.model)).filter(Boolean);
  } catch (e) {
    console.error('listModels failed', e);
    return [];
  }
}

export async function testProvider(cfg?: Partial<ProviderConfig>): Promise<{ ok: boolean; message: string }> {
  const c = { ...providerConfig, ...(cfg || {}) };
  if (!c.baseUrl) return { ok: false, message: 'Base URL is required' };
  const url = normalizeBaseUrl(c.baseUrl) + '/chat/completions';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(c.apiKey ? { Authorization: `Bearer ${c.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: c.chatModel,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, message: text || res.statusText };
    let content = 'OK';
    try {
      const data = JSON.parse(text);
      content = data?.choices?.[0]?.message?.content || content;
    } catch {}
    return { ok: true, message: content };
  } catch (e: any) {
    return { ok: false, message: e?.message || String(e) };
  }
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function chunkText(text: string, size = 1200, overlap = 200): string[] {
  const clean = text.replace(/\r\n/g, '\n');
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + size, clean.length);
    const chunk = clean.slice(i, end).trim();
    if (chunk.length > 0) chunks.push(chunk);
    if (end >= clean.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
}

async function extractText(buffer: Buffer, fileName: string, mimeType?: string): Promise<string> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf') || mimeType === 'application/pdf') {
    const mod: any = await import('pdf-parse');
    const PDFParse = mod.PDFParse || mod.default?.PDFParse;
    if (!PDFParse) throw new Error('PDF parser unavailable');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const data = await parser.getText();
    await parser.destroy();
    return data.text || '';
  }
  return buffer.toString('utf-8');
}

async function embedTexts(texts: string[], cfg: ProviderConfig): Promise<number[][]> {
  if (texts.length === 0) return [];
  const url = normalizeBaseUrl(cfg.baseUrl) + '/embeddings';
  const batchSize = 32;
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify({ model: cfg.embeddingModel, input: batch }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const embs = data?.data || [];
    for (const e of embs) out.push(e.embedding);
  }
  return out;
}

export async function createRagStore(displayName: string): Promise<RagStore> {
  const name = `store-${Date.now()}`;
  const store: RagStore = { name, displayName, chunks: [], documents: [], useKeyword: false };
  stores.set(name, store);
  return store;
}

export async function listRagStores(): Promise<RagStore[]> {
  return Array.from(stores.values());
}

export function getRagStore(name: string): RagStore | undefined {
  return stores.get(name);
}

export async function deleteRagStore(name: string): Promise<void> {
  stores.delete(name);
}

export async function uploadToRagStore(storeName: string, file: { name: string; type?: string; base64Data: string }, metadata?: any[]): Promise<{ documentName: string }> {
  const store = stores.get(storeName);
  if (!store) throw new Error('Store not found');
  const buffer = Buffer.from(file.base64Data, 'base64');
  const text = await extractText(buffer, file.name, file.type);
  const chunks = chunkText(text);
  let embeddings: number[][] = [];
  let useKeyword = store.useKeyword;
  try {
    embeddings = await embedTexts(chunks, providerConfig);
  } catch (e) {
    console.warn('Embeddings unavailable, falling back to keyword search:', e);
    useKeyword = true;
    embeddings = chunks.map(() => []);
  }
  store.useKeyword = store.useKeyword || useKeyword;
  const docName = `${storeName}/doc-${Date.now()}`;
  chunks.forEach((c, i) => {
    store.chunks.push({ text: c, embedding: embeddings[i] || [], fileName: file.name });
  });
  store.documents.push({ name: docName, displayName: file.name });
  return { documentName: docName };
}

export async function listDocuments(storeName: string): Promise<RagDocument[]> {
  const store = stores.get(storeName);
  if (!store) return [];
  return store.documents;
}

export async function deleteDocument(storeName: string, documentName: string): Promise<void> {
  const store = stores.get(storeName);
  if (!store) return;
  const doc = store.documents.find((d) => d.name === documentName);
  const fileName = doc?.displayName;
  store.documents = store.documents.filter((d) => d.name !== documentName);
  if (fileName) {
    store.chunks = store.chunks.filter((c) => c.fileName !== fileName);
  }
}

async function keywordRetrieve(store: RagStore, query: string): Promise<Chunk[]> {
  const terms = query.toLowerCase().split(/[^a-z0-9а-яё]+/i).filter((t) => t.length > 2);
  const scored = store.chunks.map((c) => {
    const lower = c.text.toLowerCase();
    let score = 0;
    for (const term of terms) {
      score += lower.split(term).length - 1;
    }
    if (terms.some((t) => c.fileName.toLowerCase().includes(t))) score += 2;
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  let top = scored.slice(0, 6).map((s) => s.c);
  if (top.length === 0) top = store.chunks.slice(0, 6);
  return top;
}

export async function retrieve(storeName: string, query: string): Promise<{ top: Chunk[]; context: string; useKeyword: boolean }> {
  const store = stores.get(storeName);
  if (!store) throw new Error('Store not found');
  let top: Chunk[] = [];
  let useKeyword = store.useKeyword;

  if (useKeyword || store.chunks.every((c) => !c.embedding || c.embedding.length === 0)) {
    top = await keywordRetrieve(store, query);
  } else {
    let qEmb: number[] = [];
    try {
      qEmb = (await embedTexts([query], providerConfig))[0] || [];
    } catch {
      store.useKeyword = true;
      useKeyword = true;
    }
    if (useKeyword) {
      top = await keywordRetrieve(store, query);
    } else {
      const scored = store.chunks.map((c) => ({ c, score: cosine(qEmb, c.embedding) }));
      scored.sort((a, b) => b.score - a.score);
      top = scored.slice(0, 6).map((s) => s.c);
      if (top.length === 0) top = store.chunks.slice(0, 6);
    }
  }

  const context = top.map((c, i) => `Source ${i + 1} (${c.fileName}):\n${c.text}`).join('\n\n---\n\n');
  return { top, context, useKeyword };
}

function buildMessages(context: string, query: string, language: string) {
  const langInstruction =
    language === 'ru'
      ? 'Answer in Russian. '
      : language === 'de'
      ? 'Answer in German. '
      : 'Answer in English. ';
  return [
    { role: 'system', content: `${langInstruction}You are a helpful assistant. Answer using the provided document context. Cite sources by number when possible.` },
    { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` },
  ];
}

export async function* chatCompletionStream(messages: any[]): AsyncGenerator<string> {
  const cfg = providerConfig;
  const url = normalizeBaseUrl(cfg.baseUrl) + '/chat/completions';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
    },
    body: JSON.stringify({ model: cfg.chatModel, messages, stream: true, temperature: 0.2 }),
  });
  if (!res.ok || !res.body) throw new Error(await res.text());
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {}
    }
  }
}

export async function fileSearch(storeName: string, query: string, language: string = 'en'): Promise<{ text: string; groundingChunks: { retrievedContext?: { text?: string } }[] }> {
  const { top, context } = await retrieve(storeName, query);
  const messages = buildMessages(context, query, language);
  const cfg = providerConfig;
  const url = normalizeBaseUrl(cfg.baseUrl) + '/chat/completions';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
    },
    body: JSON.stringify({ model: cfg.chatModel, messages, temperature: 0.2 }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  const groundingChunks = top.map((c) => ({ retrievedContext: { text: c.text } }));
  return { text, groundingChunks };
}

export { buildMessages };

export async function generateExampleQuestions(storeName: string, language: string = 'en', level: number = 0, previous: string[] = []): Promise<string[]> {
  const store = stores.get(storeName);
  if (!store || store.chunks.length === 0) return [];
  const total = store.chunks.length;
  let start = 0;
  if (level === 1) start = Math.floor(total / 3);
  else if (level >= 2) start = Math.floor(total * 2 / 3);
  const sampleChunks = store.chunks.slice(start, start + 6);
  const sample = (sampleChunks.length ? sampleChunks : store.chunks.slice(0, 6)).map((c) => c.text).join('\n\n').slice(0, 4000);
  const cfg = providerConfig;
  const url = normalizeBaseUrl(cfg.baseUrl) + '/chat/completions';
  const langName = language === 'ru' ? 'Russian' : language === 'de' ? 'German' : 'English';
  const depthInstruction =
    level <= 0
      ? 'Generate 6 simple, high-level questions about the overall content and purpose of the document.'
      : level === 1
      ? 'Generate 6 more detailed questions about specific sections, features, or procedures in the document.'
      : 'Generate 6 advanced, in-depth questions about edge cases, troubleshooting, specifications, or fine details in the document.';
  const avoid = previous.length ? `\nDo not repeat or rephrase these previous questions:\n${previous.map((q) => `- ${q}`).join('\n')}\n` : '';
  const prompt = `${depthInstruction} Write them in ${langName}. Questions must be distinct and non-repetitive.${avoid}Return ONLY a JSON array of strings.\n\n${sample}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
    },
    body: JSON.stringify({ model: cfg.chatModel, messages: [{ role: 'user', content: prompt }], temperature: 0.3 }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  try {
    const match = content.match(/\[[\s\S]*\]/);
    const arr = JSON.parse(match ? match[0] : content);
    if (Array.isArray(arr)) {
      const seen = new Set<string>();
      const unique: string[] = [];
      for (const x of arr) {
        if (typeof x !== 'string') continue;
        const key = x.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(x.trim());
      }
      return unique.slice(0, 6);
    }
  } catch {}
  return [];
}