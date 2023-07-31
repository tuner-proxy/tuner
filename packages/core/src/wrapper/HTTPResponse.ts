import * as http from 'http';
import * as stream from 'stream';

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

export interface HTTPResponseOptions {
  raw?: http.IncomingMessage;
  status?: number;
  statusCode?: number;
  headers?: Record<string, any>;
  body?: string | Buffer | stream.Readable;
  bodyEncoding?: ContentEncodingType;
}

export class HTTPResponse {
  /**
   * Create HTTPResponse object from HTTPResponseOptions
   */
  static from(options: HTTPResponse | HTTPResponseOptions) {
    if (options instanceof HTTPResponse) {
      return options;
    }
    return new HTTPResponse(options);
  }

  /**
   * The original IncomingMessage object
   */
  readonly raw?: http.IncomingMessage;

  /**
   * Response status code
   */
  statusCode: number;

  /**
   * Response headers
   */
  headers: http.IncomingHttpHeaders;

  protected body: BodyInfo;

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

  /**
   * Replace the response body
   */
  setBody(content: BodyContent, encoding?: ContentEncodingType) {
    this.body = {
      content,
      encoding: normalizeContentEncoding(encoding),
    };
    delete this.headers['content-length'];
    delete this.headers['transfer-encoding'];
  }

  /**
   * Obtain the response body as a readable stream
   */
  stream(options: ReadOptions = {}) {
    return readStream(this.body, {
      encoding: this.headers['content-encoding'],
      ...options,
    });
  }

  /**
   * Obtain the response body as a Buffer
   */
  buffer(options: ReadOptions = {}) {
    return readBuffer(this.body, {
      encoding: this.headers['content-encoding'],
      ...options,
    });
  }

  /**
   * Obtain the response body as a string
   */
  text(options: Omit<ReadOptions, 'decode' | 'encoding'> = {}) {
    return readText(this.body, options);
  }

  /**
   * Obtain the response body as a JSON object
   */
  json(options: Omit<ReadOptions, 'decode' | 'encoding'> = {}) {
    return readJson(this.body, options);
  }
}
