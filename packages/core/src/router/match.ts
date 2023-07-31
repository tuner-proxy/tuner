import flatMap from 'lodash.flatmap';

import { DEFAULT_PORT } from '../utils';

import { CompiledRoute } from './compile';
import { MatchInfo } from './compile/matcher';
import { RouteHandler } from './handler';

export interface MatchedRoute {
  params: any;
  handler: RouteHandler;
}

export function matchRoutes(routeList: CompiledRoute[], originalUrl: string) {
  const url = new URL(originalUrl);

  const info: MatchInfo = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || DEFAULT_PORT[url.protocol] || '',
    pathname: url.pathname,
    searchParams: url.searchParams,
  };

  return flatMap(routeList, ({ matchers, handlers }) => {
    for (const { match } of matchers) {
      const params = match(info);
      if (params) {
        return handlers.map((handler) => ({ params, handler }));
      }
    }
    return [];
  });
}
