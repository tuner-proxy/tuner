import type { HandleRequestFn } from '../shared/types';

import type { RouteElement } from './handler';
import { normalizeRoutes } from './normalize';
import { execRoutes } from './routes';

export function buildRoutes(routes: RouteElement[]): HandleRequestFn {
  const normalizedRoutes = normalizeRoutes(routes);
  return (req) => execRoutes(req, normalizedRoutes);
}
