import { defineRoute } from '@tuner-proxy/core';
import { decrypt, ensecure, responseAll } from '@tuner-proxy/util';

import { getViteRoute } from './vite';

export function vite(vitePath: string) {
  return defineRoute([
    decrypt(),
    ensecure(),
    getViteRoute(vitePath),

    '/::path',
    responseAll({ status: 404 }),
  ]);
}
