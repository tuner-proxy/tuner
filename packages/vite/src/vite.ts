import EventEmitter from 'events';
import fs from 'fs';
import * as http from 'http';
import path from 'path';

import { defineRoute, httpHandler, upgradeHandler } from '@tuner-proxy/core';
import { file } from '@tuner-proxy/util';
import { ViteDevServer } from 'vite';

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
  return defineRoute([
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
  return httpHandler((req) => {
    if (req.pathname === '/') {
      return file(path.join(basepath, 'index.html'));
    }
    const targetPath = path.join(basepath, req.pathname.slice(1));
    if (path.relative(basepath, targetPath).startsWith('..')) {
      return { statusCode: 404 };
    }
    return file(targetPath);
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
