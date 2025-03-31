import path from 'node:path';

import { defineRoute } from '@tuner-proxy/core';
import { file, html } from '@tuner-proxy/util';

export default defineRoute([
  '//tuner.fun',
  [
    '/',
    html('<h1>It works!</h1>'),

    '/cert',
    file(path.resolve(import.meta.dirname, '../ssl/cert.pem')),
  ],
]);
