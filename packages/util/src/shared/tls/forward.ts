import * as net from 'net';
import * as tls from 'tls';

import { ConnectRequest, Server, connectHandler } from '@tuner-proxy/core';
import waitFor from 'event-to-promise';
import extractSNI from 'sni';

import { persist } from '../../helpers/persist';

import { getTlsOptions } from './tls';

export type CreateSvrFn = (svr: Server, opts: tls.TlsOptions) => net.Server;

const getSvrFactory = persist('tuner-util:tls-svr-factory', (svr) => {
  const svrCache = new WeakMap<
    CreateSvrFn,
    Map<string | undefined, Promise<net.Server>>
  >();
  return (createSvrFn: CreateSvrFn, servername: string | undefined) => {
    if (!svrCache.has(createSvrFn)) {
      svrCache.set(createSvrFn, new Map());
    }
    const cache = svrCache.get(createSvrFn)!;
    const createServer = () =>
      getTlsOptions(svr, servername)
        .then((options) => createSvrFn(svr, options))
        .catch((error) => {
          cache.delete(servername);
          throw error;
        });
    if (!cache.has(servername)) {
      cache.set(servername, createServer());
    }
    return cache.get(servername)!;
  };
});

export const forwardTlsSvr = (createSvrFn: CreateSvrFn) =>
  connectHandler(async (req, next) => {
    req.hidden = true;

    const servername = await getServerName(req);

    const getSvr = getSvrFactory(req.svr);
    const targetSvr = await getSvr(createSvrFn, servername);

    if (!targetSvr.listening) {
      await waitFor(targetSvr, 'listening');
    }

    const addr = targetSvr.address();

    let socket: net.Socket | undefined;
    if (typeof addr === 'string') {
      socket = net.connect(addr);
    } else if (addr) {
      socket = net.connect(addr.port, addr.address);
    }
    if (!socket) {
      return next();
    }

    await waitFor(socket, 'connect');
    return socket;
  });

async function getServerName(req: ConnectRequest) {
  if (!req.head.byteLength) {
    req.responseHeaderSent = true;
    req.socket.write('HTTP/1.1 200 OK\r\n\r\n');
    req.socket.resume();
    req.head = await waitFor(req.socket, 'data');
    req.socket.pause();
  }
  const sni = extractSNI(req.head);
  if (!sni) {
    return req.hostname;
  }
  if (net.isIP(sni)) {
    return sni;
  }
}
