import type http from 'node:http';

import type { RequestProcessFn, TunerRequest } from '@tuner-proxy/core';
import { defineRoute, upgradeHandler, connectHandler } from '@tuner-proxy/core';

export type CommonRequestHandlerFn = RequestProcessFn<TunerRequest>;

/**
 * Define request handler for all kinds of requests
 */
export const requestHandler = (handler: CommonRequestHandlerFn) =>
  defineRoute([handler, connectHandler(handler), upgradeHandler(handler)]);

/**
 * Set request host
 */
export const host = (host: string) =>
  requestHandler((req, next) => {
    req.host = host;
    return next();
  });

/**
 * Set request hostname
 */
export const hostname = (hostname: string) =>
  requestHandler((req, next) => {
    req.hostname = hostname;
    return next();
  });

/**
 * Extend request headers
 */
export const reqHeaders = (headers: http.OutgoingHttpHeaders) =>
  requestHandler((req, next) => {
    Object.assign(req.headers, headers);
    return next();
  });

/**
 * Switch between HTTP / HTTPS
 */
export const secure = (encrypted = true) =>
  requestHandler((req, next) => {
    if (req.encrypted === encrypted) {
      return next();
    }
    if (req.encrypted && req.port === 443) {
      req.port = 80;
    } else if (!req.encrypted && req.port === 80) {
      req.port = 443;
    }
    req.encrypted = encrypted;
    return next();
  });
