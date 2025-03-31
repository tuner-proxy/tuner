import { buildRoutes } from '@tuner-proxy/core';
import chokidar from 'chokidar';
import debounce from 'lodash.debounce';
import { tsImport } from 'tsx/esm/api';

let handlerPromise = loadRoutes();

watch(() => {
  console.log('Reloading');
  handlerPromise = loadRoutes();
});

/**
 * @type {import('@tuner-proxy/core').HandleRequestFn}
 */
export default async (req) => {
  const handleRequest = await handlerPromise;
  return handleRequest(req);
};

async function loadRoutes() {
  const rulesMod = await tsImport('./src/index.ts', import.meta.url);
  return buildRoutes(rulesMod.default);
}

function watch(callback) {
  chokidar
    .watch('./src', { ignoreInitial: true })
    .on('all', debounce(callback, 200));
}
