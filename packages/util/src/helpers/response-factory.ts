import { promises as fsp } from 'fs';
import http from 'http';
import path from 'path';

import {
  connectHandler,
  defineRoute,
  httpHandler,
  HTTPProcessFn,
  HTTPResponse,
  HTTPResponseOptions,
  upgradeHandler,
} from '@tuner-proxy/core';
import mime from 'mime-types';

/**
 * Send HTTP response to all kinds of requests
 */
export const responseAll = (options: HTTPResponseOptions) =>
  defineRoute([
    () => options,
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
 * Response with local file
 */
export const file = (path: string) =>
  httpHandler(async (req, next) => {
    try {
      return {
        headers: {
          'content-type': mime.lookup(path) || 'application/octet-stream',
        },
        body: await fsp.readFile(path),
      };
    } catch (error) {
      return next();
    }
  });

/**
 * Response with local file within directory
 */
export const fileIn =
  (basePath: string, fileName: string): HTTPProcessFn =>
  () => {
    if (path.normalize(fileName).startsWith('..')) {
      return { status: 403 };
    }
    return file(path.join(basePath, fileName));
  };

/**
 * Response with html content
 */
export const html =
  (html: string | Buffer): HTTPProcessFn =>
  () => ({
    headers: {
      'content-type': 'text/html',
    },
    body: html,
  });

/**
 * Response with json content
 */
export const json =
  (json: any): HTTPProcessFn =>
  () => ({
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(json),
  });

/**
 * Redirect HTTP request to HTTPS
 */
export const ensecure = (): HTTPProcessFn => (req, next) => {
  if (req.encrypted) {
    return next();
  }
  return {
    status: 302,
    headers: {
      Location: req.href.replace(/^http:/, 'https:'),
    },
  };
};

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
