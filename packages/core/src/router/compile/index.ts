import type { RouteElement, RouteHandleElement } from '../handler';

import { flattenRoutes } from './flatten';
import type { MatchInfo } from './matcher';
import { createURLMatcher } from './matcher';

export interface CompiledRoute {
  matchers: Array<{ pattern: string; match(info: MatchInfo): any }>;
  handler: RouteHandleElement;
}

export function buildRoutes(routes: RouteElement[]): CompiledRoute[] {
  if (!Array.isArray(routes)) {
    throw new TypeError('Proxy rules must be an array');
  }
  return flattenRoutes(routes).map((item) => ({
    matchers: item.patterns.map((pattern) => ({
      pattern,
      match: createURLMatcher(pattern),
    })),
    handler: item.handler,
  }));
}
