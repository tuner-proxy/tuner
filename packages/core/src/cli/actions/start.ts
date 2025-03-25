import * as http from 'node:http';
import { createRequire } from 'node:module';
import type * as net from 'node:net';
import * as path from 'node:path';

import chalk from 'chalk';
import chokidar from 'chokidar';
import debounce from 'lodash.debounce';

import { Server } from '../../Server';
import { buildRoutes, createHandleRequestFn } from '../../router';
import { dispatchReloadEvent } from '../../router/reload';
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

const require = createRequire(import.meta.url);

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

  const server = new Server({
    rootCA,
    proxySvr,
    handleRequest: createHandleRequestHotFn(path.resolve(entry)),
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

function createHandleRequestHotFn(entry: string) {
  let routesPromise = loadRoutes(entry);

  const onChange = () => {
    dispatchReloadEvent();
    for (const path of Object.keys(require.cache)) {
      if (path.includes('node_modules')) {
        continue;
      }
      if (path.startsWith(entry)) {
        delete require.cache[path];
      }
    }
    routesPromise = loadRoutes(entry);
  };

  chokidar
    .watch(entry, { ignored: /node_modules/ })
    .on('change', debounce(onChange, 200, { maxWait: 1000 }));

  return createHandleRequestFn(() => routesPromise);
}

async function loadRoutes(entry: string) {
  try {
    log(chalk.gray('Loading proxy rules'));

    const { default: routes } = require(entry);
    const compiledRoutes = buildRoutes(routes);

    log(chalk.green('Proxy rules loaded'));

    return compiledRoutes;
  } catch (error: any) {
    log(chalk.red('Loading proxy rules error'), '\n', error.stack);
  }
}
