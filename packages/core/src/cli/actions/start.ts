import * as path from 'path';

import { Server } from '../../Server';
import { loadHotRouter } from '../../router';
import { resolveRootCA } from '../ca';

export interface StartParams {
  cert: string;
  key: string;
  port: string;
}

export async function start(entry: string, args: StartParams) {
  const server = new Server({
    rootCA: await resolveRootCA({
      cert: path.resolve(args.cert),
      key: path.resolve(args.key),
    }),
    handleRequest: loadHotRouter(path.resolve(entry || '.')),
  });
  server.listen(Number(args.port));
}
