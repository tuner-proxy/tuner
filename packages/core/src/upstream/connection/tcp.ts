import * as net from 'net';

import waitFor from 'event-to-promise';

import type { ConnectOptions } from '../connect';

export interface TCPProxyOptions {
  type: 'direct';
}

export async function connect(proxy: TCPProxyOptions, options: ConnectOptions) {
  const socket = net.connect(options.port, options.hostname);
  await waitFor(socket, 'connect');
  return socket;
}
