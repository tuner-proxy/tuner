import {
  ConnectRequest,
  HTTPRequest,
  UpgradeRequest,
  connectHandler,
  defineRoute,
} from '@tuner-proxy/core';

import { requestHandler } from './request';

export const basicAuth = (
  verify: (auth?: string) => boolean | Promise<boolean>,
) =>
  defineRoute([
    connectHandler(async (req, next) => {
      if (await verify(req.headers['proxy-authorization'])) {
        return next();
      }
      return authRequired(req);
    }),
    requestHandler(async (req, next) => {
      if (req.encrypted || req.type === 'connect') {
        return next();
      }
      if (await verify(req.headers['proxy-authorization'])) {
        return next();
      }
      return authRequired(req);
    }),
  ]);

function authRequired(req: HTTPRequest | UpgradeRequest | ConnectRequest) {
  if (req.type === 'common') {
    req.respondWith({
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
