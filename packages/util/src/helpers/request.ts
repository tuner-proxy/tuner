import http from 'http';

import {
  HTTPResponse,
  ConnectResult,
  defineRoute,
  HTTPRequest,
  NextFn,
  upgradeHandler,
  UpgradeRequest,
  connectHandler,
  ConnectRequest,
} from '@tuner-proxy/core';

export type RequestHandler = (
  req: HTTPRequest | ConnectRequest | UpgradeRequest,
  next: NextFn<HTTPResponse | ConnectResult>,
) => any;

/**
 * Define request handler for both normal and upgrade request
 */
export const requestHandler = (handler: RequestHandler) =>
  defineRoute([handler, connectHandler(handler), upgradeHandler(handler)]);

/**
 * Set request's host
 */
export const host = (host: string) =>
  requestHandler((req, next) => {
    req.host = host;
    return next();
  });

/**
 * Set request's hostname
 */
export const hostname = (hostname: string) =>
  requestHandler((req, next) => {
    req.hostname = hostname;
    return next();
  });

/**
 * Set headers for request
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
