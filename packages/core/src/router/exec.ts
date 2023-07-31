import { NextFn, ProcessFn } from './handler';
import { MatchedRoute } from './match';

export function execRoutes<T>(
  targetType: string,
  req: Record<string, any>,
  routes: MatchedRoute[],
  final: NextFn<T>,
  transformRes?: (res: any) => T,
): Promise<T> {
  const dispatch = async (index: number): Promise<T> => {
    if (index >= routes.length) {
      return final();
    }

    const next: NextFn<T> = (options) => {
      if (options?.final) {
        return final(options);
      }
      return dispatch(index + 1);
    };

    const { params, handler } = routes[index];
    let normalizedHandler = normalizeHandler(handler);

    if (!normalizedHandler) {
      if (handler === null) {
        return final({ final: true });
      }
      if (!handler || targetType !== 'common') {
        return next();
      }
      if (transformRes) {
        return transformRes(handler);
      }
      return handler as T;
    }

    let res: any;
    do {
      const { type, process } = normalizedHandler;
      if (type !== targetType) {
        return next();
      }
      req.params = params;
      res = await process(req, next);
    } while ((normalizedHandler = normalizeHandler(res)));

    if (!Array.isArray(res)) {
      if (transformRes) {
        return transformRes(res);
      }
      return res;
    }

    return execRoutes(
      targetType,
      req,
      res.map((handler) => ({ params, handler })),
      next,
      transformRes,
    );
  };

  return dispatch(0);
}

function normalizeHandler(
  process: any,
): { type: string; process: ProcessFn } | undefined {
  if (typeof process === 'function') {
    return { type: 'common', process };
  }
  if (process?.type && process.process) {
    return process;
  }
}
