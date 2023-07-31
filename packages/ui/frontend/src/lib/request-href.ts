import { RequestItem } from '../store/request';

import { isWebSocketUpgrade, stringifyHost } from './util';

export function getRequestHref(request: RequestItem) {
  if (request.type === 'connect') {
    return `connect://${stringifyHost(
      request.request.hostname,
      request.request.port,
    )}`;
  }
  const encrypted = request.request.encrypted;
  let protocol: string;
  if (isWebSocketUpgrade(request.request.headers.upgrade)) {
    protocol = encrypted ? 'wss:' : 'ws:';
  } else {
    protocol = encrypted ? 'https:' : 'http:';
  }
  return `${protocol}//${request.request.headers.host}${request.request.url}`;
}
