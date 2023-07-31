import * as net from 'net';

import { Server, connectHandler } from '@tuner-proxy/core';
import waitFor from 'event-to-promise';

export const forwardSvr = (getSvr: (svr: Server) => net.Server) =>
  connectHandler(async (req, next) => {
    req.hidden = true;

    const targetSvr = getSvr(req.svr);

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
