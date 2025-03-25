import type { CompiledRoute } from './compile';
import { execRoutes } from './exec';
import type { NextFn } from './handler';
import { matchRoutes } from './match';

export type HandleRequestFn = ReturnType<typeof createHandleRequestFn>;

export function createHandleRequestFn(
  getRoutes: () => Promise<CompiledRoute[] | undefined>,
) {
  return async <T>(
    type: string,
    url: string,
    req: Record<string, any>,
    final: NextFn<T>,
    transformRes?: (res: any) => T,
  ) => {
    const routes = await getRoutes();
    if (!routes) {
      return final();
    }
    const matched = matchRoutes(routes, url);
    return execRoutes<T>(type, req, matched, final, transformRes);
  };
}
