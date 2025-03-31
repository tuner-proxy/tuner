import type { Server } from '../Server';
import { parseHost, stringifyHost } from '../shared/utils';

import type { LazyURLSearchParamsInit } from './URLSearchParams';
import { LazyURLSearchParams } from './URLSearchParams';

export interface ConnectUpstreamOptions {
  type: string;
  hostname: string;
  port: string | number;
  auth?: string;
}

export interface PacUpstreamOptions {
  type: 'pac';
  url: string;
}

export type UpstreamOptions = ConnectUpstreamOptions | PacUpstreamOptions;

export type UpstreamType = null | false | undefined | string | UpstreamOptions;

export interface BaseRequestOptions {
  /**
   * Whether the underlying connection is TLS encrypted
   */
  encrypted: boolean;
  /**
   * Request method
   */
  method: string;
  /**
   * Request host
   */
  host: string;
  /**
   * Request path
   */
  path?: string;
}

export abstract class BaseRequest {
  /**
   * Request type
   */
  abstract readonly type: string;

  /**
   * The original URL of the request
   */
  abstract readonly originalUrl: string;

  /**
   * Request protocol
   */
  abstract protocol: string;

  /**
   * Upstream proxy list for the request
   */
  upstream?: UpstreamType | UpstreamType[];

  /**
   * Request method
   */
  method: string;

  /**
   * Whether the underlying connection is TLS encrypted
   */
  encrypted: boolean;

  /**
   * The hostname part of the request URL
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/hostname)
   */
  hostname!: string;

  /**
   * The port number of the request URL
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/port)
   */
  port!: number;

  /**
   * The pathname part of the request URL
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/pathname)
   */
  pathname!: string;

  /**
   * Request params resolved from named route parameter
   */
  params: Record<string, string> = {};

  protected lazySearchParams = new LazyURLSearchParams();

  constructor(
    public readonly svr: Server,
    options: BaseRequestOptions,
  ) {
    this.method = options.method!.toUpperCase();
    this.encrypted = options.encrypted;
    this.host = options.host;
    this.path = options.path || '';
  }

  /**
   * Finalize the request with default action
   */
  abstract finalize(): Promise<void>;

  /**
   * A string containing the whole URL
   *
   * @alias href
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/href)
   */
  get url() {
    return this.href;
  }

  /**
   * A string containing the whole URL
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/href)
   */
  get href() {
    return `${this.protocol}//${this.host}${this.path}`;
  }

  /**
   * The host part of the request URL
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/host)
   */
  get host() {
    return stringifyHost(this.hostname, this.port, this.encrypted ? 443 : 80);
  }

  set host(value) {
    const [hostname, port] = parseHost(value);
    this.hostname = hostname;
    this.port = Number(port ?? (this.encrypted ? 443 : 80));
  }

  /**
   * The concatenation of the pathname and search of the request URL
   *
   * [Node.js Reference](https://nodejs.org/api/url.html#urlobjectpath)
   */
  get path() {
    return this.pathname + this.search;
  }

  set path(value) {
    const url = new URL(value, 'http://example.com/');
    this.pathname = url.pathname;
    this.search = url.search;
  }

  /**
   * The search string section of the request URL
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/search)
   */
  get search() {
    return String(this.lazySearchParams);
  }

  set search(init) {
    this.lazySearchParams = new LazyURLSearchParams(String(init));
  }

  /**
   * The URLSearchParams object representing the query parameters of the request URL
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URL/searchParams)
   */
  get searchParams(): LazyURLSearchParams {
    return this.lazySearchParams;
  }

  set searchParams(init: LazyURLSearchParamsInit) {
    this.lazySearchParams = new LazyURLSearchParams(init);
  }

  /**
   * The query object representing the query parameters of the request URL
   *
   * [Node.js Reference](https://nodejs.org/api/url.html#urlobjectquery)
   */
  get query() {
    const result: Record<string, string> = {};
    for (const [key, value] of this.lazySearchParams) {
      result[key] = value;
    }
    return result;
  }

  set query(init) {
    this.lazySearchParams = new LazyURLSearchParams({ ...init });
  }
}
