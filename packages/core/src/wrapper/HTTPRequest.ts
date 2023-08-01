import * as http from 'http';
import * as http2 from 'http2';
import * as https from 'https';
import * as tls from 'tls';

import waitFor from 'event-to-promise';

import { Server } from '../Server';
import { ContentEncodingType, normalizeContentEncoding } from '../encoding';
import {
  BodyContent,
  BodyInfo,
  ReadOptions,
  readBuffer,
  readJson,
  readStream,
  readText,
} from '../stream';

import { BaseRequest } from './BaseRequest';
import { HTTPResponse, HTTPResponseOptions } from './HTTPResponse';

export interface HTTPSendOptions {
  /**
   * Consume the underlying request body
   */
  consume?: boolean;
}

/**
 * Normal HTTP request instance
 */
export class HTTPRequest extends BaseRequest {
  readonly type = 'common';

  readonly originalUrl: string;

  /**
   * Request headers
   */
  headers: http.IncomingHttpHeaders | http2.IncomingHttpHeaders;

  /**
   * The server certificate is verified against the list of supplied CAs if the value is not `false`.
   */
  rejectUnauthorized = true;

  protected body: BodyInfo;

  protected customAgent?: http.Agent | false;

  constructor(
    svr: Server,
    /**
     * The original IncomingMessage object
     */
    public readonly raw: http.IncomingMessage | http2.Http2ServerRequest,
    /**
     * The original ServerResponse object
     */
    public readonly res: http.ServerResponse | http2.Http2ServerResponse,
  ) {
    const authority =
      (raw as http2.Http2ServerRequest).authority || raw.headers.host;

    const { host, pathname, search } = new URL(
      raw.url!,
      `unknown://${authority}`,
    );

    super(svr, {
      encrypted: !!(raw.socket as tls.TLSSocket).encrypted,
      method: raw.method!.toUpperCase(),
      host,
      path: pathname + search,
    });

    this.headers = { ...raw.headers, host };
    delete this.headers[':authority'];
    delete this.headers[':method'];
    delete this.headers[':path'];
    delete this.headers[':scheme'];
    delete this.headers['proxy-authorization'];
    delete this.headers['proxy-connection'];

    this.body = {
      content: this.raw,
      encoding: normalizeContentEncoding(this.headers['content-encoding']),
    };

    this.originalUrl = this.href;
  }

  get protocol() {
    return this.encrypted ? 'https:' : 'http:';
  }

  set protocol(value) {
    this.encrypted = value === 'https:';
  }

  /**
   * Default Agent for the request
   */
  get defaultAgent() {
    if (!this.encrypted) {
      return this.svr.upstream.httpAgent;
    }
    return this.svr.upstream.httpsAgent;
  }

  /**
   * Customized Agent
   */
  get agent() {
    if (this.customAgent) {
      return this.customAgent;
    }
    if (this.customAgent === false) {
      return undefined;
    }
    return this.defaultAgent;
  }

  set agent(agent: http.Agent | false | undefined) {
    this.customAgent = agent;
  }

  /**
   * Send the request to target server
   */
  async send(options: HTTPSendOptions = {}) {
    const client = this.encrypted ? https : http;

    const proxyList = await this.svr.upstream.resolveProxyList(this);

    const requestOptions = {
      servername: this.hostname,
      agent: this.agent,
      proxyList,
      hostname: this.hostname,
      port: this.port,
      method: this.method,
      path: this.path,
      headers: this.headers,
      rejectUnauthorized: this.rejectUnauthorized,
    };
    const req = client.request(requestOptions);

    this.stream(options).pipe(req);

    return new HTTPResponse({ raw: await waitFor(req, 'response') });
  }

  /**
   * Respond to the request
   */
  async respondWith(
    responseOptions: HTTPResponse | HTTPResponseOptions,
    options?: ReadOptions,
  ) {
    const res = HTTPResponse.from(responseOptions);
    const headers = { ...res.headers };
    if (this.raw.httpVersionMajor === 2) {
      delete headers['keep-alive'];
    }
    this.res.writeHead(res.statusCode, headers);
    await waitFor(res.stream(options).pipe(this.res), 'close');
  }

  /**
   * Replace the request body
   */
  setBody(content: BodyContent, encoding?: ContentEncodingType) {
    this.body = {
      content,
      encoding: normalizeContentEncoding(encoding),
    };
  }

  /**
   * Obtain the request body as a readable stream
   */
  stream(options: ReadOptions = {}) {
    return readStream(this.body, {
      encoding: this.headers['content-encoding'],
      ...options,
    });
  }

  /**
   * Obtain the request body as a Buffer
   */
  buffer(options: ReadOptions = {}) {
    return readBuffer(this.body, {
      encoding: this.headers['content-encoding'],
      ...options,
    });
  }

  /**
   * Obtain the request body as a string
   */
  text(options: Omit<ReadOptions, 'decode' | 'encoding'> = {}) {
    return readText(this.body, options);
  }

  /**
   * Obtain the request body as a JSON object
   */
  json(options: Omit<ReadOptions, 'decode' | 'encoding'> = {}) {
    return readJson(this.body, options);
  }
}
