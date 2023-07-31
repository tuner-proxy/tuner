import path from 'path';

import { defineRoute, httpHandler, HTTPResponse } from '@tuner-proxy/core';
import { decrypt, ensecure, fileIn, responseAll } from '@tuner-proxy/util';
import { vite } from '@tuner-proxy/vite';

import { composeApis } from './compose-apis';
import { uiMessage } from './server';

const monacoEditorPath = path.dirname(
  require.resolve('monaco-editor/package.json'),
);

export function uiClient() {
  return defineRoute([
    decrypt(),
    ensecure(),

    '/__tuner_ui',
    uiMessage(),

    '/@tuner',
    [
      '/::path',
      forceCache(),

      '/api/compose',
      composeApis(),

      '/vs/::path',
      (req) => fileIn(path.join(monacoEditorPath, 'min/vs'), req.params.path),
    ],

    vite(path.join(__dirname, '../../frontend')),

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
