import { defineRoutes } from '@tuner-proxy/core';
import { decode, ensecure, responseAll } from '@tuner-proxy/util';

import { getViteRoute } from './vite';

export function vite(vitePath: string) {
  return defineRoutes([
    decode(),
    ensecure(),
    getViteRoute(vitePath),

    '/::path',
    responseAll({ status: 404 }),
  ]);
}
