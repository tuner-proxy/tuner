import flatMap from 'lodash.flatmap';

import type { RouteElement, RouteHandleElement } from '../handler';

export interface FlattenRoute {
  patterns: string[];
  handler: RouteHandleElement;
}

export function flattenRoutes(routes: RouteElement[]) {
  const result: FlattenRoute[] = [];
  for (let i = 0, ii = routes.length; i < ii; i += 1) {
    const fragments: string[] = [];
    for (; i < ii && typeof routes[i] === 'string'; i += 1) {
      fragments.push(routes[i] as string);
    }
    if (!fragments.length) {
      fragments.push('');
    }
    const activeFragments = fragments.filter((i) => i[0] !== '!');
    if (!activeFragments.length) {
      continue;
    }
    const handler = routes[i] as RouteHandleElement;
    let children: FlattenRoute[] = [{ patterns: [''], handler }];
    if (Array.isArray(handler)) {
      children = flattenRoutes(handler);
    }
    for (const child of children) {
      result.push({
        patterns: flatMap(child.patterns, (childPattern) =>
          activeFragments.map((frag) => frag + childPattern),
        ),
        handler: child.handler,
      });
    }
  }
  return result;
}
