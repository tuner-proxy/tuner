import * as http from 'http';
import * as net from 'net';
import * as tls from 'tls';

import waitFor from 'event-to-promise';

import { stringifyHost } from '../utils';

import { ProxyOptions } from './connect';
import UPSTREAM_TYPE from './connection';

declare module 'http' {
  interface Agent {
    addRequest(req: http.ClientRequest, options: http.RequestOptions): void;
  }
}

export interface HTTPProxyAgentRequestOptions extends http.RequestOptions {
  proxyList: ProxyOptions[];
}

export class HTTPProxyAgent extends http.Agent {
  getName!: (options: any) => string;

  freeSockets!: Record<string, net.Socket[]>;

  constructor(options: http.AgentOptions) {
    super(options);
  }

  async addRequest(
    req: http.ClientRequest,
    options: HTTPProxyAgentRequestOptions,
  ) {
    if (!options.proxyList) {
      super.addRequest(req, options);
      return;
    }
    for (const proxy of options.proxyList) {
      try {
        super.addRequest(req, await this.connectProxy(req, options, proxy));
        return;
      } catch (error) {
        // noop
      }
    }
    super.addRequest(req, options);
  }

  async connectProxy(
    req: http.ClientRequest,
    options: HTTPProxyAgentRequestOptions,
    proxy: ProxyOptions,
  ) {
    if (
      proxy.type !== 'proxy' &&
      proxy.type !== 'http' &&
      proxy.type !== 'https'
    ) {
      const name = this.getName(options);
      if (this.freeSockets[name]?.length) {
        return options;
      }
      const upstream = UPSTREAM_TYPE[proxy.type] as any;
      const socket: net.Socket = await upstream.connect(proxy, options);
      if (!this.freeSockets[name]) {
        this.freeSockets[name] = [];
      }
      this.freeSockets[name].push(socket);
      return options;
    }

    const proxyOptions = {
      ...options,
      host: stringifyHost(proxy.hostname, proxy.port),
      hostname: proxy.hostname,
      port: proxy.port,
      path: req.path,
    };

    const name = this.getName(proxyOptions);
    if (this.freeSockets[name]?.length) {
      return options;
    }

    const client: any = proxy.type === 'https' ? tls : net;
    const socket: net.Socket = client.connect(proxy.port, proxy.hostname, {
      ALPNProtocols: ['http/1.1', 'http/1.0'],
    });

    await waitFor(socket, 'connect');

    let base: string;
    if (!options.hostname) {
      base = `http://${options.host}`;
    } else {
      base = `http://${options.hostname}:${options.port}/`;
    }

    const parsed = new URL(req.path, base);

    if (parsed.port === '80') {
      parsed.port = '';
    }

    req.path = parsed.href;

    if (proxy.auth) {
      req.setHeader(
        'Proxy-Authorization',
        `Basic ${Buffer.from(proxy.auth).toString('base64')}`,
      );
    }

    const raw = req as any;
    if (raw._header) {
      raw._header = null;
      raw._implicitHeader();

      if (raw.output && raw.output.length > 0) {
        raw.output[0] = raw._header + removeHeader(raw.output[0]);
        raw._headerSent = true;
      } else if (raw.outputData && raw.outputData.length > 0) {
        raw.outputData[0].data =
          raw._header + removeHeader(raw.outputData[0].data);
        raw._headerSent = true;
      }
    }
    /* eslint-enable no-underscore-dangle */

    if (!this.freeSockets[name]) {
      this.freeSockets[name] = [];
    }
    this.freeSockets[name].push(socket);

    return proxyOptions;
  }

  createConnection(
    options: http.RequestOptions,
    callback: (...args: any[]) => any,
  ) {
    callback(new Error('Failed to establish proxy connection'));
  }
}

function removeHeader(data: string) {
  const headerIndex = data.indexOf('\r\n\r\n');
  if (headerIndex < 0) {
    throw new Error('Cannot find header');
  }
  return data.slice(headerIndex + 4);
}
