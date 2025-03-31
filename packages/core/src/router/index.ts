import type { RouteElement } from './handler';

export * from './build';
export * from './handler';

export function defineRoutes(routes: RouteElement[]) {
  return routes;
}
