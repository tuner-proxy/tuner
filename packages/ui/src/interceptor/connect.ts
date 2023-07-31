import { connectHandler } from '@tuner-proxy/core';

import { broadcast } from '../ctrl/server';
import { genUID, getRemoteInfo } from '../shared';

export function createConnectInterceptor() {
  return connectHandler(async (req, next) => {
    const uid = genUID();

    broadcast(uid, {
      type: 'connect-begin',
      remote: getRemoteInfo(req.socket)!,
      hostname: req.hostname,
      port: req.port,
      headers: req.raw.rawHeaders,
    });

    try {
      const res = await next();

      broadcast(uid, {
        type: 'connect-end',
        remote: getRemoteInfo(res),
        accepted: !res,
        hidden: req.hidden,
      });

      return res;
    } catch (error: any) {
      broadcast(uid, {
        type: 'connect-error',
        error: {
          message: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  });
}
