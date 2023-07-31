import {
  ConnectRequest,
  CommonRequest,
  RequestItem,
  UpgradeRequest,
} from '../store/request';

import { parserContentType } from './header-parser';
import {
  formatBodySize,
  getBodySize,
  isWebSocketUpgrade,
  stringifyHost,
} from './util';

export interface ListItem {
  uid: string;
  result?: string;
  protocol: string;
  method: string;
  host: string;
  url: string;
  bodySize?: string;
  contentType?: string;
  hostIp?: string;
}

export function formatRequestList(list: RequestItem[]) {
  return list
    .filter((item) => {
      if (item.type !== 'connect') {
        return true;
      }
      return !item.response?.hidden;
    })
    .map((item) => {
      if (item.type === 'connect') {
        return formatConnectRequest(item);
      }
      if (item.type === 'request') {
        return formatRequestRequest(item);
      }
      return formatUpgradeRequest(item);
    });
}

function formatConnectRequest(item: ConnectRequest): ListItem {
  let result: string | undefined;
  if (item.error) {
    result = '502';
  } else if (item.response) {
    result = '200';
  }
  return {
    uid: item.uid,
    result,
    protocol: 'HTTP',
    method: 'CONNECT',
    host: 'Tunnel to',
    url: stringifyHost(item.request.hostname, item.request.port),
    bodySize: '-',
    hostIp: item.response?.remote?.address,
  };
}

function formatRequestRequest(item: CommonRequest): ListItem {
  let result: string | undefined;
  if (item.request.error || item.response?.error) {
    result = '502';
  } else if (item.response) {
    result = String(item.response.statusCode);
  } else if (item.accepted) {
    result = '-';
  }
  const contentType = parserContentType(item.response?.headers['content-type']);
  return {
    uid: item.uid,
    result,
    protocol: item.request.encrypted ? 'HTTPS' : 'HTTP',
    method: item.request.method,
    host: item.request.headers.host,
    url: item.request.url,
    bodySize: item.accepted
      ? '-'
      : formatBodySize(getBodySize(item.response?.body?.data)),
    contentType: contentType?.type,
    hostIp: item.response?.remote?.address,
  };
}

function formatUpgradeRequest(item: UpgradeRequest): ListItem {
  let result: string | undefined;
  if (item.error) {
    result = '502';
  } else if (item.response) {
    result = '-';
  }
  let protocol: string;
  if (isWebSocketUpgrade(item.request.headers.upgrade)) {
    protocol = item.request.encrypted ? 'WSS' : 'WS';
  } else {
    protocol = item.request.encrypted ? 'HTTPS' : 'HTTP';
  }
  return {
    uid: item.uid,
    result,
    protocol,
    method: item.request.method,
    host: item.request.headers.host,
    url: item.request.url,
    bodySize: '-',
    hostIp: item.response?.remote?.address,
  };
}
