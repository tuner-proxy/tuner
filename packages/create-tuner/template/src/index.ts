import path from 'node:path';

import { defineRoutes } from '@tuner-proxy/core';
import { file, html } from '@tuner-proxy/util';

export default defineRoutes([
  '//tuner.fun',
  [
    '/',
    html('<h1>It works!</h1>'),

    '/cert',
    file(path.resolve(import.meta.dirname, '../ssl/cert.pem')),
  ],
]);
