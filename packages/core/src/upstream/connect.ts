import * as net from 'net';

import UPSTREAM_TYPE from './connection';
import type { HTTPProxyOptions } from './connection/http';
import type { SocksProxyOptions } from './connection/socks';
import type { TCPProxyOptions } from './connection/tcp';

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
    } catch (error) {
      // noop
    }
  }
  throw new Error('Failed to establish proxy connection');
}
