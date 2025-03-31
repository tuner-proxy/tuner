import https from 'node:https';
import tls from 'node:tls';

import type { ProxyOptions } from './connect';
import { connect } from './connect';

declare module 'https' {
  interface Agent {
    createConnection(
      options: https.RequestOptions,
      callback: (...args: any[]) => any,
    ): void;
  }
}

export interface HTTPSProxyAgentRequestOptions extends https.RequestOptions {
  proxyList: ProxyOptions[];
}

export class HTTPSProxyAgent extends https.Agent {
  createConnection(
    options: HTTPSProxyAgentRequestOptions,
    callback: (...args: any[]) => any,
  ) {
    if (!options.proxyList) {
      return super.createConnection(options, callback);
    }
    connect(options.proxyList, options as any).then((socket) => {
      callback(null, tls.connect({ ...options, socket } as any));
    }, callback);
  }
}
