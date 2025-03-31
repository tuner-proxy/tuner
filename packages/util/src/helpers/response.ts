import type http from 'node:http';

import type {
  HTTPResponse,
  HTTPRequest,
  HTTPResponseOptions,
  Awaitable,
} from '@tuner-proxy/core';
import { httpHandler } from '@tuner-proxy/core';

export type TransformResponseHandler = (
  res: HTTPResponse,
  req: HTTPRequest,
) => Awaitable<HTTPResponseOptions | HTTPResponse | void>;

/**
 * Transform response object
 */
export const transformRes = (handler: TransformResponseHandler) =>
  httpHandler(async (req, next) => {
    await next();
    if (!req.response) {
      return;
    }
    const res = await handler(req.response, req);
    req.response = res || undefined;
  });

/**
 * Extend response headers
 */
export const resHeaders = (headers: http.OutgoingHttpHeaders) =>
  transformRes((res) => {
    Object.assign(res.headers, headers);
    return res;
  });

/**
 * Add CORS headers for response
 */
export const cors = () =>
  transformRes(async (res, req) => {
    res.headers['access-control-allow-credentials'] = 'true';
    res.headers['access-control-max-age'] = '86400';
    if (req.headers.origin) {
      res.headers['access-control-allow-origin'] = req.headers.origin;
    }
    if (req.headers['access-control-request-method']) {
      res.headers['access-control-allow-methods'] =
        req.headers['access-control-request-method'];
    }
    if (req.headers['access-control-request-headers']) {
      res.headers['access-control-allow-headers'] =
        req.headers['access-control-request-headers'];
    }
    return res;
  });
