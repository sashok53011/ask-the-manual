# Ask the Manual — RAG-чат по документам

[English](README.md) | [Русский](README.ru.md) | [Deutsch](README.de.md)

Чат с вашими документами (PDF, TXT, MD, код) на базе любого **OpenAI-совместимого** провайдера:
SSE-стриминг ответов, RAG (эмбеддинги + поиск по ключевым словам), встроенный терминал,
темы и сборка Android APK.

**Онлайн:** https://aistudio.devhorizon.online/ask-the-manual/

---

## Возможности

- 📄 Загрузка руководств/спецификаций/кода → in-memory RAG-хранилище (чанкинг + эмбеддинги)
- 🤖 Любой OpenAI-совместимый endpoint (OpenAI, LM Studio, Ollama, OpenRouter, AI Bridge…)
- 🔌 UI настроек провайдера: Base URL, API-ключ, **Get model list**, **Test Connection**, **Save**
- ⚡ SSE-стриминг ответов (посимвольно)
- 🔍 Поиск по эмбеддингам с автоматическим **fallback на поиск по ключевым словам**, если `/embeddings` недоступен
- 📚 Панель источников (полученные фрагменты)
- 💬 Примерные вопросы: 6 неповторяющихся подсказок, с ростом глубины при **Refresh**
- 🌍 Языки интерфейса: RU / DE / EN + живой перевод сообщений
- 🖥️ Выдвижной терминал (последовательное построчное выполнение команд)
- 🎨 8 радужных тем, шрифты и полный RGB-кастомизатор элементов
- 📱 Мобильный адаптивный UI (6" Android) + safe-area
- 🤖 Android APK на базе Capacitor
- 🔐 API-ключ хранится в браузере (`localStorage`) **и** на сервере (`provider-config.json`)

---

## Архитектура

```
┌────────────────────────────── Браузер (React19 + Vite) ──────────────────────────────┐
│ App.tsx (машина состояний: Welcome → Uploading → Chatting → Error)                   │
│  ├─ i18n/         LanguageProvider (ru/de/en) + живой перевод                        │
│  ├─ themes/       ThemeProvider (8 пресетов, RGB-кастомизатор, шрифты)                │
│  ├─ components/   TopNavigation, WelcomeScreen, ChatInterface (Markdown+KaTeX),       │
│  │                CodeBlock, TerminalDrawer, ProviderSettingsModal,                  │
│  │                AdvancedRagModal (RagStoreList/DocumentList/QueryInterface),       │
│  │                ThemeCustomizerModal, MarkdownRenderer                             │
│  └─ services/aiService.ts   →  fetch /api/*  (SSE-чтение стримов)                    │
└──────────────────────────────────────┬───────────────────────────────────────────────┘
                                       │  HTTP / SSE
┌──────────────────────────────────────▼───────────────────────────────────────────────┐
│ server.ts (Express, tsx, порт 8009/8011)                                             │
│  /api/provider-config|test|models   — настройки провайдера + тест соединения         │
│  /api/rag-create|upload|delete|stores-list|store-get|documents-list|document-delete  │
│  /api/rag-query                     — не-стримовый RAG-ответ                          │
│  /api/rag-query-stream              — SSE: retrieve → проксирование стрима           │
│  /api/rag-example-questions         — suggestions с глубиной (0/1/2+)                │
│  /api/terminal/run, /api/save-file  — выполнение команд + сохранение файла           │
│  + Vite dev middleware (dev) / статика dist (prod)                                    │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ ragEngine.ts (in-memory RAG)                                                         │
│  • chunkText(1200 символов, перекрытие 200)                                          │
│  • extractText: PDF (pdf-parse v2) / обычный текст                                   │
│  • embedTexts → POST {base}/v1/embeddings  (батчи по 32)                             │
│  • retrieve(): cosine similarity  ──при ошибке──▶  fallback на keyword-скоринг        │
│  • chatCompletionStream(): upstream SSE → генератор дельт                             │
│  • generateExampleQuestions(): уровень 0/1/2 → простые → детальные → продвинутые      │
│  • provider-config.json сохраняется на диске                                          │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                       │
                    OpenAI-совместимый провайдер (чат + эмбеддинги + /models)
```

### Ключевые потоки

1. **Загрузка** → `createRagStore` → для каждого файла: base64 → извлечение текста → чанкинг → эмбеддинги → сохранение чанков.
2. **Вопрос** → `retrieve` топ-6 чанков → сборка сообщений (язык + контекст) → upstream `/chat/completions`.
   - При `stream: true` сервер транслирует `text/event-stream` клиенту, который прогрессивно рендерит Markdown.
3. **Подсказки** → сэмпл чанков с растущей глубиной документа, запрос 6 различных вопросов,
   дедупликация против всех предыдущих раундов.
4. **Конфиг провайдера** → сохраняется в `localStorage` (клиент) + `provider-config.json` (сервер);
   синхронизируется на сервер при загрузке приложения и по кнопке *Save*.

---

## Структура проекта

```
├── App.tsx                  # корневая машина состояний + провайдеры
├── server.ts                # Express API + SSE-прокси + раздача статики
├── ragEngine.ts             # in-memory RAG: чанкинг/эмбеддинги/поиск/стрим/подсказки
├── services/aiService.ts    # API-клиент браузера (включая SSE-генератор)
├── components/              # UI (чат, терминал, модалки, иконки)
├── i18n/                    # переводы (en/ru/de) + контекст языка
├── themes/                  # пресеты тем + контекст RGB-кастомизатора
├── capacitor.config.ts      # Android-обёртка (грузит размещённое веб-приложение)
├── android/                 # Android-проект Capacitor (gradle)
└── AskTheManual.apk         # готовый debug APK
```

---

## Запуск локально

```bash
npm install
npm run dev          # http://localhost:3000
```

Настройте провайдер в UI (**AI Provider** → Base URL / ключ / модели → *Test* → *Save*).

Env-переменные (опционально, `.env`): `OPENAI_BASE_URL`, `OPENAI_API_KEY`,
`OPENAI_CHAT_MODEL`, `OPENAI_EMBEDDING_MODEL`, `PORT`.

## Сборка

```bash
npm run build        # → dist/
npm run start        # production-сервер (NODE_ENV=production)
npm run build:apk    # build + cap sync + gradle assembleDebug → AskTheManual.apk
```

## Деплой (текущий)

- Сервер: `192.168.0.174` → `~/remix-ask-the-manual`, PM2-приложение `ask-the-manual`, порт **8011**
- Портал: `aistudio-portal` на **8009** роутит slug `ask-the-manual` → `:8011`
- Edge: Cloudflare Tunnel → https://aistudio.devhorizon.online/ask-the-manual/
- Обновление: `git pull` → `npm install` → `npm run build` → `pm2 restart ask-the-manual`

## Android APK

- WebView на базе Capacitor грузит размещённое приложение (`capacitor.config.ts` → `server.url`)
- Debug APK: `AskTheManual.apk` (4 МБ) — установить на устройство, разрешить неизвестные источники
- Пересборка: `npm run build:apk`

---

## TODO

### Высокий приоритет
- [ ] **Release APK** — собственный keystore, `assembleRelease`, подписанный пакет для распространения
- [ ] **Офлайн/автономный APK** — абсолютный API base URL, кеш оболочки, service worker
- [ ] **Персистентность RAG-сторов на диске** — переживать перезапуск сервера (сейчас только in-memory)
- [ ] **Сохранение истории чата** — восстановление диалога после перезагрузки (сервер или IndexedDB)
- [ ] **CI/CD** — GitHub Actions: сборка APK по тегу, деплой на сервер по SSH

### Средний приоритет
- [ ] **Цитаты источников с номерами страниц** для PDF
- [ ] **Экспорт чата в Markdown / PDF**
- [ ] **Лимиты и валидация загрузки файлов** (размер, MIME, hook антивируса)
- [ ] **Пагинация** списков сторов/документов в Advanced RAG Manager
- [ ] **Стриминг терминала (PTY)** — живой stdout вместо буфера после выполнения; `cwd` на сессию
- [ ] **Автоопределение embedding-модели** из `/models` (фильтр `*embed*`)
- [ ] **Параллельная загрузка нескольких файлов** с прогрессом по каждому
- [ ] **Безопасное хранение ключей** — серверное хранилище секретов (не обычный JSON)

### Низкий приоритет / полировка
- [ ] Полный i18n: оставшиеся захардкоженные английские строки (сообщения прогресса, ошибки) → `translations.ts`
- [ ] Code splitting (`manualChunks`) для уменьшения бандла ~650 кБ
- [ ] Юнит-тесты для `ragEngine` (чанкинг, retrieval, дедупликация) + интеграционные API-тесты
- [ ] Определение системной темы dark/light
- [ ] Разбор документов с учётом изображений/таблиц (OCR для сканов)
- [ ] Остановка стрима из UI (AbortController)
- [ ] Языковые пресеты глубины подсказок

---

## Лицензия

Apache-2.0 (SPDX-заголовки в исходных файлах).
