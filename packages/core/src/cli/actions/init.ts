import path from 'node:path';

import { installRootCA } from '../../ca';
import { resolveRootCA } from '../ca';

export interface InitParams {
  cert: string;
  key: string;
  force: boolean;
  install: boolean;
}

export async function init(args: InitParams) {
  const certPath = path.resolve(args.cert);
  await resolveRootCA({
    cert: certPath,
    key: path.resolve(args.key),
    force: args.force,
  });
  if (args.install) {
    installRootCA(certPath);
  }
}
