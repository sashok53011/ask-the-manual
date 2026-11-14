/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'ru' | 'de';

export interface TranslationStrings {
  // Navigation & General
  appTitle: string;
  appSubtitle: string;
  newChat: string;
  terminal: string;
  openTerminal: string;
  closeTerminal: string;
  themeCustomizer: string;
  themes: string;
  fonts: string;
  colorPalette: string;
  language: string;
  resetDefaults: string;
  saveChanges: string;

  // Welcome Screen
  welcomeTitle: string;
  welcomeSubtitle: string;
  apiKeySelected: string;
  selectApiKey: string;
  dragDropText: string;
  browseFiles: string;
  selectedFiles: string;
  uploadAndChat: string;
  orDivider: string;
  tryExample: string;
  sampleCarManual: string;
  sampleWasherManual: string;

  // Chat Screen
  chatWith: string;
  askPlaceholder: string;
  send: string;
  sources: string;
  sourceText: string;
  close: string;
  trySuggestion: string;
  translating: string;
  translateMessage: string;
  translatedTo: string;
  showOriginal: string;

  // Code Block
  copyCode: string;
  copied: string;
  saveToProject: string;
  savingFile: string;
  savedFile: string;
  saveFailed: string;
  runInTerminal: string;
  executing: string;
  languageLabel: string;
  fileLabel: string;
  linesLabel: string;

  // Terminal
  terminalTitle: string;
  terminalSubtitle: string;
  sequentialExecutionNotice: string;
  clearTerminal: string;
  copyLogs: string;
  stopExecution: string;
  runCommandPrompt: string;
  readyForCommands: string;
  runningLine: string;
  commandCompleted: string;
  commandFailed: string;
  duration: string;
  exitCode: string;

  // Themes & Customizer
  themeNameCyber: string;
  themeDescCyber: string;
  themeNameSunset: string;
  themeDescSunset: string;
  themeNameOcean: string;
  themeDescOcean: string;
  themeNamePastel: string;
  themeDescPastel: string;
  themeNameMonokai: string;
  themeDescMonokai: string;
  themeNameCosmic: string;
  themeDescCosmic: string;
  themeNameArcade: string;
  themeDescArcade: string;
  themeNameEmerald: string;
  themeDescEmerald: string;

  fontFamily: string;
  elementColors: string;
  bgColor: string;
  surfaceColor: string;
  userBubbleColor: string;
  aiBubbleColor: string;
  accentColor: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  codeBgColor: string;
  rainbowIntensity: string;
}

export const translations: Record<Language, TranslationStrings> = {
  en: {
    appTitle: 'Ask the Manual RAG',
    appSubtitle: 'Interactive Document Assistant & Terminal Runner',
    newChat: 'New Chat',
    terminal: 'Terminal',
    openTerminal: 'Open Terminal',
    closeTerminal: 'Close Terminal',
    themeCustomizer: 'Themes & Customizer',
    themes: 'Themes',
    fonts: 'Typography',
    colorPalette: 'Full RGB Palette',
    language: 'Language',
    resetDefaults: 'Reset to Defaults',
    saveChanges: 'Save Changes',

    welcomeTitle: 'Chat With Your Document',
    welcomeSubtitle: 'Upload manuals, specs, or code files to extract precise answers instantly.',
    apiKeySelected: 'API Key Active',
    selectApiKey: 'Select Gemini API Key to Begin',
    dragDropText: 'Drag & drop your PDF, .txt, .md, or code files here',
    browseFiles: 'Browse Files',
    selectedFiles: 'Selected Files',
    uploadAndChat: 'Upload & Start RAG Chat',
    orDivider: 'OR CHOOSE PRESET',
    tryExample: 'Try a pre-indexed example manual:',
    sampleCarManual: 'Hyundai i10 Manual (562 pages, PDF)',
    sampleWasherManual: 'LG Washer Manual (36 pages, PDF)',

    chatWith: 'Chat with',
    askPlaceholder: 'Ask a question about your documents, code, or manuals...',
    send: 'Send',
    sources: 'Sources',
    sourceText: 'Source Document Chunk',
    close: 'Close',
    trySuggestion: 'Try',
    translating: 'Translating...',
    translateMessage: 'Translate to',
    translatedTo: 'Translated to',
    showOriginal: 'Show Original',

    copyCode: 'Copy',
    copied: 'Copied!',
    saveToProject: 'Save to Project',
    savingFile: 'Saving...',
    savedFile: 'Saved to project disk!',
    saveFailed: 'Save failed',
    runInTerminal: 'Run in Terminal',
    executing: 'Running...',
    languageLabel: 'Lang',
    fileLabel: 'File',
    linesLabel: 'lines',

    terminalTitle: 'Terminal & Command Runner',
    terminalSubtitle: 'Interactive shell with sequential line-by-line execution',
    sequentialExecutionNotice: 'Multi-line commands are executed sequentially line by line after previous finishes.',
    clearTerminal: 'Clear',
    copyLogs: 'Copy Logs',
    stopExecution: 'Stop Queue',
    runCommandPrompt: 'Enter command (e.g. ls -la, git status, echo "hello")...',
    readyForCommands: 'Terminal ready. Type a command or click "Run in Terminal" on any code block.',
    runningLine: 'Executing line',
    commandCompleted: 'Completed successfully',
    commandFailed: 'Command finished with error',
    duration: 'Duration',
    exitCode: 'Exit code',

    themeNameCyber: 'Cyberpunk Neon Prism',
    themeDescCyber: 'Ultra-dark obsidian matrix with vibrant razor-neon rainbow accents',
    themeNameSunset: 'Sunset Horizon Prism',
    themeDescSunset: 'Warm twilight violet with radiant fiery sunset rainbow spectrum',
    themeNameOcean: 'Deep Ocean Aurora',
    themeDescOcean: 'Abyssal navy with bioluminescent marine rainbow undertones',
    themeNamePastel: 'Pastel Dream Rainbow',
    themeDescPastel: 'Frosted ivory canvas with vivid soft candy rainbow accents',
    themeNameMonokai: 'Monokai Pro Matrix',
    themeDescMonokai: 'Classic dark hacker workspace with high-contrast rainbow syntax',
    themeNameCosmic: 'Cosmic Starlight',
    themeDescCosmic: 'Deep nebula violet with celestial starry rainbow luminescence',
    themeNameArcade: 'Retro 80s Synthwave',
    themeDescArcade: 'Pitch-black retro arcade with laser magenta, cyan, and gold prism',
    themeNameEmerald: 'Emerald Garden Canopy',
    themeDescEmerald: 'Deep botanical emerald forest with organic prism floral spectrum',

    fontFamily: 'Font Family',
    elementColors: 'Element RGB Color Customizer',
    bgColor: 'App Background',
    surfaceColor: 'Card / Surface Background',
    userBubbleColor: 'User Message Bubble',
    aiBubbleColor: 'AI Message Bubble',
    accentColor: 'Primary Accent Color',
    textPrimaryColor: 'Primary Text Color',
    textSecondaryColor: 'Secondary Text Color',
    codeBgColor: 'Code Block Background',
    rainbowIntensity: 'Rainbow Spectrum Intensity',
  },

  ru: {
    appTitle: 'RAG Руководство и Чат',
    appSubtitle: 'Интерактивный помощник по документам и терминал',
    newChat: 'Новый чат',
    terminal: 'Терминал',
    openTerminal: 'Открыть терминал',
    closeTerminal: 'Закрыть терминал',
    themeCustomizer: 'Темы и Настройки',
    themes: 'Цветовые темы',
    fonts: 'Шрифты',
    colorPalette: 'Полная RGB палитра',
    language: 'Язык (Language)',
    resetDefaults: 'Сбросить по умолчанию',
    saveChanges: 'Сохранить изменения',

    welcomeTitle: 'Общайтесь с вашим документом',
    welcomeSubtitle: 'Загрузите руководство, спецификацию или файлы кода для получения мгновенных и точных ответов.',
    apiKeySelected: 'API ключ активен',
    selectApiKey: 'Выберите API ключ Gemini для начала',
    dragDropText: 'Перетащите PDF, .txt, .md или файлы кода сюда',
    browseFiles: 'Выбрать файлы',
    selectedFiles: 'Выбранные файлы',
    uploadAndChat: 'Загрузить и начать чат RAG',
    orDivider: 'ИЛИ ВЫБЕРИТЕ ПРИМЕР',
    tryExample: 'Попробуйте готовый пример руководства:',
    sampleCarManual: 'Руководство Hyundai i10 (562 стр., PDF)',
    sampleWasherManual: 'Руководство LG Washer (36 стр., PDF)',

    chatWith: 'Чат с',
    askPlaceholder: 'Задайте вопрос по руководству, коду или документу...',
    send: 'Отправить',
    sources: 'Источники',
    sourceText: 'Фрагмент исходного документа',
    close: 'Закрыть',
    trySuggestion: 'Попробовать',
    translating: 'Перевод...',
    translateMessage: 'Перевести на',
    translatedTo: 'Переведено на',
    showOriginal: 'Показать оригинал',

    copyCode: 'Копировать',
    copied: 'Скопировано!',
    saveToProject: 'Сохранить в проект',
    savingFile: 'Сохранение...',
    savedFile: 'Успешно сохранено в проекте!',
    saveFailed: 'Ошибка сохранения',
    runInTerminal: 'Выполнить в терминале',
    executing: 'Выполняется...',
    languageLabel: 'Язык',
    fileLabel: 'Файл',
    linesLabel: 'строк',

    terminalTitle: 'Терминал и выполнение команд',
    terminalSubtitle: 'Интерактивная оболочка с последовательным построчным выполнением',
    sequentialExecutionNotice: 'Многострочные команды выполняются строго построчно: каждая строка запускается после завершения предыдущей.',
    clearTerminal: 'Очистить',
    copyLogs: 'Копировать вывод',
    stopExecution: 'Остановить очередь',
    runCommandPrompt: 'Введите команду (напр., ls -la, git status, echo "привет")...',
    readyForCommands: 'Терминал готов. Введите команду или нажмите кнопку "Выполнить" в блоке кода.',
    runningLine: 'Выполнение строки',
    commandCompleted: 'Успешно завершено',
    commandFailed: 'Команда завершилась с ошибкой',
    duration: 'Время',
    exitCode: 'Код выхода',

    themeNameCyber: 'Киберпанк Неон Радуга',
    themeDescCyber: 'Сверхтемный обсидиан с яркими неоновыми оттенками всех цветов радуги',
    themeNameSunset: 'Закатная Призма Радуги',
    themeDescSunset: 'Теплый сумеречный фиолетовый с богатым градиентом закатной радуги',
    themeNameOcean: 'Аврора Глубокого Океана',
    themeDescOcean: 'Бездненный морской синий с биолюминесцентными радужными акцентами',
    themeNamePastel: 'Пастельная Мечта Радуга',
    themeDescPastel: 'Светлый матовый фон со сладкими пастельными радужными акцентами',
    themeNameMonokai: 'Монокай Вивид Матрица',
    themeDescMonokai: 'Классическое хакерское рабочее пространство с яркой радужной подсветкой кода',
    themeNameCosmic: 'Космический Звездный Свет',
    themeDescCosmic: 'Глубокий туманный фиолетовый с мерцающей галактической радугой',
    themeNameArcade: 'Ретро Синтвейв 80-х',
    themeDescArcade: 'Глубокий аркадный фон с лазерным неоном, маджентой, цианом и радужным золотом',
    themeNameEmerald: 'Изумрудный Сад Призмы',
    themeDescEmerald: 'Густой изумрудный лес с ботанической радужной палитрой',

    fontFamily: 'Семейство шрифтов',
    elementColors: 'Настройка цветов любых элементов (RGB)',
    bgColor: 'Фон приложения',
    surfaceColor: 'Фон карточек и панелей',
    userBubbleColor: 'Сообщение пользователя',
    aiBubbleColor: 'Сообщение модели / ИИ',
    accentColor: 'Основной акцентный цвет',
    textPrimaryColor: 'Основной цвет текста',
    textSecondaryColor: 'Вторичный цвет текста',
    codeBgColor: 'Фон блоков с кодом',
    rainbowIntensity: 'Интенсивность радужного спектра',
  },

  de: {
    appTitle: 'Handbuch RAG Assistent',
    appSubtitle: 'Interaktiver Dokumenten-Assistent & Terminal-Runner',
    newChat: 'Neuer Chat',
    terminal: 'Terminal',
    openTerminal: 'Terminal öffnen',
    closeTerminal: 'Terminal schließen',
    themeCustomizer: 'Themen & Anpassung',
    themes: 'Farbthemen',
    fonts: 'Schriftarten',
    colorPalette: 'Volle RGB-Palette',
    language: 'Sprache (Language)',
    resetDefaults: 'Auf Standard zurücksetzen',
    saveChanges: 'Änderungen speichern',

    welcomeTitle: 'Chatten Sie mit Ihrem Dokument',
    welcomeSubtitle: 'Laden Sie Handbücher, Datenblätter oder Code hoch, um präzise Antworten zu erhalten.',
    apiKeySelected: 'API-Schlüssel aktiv',
    selectApiKey: 'Gemini API-Schlüssel auswählen, um zu beginnen',
    dragDropText: 'PDF-, .txt-, .md- oder Codedateien hierher ziehen & ablegen',
    browseFiles: 'Dateien durchsuchen',
    selectedFiles: 'Ausgewählte Dateien',
    uploadAndChat: 'Hochladen & RAG-Chat starten',
    orDivider: 'ODER BEISPIEL WÄHLEN',
    tryExample: 'Testen Sie ein vorindiziertes Beispielhandbuch:',
    sampleCarManual: 'Hyundai i10 Handbuch (562 Seiten, PDF)',
    sampleWasherManual: 'LG Waschmaschinen-Handbuch (36 Seiten, PDF)',

    chatWith: 'Chat mit',
    askPlaceholder: 'Stellen Sie eine Frage zu Handbüchern, Code oder Dokumenten...',
    send: 'Senden',
    sources: 'Quellen',
    sourceText: 'Quelldokument-Auszug',
    close: 'Schließen',
    trySuggestion: 'Vorschlag',
    translating: 'Übersetzen...',
    translateMessage: 'Übersetzen nach',
    translatedTo: 'Übersetzt nach',
    showOriginal: 'Original anzeigen',

    copyCode: 'Kopieren',
    copied: 'Kopiert!',
    saveToProject: 'Im Projekt speichern',
    savingFile: 'Speichern...',
    savedFile: 'Erfolgreich im Projekt gespeichert!',
    saveFailed: 'Speichern fehlgeschlagen',
    runInTerminal: 'Im Terminal ausführen',
    executing: 'Ausführen...',
    languageLabel: 'Sprache',
    fileLabel: 'Datei',
    linesLabel: 'Zeilen',

    terminalTitle: 'Terminal & Befehlsausführung',
    terminalSubtitle: 'Interaktive Konsole mit sequentieller Zeilen-für-Zeilen Ausführung',
    sequentialExecutionNotice: 'Mehrzeilige Befehle werden nacheinander ausgeführt: Jede Zeile startet erst nach Abschluss der vorherigen.',
    clearTerminal: 'Löschen',
    copyLogs: 'Ausgabe kopieren',
    stopExecution: 'Warteschlange stoppen',
    runCommandPrompt: 'Befehl eingeben (z. B. ls -la, git status, echo "hallo")...',
    readyForCommands: 'Terminal bereit. Geben Sie einen Befehl ein oder klicken Sie im Codeblock auf "Im Terminal ausführen".',
    runningLine: 'Zeile wird ausgeführt',
    commandCompleted: 'Erfolgreich abgeschlossen',
    commandFailed: 'Befehl mit Fehler beendet',
    duration: 'Dauer',
    exitCode: 'Exit-Code',

    themeNameCyber: 'Cyberpunk Neon Regenbogen',
    themeDescCyber: 'Ultra-dunkles Obsidian mit leuchtenden Neon-Regenbogen-Akzenten',
    themeNameSunset: 'Sonnenuntergang Prisma',
    themeDescSunset: 'Warmes Dämmerungsviolett mit feurigem Regenbogenspektrum',
    themeNameOcean: 'Tiefsee Aurora Regenbogen',
    themeDescOcean: 'Tiefes Ozeanblau mit biolumineszenten Meeres-Regenbogenfarben',
    themeNamePastel: 'Pastelltraum Regenbogen',
    themeDescPastel: 'Helle Mattfläche mit samtigen Bonbon-Regenbogen-Farben',
    themeNameMonokai: 'Monokai Pro Matrix',
    themeDescMonokai: 'Klassische Hacker-Umgebung mit kontrastreicher Regenbogen-Syntax',
    themeNameCosmic: 'Kosmischer Sternenglanz',
    themeDescCosmic: 'Tiefes Nebelviolett mit funkelndem Sternen-Regenbogen',
    themeNameArcade: 'Retro 80er Synthwave',
    themeDescArcade: 'Reines Retro-Arcade-Schwarz mit Laser-Magenta, Cyan und Gold-Prisma',
    themeNameEmerald: 'Smaragdwald Prisma',
    themeDescEmerald: 'Dichter tropischer Wald mit botanischem Regenbogenspektrum',

    fontFamily: 'Schriftfamilie',
    elementColors: 'Elementfarben anpassen (Volle RGB-Palette)',
    bgColor: 'App-Hintergrund',
    surfaceColor: 'Karten- / Paneel-Hintergrund',
    userBubbleColor: 'Benutzer-Nachrichtenblase',
    aiBubbleColor: 'KI-Nachrichtenblase',
    accentColor: 'Primäre Akzentfarbe',
    textPrimaryColor: 'Primäre Textfarbe',
    textSecondaryColor: 'Sekundäre Textfarbe',
    codeBgColor: 'Codeblock-Hintergrund',
    rainbowIntensity: 'Regenbogenspektrum-Intensität',
  },
};
