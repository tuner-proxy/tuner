import type http from 'node:http';
import type net from 'node:net';
import type stream from 'node:stream';
import type tls from 'node:tls';

import type { Server } from '../Server';

import { BaseRequest } from './BaseRequest';

/**
 * HTTP connect request instance
 */
export class ConnectRequest extends BaseRequest {
  readonly type = 'connect';

  readonly originalUrl: string;

  /**
   * The request headers object
   *
   * [Node.js Reference](https://nodejs.org/api/http.html#messageheaders)
   */
  headers: http.IncomingHttpHeaders;

  /**
   * Whether the request should be hidden from the request list in `@tuner-proxy/ui`
   */
  hidden = false;

  /**
   * Whether the response headers has been sent
   */
  responseHeaderSent = false;

  /**
   * The upstream socket object
   */
  upstreamSocket?: net.Socket;

  constructor(
    svr: Server,
    public readonly raw: http.IncomingMessage,
    public readonly socket: stream.Duplex,
    public head: Buffer,
  ) {
    super(svr, {
      encrypted: !!(raw.socket as tls.TLSSocket).encrypted,
      method: 'CONNECT',
      host: raw.url!,
    });

    this.headers = { ...raw.headers };

    this.originalUrl = this.href;
  }

  get protocol() {
    return 'connect:';
  }

  async finalize() {
    if (!this.upstreamSocket) {
      this.upstreamSocket = await this.connect();
    }
  }

  /**
   * Connect to the upstream server
   */
  async connect() {
    const proxyList = await this.svr.upstream.resolveProxyList(this);
    return this.svr.upstream.connect(proxyList, {
      port: this.port,
      hostname: this.hostname,
      headers: {
        'user-agent': this.headers['user-agent'],
      },
    });
  }
}
