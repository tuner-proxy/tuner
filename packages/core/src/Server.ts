import * as dns from 'dns';
import * as http from 'http';
import * as net from 'net';
import * as os from 'os';
import { promisify } from 'util';

import chalk from 'chalk';
import waitFor from 'event-to-promise';

import { Certificate } from './keygen';
import { Router } from './router';
import { ConnectResult, HTTPResult } from './router/handler';
import { Upstream } from './upstream';
import { log } from './utils';
import { BaseRequest } from './wrapper/BaseRequest';
import { ConnectRequest } from './wrapper/ConnectRequest';
import { HTTPRequest } from './wrapper/HTTPRequest';
import { HTTPResponse } from './wrapper/HTTPResponse';
import { UpgradeRequest } from './wrapper/UpgradeRequest';

export interface ServerOptions {
  rootCA: Certificate;
  router: Router;
}

const resolve = promisify(dns.resolve);

export class Server {
  rootCA: Certificate;
  router: Router;
  upstream: Upstream;
  proxySvr: http.Server;

  constructor(options: ServerOptions) {
    this.rootCA = options.rootCA;
    this.router = options.router;
    this.upstream = new Upstream();

    this.proxySvr = http.createServer();

    this.proxySvr.on('connect', (req, socket, head) => {
      this.handleConnectRequest(new ConnectRequest(this, req, socket, head));
    });

    this.proxySvr.on('request', (req, rawRes) => {
      this.handleHTTPRequest(new HTTPRequest(this, req, rawRes));
    });

    this.proxySvr.on('upgrade', (req, socket, head) => {
      this.handleUpgradeRequest(new UpgradeRequest(this, req, socket, head));
    });

    this.proxySvr.on('listening', () => {
      const addr = this.proxySvr.address() as net.AddressInfo;
      log(chalk.green(`Server listening at ${addr.port}`));
    });

    this.proxySvr.on('clientError', (error) => {
      log(chalk.red('Client error'), '\n', error);
    });
  }

  listen(port: string | number) {
    this.proxySvr.listen(port);
  }

  async handleConnectRequest(req: ConnectRequest) {
    log(chalk.cyan('CONNECT'), req.originalUrl);

    let responseHeaderSent = false;
    try {
      req.socket.pause();

      const upstreamSocket = await this.router.handleRequest<ConnectResult>(
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

  async handleHTTPRequest(req: HTTPRequest) {
    log(chalk.cyan(req.method), req.originalUrl);

    try {
      const routerRes = await this.router.handleRequest<HTTPResult>(
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

  async handleUpgradeRequest(req: UpgradeRequest) {
    log(chalk.cyan('UPGRADE'), req.originalUrl);

    try {
      const upstreamSocket = await this.router.handleRequest<ConnectResult>(
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
  const hasLoopBack = Object.values(interfaces).some(
    (list) => list?.some((item) => item.address === address),
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
