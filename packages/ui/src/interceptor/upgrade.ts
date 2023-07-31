import { TLSSocket } from 'tls';

import { ConnectResult, upgradeHandler } from '@tuner-proxy/core';

import { broadcast } from '../ctrl/server';
import { genUID, getRemoteInfo } from '../shared';

export function createUpgradeInterceptor() {
  return upgradeHandler(async (req, next) => {
    const uid = genUID();

    broadcast(uid, {
      type: 'upgrade-begin',
      remote: getRemoteInfo(req.raw.socket)!,
      encrypted: !!(req.raw.socket as TLSSocket).encrypted,
      method: req.raw.method!,
      url: req.raw.url!,
      headers: req.raw.rawHeaders,
    });

    try {
      const res: ConnectResult = await next();

      broadcast(uid, {
        type: 'upgrade-end',
        remote: getRemoteInfo(res),
        encrypted: !!(res as TLSSocket | undefined)?.encrypted,
        accepted: !res,
      });

      return res;
    } catch (error: any) {
      broadcast(uid, {
        type: 'upgrade-error',
        error: {
          message: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  });
}
