import net from 'node:net';

import type { ConnectRequest, Server } from '@tuner-proxy/core';
import { connectHandler } from '@tuner-proxy/core';
import waitFor from 'event-to-promise';
import extractSNI from 'sni';

import { persist } from '../helpers/persist';

export type CreateSvrFn = (
  svr: Server,
  servername: string | undefined,
) => Promise<net.Server>;

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
    if (!cache.has(servername)) {
      const promise = createSvrFn(svr, servername);
      promise.catch(() => {
        cache.delete(servername);
      });
      cache.set(servername, promise);
    }
    return cache.get(servername)!;
  };
});

export const forwardHttpSvr = (
  createSvrFn: CreateSvrFn,
  createTlsSvrFn: CreateSvrFn,
) =>
  connectHandler(async (req, next) => {
    req.hidden = true;

    if (!req.head.byteLength) {
      req.responseHeaderSent = true;
      const headPromise = waitFor(req.socket, 'data');
      req.socket.write('HTTP/1.1 200 OK\r\n\r\n');
      req.socket.resume();
      req.head = await headPromise;
      req.socket.pause();
    }

    const servername = getServerName(req);

    const getSvr = getSvrFactory(req.svr);

    const targetSvr = await getSvr(
      isTLS(req.head) ? createTlsSvrFn : createSvrFn,
      servername,
    );

    if (!targetSvr.listening) {
      await waitFor(targetSvr, 'listening');
    }

    const addr = targetSvr.address();

    let socket: net.Socket | undefined;
    if (typeof addr === 'string') {
      socket = net.connect(addr);
    } else if (addr) {
      let address = addr.address;
      if (address === '::' || address === '0.0.0.0') {
        address = 'localhost';
      }
      socket = net.connect(addr.port, address);
    }
    if (!socket) {
      return next();
    }

    await waitFor(socket, 'connect');
    req.upstreamSocket = socket;
  });

function getServerName(req: ConnectRequest) {
  const sni = extractSNI(req.head);
  if (!sni) {
    return req.hostname;
  }
  if (net.isIP(sni)) {
    return sni;
  }
}

function isTLS(head: Buffer) {
  return head[0] === 0x16 || head[0] === 0x80 || head[0] === 0x00;
}
