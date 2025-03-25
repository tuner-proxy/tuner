import * as dns from 'node:dns';
import type * as http from 'node:http';
import * as net from 'node:net';
import * as os from 'node:os';
import { promisify } from 'node:util';

import chalk from 'chalk';
import waitFor from 'event-to-promise';

import type { Certificate } from './ca';
import type { ConnectResult, HTTPResult, HandleRequestFn } from './router';
import { Upstream } from './upstream';
import { log } from './utils';
import type { BaseRequest } from './wrapper/BaseRequest';
import type { ConnectRequest } from './wrapper/ConnectRequest';
import type { HTTPRequest } from './wrapper/HTTPRequest';
import { HTTPResponse } from './wrapper/HTTPResponse';
import type { UpgradeRequest } from './wrapper/UpgradeRequest';

export interface ServerOptions {
  /**
   * Root CA certificate
   */
  rootCA: Certificate;
  /**
   * HTTP proxy server
   */
  proxySvr: http.Server;
  /**
   * Request handler
   */
  handleRequest: HandleRequestFn;
}

const resolve = promisify(dns.resolve);

export class Server {
  /**
   * Root CA certificate
   */
  rootCA: Certificate;

  /**
   * Upstream manager instance
   */
  upstream: Upstream;

  /**
   * HTTP proxy server
   */
  proxySvr: http.Server;

  /**
   * Request handler
   */
  handleRequest: HandleRequestFn;

  constructor(options: ServerOptions) {
    this.rootCA = options.rootCA;
    this.proxySvr = options.proxySvr;

    this.upstream = new Upstream();
    this.handleRequest = options.handleRequest;
  }

  /**
   * Handle connect request with tuner routes
   */
  async handleConnectRequest(req: ConnectRequest) {
    log(chalk.cyan('CONNECT'), req.originalUrl);

    let responseHeaderSent = false;
    try {
      req.socket.pause();

      const upstreamSocket = await this.handleRequest<ConnectResult>(
        'connect',
        req.originalUrl,
        req,
        () => req.connect(),
      );

      if (!upstreamSocket) {
        log(chalk.blue('CONNECT'), chalk.cyan('accepted'), req.originalUrl);
        return;
      }

      if ((upstreamSocket as net.Socket).connecting) {
        await waitFor(upstreamSocket, 'connect');
      }

      responseHeaderSent = req.responseHeaderSent;

      req.socket.once('error', () => upstreamSocket.destroy());
      upstreamSocket.once('error', () => req.socket.destroy());

      if (!responseHeaderSent) {
        responseHeaderSent = true;
        req.socket.write('HTTP/1.1 200 OK\r\n\r\n');
      }

      upstreamSocket.pipe(req.socket);
      upstreamSocket.write(req.head);
      req.socket.pipe(upstreamSocket);

      req.socket.resume();

      log(chalk.green('CONNECT'), req.originalUrl);
    } catch (error) {
      log(chalk.red('CONNECT'), req.originalUrl, '\n', error);

      if (!responseHeaderSent) {
        req.socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
        req.socket.end();
      } else {
        req.socket.destroy();
      }
    }
  }

  /**
   * Handle HTTP request with tuner routes
   */
  async handleHTTPRequest(req: HTTPRequest) {
    log(chalk.cyan(req.method), req.originalUrl);

    try {
      const routerRes = await this.handleRequest<HTTPResult>(
        'common',
        req.originalUrl,
        req,
        async () => {
          if (!(await isLoopBack(req))) {
            return req.send();
          }
          log(chalk.red(req.method), chalk.red('loop back'), req.originalUrl);
          return HTTPResponse.from({
            status: 404,
            body: 'Tuner Server - Not Found',
          });
        },
        (res) => {
          if (!res) {
            return res;
          }
          return HTTPResponse.from(res);
        },
      );

      if (!routerRes) {
        log(chalk.blue(req.method), chalk.cyan('accepted'), req.originalUrl);
        return;
      }

      const res = HTTPResponse.from(routerRes);
      log(
        chalk.green(req.method),
        chalk.blueBright(res.statusCode),
        req.originalUrl,
      );

      await req.respondWith(res, { consume: true });

      log(
        chalk.green(req.method),
        chalk.green(res.statusCode),
        req.originalUrl,
      );
    } catch (error) {
      log(chalk.red(req.method), req.originalUrl, '\n', error);

      if (req.res.writable) {
        req.res.writeHead(502);
      }
      req.res.end();
    }
  }

  /**
   * Handle upgrade request with tuner routes
   */
  async handleUpgradeRequest(req: UpgradeRequest) {
    log(chalk.cyan('UPGRADE'), req.originalUrl);

    try {
      const upstreamSocket = await this.handleRequest<ConnectResult>(
        'upgrade',
        req.originalUrl,
        req,
        async () => {
          if (!(await isLoopBack(req))) {
            return req.connect();
          }
          log(chalk.red('UPGRADE'), chalk.red('loop back'), req.originalUrl);
          req.socket.write('HTTP/1.1 200 OK\r\n\r\n');
          req.socket.end();
        },
      );

      if (!upstreamSocket) {
        log(chalk.blue('UPGRADE'), chalk.cyan('accepted'), req.originalUrl);
        return;
      }

      if ((upstreamSocket as net.Socket).connecting) {
        await waitFor(upstreamSocket, 'connect');
      }

      req.socket.once('error', () => upstreamSocket!.destroy());
      upstreamSocket.once('error', () => req.socket.destroy());

      upstreamSocket.pipe(req.socket);

      upstreamSocket.write(
        `${req.method} ${req.path} HTTP/${req.raw.httpVersion}\r\n`,
      );
      for (let i = 0, ii = req.raw.rawHeaders.length; i < ii; i += 2) {
        upstreamSocket.write(
          `${req.raw.rawHeaders[i]}: ${req.raw.rawHeaders[i + 1]}\r\n`,
        );
      }
      upstreamSocket.write('\r\n');
      upstreamSocket.write(req.head);

      req.socket.pipe(upstreamSocket);

      log(chalk.green('UPGRADE'), req.originalUrl);
    } catch (error) {
      log(chalk.red('UPGRADE'), req.originalUrl, '\n', error);

      req.socket.destroy();
    }
  }
}

async function isLoopBack(req: BaseRequest) {
  const interfaces = os.networkInterfaces();
  let address = req.hostname;
  if (!net.isIP(address)) {
    [address] = await resolve(address);
  }
  const hasLoopBack = Object.values(interfaces).some((list) =>
    list?.some((item) => item.address === address),
  );
  if (!hasLoopBack) {
    return false;
  }
  const addr = req.svr.proxySvr.address();
  if (!addr || typeof addr === 'string') {
    return false;
  }
  return addr.port === req.port;
}
