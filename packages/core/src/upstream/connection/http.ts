import * as http from 'http';
import * as https from 'https';

import { stringifyHost } from '../../utils';
import type { ConnectOptions } from '../connect';

export interface HTTPProxyOptions {
  type: 'http' | 'https' | 'proxy';
  hostname: string;
  port: number;
  auth?: string;
}

export async function connect(
  proxy: HTTPProxyOptions,
  options: ConnectOptions,
) {
  const encrypted = proxy.type === 'https';

  const headers: http.IncomingHttpHeaders = {
    host: stringifyHost(options.hostname, options.port),
  };
  if (options.headers?.['user-agent']) {
    headers['user-agent'] = options.headers['user-agent'];
  }
  if (proxy.auth) {
    const authorization = Buffer.from(proxy.auth).toString('base64');
    headers['proxy-authorization'] = `Basic ${authorization}`;
  }

  const req = (encrypted ? https : http).request({
    servername: proxy.hostname,
    hostname: proxy.hostname,
    port: proxy.port,
    method: 'CONNECT',
    path: headers.host,
    headers,
  });

  req.end();

  try {
    return await new Promise((resolve, reject) => {
      req.once('error', reject);
      req.once('response', (res) => {
        reject(new Error(`Invalid proxy response ${res.statusCode}`));
      });
      req.once('upgrade', (res_1) => {
        reject(new Error(`Invalid proxy response ${res_1.statusCode}`));
      });
      req.once('connect', (res_2, socket) => {
        if (res_2.statusCode === 200) {
          return resolve(socket);
        }
        reject(new Error(`Invalid proxy response ${res_2.statusCode}`));
      });
    });
  } catch (error) {
    req.destroy();
    throw error;
  }
}
