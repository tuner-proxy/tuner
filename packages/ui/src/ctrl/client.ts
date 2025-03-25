import { fileURLToPath } from 'node:url';

import type { HTTPResponse } from '@tuner-proxy/core';
import { defineRoute, httpHandler } from '@tuner-proxy/core';
import { decode, ensecure, responseAll } from '@tuner-proxy/util';
import { vite } from '@tuner-proxy/vite';

import { composeApis } from './compose-apis';
import { uiMessage } from './server';

const frontendPath = fileURLToPath(import.meta.resolve('../frontend'));

export function uiClient() {
  return defineRoute([
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
      return { status: 304 };
    }
    const res: HTTPResponse | undefined = await next();
    if (!res) {
      return;
    }
    res.headers['last-modified'] = (new Date() as any).toGMTString();
    res.headers['cache-control'] = 'max-age=604800';
    return res;
  });
