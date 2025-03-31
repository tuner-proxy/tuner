import https from 'node:https';

import type { Server } from '@tuner-proxy/core';
import { HTTPRequest, UpgradeRequest } from '@tuner-proxy/core';
import chalk from 'chalk';

import { forwardHttpSvr } from '../shared/forward';
import { log } from '../shared/log';
import { getTlsOptions } from '../shared/tls';

/**
 * Decode http(s) request
 */
export const decode = () =>
  forwardHttpSvr(
    async (svr) => svr.proxySvr,
    async (svr: Server, servername: string | undefined) => {
      const tlsOptions = await getTlsOptions(svr, servername);
      const tlsSvr = https.createServer(tlsOptions);

      tlsSvr.on('request', (req, res) => {
        svr.handleHTTPRequest(new HTTPRequest(svr, req, res));
      });

      tlsSvr.on('upgrade', (req, socket, head) => {
        svr.handleUpgradeRequest(new UpgradeRequest(svr, req, socket, head));
      });

      tlsSvr.on('tlsClientError', (error) => {
        log(chalk.red('TLS client error'), '\n', error);
      });

      tlsSvr.listen();

      return tlsSvr;
    },
  );

/**
 * Decrypt https request
 *
 * @deprecated use `decode` instead
 */
export const decrypt = decode;
