import { defineRoute } from '@tuner-proxy/core';

import { createConnectInterceptor } from '../interceptor/connect';
import { createRequestInterceptor } from '../interceptor/request';
import { createUpgradeInterceptor } from '../interceptor/upgrade';

export function uiInterceptor() {
  return defineRoute([
    createRequestInterceptor(),
    createConnectInterceptor(),
    createUpgradeInterceptor(),
  ]);
}
