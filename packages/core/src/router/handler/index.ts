import { Duplex } from 'stream';

import { ConnectRequest } from '../../wrapper/ConnectRequest';
import { HTTPRequest } from '../../wrapper/HTTPRequest';
import { HTTPResponse, HTTPResponseOptions } from '../../wrapper/HTTPResponse';
import { UpgradeRequest } from '../../wrapper/UpgradeRequest';

export type RouteElement = string | RouteHandler | RouteElement[];

export type RouteHandler =
  | HTTPProcessFn
  | HTTPResponseOptions
  | ProcessItem
  | null
  | false
  | undefined;

export interface ProcessItem<TType = string, TProcess = ProcessFn> {
  type: TType;
  process: TProcess;
}

export type ProcessFn = (req: any, next: NextFn<any>) => MaybePromise<any>;

export interface NextOptions {
  final?: boolean;
}

export type NextFn<T> = (options?: NextOptions) => Promise<T>;

export type MaybePromise<T> = T | Promise<T>;

export type HTTPResult =
  | HTTPResponse
  | HTTPResponseOptions
  | undefined
  | null
  | void;

export type HTTPProcessItem = ProcessItem<'common', HTTPProcessFn>;

export type HTTPProcessFn = (
  req: HTTPRequest,
  next: NextFn<HTTPResponse>,
) => MaybePromise<
  | HTTPResult
  | HTTPProcessFn
  | HTTPProcessItem
  | Array<HTTPResult | HTTPProcessFn | HTTPProcessItem>
>;

export const httpHandler = getFactory<HTTPProcessItem>('common');

export type ConnectResult = Duplex | undefined | null | void;

export type ConnectProcessItem = ProcessItem<'connect', ConnectProcessFn>;

export type ConnectProcessFn = (
  req: ConnectRequest,
  next: NextFn<ConnectResult>,
) => MaybePromise<ConnectResult | ConnectProcessItem | ConnectProcessItem[]>;

export const connectHandler = getFactory<ConnectProcessItem>('connect');

export type UpgradeProcessItem = ProcessItem<'upgrade', UpgradeProcessFn>;

export type UpgradeProcessFn = (
  req: UpgradeRequest,
  next: NextFn<ConnectResult>,
) => MaybePromise<ConnectResult | UpgradeProcessItem | UpgradeProcessItem[]>;

export const upgradeHandler = getFactory<UpgradeProcessItem>('upgrade');

function getFactory<T extends ProcessItem>(type: string) {
  return (process: T['process']) => ({ type, process }) as any as T;
}
