import type http from 'node:http';
import type net from 'node:net';

import chalk from 'chalk';
import waitFor from 'event-to-promise';

import type { Certificate } from './ca';
import type { HandleRequestFn } from './shared/types';
import { log } from './shared/utils';
import { Upstream } from './upstream';
import type { ConnectRequest } from './wrapper/ConnectRequest';
import type { HTTPRequest } from './wrapper/HTTPRequest';
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

      await this.handleRequest(req);
      const upstreamSocket = req.upstreamSocket;

      // the request is handled by the handler
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

      // send proxy connect success -> client
      if (!responseHeaderSent) {
        responseHeaderSent = true;
        req.socket.write('HTTP/1.1 200 OK\r\n\r\n');
      }

      // flush client head -> upstream
      upstreamSocket.write(req.head);

      // pipe client <-> upstream
      upstreamSocket.pipe(req.socket);
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
      await this.handleRequest(req);
      const res = req.response;

      // the request is handled by the handler
      if (!res) {
        log(chalk.blue(req.method), chalk.cyan('accepted'), req.originalUrl);
        return;
      }

      // respond with provided response
      log(
        chalk.green(req.method),
        chalk.blueBright(res.statusCode),
        req.originalUrl,
      );
      await req.sendResponse(res, { consume: true });

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
      req.socket.pause();

      await this.handleRequest(req);
      const upstreamSocket = req.upstreamSocket;

      // the request is handled by the handler
      if (!upstreamSocket) {
        log(chalk.blue('UPGRADE'), chalk.cyan('accepted'), req.originalUrl);
        return;
      }

      if ((upstreamSocket as net.Socket).connecting) {
        await waitFor(upstreamSocket, 'connect');
      }
      req.socket.once('error', () => upstreamSocket!.destroy());
      upstreamSocket.once('error', () => req.socket.destroy());

      // send upgrade head -> upstream
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

      // pipe client <-> upstream
      upstreamSocket.pipe(req.socket);
      req.socket.pipe(upstreamSocket);
      req.socket.resume();

      log(chalk.green('UPGRADE'), req.originalUrl);
    } catch (error) {
      log(chalk.red('UPGRADE'), req.originalUrl, '\n', error);

      req.socket.destroy();
    }
  }
}
