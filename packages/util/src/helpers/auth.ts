import type {
  ConnectRequest,
  HTTPRequest,
  UpgradeRequest,
} from '@tuner-proxy/core';
import { connectHandler, defineRoutes } from '@tuner-proxy/core';

import { requestHandler } from './request';

export const basicAuth = (
  verify: (auth?: string) => boolean | Promise<boolean>,
) =>
  defineRoutes([
    connectHandler(async (req, next) => {
      if (await verify(req.headers['proxy-authorization'])) {
        return next();
      }
      authRequired(req);
    }),
    requestHandler(async (req, next) => {
      if (req.encrypted || req.type === 'connect') {
        return next();
      }
      if (await verify(req.raw.headers['proxy-authorization'])) {
        return next();
      }
      authRequired(req);
    }),
  ]);

function authRequired(req: HTTPRequest | UpgradeRequest | ConnectRequest) {
  if (req.type === 'common') {
    req.sendResponse({
      status: 407,
      headers: { 'Proxy-Authenticate': 'Basic' },
    });
    return;
  }
  if (req.type === 'connect') {
    req.responseHeaderSent = true;
  }
  req.socket.write('HTTP/1.1 407 Proxy Authentication Required\r\n');
  req.socket.write('Proxy-Authenticate: Basic\r\n');
  req.socket.write('\r\n');
  req.socket.resume();
}
