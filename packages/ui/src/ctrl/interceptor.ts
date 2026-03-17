import { defineRoutes } from '@tuner-proxy/core';

import { createConnectInterceptor } from '../interceptor/connect.js';
import { createRequestInterceptor } from '../interceptor/request.js';
import { createUpgradeInterceptor } from '../interceptor/upgrade.js';

export function uiInterceptor() {
  return defineRoutes([
    createRequestInterceptor(),
    createConnectInterceptor(),
    createUpgradeInterceptor(),
  ]);
}
