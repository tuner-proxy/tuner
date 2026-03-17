import type { HandleRequestFn } from '../shared/types.js';

import type { RouteElement } from './handler.js';
import { normalizeRoutes } from './normalize/index.js';
import { execRoutes } from './routes.js';

export function buildRoutes(routes: RouteElement[]): HandleRequestFn {
  const normalizedRoutes = normalizeRoutes(routes);
  return (req) => execRoutes(req, normalizedRoutes);
}
