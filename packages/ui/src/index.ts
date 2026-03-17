import { defineRoutes } from '@tuner-proxy/core';

import { uiClient } from './ctrl/client.js';
import { uiInterceptor } from './ctrl/interceptor.js';

export * from './ctrl/client.js';
export * from './ctrl/server.js';
export * from './types/message.js';

export { uiClient, uiInterceptor };

export function ui(clientPath: string) {
  return defineRoutes([clientPath, uiClient(), uiInterceptor()]);
}
