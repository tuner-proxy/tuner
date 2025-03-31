import EventEmitter from 'node:events';
import fs from 'node:fs';
import type http from 'node:http';
import path from 'node:path';

import { defineRoutes, httpHandler, upgradeHandler } from '@tuner-proxy/core';
import { file } from '@tuner-proxy/util';
import type { ViteDevServer } from 'vite';

const devServerMap = new Map<
  string,
  Promise<{ vite: ViteDevServer; ws: EventEmitter }>
>();

export function getViteRoute(vitePath: string) {
  return fs.existsSync(path.join(vitePath, 'src'))
    ? getDevViteRoute(vitePath)
    : getProdViteRoute(vitePath);
}

function getDevViteRoute(vitePath: string) {
  if (!devServerMap.has(vitePath)) {
    devServerMap.set(vitePath, createViteDevServer(vitePath));
  }
  return defineRoutes([
    async (req) => {
      const server = await devServerMap.get(vitePath)!;
      server.vite.middlewares(
        req.raw as http.IncomingMessage,
        req.res as http.ServerResponse,
      );
    },

    '/',
    upgradeHandler(async (req, next) => {
      const server = await devServerMap.get(vitePath)!;
      if (req.headers['sec-websocket-protocol'] !== 'vite-hmr') {
        return next();
      }
      server.ws.emit('upgrade', req.raw, req.socket, req.head);
    }),
  ]);
}

function getProdViteRoute(vitePath: string) {
  const basepath = path.join(vitePath, 'dist');
  return httpHandler((req, next) => {
    if (req.pathname === '/') {
      return next([file(path.join(basepath, 'index.html'))]);
    }
    const targetPath = path.join(basepath, req.pathname.slice(1));
    if (path.relative(basepath, targetPath).startsWith('..')) {
      req.response = { statusCode: 404 };
      return;
    }
    return next([file(targetPath)]);
  });
}

async function createViteDevServer(vitePath: string) {
  const { createServer } = await import('vite');

  const ws: any = new EventEmitter();

  const vite = await createServer({
    root: vitePath,
    server: {
      middlewareMode: true,
      hmr: { server: ws },
    },
  });

  return { vite, ws };
}
