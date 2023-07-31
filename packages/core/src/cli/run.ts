import * as path from 'path';

import { Server } from '../Server';
import { Router } from '../router';

import { getRootCA } from './rootCA';

export interface RunParams {
  cert: string;
  key: string;
  port: string;
}

export async function run(entry: string, args: RunParams) {
  const server = new Server({
    rootCA: await getRootCA({
      key: path.resolve(args.key),
      cert: path.resolve(args.cert),
    }),
    router: new Router(path.resolve(entry || '.')),
  });

  server.listen(Number(args.port));
}
