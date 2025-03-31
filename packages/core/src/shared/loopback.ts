import net from 'net';
import dns from 'node:dns';
import { promisify } from 'node:util';
import os from 'os';

import type { TunerRequest } from './types';

const resolve = promisify(dns.resolve);

export async function isLoopBack(req: TunerRequest) {
  const interfaces = os.networkInterfaces();
  let address = req.hostname;
  if (!net.isIP(address)) {
    [address] = await resolve(address);
  }
  const hasLoopBack = Object.values(interfaces).some((list) =>
    list?.some((item) => item.address === address),
  );
  if (!hasLoopBack) {
    return false;
  }
  const addr = req.svr.proxySvr.address();
  if (!addr || typeof addr === 'string') {
    return false;
  }
  return addr.port === req.port;
}
