import * as https from 'https';

import { HTTPRequest, UpgradeRequest, Server } from '@tuner-proxy/core';
import chalk from 'chalk';

import { forwardSvr } from '../shared/forward';
import { log } from '../shared/log';
import { getSNICallback } from '../shared/tls';

import { persist } from './persist';

export const getHTTPSSvr = persist('tuner-util:https-svr', (svr: Server) => {
  const tlsSvr = https.createServer({
    key: svr.rootCA.key,
    cert: svr.rootCA.cert,
    SNICallback: getSNICallback(svr),
  });

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
 */
export const decrypt = () => forwardSvr(getHTTPSSvr);
