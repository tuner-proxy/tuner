import type { TLSSocket } from 'node:tls';

import { upgradeHandler } from '@tuner-proxy/core';

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
      await next();

      const socket = req.upstreamSocket;

      broadcast(uid, {
        type: 'upgrade-end',
        remote: getRemoteInfo(socket),
        encrypted: !!(socket as TLSSocket | undefined)?.encrypted,
        accepted: !socket,
      });
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
