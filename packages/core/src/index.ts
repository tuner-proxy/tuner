import { RouteElement } from './router/handler';

export { ServerOptions, Server } from './Server';
export { Upstream } from './upstream';
export { Router } from './router';
export { Certificate, generateHostCertificate } from './keygen';

export * from './router/handler';

export {
  LazyURLSearchParams,
  LazyURLSearchParamsInit,
} from './wrapper/URLSearchParams';

export {
  BaseRequestOptions,
  BaseRequest,
  UpstreamType,
  UpstreamOptions,
  ConnectUpstreamOptions,
  PacUpstreamOptions,
} from './wrapper/BaseRequest';

export { ConnectRequest } from './wrapper/ConnectRequest';
export { HTTPRequest, HTTPSendOptions } from './wrapper/HTTPRequest';
export { HTTPResponse, HTTPResponseOptions } from './wrapper/HTTPResponse';
export { UpgradeRequest } from './wrapper/UpgradeRequest';

export * from './encoding';
export * from './stream';

export function defineRoute(route: RouteElement[]) {
  return route;
}
