import type { TunerRequest } from '../shared/types';
import type { ConnectRequest } from '../wrapper/ConnectRequest';
import type { HTTPRequest } from '../wrapper/HTTPRequest';
import type { UpgradeRequest } from '../wrapper/UpgradeRequest';

export type Awaitable<T> = T | PromiseLike<T>;

export type RouteElement = string | RouteHandleElement | RouteElement[];

export type RouteHandleElement =
  | HTTPProcessFn
  | RouteHandler
  | null
  | false
  | undefined;

export type RouteNextFn = (
  handlers?: Array<HTTPProcessFn | RouteHandler>,
) => Promise<void>;

export type RequestProcessFn<T extends TunerRequest> = (
  req: T,
  next: RouteNextFn,
) => Awaitable<void>;

export type HTTPProcessFn = RequestProcessFn<HTTPRequest>;
export type ConnectProcessFn = RequestProcessFn<ConnectRequest>;
export type UpgradeProcessFn = RequestProcessFn<UpgradeRequest>;

export interface BaseRouteHandler {
  type: 'process-item';
}

export interface HTTPRouteHandler extends BaseRouteHandler {
  kind: 'common';
  process: HTTPProcessFn;
}

export interface ConnectRouteHandler extends BaseRouteHandler {
  kind: 'connect';
  process: ConnectProcessFn;
}

export interface UpgradeRouteHandler extends BaseRouteHandler {
  kind: 'upgrade';
  process: UpgradeProcessFn;
}

export type RouteHandler =
  | HTTPRouteHandler
  | ConnectRouteHandler
  | UpgradeRouteHandler;

export const httpHandler = getFactory<HTTPRouteHandler>('common');
export const connectHandler = getFactory<ConnectRouteHandler>('connect');
export const upgradeHandler = getFactory<UpgradeRouteHandler>('upgrade');

function getFactory<T extends RouteHandler>(kind: T['kind']) {
  return (process: T['process']) =>
    ({
      type: 'process-item',
      kind,
      process,
    }) as T;
}
