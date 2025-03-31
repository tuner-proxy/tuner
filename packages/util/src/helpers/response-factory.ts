import { promises as fsp } from 'node:fs';
import http from 'node:http';
import path from 'node:path';

import type { HTTPResponseOptions } from '@tuner-proxy/core';
import {
  connectHandler,
  defineRoute,
  httpHandler,
  HTTPResponse,
  upgradeHandler,
} from '@tuner-proxy/core';
import mime from 'mime-types';

/**
 * Send HTTP response to all kinds of requests
 */
export const responseAll = (options: HTTPResponseOptions) =>
  defineRoute([
    (req) => {
      req.response = options;
    },
    responseConnect(options),
    responseUpgrade(options),
  ]);

/**
 * Send HTTP response to connect requests
 */
export const responseConnect = (options: HTTPResponseOptions) =>
  connectHandler(responseSocket(options));

/**
 * Send HTTP response to upgrade requests
 */
export const responseUpgrade = (options: HTTPResponseOptions) =>
  upgradeHandler(responseSocket(options));

/**
 * Respond with HTTP response
 */
export const response = (response: HTTPResponseOptions) =>
  httpHandler((req) => {
    req.response = response;
  });

/**
 * Respond with local file
 */
export const file = (path: string) =>
  httpHandler(async (req, next) => {
    try {
      req.response = {
        headers: {
          'content-type': mime.lookup(path) || 'application/octet-stream',
        },
        body: await fsp.readFile(path),
      };
    } catch {
      return next();
    }
  });

/**
 * Respond with files in directory
 */
export const fileIn = (basePath: string, fileName: string) =>
  httpHandler(async (req, next) => {
    if (path.normalize(fileName).startsWith('..')) {
      req.response = { status: 403 };
      return;
    }
    return next([file(path.join(basePath, fileName))]);
  });

/**
 * Respond with html content
 */
export const html = (html: string | Buffer) =>
  httpHandler((req) => {
    req.response = {
      headers: {
        'content-type': 'text/html',
      },
      body: html,
    };
  });

/**
 * Respond with json content
 */
export const json = (json: any) =>
  httpHandler((req) => {
    req.response = {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(json),
    };
  });

/**
 * Redirect HTTP to HTTPS
 */
export const ensecure = () =>
  httpHandler((req, next) => {
    if (req.encrypted) {
      return next();
    }
    req.response = {
      status: 302,
      headers: {
        Location: req.href.replace(/^http:/, 'https:'),
      },
    };
  });

function responseSocket(options: HTTPResponseOptions) {
  return (req: any) => {
    const res = HTTPResponse.from(options);
    const statusMsg = http.STATUS_CODES[res.statusCode] || '';
    let head = '';
    head += `HTTP/1.1 ${res.statusCode} ${statusMsg}\r\n`;
    for (const key of Object.keys(res.headers)) {
      const value = res.headers[key];
      if (value == null) {
        continue;
      }
      let normalized = value;
      if (Array.isArray(value)) {
        normalized = value.join('; ');
      }
      head += `${key}: ${normalized}\r\n`;
    }
    req.socket.write(`${head}\r\n`);
    res.stream({ consume: true }).pipe(req.socket);
  };
}
