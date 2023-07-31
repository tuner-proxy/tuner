import { IncomingHttpHeaders } from 'http';
import { TLSSocket } from 'tls';

import { HTTPResponse, httpHandler, HTTPRequest } from '@tuner-proxy/core';

import { broadcast, broadcastData } from '../ctrl/server';
import { genUID, getRemoteInfo } from '../shared';

export function createRequestInterceptor() {
  function bindEvent(
    uid: string,
    target: HTTPRequest | HTTPResponse,
    chunkEventName: 'request-body-chunk' | 'response-body-chunk',
    endEventName: 'request-body-end' | 'response-body-end',
    errorEventName: 'request-error' | 'response-error',
  ) {
    target
      .stream({ encoding: null })
      .on('data', (chunk) => {
        broadcast(uid, { type: chunkEventName });
        broadcastData(chunk);
      })
      .once('end', () => {
        broadcast(uid, { type: endEventName });
      });
    target.raw?.on('error', (error) => {
      broadcast(uid, {
        type: errorEventName,
        error: {
          message: error.message,
          stack: error.stack,
        },
      });
    });
  }

  return httpHandler(async (req, next) => {
    const uid = genUID();

    broadcast(uid, {
      type: 'request-begin',
      remote: getRemoteInfo(req.raw.socket)!,
      encrypted: !!(req.raw.socket as TLSSocket).encrypted,
      method: req.raw.method!,
      url: req.raw.url!,
      headers: req.raw.rawHeaders,
    });

    bindEvent(
      uid,
      req,
      'request-body-chunk',
      'request-body-end',
      'request-error',
    );

    try {
      const res: HTTPResponse | undefined = await next();
      if (!res) {
        broadcast(uid, { type: 'request-accepted' });
        return res;
      }

      broadcast(uid, {
        type: 'response-begin',
        remote: getRemoteInfo(res.raw?.socket),
        statusCode: res.statusCode,
        headers: res.raw?.rawHeaders || flattenHeaders(res.headers),
        encrypted: !!(res.raw?.socket as TLSSocket | undefined)?.encrypted,
      });

      bindEvent(
        uid,
        res,
        'response-body-chunk',
        'response-body-end',
        'response-error',
      );

      return res;
    } catch (error: any) {
      broadcast(uid, {
        type: 'request-error',
        error: {
          message: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  });
}

function flattenHeaders(headers: IncomingHttpHeaders) {
  return Object.keys(headers).flatMap((key) => {
    const value = headers[key];
    if (value == null) {
      return [];
    }
    if (Array.isArray(value)) {
      return [key, value.join('; ')];
    }
    return [key, value];
  });
}
