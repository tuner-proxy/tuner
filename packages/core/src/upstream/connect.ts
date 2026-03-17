import type net from 'node:net';

import UPSTREAM_TYPE from './connection/index.js';
import type { HTTPProxyOptions } from './connection/http.js';
import type { SocksProxyOptions } from './connection/socks.js';
import type { TCPProxyOptions } from './connection/tcp.js';

export type ProxyOptions =
  | HTTPProxyOptions
  | SocksProxyOptions
  | TCPProxyOptions;

export interface ConnectOptions {
  hostname: string;
  port: number;
  headers?: Record<string, any>;
}

export async function connect(
  proxyList: ProxyOptions[],
  options: ConnectOptions,
): Promise<net.Socket> {
  for (const proxy of proxyList) {
    try {
      const { connect } = UPSTREAM_TYPE[proxy.type] as any;
      return await connect(proxy, options);
    } catch {
      // noop
    }
  }
  throw new Error('Failed to establish proxy connection');
}
