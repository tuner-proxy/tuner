import * as http2 from 'http2';

import { HTTPRequest, Server } from '@tuner-proxy/core';

import { forwardSvr } from '../shared/forward';
import { getSNICallback } from '../shared/tls';

import { persist } from './persist';

export const getH2Svr = persist('tuner-util:h2-svr', (svr: Server) => {
  const h2Svr = http2.createSecureServer({
    key: svr.rootCA.key,
    cert: svr.rootCA.cert,
    SNICallback: getSNICallback(svr),
  });

  h2Svr.on('request', (req, res) => {
    svr.handleHTTPRequest(new HTTPRequest(svr, req, res));
  });

  h2Svr.listen();

  return h2Svr;
});

/**
 * Decrypt http/2 request
 */
export const h2 = () => forwardSvr(getH2Svr);
