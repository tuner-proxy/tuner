import * as httpUpstream from './http.js';
import * as socksUpstream from './socks.js';
import * as tcpUpstream from './tcp.js';

export default {
  direct: tcpUpstream,
  http: httpUpstream,
  https: httpUpstream,
  proxy: httpUpstream,
  socks: socksUpstream,
  socks4: socksUpstream,
  socks4a: socksUpstream,
  socks5: socksUpstream,
};
