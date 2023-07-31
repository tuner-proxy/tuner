import * as dns from 'dns';
import { promisify } from 'util';

import { SocksClient } from 'socks';

import type { ConnectOptions } from '../connect';

const resolve4 = promisify(dns.resolve4);

type SocksProxyType = 4 | 5;

export interface SocksProxyOptions {
  type: 'socks4' | 'socks4a' | 'socks5';
  hostname: string;
  port: number;
}

export async function connect(
  proxy: SocksProxyOptions,
  options: ConnectOptions,
) {
  let proxyType: SocksProxyType = 5;
  if (proxy.type === 'socks4' || proxy.type === 'socks4a') {
    proxyType = 4;
  }

  let targetHost = options.hostname;
  if (proxy.type === 'socks4') {
    [targetHost] = await resolve4(options.hostname);
  }

  const { socket } = await SocksClient.createConnection({
    command: 'connect',
    proxy: {
      type: proxyType,
      port: proxy.port || 1080,
      ipaddress: proxy.hostname,
    },
    destination: {
      port: options.port,
      host: targetHost,
    },
  });

  return socket;
}
