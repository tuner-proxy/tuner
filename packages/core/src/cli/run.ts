import * as path from 'path';

import { Server } from '../Server';
import { loadHotRouter } from '../router';

import { getRootCA } from './rootCA';

export interface RunParams {
  cert: string;
  key: string;
  port: string;
}

export async function start(entry: string, args: RunParams) {
  const server = new Server({
    rootCA: await getRootCA({
      key: path.resolve(args.key),
      cert: path.resolve(args.cert),
    }),
    handleRequest: loadHotRouter(path.resolve(entry || '.')),
  });

  server.listen(Number(args.port));
}
