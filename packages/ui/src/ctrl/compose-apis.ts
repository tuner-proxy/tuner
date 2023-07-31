import http from 'http';
import https from 'https';
import { AddressInfo } from 'net';
import { Readable } from 'stream';

import { defineRoute } from '@tuner-proxy/core';
import busboy from 'busboy';

export const composeApis = () =>
  defineRoute([
    '/send',
    async (req) => {
      let params: {
        encrypted: string;
        host: string;
        method: string;
        url: string;
        headers: string[];
      };

      const body = await new Promise<Readable>((resolve, reject) => {
        const bb = busboy({ headers: req.headers });
        bb.on('field', (name, value) => {
          params = JSON.parse(value);
        });
        bb.on('file', (name, file) => {
          if (name === 'body') {
            resolve(file);
          } else {
            file.resume();
          }
        });
        bb.on('close', resolve);
        bb.once('error', reject);
        req.stream().pipe(bb);
      });

      const headers: Record<string, any> = Object.create(null);
      for (let i = 0, ii = params!.headers.length; i < ii; i += 2) {
        const key = params!.headers[i];
        const value = params!.headers[i + 1];
        if (Array.isArray(headers[key])) {
          headers[key].push(value);
        } else if (headers[key] != null) {
          headers[key] = [headers[key], params!.headers[i + 1]];
        } else {
          headers[key] = value;
        }
      }

      const client = params!.encrypted ? https : http;
      const proxyAddress = req.svr.proxySvr.address() as AddressInfo;

      const proxyOptions = {
        proxyList: [
          {
            type: 'http',
            hostname: proxyAddress.address,
            port: proxyAddress.port,
          },
        ],
      };

      const agent = params!.encrypted
        ? req.svr.upstream.httpsAgent
        : req.svr.upstream.httpAgent;

      const hostParser = new URL('https://example.com/');

      hostParser.protocol = params!.encrypted ? 'https:' : 'http:';
      hostParser.host = params!.host;

      const clientReq = client.request({
        hostname: hostParser.hostname,
        port: hostParser.port ?? params!.encrypted ? 443 : 80,
        method: params!.method,
        path: params!.url,
        headers,
        agent,
        rejectUnauthorized: false,
        ...proxyOptions,
      });

      body.pipe(clientReq);

      return { status: 200 };
    },
  ]);
