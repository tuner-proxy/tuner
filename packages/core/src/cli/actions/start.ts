import http from 'node:http';
import type net from 'node:net';
import path from 'node:path';

import chalk from 'chalk';

import { Server } from '../../Server.js';
import { log } from '../../shared/utils.js';
import { ConnectRequest } from '../../wrapper/ConnectRequest.js';
import { HTTPRequest } from '../../wrapper/HTTPRequest.js';
import { UpgradeRequest } from '../../wrapper/UpgradeRequest.js';
import { resolveRootCA } from '../ca.js';

export interface StartParams {
  cert: string;
  key: string;
  port: string;
}

export async function start(entry: string, args: StartParams) {
  const rootCA = await resolveRootCA({
    cert: path.resolve(args.cert),
    key: path.resolve(args.key),
  });

  const proxySvr = http.createServer();

  proxySvr.on('listening', () => {
    const addr = proxySvr.address() as net.AddressInfo;
    log(chalk.green(`Server listening at http://127.0.0.1:${addr.port}`));
  });

  proxySvr.on('clientError', (error) => {
    log(chalk.red('Client error'), '\n', error);
  });

  const { default: handleRequest } = await import(path.resolve(entry));
  const server = new Server({
    rootCA,
    proxySvr,
    handleRequest,
  });

  proxySvr.on('connect', (req, socket, head) => {
    server.handleConnectRequest(new ConnectRequest(server, req, socket, head));
  });

  proxySvr.on('request', (req, res) => {
    server.handleHTTPRequest(new HTTPRequest(server, req, res));
  });

  proxySvr.on('upgrade', (req, socket, head) => {
    server.handleUpgradeRequest(new UpgradeRequest(server, req, socket, head));
  });

  proxySvr.listen(Number(args.port));
}
