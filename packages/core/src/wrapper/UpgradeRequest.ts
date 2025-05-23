import type http from 'node:http';
import type stream from 'node:stream';
import tls from 'node:tls';

import type { Server } from '../Server';
import { isLoopBack } from '../shared/loopback';

import { BaseRequest } from './BaseRequest';

export class UpgradeRequest extends BaseRequest {
  readonly type = 'upgrade';

  readonly originalUrl: string;

  /**
   * The request headers object
   *
   * [Node.js Reference](https://nodejs.org/api/http.html#messageheaders)
   */
  headers: http.IncomingHttpHeaders;

  /**
   * Options for the TLSSocket
   */
  tlsOptions: tls.TLSSocketOptions = {};

  /**
   * Whether the response headers has been sent
   */
  responseHeaderSent = false;

  /**
   * The upstream socket object
   */
  upstreamSocket?: stream.Duplex;

  constructor(
    svr: Server,
    public readonly raw: http.IncomingMessage,
    public readonly socket: stream.Duplex,
    public head: Buffer,
  ) {
    const { host, pathname, search } = new URL(
      raw.url!,
      `unknown://${raw.headers.host}`,
    );

    super(svr, {
      encrypted: !!(raw.socket as tls.TLSSocket).encrypted,
      method: raw.method!.toUpperCase(),
      host,
      path: pathname + search,
    });

    this.headers = { ...raw.headers, host };
    delete this.headers['proxy-authorization'];
    delete this.headers['proxy-connection'];

    this.originalUrl = this.href;
  }

  /**
   * Value of the `Upgrade` header
   *
   * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Upgrade)
   */
  get upgradeType() {
    return this.headers.upgrade!.toUpperCase();
  }

  get protocol() {
    if (this.upgradeType === 'WEBSOCKET') {
      return this.encrypted ? 'wss:' : 'ws:';
    }
    return this.encrypted ? 'https:' : 'http:';
  }

  set protocol(value) {
    this.encrypted = ['wss:', 'https:'].includes(value);
  }

  async finalize() {
    if (this.upstreamSocket) {
      return;
    }
    if (!(await isLoopBack(this))) {
      this.upstreamSocket = await this.connect();
      return;
    }
    this.socket.write('HTTP/1.1 200 OK\r\n\r\n');
    this.socket.end();
    this.responseHeaderSent = true;
  }

  /**
   * Create socket (tls) connection with target server
   */
  async connect() {
    const proxyList = await this.svr.upstream.resolveProxyList(this);
    const socket = await this.svr.upstream.connect(proxyList, {
      port: this.port,
      hostname: this.hostname,
      headers: {
        'user-agent': this.headers['user-agent'],
      },
    });
    if (!this.encrypted) {
      return socket;
    }
    return new tls.TLSSocket(socket, this.tlsOptions);
  }
}
