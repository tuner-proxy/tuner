import flatMap from 'lodash.flatmap';

import type { TunerRequest } from '../shared/types';
import { DEFAULT_PORT } from '../shared/utils';

import type {
  RouteNextFn,
  RouteHandler,
  RouteHandleElement,
  HTTPProcessFn,
} from './handler';
import type { NormalizedRoute } from './normalize';
import type { MatchInfo } from './normalize/matcher';

export function execRoutes<T extends TunerRequest>(
  req: T,
  routes: NormalizedRoute[],
): Promise<void> {
  const reqUrl = new URL(req.originalUrl);

  const matchInfo: MatchInfo = {
    protocol: reqUrl.protocol,
    hostname: reqUrl.hostname,
    port: reqUrl.port || DEFAULT_PORT[reqUrl.protocol] || '',
    pathname: reqUrl.pathname,
    searchParams: reqUrl.searchParams,
  };

  const matchedRoutes = flatMap(routes, ({ matchers, handler }) => {
    for (const { match } of matchers) {
      const params = match(matchInfo);
      if (params) {
        return { params, handler };
      }
    }
    return [];
  });

  const dispatch = async (index: number): Promise<void> => {
    if (index >= matchedRoutes.length) {
      return req.finalize();
    }
    const next: RouteNextFn = (handlers) => {
      if (handlers?.length) {
        return execHandlers(req, handlers, next);
      }
      return dispatch(index + 1);
    };

    const { params, handler } = matchedRoutes[index];
    const normalizedHandler = normalizeHandler(handler);
    if (!normalizedHandler) {
      return next();
    }

    const { kind, process } = normalizedHandler as any;
    if (req.type !== kind) {
      return next();
    }

    req.params = params;
    await process(req, next);
  };

  return dispatch(0);
}

async function execHandlers<T extends TunerRequest>(
  req: T,
  handlers: Array<HTTPProcessFn | RouteHandler>,
  final: RouteNextFn,
) {
  const dispatch = async (index: number): Promise<void> => {
    if (index >= handlers.length) {
      return final();
    }
    const next: RouteNextFn = (handlers) => {
      if (handlers?.length) {
        return execHandlers(req, handlers, next);
      }
      return dispatch(index + 1);
    };

    const handler = handlers[index];
    if (typeof handler === 'function') {
      if (req.type === 'common') {
        return handler(req, next);
      }
      return next();
    }

    const { kind, process } = handler as any;
    if (req.type !== kind) {
      return next();
    }

    await process(req, next);
  };

  return dispatch(0);
}

function normalizeHandler(
  process: RouteHandleElement,
): RouteHandler | undefined {
  if (typeof process === 'function') {
    return { type: 'process-item', kind: 'common', process };
  }
  return process || undefined;
}
