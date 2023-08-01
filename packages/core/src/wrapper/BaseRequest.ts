import { Server } from '../Server';
import { parseHost, stringifyHost } from '../utils';

import {
  LazyURLSearchParams,
  LazyURLSearchParamsInit,
} from './URLSearchParams';

export interface ConnectUpReadOptions {
  type: string;
  hostname: string;
  port: string | number;
  auth?: string;
}

export interface PacUpReadOptions {
  type: 'pac';
  url: string;
}

export type UpReadOptions = ConnectUpReadOptions | PacUpReadOptions;

export type UpstreamType = null | false | undefined | string | UpReadOptions;

export interface BaseRequestOptions {
  encrypted: boolean;
  method: string;
  host: string;
  path?: string;
}

export abstract class BaseRequest {
  /**
   * Request type
   */
  abstract readonly type: string;

  /**
   * Original request URL
   */
  abstract readonly originalUrl: string;

  /**
   * Request protocol
   */
  abstract protocol: string;

  /**
   * Upstream proxy list
   */
  upstream?: UpstreamType | UpstreamType[];

  /**
   * HTTP request method
   */
  method: string;

  /**
   * `true` if the underlying connection is TLS encrypted
   */
  encrypted: boolean;

  /**
   * Request hostname
   */
  hostname!: string;

  /**
   * Request port
   */
  port!: number;

  /**
   * Pathname of the request URL
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
   * A stringifier that returns a string containing the whole request URL
   */
  get href() {
    return `${this.protocol}//${this.host}${this.path}`;
  }

  /**
   * Request host
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
   * Request path
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
   * Search string section of the request URL
   */
  get search() {
    return String(this.lazySearchParams);
  }

  set search(init) {
    this.lazySearchParams = new LazyURLSearchParams(String(init));
  }

  /**
   * The URLSearchParams object representing the query parameters of the request URL
   */
  get searchParams(): LazyURLSearchParams {
    return this.lazySearchParams;
  }

  set searchParams(init: LazyURLSearchParamsInit) {
    this.lazySearchParams = new LazyURLSearchParams(init);
  }

  /**
   * The query object representing the query parameters of the request URL
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
