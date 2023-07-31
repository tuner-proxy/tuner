import * as http from 'http';
import * as stream from 'stream';
import * as tls from 'tls';

import { Server } from '../Server';

import { BaseRequest } from './BaseRequest';

export class UpgradeRequest extends BaseRequest {
  readonly type = 'upgrade';

  readonly originalUrl: string;

  /**
   * Request headers
   */
  headers: http.IncomingHttpHeaders;

  /**
   * Options for the TLSSocket
   */
  tlsOptions: tls.TLSSocketOptions = {};

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
