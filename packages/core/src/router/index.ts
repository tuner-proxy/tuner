import type { RouteElement } from './handler';

export * from './compile';
export * from './handler';
export * from './routes';

export function defineRoute(route: RouteElement[]) {
  return route;
}
