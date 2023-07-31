import * as dns from 'dns';
import * as net from 'net';
import * as os from 'os';
import { promisify } from 'util';

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

const resolve = promisify(dns.resolve);

export interface BaseRequestOptions {
  encrypted: boolean;
  method: string;
  host: string;
  path?: string;
}

export abstract class BaseRequest {
  abstract readonly type: string;

  abstract readonly originalUrl: string;

  abstract protocol: string;

  upstream?: UpstreamType | UpstreamType[];

  method: string;

  encrypted: boolean;

  hostname!: string;

  port!: number;

  pathname!: string;

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

  get href() {
    return `${this.protocol}//${this.host}${this.path}`;
  }

  get host() {
    return stringifyHost(this.hostname, this.port, this.encrypted ? 443 : 80);
  }

  set host(value) {
    const [hostname, port] = parseHost(value);
    this.hostname = hostname;
    this.port = Number(port ?? (this.encrypted ? 443 : 80));
  }

  get path() {
    return this.pathname + this.search;
  }

  set path(value) {
    const url = new URL(value, 'http://example.com/');
    this.pathname = url.pathname;
    this.search = url.search;
  }

  get search() {
    return String(this.lazySearchParams);
  }

  set search(init) {
    this.lazySearchParams = new LazyURLSearchParams(String(init));
  }

  get searchParams(): LazyURLSearchParams {
    return this.lazySearchParams;
  }

  set searchParams(init: LazyURLSearchParamsInit) {
    this.lazySearchParams = new LazyURLSearchParams(init);
  }

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

  async isLoopBack() {
    const interfaces = os.networkInterfaces();
    let address = this.hostname;
    if (!net.isIP(address)) {
      [address] = await resolve(address);
    }
    const hasLoopBack = Object.values(interfaces).some(
      (list) => list?.some((item) => item.address === address),
    );
    if (!hasLoopBack) {
      return false;
    }
    const addr = this.svr.proxySvr.address();
    if (!addr || typeof addr === 'string') {
      return false;
    }
    return addr.port === this.port;
  }
}
