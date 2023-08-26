import * as https from 'https';
import * as tls from 'tls';

import { HTTPRequest, UpgradeRequest, Server } from '@tuner-proxy/core';
import chalk from 'chalk';

import { log } from '../shared/log';
import { forwardTlsSvr } from '../shared/tls/forward';

/**
 * Decrypt https request
 */
export const decrypt = () =>
  forwardTlsSvr((svr: Server, tlsOptions: tls.TlsOptions) => {
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
