import * as http2 from 'http2';

import { HTTPRequest, Server } from '@tuner-proxy/core';

import { forwardHttpSvr } from '../shared/forward';
import { getTlsOptions } from '../shared/tls';

/**
 * Decode http/2 request
 */
export const h2 = () =>
  forwardHttpSvr(
    async (svr) => bindH2Svr(svr, http2.createServer()),
    async (svr, servername) => {
      const tlsOptions = await getTlsOptions(svr, servername);
      return bindH2Svr(svr, http2.createSecureServer(tlsOptions));
    },
  );

function bindH2Svr(svr: Server, h2Svr: http2.Http2Server) {
  h2Svr.on('request', (req, res) => {
    svr.handleHTTPRequest(new HTTPRequest(svr, req, res));
  });
  h2Svr.listen();
  return h2Svr;
}
