/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
import { GoogleGenAI } from '@google/genai';
import * as ragEngine from './ragEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY or API_KEY environment variable is required on the server.');
  }
  return key;
}

const MODEL_UPGRADES: Record<string, string> = {
  "gemini-2.5-flash": "gemini-3-flash-preview",
  "gemini-2.5-pro": "gemini-3.1-pro-preview",
  "gemini-2.5-pro-exp-03-25": "gemini-3.1-pro-preview",
  "gemini-3-pro-preview": "gemini-3.1-pro-preview",
  "gemini-2.0-flash": "gemini-3-flash-preview",
  "gemini-2.0-flash-exp": "gemini-3-flash-preview",
  "gemini-2.0-flash-preview-image-generation": "gemini-2.5-flash-image",
};

function resolveModel(model?: string): string {
  if (!model) return "gemini-3-flash-preview";
  return MODEL_UPGRADES[model] || model;
}

function getAI(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: getApiKey() });
}

function serializeResponse(response: any) {
  return {
    text: response?.text ?? '',
    candidates: response?.candidates ?? [],
    functionCalls: response?.functionCalls ?? undefined,
    groundingMetadata: response?.candidates?.[0]?.groundingMetadata ?? undefined,
    usageMetadata: response?.usageMetadata ?? undefined,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', hasKey: Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY) });
  });

  app.get('/api/models', async (_req, res) => {
    try {
      const apiKey = getApiKey();
      const upstream = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
        {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
        }
      );
      if (!upstream.ok) {
        return res.status(upstream.status).json({ error: upstream.statusText });
      }
      const data = await upstream.json();
      res.json(data);
    } catch (error: any) {
      console.error('Error in /api/models:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/generate-content', async (req, res) => {
    try {
      const ai = getAI();
      const { model: rawModel, contents, config } = req.body;
      const response = await ai.models.generateContent({ model: resolveModel(rawModel), contents, config });
      res.json(serializeResponse(response));
    } catch (error: any) {
      console.error('Error in /api/generate-content:', error);
      res.status(error?.status || 500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/generate-content-stream', async (req, res) => {
    try {
      const ai = getAI();
      const { model: rawModel, contents, config } = req.body;
      const responseStream = await ai.models.generateContentStream({ model: resolveModel(rawModel), contents, config });

      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache');

      for await (const chunk of responseStream) {
        res.write(JSON.stringify(serializeResponse(chunk)) + '\n');
      }
      res.end();
    } catch (error: any) {
      console.error('Error in /api/generate-content-stream:', error);
      if (!res.headersSent) {
        res.status(error?.status || 500).json({ error: error.message || String(error) });
      } else {
        res.write(JSON.stringify({ error: error.message || String(error) }) + '\n');
        res.end();
      }
    }
  });

  app.post('/api/generate-images', async (req, res) => {
    try {
      const ai = getAI();
      const { model, prompt, config } = req.body;
      const response = await ai.models.generateImages({ model: resolveModel(model), prompt, config });
      res.json(response);
    } catch (error: any) {
      console.error('Error in /api/generate-images:', error);
      res.status(error?.status || 500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/generate-videos', async (req, res) => {
    try {
      const ai = getAI();
      const { model, prompt, image, video, config } = req.body;
      const operation = await ai.models.generateVideos({ model, prompt, image, video, config });
      res.json({
        name: operation.name,
        done: operation.done,
        error: operation.error,
        response: operation.response,
        metadata: operation.metadata,
      });
    } catch (error: any) {
      console.error('Error in /api/generate-videos:', error);
      res.status(error?.status || 500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/videos-operation', async (req, res) => {
    try {
      const ai = getAI();
      const { name, operation: opInput } = req.body;
      const operation = await ai.operations.getVideosOperation({
        operation: opInput || ({ name } as any),
      });
      const serialized: any = {
        name: operation.name,
        done: operation.done,
        error: operation.error,
        metadata: operation.metadata,
        response: operation.response ? JSON.parse(JSON.stringify(operation.response)) : undefined,
      };
      if (serialized.response?.generatedVideos) {
        for (const v of serialized.response.generatedVideos) {
          if (v?.video?.uri && !v.video.uri.startsWith('/api/')) {
            const b64 = Buffer.from(v.video.uri, 'utf-8').toString('base64');
            v.video.uri = `/api/video-download?b64=${encodeURIComponent(b64)}`;
          }
        }
      }
      res.json(serialized);
    } catch (error: any) {
      console.error('Error in /api/videos-operation:', error);
      res.status(error?.status || 500).json({ error: error.message || String(error) });
    }
  });

  app.get('/api/video-download', async (req, res) => {
    try {
      const b64 = String(req.query.b64 || '');
      const rawUri = b64 ? Buffer.from(b64, 'base64').toString('utf-8') : String(req.query.uri || '');
      if (!rawUri || !rawUri.startsWith('https://')) {
        return res.status(400).json({ error: 'Invalid video URI' });
      }
      const cleanUri = rawUri.replace(/([?&])key=[^&]*/g, '');
      const apiKey = getApiKey();
      const upstream = await fetch(cleanUri, {
        headers: { 'x-goog-api-key': apiKey },
      });
      if (!upstream.ok) {
        return res.status(upstream.status).send(await upstream.text());
      }
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'video/mp4');
      const arrayBuffer = await upstream.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error('Error in /api/video-download:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/rag-create', async (req, res) => {
    try {
      const store = await ragEngine.createRagStore(req.body?.displayName || req.body?.config?.displayName || 'RAG Store');
      res.json(store);
    } catch (error: any) {
      console.error('Error in /api/rag-create:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/rag-upload', async (req, res) => {
    try {
      const { fileSearchStoreName, fileName, mimeType, base64Data } = req.body;
      const result = await ragEngine.uploadToRagStore(fileSearchStoreName, {
        name: fileName || 'document',
        type: mimeType,
        base64Data,
      });
      res.json({ done: true, name: result.documentName });
    } catch (error: any) {
      console.error('Error in /api/rag-upload:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/rag-delete', async (req, res) => {
    try {
      await ragEngine.deleteRagStore(req.body?.name);
      res.json({});
    } catch (error: any) {
      console.error('Error in /api/rag-delete:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/rag-stores-list', async (_req, res) => {
    try {
      const stores = await ragEngine.listRagStores();
      res.json({ stores });
    } catch (error: any) {
      console.error('Error in /api/rag-stores-list:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/rag-store-get', async (req, res) => {
    try {
      const store = ragEngine.getRagStore(req.body?.name);
      res.json(store ?? {});
    } catch (error: any) {
      console.error('Error in /api/rag-store-get:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/documents-list', async (req, res) => {
    try {
      const docs = await ragEngine.listDocuments(req.body?.parent);
      res.json({ documents: docs });
    } catch (error: any) {
      console.error('Error in /api/documents-list:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/document-delete', async (req, res) => {
    try {
      await ragEngine.deleteDocument(req.body?.storeName, req.body?.name);
      res.json({});
    } catch (error: any) {
      console.error('Error in /api/document-delete:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/operation-get', async (req, res) => {
    try {
      const ai = getAI();
      const { operation } = req.body;
      const op = await ai.operations.get({ operation });
      res.json(JSON.parse(JSON.stringify(op ?? {})));
    } catch (error: any) {
      console.error('Error in /api/operation-get:', error);
      res.status(error?.status || 500).json({ error: error.message || String(error) });
    }
  });

  app.get('/api/provider-config', (_req, res) => {
    res.json(ragEngine.getProviderConfig());
  });

  app.post('/api/provider-config', (req, res) => {
    ragEngine.setProviderConfig(req.body || {});
    res.json({ ok: true });
  });

  app.post('/api/provider-models', async (req, res) => {
    try {
      if (req.body) ragEngine.setProviderConfig(req.body);
      const models = await ragEngine.listModels();
      res.json({ models });
    } catch (error: any) {
      console.error('Error in /api/provider-models:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/provider-test', async (req, res) => {
    if (req.body) ragEngine.setProviderConfig(req.body);
    const result = await ragEngine.testProvider();
    res.status(result.ok ? 200 : 400).json(result);
  });

  app.post('/api/rag-query', async (req, res) => {
    try {
      const { storeName, message, language } = req.body;
      const result = await ragEngine.fileSearch(storeName, message, language || 'en');
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/rag-query:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/rag-query-stream', async (req, res) => {
    const { storeName, message, language } = req.body;
    try {
      const { top, context } = await ragEngine.retrieve(storeName, message);
      const messages = ragEngine.buildMessages(context, message, language || 'en');

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      for await (const delta of ragEngine.chatCompletionStream(messages)) {
        res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
      }
      const groundingChunks = top.map((c) => ({ retrievedContext: { text: c.text } }));
      res.write(`data: ${JSON.stringify({ groundingChunks, done: true })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error('Error in /api/rag-query-stream:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || String(error) });
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message || String(error) })}\n\n`);
        res.end();
      }
    }
  });

  app.post('/api/rag-example-questions', async (req, res) => {
    try {
      const questions = await ragEngine.generateExampleQuestions(
        req.body?.storeName,
        req.body?.language || 'en',
        req.body?.level || 0,
        Array.isArray(req.body?.previous) ? req.body.previous : []
      );
      res.json({ questions });
    } catch (error: any) {
      console.error('Error in /api/rag-example-questions:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const ai = getAI();
      const { model: rawModel, config, history, message } = req.body;
      const chat = ai.chats.create({ model: resolveModel(rawModel), config, history: history || [] });
      const msgPayload = typeof message === 'object' && message !== null && 'message' in message ? message.message : message;
      const response = await chat.sendMessage({ message: msgPayload });
      res.json({
        ...serializeResponse(response),
        history: await chat.getHistory(),
      });
    } catch (error: any) {
      console.error('Error in /api/chat:', error);
      res.status(error?.status || 500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/chat-stream', async (req, res) => {
    try {
      const ai = getAI();
      const { model: rawModel, config, history, message } = req.body;
      const chat = ai.chats.create({ model: resolveModel(rawModel), config, history: history || [] });
      const msgPayload = typeof message === 'object' && message !== null && 'message' in message ? message.message : message;
      const responseStream = await chat.sendMessageStream({ message: msgPayload });

      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache');

      for await (const chunk of responseStream) {
        res.write(JSON.stringify(serializeResponse(chunk)) + '\n');
      }
      res.end();
    } catch (error: any) {
      console.error('Error in /api/chat-stream:', error);
      if (!res.headersSent) {
        res.status(error?.status || 500).json({ error: error.message || String(error) });
      } else {
        res.write(JSON.stringify({ error: error.message || String(error) }) + '\n');
        res.end();
      }
    }
  });

  app.post('/api/terminal/run', async (req, res) => {
    try {
      const { command, cwd } = req.body;
      if (!command || typeof command !== 'string') {
        return res.status(400).json({ error: 'Command string is required' });
      }

      const sanitized = command.trim();
      const startTime = Date.now();
      const workDir = cwd ? path.resolve(__dirname, cwd) : __dirname;

      try {
        const { stdout, stderr } = await execAsync(sanitized, {
          cwd: workDir,
          timeout: 25000,
          maxBuffer: 1024 * 1024 * 5,
          env: { ...process.env, TERM: 'xterm-256color', PAGER: 'cat' },
        });
        const durationMs = Date.now() - startTime;
        res.json({
          stdout: stdout || '',
          stderr: stderr || '',
          exitCode: 0,
          durationMs,
        });
      } catch (execErr: any) {
        const durationMs = Date.now() - startTime;
        res.json({
          stdout: execErr.stdout || '',
          stderr: execErr.stderr || execErr.message || String(execErr),
          exitCode: typeof execErr.code === 'number' ? execErr.code : 1,
          durationMs,
        });
      }
    } catch (error: any) {
      console.error('Error in /api/terminal/run:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/save-file', async (req, res) => {
    try {
      const { filePath, content } = req.body;
      if (!filePath || typeof filePath !== 'string') {
        return res.status(400).json({ error: 'filePath is required' });
      }

      const normalized = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
      const fullPath = path.resolve(__dirname, normalized);

      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content ?? '', 'utf-8');
      res.json({
        success: true,
        savedPath: normalized,
        absolutePath: fullPath,
        size: Buffer.byteLength(content ?? '', 'utf-8'),
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error in /api/save-file:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
