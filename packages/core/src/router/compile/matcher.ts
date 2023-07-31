import { parseURL } from './parseURL';

export interface MatchInfo {
  readonly protocol: string;
  readonly port: string | number;
  readonly hostname: string;
  readonly pathname: string;
  readonly searchParams: URLSearchParams;
}

/**
 * Create matching function for given url
 */
export function createURLMatcher(url: string) {
  const pattern = parseURL(url);

  const matchProtocol = createProtocolMatcher(pattern.protocol);
  const matchHostname = createHostnameMatcher(pattern.hostname);
  const matchPort = createPortMatcher(pattern.port);
  const matchSearchParams = createSearchParamsMatcher(pattern.search);
  const matchPathname = createPathnameMatcher(pattern.pathname);

  return function matchRequest(info: MatchInfo) {
    if (!matchProtocol(info)) {
      return;
    }
    if (!matchPort(info)) {
      return;
    }
    if (!matchHostname(info)) {
      return;
    }
    if (!matchSearchParams(info)) {
      return;
    }
    return matchPathname(info);
  };
}

/**
 * Matching protocol
 */
export function createProtocolMatcher(pattern?: string) {
  if (!pattern) {
    return () => true;
  }
  const accepts = pattern.toUpperCase().replace(/:$/, '').split('|');
  return function matchProtocol(info: MatchInfo) {
    return accepts.includes(info.protocol.toUpperCase().replace(/:$/, ''));
  };
}

/**
 * Matching hostname
 *
 * Supports DNS wildcard
 */
export function createHostnameMatcher(pattern?: string) {
  if (!pattern) {
    return () => true;
  }
  const domain = pattern.replace(/^\*(\.\*)?/, '');
  const strict = !pattern.startsWith('*.*.');
  const wildcard = pattern.startsWith('*.');
  const patternLength = pattern.split('.').length;

  return function matchHostname(info: MatchInfo) {
    if (info.hostname === pattern) {
      return true;
    }
    if (!info.hostname.endsWith(domain)) {
      return false;
    }
    if (strict && info.hostname.split('.').length !== patternLength) {
      return false;
    }
    return wildcard;
  };
}

/**
 * Matching port number
 */
export function createPortMatcher(pattern?: string) {
  if (!pattern) {
    return () => true;
  }
  const accepts = pattern.split('|');
  return function matchPort(info: MatchInfo) {
    return accepts.includes(`${info.port}`);
  };
}

/**
 * Matching pathname with params
 *
 * eg. /pathname/with/:shortParam/::longParam
 *
 * :shortParam matches any characters except "/"
 * ::longParam matches any characters
 */
export function createPathnameMatcher(pattern?: string) {
  if (!pattern) {
    return () => Object.create(null);
  }

  const source = pattern
    .replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    .replace(/::?\w+/g, (param) => {
      if (param.startsWith('::')) {
        return `(?<${param.slice(2)}>.+)`;
      }
      return `(?<${param.slice(1)}>[^/]+)`;
    });
  const regex = new RegExp(`^${source}$`);

  return function matchPathname(info: MatchInfo) {
    const match = info.pathname.match(regex);
    if (match) {
      return match.groups || Object.create(null);
    }
  };
}

/**
 * Matching query
 *
 * eg. foo&bar=baz
 *
 * "foo" must exists, and "bar" must equals to "baz"
 */
export function createSearchParamsMatcher(pattern?: string) {
  if (!pattern) {
    return () => true;
  }

  const patternQuery = new URLSearchParams(pattern.slice(1));

  return function matchSearchParams(info: MatchInfo) {
    for (const [key, value] of patternQuery) {
      if (!info.searchParams.has(key)) {
        return false;
      }
      if (value && value !== info.searchParams.get(key)) {
        return false;
      }
    }
    return true;
  };
}
