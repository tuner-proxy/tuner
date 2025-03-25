import type { RouteElement } from './router/handler';

export * from './encoding';
export * from './router';
export * from './Server';
export * from './stream';
export * from './upstream';
export * from './ca';
export * from './wrapper/BaseRequest';
export * from './wrapper/ConnectRequest';
export * from './wrapper/HTTPRequest';
export * from './wrapper/HTTPResponse';
export * from './wrapper/UpgradeRequest';
export * from './wrapper/URLSearchParams';

export function defineRoute(route: RouteElement[]) {
  return route;
}
