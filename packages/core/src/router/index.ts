import chalk from 'chalk';
import * as chokidar from 'chokidar';
import debounce from 'lodash.debounce';

import { log } from '../utils';

import { buildRoutes } from './compile';
import { execRoutes } from './exec';
import { NextFn } from './handler';
import { matchRoutes } from './match';
import { dispatchReloadEvent } from './reload';

export class Router {
  readonly entry: string;

  protected compiledRoutes?: ReturnType<typeof buildRoutes>;

  constructor(entry: string) {
    this.entry = entry;
    this.loadRoutes();

    chokidar
      .watch(entry, { ignored: /node_modules/ })
      .on(
        'change',
        debounce(this.loadRoutes.bind(this), 200, { maxWait: 1000 }),
      );
  }

  async handleRequest<T>(
    type: string,
    url: string,
    req: Record<string, any>,
    final: NextFn<T>,
    transformRes?: (res: any) => T,
  ) {
    if (!this.compiledRoutes) {
      return final();
    }
    const routes = matchRoutes(this.compiledRoutes, url);
    return execRoutes<T>(type, req, routes, final, transformRes);
  }

  protected async loadRoutes() {
    log(chalk.gray('Cleanup proxy rules'));
    dispatchReloadEvent();
    for (const path of Object.keys(require.cache)) {
      if (!path.includes('node_modules') && path.startsWith(this.entry)) {
        delete require.cache[path];
      }
    }
    try {
      log(chalk.gray('Loading proxy rules'));

      const { default: routes } = await import(this.entry);
      this.compiledRoutes = buildRoutes(routes);

      log(chalk.green('Proxy rules loaded'));
    } catch (error: any) {
      log(chalk.red('Loading proxy rules error'), '\n', error.stack);
    }
  }
}
