import axios from 'axios';
import flatten from 'lodash.flatten';
import { LRUCache } from 'lru-cache';
import { createPacResolver } from 'pac-resolver';
import { getQuickJS } from 'quickjs-emscripten';

import { parseHost } from '../utils';
import { BaseRequest } from '../wrapper/BaseRequest';

import { HTTPProxyAgent } from './HTTPProxyAgent';
import { HTTPSProxyAgent } from './HTTPSProxyAgent';
import { connect, ProxyOptions } from './connect';

type PacResolver = ReturnType<typeof createPacResolver>;

export class Upstream {
  httpAgent = new HTTPProxyAgent({ keepAlive: true });

  httpsAgent = new HTTPSProxyAgent({ keepAlive: true });

  connect = connect;

  pacCache = new LRUCache<string, PacResolver>({ max: 20 });

  async resolveProxyList(req: BaseRequest): Promise<ProxyOptions[]> {
    const { href, hostname } = req;
    let { upstream } = req;
    if (!Array.isArray(upstream)) {
      upstream = [upstream];
    }
    return flatten(
      await Promise.all(
        upstream.map(async (proxy: any) => {
          if (!proxy || proxy === 'direct') {
            return { type: 'direct' };
          }

          let parsedProxy = proxy;
          if (typeof proxy === 'string') {
            parsedProxy = parseProxy(proxy);
          }

          if (parsedProxy.type !== 'pac') {
            return parsedProxy;
          }

          if (!this.pacCache.has(parsedProxy.url)) {
            this.pacCache.set(
              parsedProxy.url,
              await getPacResolver(parsedProxy.url),
            );
          }

          const findProxy = this.pacCache.get(parsedProxy.url)!;
          const proxyList: string = await findProxy(href, hostname);

          return proxyList.split(';').map((item) => {
            const [type, host] = item.trim().split(/\s+/);
            const [hostname, port] = parseHost(host);
            return { type: type.toLowerCase(), hostname, port };
          });
        }),
      ),
    );
  }
}

function parseProxy(proxy: string) {
  const parsed = new URL(proxy);
  if (parsed.protocol.toLowerCase().startsWith('pac+')) {
    return { type: 'pac', url: proxy.slice(4) };
  }
  return {
    type: parsed.protocol.replace(/:$/, ''),
    hostname: parsed.hostname,
    port: parsed.port,
    auth: stringifyAuth(parsed),
  };
}

function stringifyAuth(url: URL) {
  if (!url.username && !url.password) {
    return;
  }
  if (!url.password) {
    return url.username;
  }
  return `${url.username}:${url.password}`;
}

async function getPacResolver(url: string) {
  const [res, qjs] = await Promise.all([
    axios.get<string>(url, { responseType: 'text' }),
    getQuickJS(),
  ]);
  return createPacResolver(qjs, res.data);
}
