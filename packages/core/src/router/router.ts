import chalk from 'chalk';

import { log } from '../utils';

import { buildRoutes } from './compile';
import { execRoutes } from './exec';
import { NextFn } from './handler';
import { matchRoutes } from './match';

export type HandleRequestFn = ReturnType<typeof loadRouter>;

export function loadRouter(entry: string) {
  const compiledRoutesPromise = loadRoutes(entry);
  return async <T>(
    type: string,
    url: string,
    req: Record<string, any>,
    final: NextFn<T>,
    transformRes?: (res: any) => T,
  ) => {
    const compiledRoutes = await compiledRoutesPromise;
    if (!compiledRoutes) {
      return final();
    }
    const routes = matchRoutes(compiledRoutes, url);
    return execRoutes<T>(type, req, routes, final, transformRes);
  };
}

async function loadRoutes(entry: string) {
  try {
    log(chalk.gray('Loading proxy rules'));

    const { default: routes } = await import(entry);
    const compiledRoutes = buildRoutes(routes);

    log(chalk.green('Proxy rules loaded'));

    return compiledRoutes;
  } catch (error: any) {
    log(chalk.red('Loading proxy rules error'), '\n', error.stack);
  }
}
