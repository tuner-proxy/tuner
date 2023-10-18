import * as http from 'http';
import * as net from 'net';
import * as path from 'path';

import chalk from 'chalk';
import chokidar from 'chokidar';
import debounce from 'lodash.debounce';

import { Server } from '../../Server';
import { dispatchReloadEvent } from '../../router/reload';
import { HandleRequestFn, loadRouter } from '../../router/router';
import { log } from '../../utils';
import { ConnectRequest } from '../../wrapper/ConnectRequest';
import { HTTPRequest } from '../../wrapper/HTTPRequest';
import { UpgradeRequest } from '../../wrapper/UpgradeRequest';
import { resolveRootCA } from '../ca';

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
    log(chalk.green(`Server listening at ${addr.port}`));
  });

  proxySvr.on('clientError', (error) => {
    log(chalk.red('Client error'), '\n', error);
  });

  const server = new Server({
    rootCA,
    proxySvr,
    handleRequest: loadHotRouter(path.resolve(entry)),
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

function loadHotRouter(entry: string): HandleRequestFn {
  let handleRequest = loadRouter(entry);

  const onChange = () => {
    dispatchReloadEvent();
    for (const path of Object.keys(require.cache)) {
      if (!path.includes('node_modules') && path.startsWith(entry)) {
        delete require.cache[path];
      }
    }
    handleRequest = loadRouter(entry);
  };

  chokidar
    .watch(entry, { ignored: /node_modules/ })
    .on('change', debounce(onChange, 200, { maxWait: 1000 }));

  return (...args) => handleRequest(...args);
}
