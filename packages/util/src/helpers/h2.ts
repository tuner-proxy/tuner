import * as http2 from 'http2';
import * as tls from 'tls';

import { HTTPRequest, Server } from '@tuner-proxy/core';

import { forwardTlsSvr } from '../shared/tls/forward';

/**
 * Decrypt http/2 request
 */
export const h2 = () =>
  forwardTlsSvr((svr: Server, tlsOptions: tls.TlsOptions) => {
    const h2Svr = http2.createSecureServer(tlsOptions);

    h2Svr.on('request', (req, res) => {
      svr.handleHTTPRequest(new HTTPRequest(svr, req, res));
    });

    h2Svr.listen();

    return h2Svr;
  });
