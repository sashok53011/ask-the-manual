# Ask the Manual — RAG Document Chat

[English](README.md) | [Русский](README.ru.md) | [Deutsch](README.de.md)

Chat with your documents (PDF, TXT, MD, code) using a pluggable **OpenAI-compatible** provider,
with SSE streaming answers, keyword/embedding RAG, an embedded shell terminal, theming and
an Android APK build.

**Live:** https://aistudio.devhorizon.online/ask-the-manual/

---

## Features

- 📄 Upload manuals/specs/code → in-memory RAG store (chunking + embeddings)
- 🤖 Any OpenAI-compatible endpoint (OpenAI, LM Studio, Ollama, OpenRouter, AI Bridge…)
- 🔌 Provider settings UI: Base URL, API key, **Get model list**, **Test Connection**, **Save**
- ⚡ SSE streaming answers (token-by-token)
- 🔍 Embedding search with automatic **keyword-search fallback** when `/embeddings` is unavailable
- 📚 Sources panel with retrieved chunks
- 💬 Example questions: 6 non-repeating suggestions, growing depth on **Refresh**
- 🌍 UI languages: RU / DE / EN + per-message live translation
- 🖥️ Slide-out terminal (sequential line-by-line command execution)
- 🎨 8 rainbow themes, fonts and full RGB element customizer
- 📱 Mobile-adaptive UI (6" Android) + safe-area support
- 🤖 Capacitor Android APK
- 🔐 API key persisted in browser `localStorage` **and** on the server (`provider-config.json`)

---

## Architecture

```
┌────────────────────────────── Browser (React19 + Vite) ──────────────────────────────┐
│ App.tsx (state machine: Welcome → Uploading → Chatting → Error)                      │
│  ├─ i18n/         LanguageProvider (ru/de/en) + live translation                      │
│  ├─ themes/       ThemeProvider (8 presets, RGB customizer, fonts)                    │
│  ├─ components/   TopNavigation, WelcomeScreen, ChatInterface (Markdown+KaTeX),        │
│  │                CodeBlock, TerminalDrawer, ProviderSettingsModal,                   │
│  │                AdvancedRagModal (RagStoreList/DocumentList/QueryInterface),        │
│  │                ThemeCustomizerModal, MarkdownRenderer                              │
│  └─ services/aiService.ts   →  fetch /api/*  (SSE reader for streams)                 │
└──────────────────────────────────────┬───────────────────────────────────────────────┘
                                       │  HTTP / SSE
┌──────────────────────────────────────▼───────────────────────────────────────────────┐
│ server.ts (Express, tsx, PORT 8009/8011)                                             │
│  /api/provider-config|test|models   — provider settings + connection test            │
│  /api/rag-create|upload|delete|stores-list|store-get|documents-list|document-delete  │
│  /api/rag-query                     — non-stream RAG answer                          │
│  /api/rag-query-stream              — SSE: retrieve → proxy upstream stream          │
│  /api/rag-example-questions         — depth-aware suggestions (0/1/2+)                │
│  /api/terminal/run, /api/save-file  — shell exec + file save                          │
│  + Vite dev middleware (dev) / static dist (prod)                                     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ ragEngine.ts (in-memory RAG)                                                         │
│  • chunkText(1200 chars, 200 overlap)                                                │
│  • extractText: PDF (pdf-parse v2) / plain text                                      │
│  • embedTexts → POST {base}/v1/embeddings  (batched, 32)                             │
│  • retrieve(): cosine similarity  ──on error──▶  keyword scoring fallback             │
│  • chatCompletionStream(): upstream SSE → delta generator                             │
│  • generateExampleQuestions(): level 0/1/2 → simple → detailed → advanced            │
│  • provider-config.json persisted on disk                                            │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                       │
                    OpenAI-compatible provider (chat + embeddings + /models)
```

### Key flows

1. **Upload** → `createRagStore` → per file: base64 → extract text → chunk → embed → store chunks.
2. **Question** → `retrieve` top-6 chunks → build messages (language + context) → upstream `/chat/completions`.
   - With `stream: true` the server relays `text/event-stream` to the client, which renders Markdown progressively.
3. **Suggestions** → sample chunks from increasing document depth, request 6 distinct questions,
   dedupe against all previous rounds.
4. **Provider config** → saved to `localStorage` (client) + `provider-config.json` (server);
   synced to the server on app load and on *Save*.

---

## Project structure

```
├── App.tsx                  # root state machine + providers
├── server.ts                # Express API + SSE proxy + static serving
├── ragEngine.ts             # in-memory RAG: chunk/embed/retrieve/stream/suggest
├── genaiProxy (removed)     # replaced by aiService + OpenAI-compatible calls
├── services/aiService.ts    # browser API client (incl. SSE generator)
├── components/              # UI (chat, terminal, modals, icons)
├── i18n/                    # translations (en/ru/de) + language context
├── themes/                  # theme presets + RGB customizer context
├── capacitor.config.ts      # Android wrapper (loads the hosted web app)
├── android/                 # Capacitor Android project (gradle)
└── AskTheManual.apk         # prebuilt debug APK
```

---

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Configure the provider in the UI (**AI Provider** → Base URL / key / models → *Test* → *Save*).

Environment fallbacks (optional, `.env`): `OPENAI_BASE_URL`, `OPENAI_API_KEY`,
`OPENAI_CHAT_MODEL`, `OPENAI_EMBEDDING_MODEL`, `PORT`.

## Build

```bash
npm run build        # → dist/
npm run start        # production server (NODE_ENV=production)
npm run build:apk    # build + cap sync + gradle assembleDebug → AskTheManual.apk
```

## Deployment (current)

- Server: `192.168.0.174` → `~/remix-ask-the-manual`, PM2 app `ask-the-manual`, port **8011**
- Portal: `aistudio-portal` on **8009** routes slug `ask-the-manual` → `:8011`
- Edge: Cloudflare Tunnel → https://aistudio.devhorizon.online/ask-the-manual/
- Update: `git pull` → `npm install` → `npm run build` → `pm2 restart ask-the-manual`

## Android APK

- `Capacitor` WebView loads the hosted app (`capacitor.config.ts` → `server.url`)
- Debug APK: `AskTheManual.apk` (4 MB) — install on device, allow unknown sources
- Rebuild: `npm run build:apk`

---

## TODO

### High priority
- [ ] **Release APK** — own keystore, `assembleRelease`, signed bundle for distribution
- [ ] **Offline / standalone APK** — absolute API base URL, cache shell, service worker
- [ ] **Persist RAG stores to disk** — survive server restarts (currently in-memory only)
- [ ] **Chat history persistence** — restore conversation after reload (server-side or IndexedDB)
- [ ] **CI/CD** — GitHub Actions: build APK on tag, deploy to server via SSH

### Medium priority
- [ ] **Source citations with page numbers** for PDFs
- [ ] **Export chat to Markdown / PDF**
- [ ] **File upload limits + validation** (size, MIME, virus scan hook)
- [ ] **Pagination** for store/document lists in Advanced RAG Manager
- [ ] **Terminal streaming (PTY)** — live stdout instead of post-exec buffer; `cwd` per session
- [ ] **Auto-detect embedding model** from `/models` (filter `*embed*`)
- [ ] **Multi-file parallel upload** with per-file progress
- [ ] **Secure key storage** — server-side secret store (not plain JSON)

### Low priority / polish
- [ ] Full i18n: move remaining hard-coded English strings (progress messages, errors) to `translations.ts`
- [ ] Code splitting (`manualChunks`) to shrink the ~650 kB bundle
- [ ] Unit tests for `ragEngine` (chunking, retrieval, dedupe) + API integration tests
- [ ] Dark/light system theme detection
- [ ] Image/table-aware document parsing (OCR for scans)
- [ ] Stop/abort in-flight stream from UI (AbortController)
- [ ] Per-language suggestion depth presets

---

## License

Apache-2.0 (SPDX headers in source files).
