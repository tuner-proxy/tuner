import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineRoutes, httpHandler } from '@tuner-proxy/core';
import { decode, ensecure, responseAll } from '@tuner-proxy/util';
import { vite } from '@tuner-proxy/vite';

import { composeApis } from './compose-apis';
import { uiMessage } from './server';

const frontendPath = dirname(
  fileURLToPath(import.meta.resolve('../frontend/vite.config.ts')),
);

export function uiClient() {
  return defineRoutes([
    decode(),
    ensecure(),

    '/__tuner_ui',
    uiMessage(),

    '/@tuner',
    ['/::path', forceCache(), '/api/compose', composeApis()],

    vite(frontendPath),

    '/::path',
    responseAll({ status: 404 }),
  ]);
}

const forceCache = () =>
  httpHandler(async (req, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    if (req.headers['if-modified-since']) {
      req.response = { status: 304 };
      return;
    }
    await next();
    const res = req.response;
    if (!res) {
      return;
    }
    res.headers['last-modified'] = (new Date() as any).toGMTString();
    res.headers['cache-control'] = 'max-age=604800';
  });
