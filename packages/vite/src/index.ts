import { defineRoute } from '@tuner-proxy/core';
import { decode, ensecure, responseAll } from '@tuner-proxy/util';

import { getViteRoute } from './vite';

export function vite(vitePath: string) {
  return defineRoute([
    decode(),
    ensecure(),
    getViteRoute(vitePath),

    '/::path',
    responseAll({ status: 404 }),
  ]);
}
