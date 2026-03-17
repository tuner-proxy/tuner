import type { RouteElement, RouteHandleElement } from '../handler.js';

import { flattenRoutes } from './flatten.js';
import type { MatchInfo } from './matcher.js';
import { createURLMatcher } from './matcher.js';

export interface NormalizedRoute {
  matchers: Array<{ pattern: string; match(info: MatchInfo): any }>;
  handler: RouteHandleElement;
}

export function normalizeRoutes(routes: RouteElement[]): NormalizedRoute[] {
  if (!Array.isArray(routes)) {
    throw new TypeError('Proxy rules must be an array');
  }
  return flattenRoutes(routes).map((route) => ({
    matchers: route.patterns.map((pattern) => ({
      pattern,
      match: createURLMatcher(pattern),
    })),
    handler: route.handler,
  }));
}
