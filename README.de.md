# Ask the Manual — RAG-Dokumenten-Chat

[English](README.md) | [Русский](README.ru.md) | [Deutsch](README.de.md)

Chatten Sie mit Ihren Dokumenten (PDF, TXT, MD, Code) über einen beliebigen
**OpenAI-kompatiblen** Provider: SSE-Streaming der Antworten, RAG (Embeddings +
Keyword-Suche), eingebautes Terminal, Themes und ein Android-APK-Build.

**Live:** https://aistudio.devhorizon.online/ask-the-manual/

---

## Funktionen

- 📄 Handbücher/Specs/Code hochladen → In-Memory-RAG-Store (Chunking + Embeddings)
- 🤖 Jeder OpenAI-kompatible Endpoint (OpenAI, LM Studio, Ollama, OpenRouter, AI Bridge…)
- 🔌 Provider-Settings-UI: Base URL, API-Key, **Get model list**, **Test Connection**, **Save**
- ⚡ SSE-Streaming der Antworten (Token für Token)
- 🔍 Embedding-Suche mit automatischem **Fallback auf Keyword-Suche**, wenn `/embeddings` fehlt
- 📚 Quellen-Panel mit abgerufenen Chunks
- 💬 Beispiel-Fragen: 6 nicht wiederholte Vorschläge, steigende Tiefe bei **Refresh**
- 🌍 UI-Sprachen: RU / DE / EN + Live-Übersetzung einzelner Nachrichten
- 🖥️ Ausfahrendes Terminal (sequenzielle Befehlsausführung Zeile für Zeile)
- 🎨 8 Regenbogen-Themes, Schriftarten und volle RGB-Element-Anpassung
- 📱 Mobiles, adaptives UI (6" Android) + Safe-Area-Unterstützung
- 🤖 Capacitor-Android-APK
- 🔐 API-Key wird im Browser (`localStorage`) **und** auf dem Server (`provider-config.json`) gespeichert

---

## Architektur

```
┌────────────────────────────── Browser (React19 + Vite) ──────────────────────────────┐
│ App.tsx (Statusmaschine: Welcome → Uploading → Chatting → Error)                     │
│  ├─ i18n/         LanguageProvider (ru/de/en) + Live-Übersetzung                     │
│  ├─ themes/       ThemeProvider (8 Presets, RGB-Customizer, Schriften)               │
│  ├─ components/   TopNavigation, WelcomeScreen, ChatInterface (Markdown+KaTeX),      │
│  │                CodeBlock, TerminalDrawer, ProviderSettingsModal,                 │
│  │                AdvancedRagModal (RagStoreList/DocumentList/QueryInterface),      │
│  │                ThemeCustomizerModal, MarkdownRenderer                            │
│  └─ services/aiService.ts   →  fetch /api/*  (SSE-Reader für Streams)                │
└──────────────────────────────────────┬───────────────────────────────────────────────┘
                                       │  HTTP / SSE
┌──────────────────────────────────────▼───────────────────────────────────────────────┐
│ server.ts (Express, tsx, Port 8009/8011)                                             │
│  /api/provider-config|test|models   — Provider-Einstellungen + Verbindungstest       │
│  /api/rag-create|upload|delete|stores-list|store-get|documents-list|document-delete  │
│  /api/rag-query                     — nicht-streaming RAG-Antwort                    │
│  /api/rag-query-stream              — SSE: retrieve → Upstream-Stream weiterleiten   │
│  /api/rag-example-questions         — Vorschläge mit Tiefe (0/1/2+)                  │
│  /api/terminal/run, /api/save-file  — Shell-Ausführung + Datei-Speichern             │
│  + Vite dev middleware (dev) / statisches dist (prod)                                 │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ ragEngine.ts (In-Memory-RAG)                                                         │
│  • chunkText(1200 Zeichen, 200 Überlappung)                                          │
│  • extractText: PDF (pdf-parse v2) / Klartext                                        │
│  • embedTexts → POST {base}/v1/embeddings  (Batches à 32)                            │
│  • retrieve(): Cosine Similarity  ──bei Fehler──▶  Keyword-Scoring-Fallback          │
│  • chatCompletionStream(): Upstream-SSE → Delta-Generator                            │
│  • generateExampleQuestions(): Level 0/1/2 → einfach → detailliert → fortgeschritten │
│  • provider-config.json wird auf der Festplatte gespeichert                          │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                       │
                    OpenAI-kompatibler Provider (Chat + Embeddings + /models)
```

### Wichtige Abläufe

1. **Upload** → `createRagStore` → pro Datei: base64 → Text extrahieren → Chunks → Embeddings → speichern.
2. **Frage** → `retrieve` Top-6-Chunks → Nachrichten bauen (Sprache + Kontext) → upstream `/chat/completions`.
   - Bei `stream: true` leitet der Server `text/event-stream` an den Client weiter, der Markdown
     progressiv rendert.
3. **Vorschläge** → Samples aus zunehmender Dokumenttiefe, 6 unterschiedliche Fragen anfordern,
   gegen alle vorherigen Runden deduplizieren.
4. **Provider-Config** → in `localStorage` (Client) + `provider-config.json` (Server);
   wird beim Laden der App und über *Save* mit dem Server synchronisiert.

---

## Projektstruktur

```
├── App.tsx                  # Wurzel-Statusmaschine + Provider
├── server.ts                # Express-API + SSE-Proxy + Auslieferung statischer Dateien
├── ragEngine.ts             # In-Memory-RAG: Chunks/Embeddings/Suche/Stream/Vorschläge
├── services/aiService.ts    # Browser-API-Client (inkl. SSE-Generator)
├── components/              # UI (Chat, Terminal, Dialoge, Icons)
├── i18n/                    # Übersetzungen (en/ru/de) + Sprachkontext
├── themes/                  # Theme-Presets + RGB-Customizer-Kontext
├── capacitor.config.ts      # Android-Wrapper (lädt die gehostete Web-App)
├── android/                 # Capacitor-Android-Projekt (gradle)
└── AskTheManual.apk         # vorkompiliertes Debug-APK
```

---

## Lokal ausführen

```bash
npm install
npm run dev          # http://localhost:3000
```

Provider in der UI konfigurieren (**AI Provider** → Base URL / Key / Modelle → *Test* → *Save*).

Env-Variablen (optional, `.env`): `OPENAI_BASE_URL`, `OPENAI_API_KEY`,
`OPENAI_CHAT_MODEL`, `OPENAI_EMBEDDING_MODEL`, `PORT`.

## Build

```bash
npm run build        # → dist/
npm run start        # Production-Server (NODE_ENV=production)
npm run build:apk    # build + cap sync + gradle assembleDebug → AskTheManual.apk
```

## Deployment (aktuell)

- Server: `192.168.0.174` → `~/remix-ask-the-manual`, PM2-App `ask-the-manual`, Port **8011**
- Portal: `aistudio-portal` auf **8009** routet Slug `ask-the-manual` → `:8011`
- Edge: Cloudflare Tunnel → https://aistudio.devhorizon.online/ask-the-manual/
- Update: `git pull` → `npm install` → `npm run build` → `pm2 restart ask-the-manual`

## Android-APK

- Capacitor-WebView lädt die gehostete App (`capacitor.config.ts` → `server.url`)
- Debug-APK: `AskTheManual.apk` (4 MB) — auf Gerät installieren, unbekannte Quellen erlauben
- Rebuild: `npm run build:apk`

---

## TODO

### Hohe Priorität
- [ ] **Release-APK** — eigener Keystore, `assembleRelease`, signiertes Paket zur Verteilung
- [ ] **Offline/Standalone-APK** — absolute API-Base-URL, Shell-Cache, Service Worker
- [ ] **RAG-Stores auf Festplatte persistieren** — Server-Neustart überleben (nur In-Memory)
- [ ] **Chat-Verlauf persistieren** — Dialog nach Reload wiederherstellen (Server oder IndexedDB)
- [ ] **CI/CD** — GitHub Actions: APK-Build per Tag, Deploy per SSH

### Mittlere Priorität
- [ ] **Quellenzitate mit Seitenzahlen** für PDFs
- [ ] **Chat-Export nach Markdown / PDF**
- [ ] **Upload-Limits & Validierung** (Größe, MIME, Virenscan-Hook)
- [ ] **Paginierung** der Store-/Dokumentlisten im Advanced RAG Manager
- [ ] **Terminal-Streaming (PTY)** — Live-stdout statt Puffer nach Ausführung; `cwd` pro Sitzung
- [ ] **Embedding-Modell auto-erkennen** aus `/models` (Filter `*embed*`)
- [ ] **Paralleler Multi-File-Upload** mit Fortschritt je Datei
- [ ] **Sichere Key-Ablage** — serverseitiges Secret-Store (kein einfaches JSON)

### Niedrige Priorität / Feinschliff
- [ ] Vollständiges i18n: verbleibende harte englische Strings (Fortschritt, Fehler) → `translations.ts`
- [ ] Code-Splitting (`manualChunks`) zur Verkleinerung des ~650-kB-Bundles
- [ ] Unit-Tests für `ragEngine` (Chunking, Retrieval, Dedupe) + API-Integrationstests
- [ ] System-Thema Dark/Light erkennen
- [ ] Bild-/tabellenbewusstes Dokument-Parsing (OCR für Scans)
- [ ] Stream aus dem UI abbrechen (AbortController)
- [ ] Sprachspezifische Tiefen-Presets für Vorschläge

---

## Lizenz

Apache-2.0 (SPDX-Header in den Quelldateien).
