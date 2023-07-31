import * as http from 'http';
import * as http2 from 'http2';
import * as https from 'https';
import * as tls from 'tls';

import waitFor from 'event-to-promise';

import { Server } from '../Server';
import { ContentEncodingType, normalizeContentEncoding } from '../encoding';
import * as httpStream from '../stream';

import { BaseRequest } from './BaseRequest';
import { HTTPResponse, HTTPResponseOptions } from './HTTPResponse';

export interface HTTPSendOptions {
  consume?: boolean;
}

export class HTTPRequest extends BaseRequest {
  readonly type = 'common';

  readonly originalUrl: string;

  headers: http.IncomingHttpHeaders | http2.IncomingHttpHeaders;

  rejectUnauthorized = true;

  protected body: httpStream.BodyInfo;

  protected customAgent?: http.Agent | false;

  constructor(
    svr: Server,
    public readonly raw: http.IncomingMessage | http2.Http2ServerRequest,
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

  get defaultAgent() {
    if (!this.encrypted) {
      return this.svr.upstream.httpAgent;
    }
    return this.svr.upstream.httpsAgent;
  }

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

  async respondWith(
    responseOptions: HTTPResponse | HTTPResponseOptions,
    options?: httpStream.ReadOptions,
  ) {
    const res = HTTPResponse.from(responseOptions);
    const headers = { ...res.headers };
    if (this.raw.httpVersionMajor === 2) {
      delete headers['keep-alive'];
    }
    this.res.writeHead(res.statusCode, headers);
    await waitFor(res.stream(options).pipe(this.res), 'close');
  }

  setBody(content: httpStream.BodyContent, encoding?: ContentEncodingType) {
    this.body = {
      content,
      encoding: normalizeContentEncoding(encoding),
    };
  }

  stream(options: httpStream.ReadOptions = {}) {
    return httpStream.readStream(this.body, {
      encoding: this.headers['content-encoding'],
      ...options,
    });
  }

  buffer(options: httpStream.ReadOptions = {}) {
    return httpStream.readBuffer(this.body, {
      encoding: this.headers['content-encoding'],
      ...options,
    });
  }

  text(options: Omit<httpStream.ReadOptions, 'decode' | 'encoding'> = {}) {
    return httpStream.readText(this.body, options);
  }

  json(options: Omit<httpStream.ReadOptions, 'decode' | 'encoding'> = {}) {
    return httpStream.readJson(this.body, options);
  }
}
