import type { RouteElement } from './handler.js';

export * from './build.js';
export * from './handler.js';

export function defineRoutes(routes: RouteElement[]) {
  return routes;
}
