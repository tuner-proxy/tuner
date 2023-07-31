import { RouteElement, RouteHandler } from '../handler';

import { flattenRoutes } from './flatten';
import { MatchInfo, createURLMatcher } from './matcher';

export interface CompiledRoute {
  matchers: Array<{ pattern: string; match(info: MatchInfo): any }>;
  handlers: RouteHandler[];
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
    handlers: item.handlers,
  }));
}
