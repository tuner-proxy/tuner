import flatMap from 'lodash.flatmap';

import { RouteElement, RouteHandler } from '../handler';

export interface RouteItem {
  patterns: string[];
  handlers: RouteHandler[];
}

export function flattenRoutes(routes: RouteElement[]) {
  const result: RouteItem[] = [];
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
    const handler = routes[i] as RouteHandler;
    let children: RouteItem[] = [{ patterns: [''], handlers: [handler] }];
    if (Array.isArray(handler)) {
      children = flattenRoutes(handler);
    }
    for (const child of children) {
      result.push({
        patterns: flatMap(child.patterns, (childPattern) =>
          activeFragments.map((frag) => frag + childPattern),
        ),
        handlers: child.handlers,
      });
    }
  }
  return result;
}
