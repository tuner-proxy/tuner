import { defineRoute } from '@tuner-proxy/core';

import { uiClient } from './ctrl/client';
import { uiInterceptor } from './ctrl/interceptor';

export * from './ctrl/client';
export * from './ctrl/server';
export * from './types/message';

export { uiClient, uiInterceptor };

export function ui(clientPath: string) {
  return defineRoute([clientPath, uiClient(), uiInterceptor()]);
}
