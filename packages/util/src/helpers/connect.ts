import http2 from 'node:http2';
import https from 'node:https';
import net from 'node:net';
import type tls from 'node:tls';

import type { Server } from '@tuner-proxy/core';
import { connectHandler, HTTPRequest, UpgradeRequest } from '@tuner-proxy/core';
import chalk from 'chalk';
import waitFor from 'event-to-promise';

import { log } from '../shared/log';
import { getCertificate } from '../shared/tls';

import { definePersist } from './persist';

export type DecoderServerType = 'http' | 'https' | 'h2c' | 'h2';

const getDecodeServer = definePersist('tuner-util:decode-server', (svr) => {
  const cache = new Map<DecoderServerType, net.Server>();
  return (type: DecoderServerType) => {
    if (!cache.has(type)) {
      cache.set(type, createDecodeServer(svr, type));
    }
    return cache.get(type)!;
  };
});

/**
 * Decode connect body
 */
export const decode = (type: DecoderServerType = 'https') =>
  connectHandler(async (req) => {
    const server = getDecodeServer(req.svr)(type);
    if (!server.listening) {
      await waitFor(server, 'listening');
    }
    const addr = server.address() as net.AddressInfo;
    const socket = net.connect(addr.port, addr.address);
    req.upstreamSocket = socket;
  });

function createDecodeServer(svr: Server, type: DecoderServerType) {
  if (type === 'http') {
    return svr.proxySvr;
  }
  if (type === 'h2c') {
    return bindH2Svr(svr, http2.createServer());
  }
  const tlsOptions: tls.TlsOptions = {
    SNICallback(servername, callback) {
      getCertificate(svr, servername).then((res) => {
        callback(null, res.context);
      }, callback);
    },
  };
  if (type === 'h2') {
    const server = http2.createSecureServer(tlsOptions);

    server.on('sessionError', (error) => {
      log(chalk.red('HTTP/2 session error'), '\n', error);
    });

    return bindH2Svr(svr, server);
  }
  const server = https.createServer(tlsOptions);

  server.on('request', (req, res) => {
    svr.handleHTTPRequest(new HTTPRequest(svr, req, res));
  });

  server.on('upgrade', (req, socket, head) => {
    svr.handleUpgradeRequest(new UpgradeRequest(svr, req, socket, head));
  });

  server.on('tlsClientError', (error) => {
    log(chalk.red('TLS client error'), '\n', error);
  });

  server.listen(0, 'localhost');

  return server;
}

function bindH2Svr(svr: Server, h2Svr: http2.Http2Server) {
  h2Svr.on('request', (req, res) => {
    svr.handleHTTPRequest(new HTTPRequest(svr, req, res));
  });
  h2Svr.listen(0, 'localhost');
  return h2Svr;
}
