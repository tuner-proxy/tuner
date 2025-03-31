import { defineRoutes } from '@tuner-proxy/core';

import { createConnectInterceptor } from '../interceptor/connect';
import { createRequestInterceptor } from '../interceptor/request';
import { createUpgradeInterceptor } from '../interceptor/upgrade';

export function uiInterceptor() {
  return defineRoutes([
    createRequestInterceptor(),
    createConnectInterceptor(),
    createUpgradeInterceptor(),
  ]);
}
