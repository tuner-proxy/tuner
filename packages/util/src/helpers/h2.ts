import http2 from 'node:http2';

import type { Server } from '@tuner-proxy/core';
import { HTTPRequest } from '@tuner-proxy/core';

import { forwardSvr } from '../shared/forward';
import { getTlsOptions } from '../shared/tls';

/**
 * Decode http/2 request
 */
export const h2 = () =>
  forwardSvr('tls', async (svr, secure, servername) => {
    if (!secure) {
      return bindH2Svr(svr, http2.createServer());
    }
    const tlsOptions = await getTlsOptions(svr, servername);
    return bindH2Svr(svr, http2.createSecureServer(tlsOptions));
  });

function bindH2Svr(svr: Server, h2Svr: http2.Http2Server) {
  h2Svr.on('request', (req, res) => {
    svr.handleHTTPRequest(new HTTPRequest(svr, req, res));
  });
  h2Svr.listen();
  return h2Svr;
}
