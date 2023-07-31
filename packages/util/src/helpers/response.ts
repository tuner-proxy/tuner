import http from 'http';

import { HTTPResponse, httpHandler, HTTPRequest } from '@tuner-proxy/core';

export type TransformResponseHandler = (
  res: HTTPResponse,
  req: HTTPRequest,
) => any;

/**
 * Transform response object
 */
export const transformRes = (handler: TransformResponseHandler) =>
  httpHandler(async (req, next) => {
    const res = await next();
    if (!res) {
      return res;
    }
    return handler(res, req);
  });

/**
 * Set headers for response
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
