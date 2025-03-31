import { execRoutes } from '@tuner-proxy/core';
import { buildRoutes } from '@tuner-proxy/core';
import { tsImport } from 'tsx/esm/api';

const { default: routes } = await tsImport('./src/index.ts', import.meta.url);
const compiledRoutes = buildRoutes(routes);

/**
 * @type {import('@tuner-proxy/core').HandleRequestFn}
 */
export default async (req) =>
  execRoutes(req, compiledRoutes, (req) => req.finalize());
