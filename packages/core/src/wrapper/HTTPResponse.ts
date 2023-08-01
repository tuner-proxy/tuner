import * as http from 'http';
import * as stream from 'stream';

import { ContentEncodingType, normalizeContentEncoding } from '../encoding';
import * as httpStream from '../stream';

export interface HTTPResponseOptions {
  raw?: http.IncomingMessage;
  status?: number;
  statusCode?: number;
  headers?: Record<string, any>;
  body?: string | Buffer | stream.Readable;
  bodyEncoding?: ContentEncodingType;
}

export class HTTPResponse {
  static from(options: HTTPResponse | HTTPResponseOptions) {
    if (options instanceof HTTPResponse) {
      return options;
    }
    return new HTTPResponse(options);
  }

  readonly raw?: http.IncomingMessage;

  statusCode: number;

  headers: http.IncomingHttpHeaders;

  protected body: httpStream.BodyInfo;

  constructor(options: HTTPResponseOptions) {
    this.raw = options.raw;

    this.statusCode =
      options.statusCode ?? options.status ?? options.raw?.statusCode ?? 200;

    this.headers = {
      ...options.raw?.headers,
      ...options.headers,
    };

    this.body = {
      content: options.body ?? options.raw,
      encoding:
        options.bodyEncoding ??
        normalizeContentEncoding(options.raw?.headers['content-encoding']),
    };
  }

  setBody(content: httpStream.BodyContent, encoding?: ContentEncodingType) {
    this.body = {
      content,
      encoding: normalizeContentEncoding(encoding),
    };
    delete this.headers['content-length'];
    delete this.headers['transfer-encoding'];
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
