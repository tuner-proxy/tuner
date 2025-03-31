import http from 'node:http';
import type http2 from 'node:http2';
import https from 'node:https';
import type tls from 'node:tls';

import waitFor from 'event-to-promise';

import type { Server } from '../Server';
import type { ContentEncodingType } from '../shared/encoding';
import { normalizeContentEncoding } from '../shared/encoding';
import { isLoopBack } from '../shared/loopback';
import type { BodyContent, BodyInfo, ReadOptions } from '../stream';
import { readBuffer, readJson, readStream, readText } from '../stream';

import { BaseRequest } from './BaseRequest';
import type { HTTPResponseOptions } from './HTTPResponse';
import { HTTPResponse } from './HTTPResponse';

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
   * The request headers object
   *
   * [Node.js Reference](https://nodejs.org/api/http.html#messageheaders)
   */
  headers: http.IncomingHttpHeaders | http2.IncomingHttpHeaders;

  /**
   * If the value is not `false`, the server certificate is verified against the list of supplied CAs
   */
  rejectUnauthorized = true;

  protected body: BodyInfo;

  protected customAgent?: http.Agent | false;

  protected responseObject?: HTTPResponse;

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
   * Default HTTP Agent
   */
  get defaultAgent() {
    if (!this.encrypted) {
      return this.svr.upstream.httpAgent;
    }
    return this.svr.upstream.httpsAgent;
  }

  /**
   * The actual Agent to be used when sending the request
   *
   * - if the value is `false`, the [http.globalAgent](https://nodejs.org/api/http.html#class-httpagent) will be used
   * - if the value is `undefined`, the `defaultAgent` will be used
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
   * HTTP response for the request
   *
   * It will be sent after the `handleRequest` function is resolved
   */
  get response(): HTTPResponse | undefined {
    return this.responseObject;
  }

  set response(response: HTTPResponse | HTTPResponseOptions | undefined) {
    if (!response) {
      this.responseObject = undefined;
    } else {
      this.responseObject = HTTPResponse.from(response);
    }
  }

  async finalize() {
    if (this.responseObject) {
      return;
    }
    if (!(await isLoopBack(this))) {
      this.responseObject = await this.send();
      return;
    }
    this.responseObject = HTTPResponse.from({
      status: 404,
      body: 'Tuner Server - Not Found',
    });
  }

  /**
   * Send request to the upstream server
   */
  async send(options: HTTPSendOptions = {}) {
    const proxyList = await this.svr.upstream.resolveProxyList(this);

    const client = this.encrypted ? https : http;

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
   * Send response to the client
   */
  async sendResponse(
    response: HTTPResponse | HTTPResponseOptions,
    options?: ReadOptions,
  ) {
    const res = HTTPResponse.from(response);
    const headers = { ...res.headers };
    if (this.raw.httpVersionMajor === 2) {
      delete headers['keep-alive'];
    }
    this.res.writeHead(res.statusCode, headers);
    await waitFor(res.stream(options).pipe(this.res), 'close');
  }

  /**
   * Set the request body
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
   * Obtain the request body as a node.js Buffer
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
