import https from 'node:https';

import { HTTPRequest, UpgradeRequest } from '@tuner-proxy/core';
import chalk from 'chalk';

import { forwardSvr } from '../shared/forward';
import { log } from '../shared/log';
import { getTlsOptions } from '../shared/tls';

/**
 * Decode http(s) request
 */
export const decode = () =>
  forwardSvr('http', async (svr, secure, servername) => {
    if (!secure) {
      return svr.proxySvr;
    }
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
  });

/**
 * Decrypt https request
 *
 * @deprecated use `decode` instead
 */
export const decrypt = decode;
