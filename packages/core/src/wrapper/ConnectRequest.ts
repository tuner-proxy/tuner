import * as http from 'http';
import * as stream from 'stream';
import * as tls from 'tls';

import { Server } from '../Server';

import { BaseRequest } from './BaseRequest';

/**
 * HTTP connect request instance
 */
export class ConnectRequest extends BaseRequest {
  readonly type = 'connect';

  readonly originalUrl: string;

  /**
   * Request headers
   */
  headers: http.IncomingHttpHeaders;

  /**
   * Whether the request should be hidden from the request list in tuner/ui
   */
  hidden = false;

  /**
   * Whether the response headers has been sent
   */
  responseHeaderSent = false;

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

  /**
   * Create socket connection with target server
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
