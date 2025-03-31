const protocol = String.raw`(?<protocol>[^:/?]+:?)`;
const hostname = String.raw`(?<hostname>(\[[^\]]+\]|[^:/?]+))`;
const port = String.raw`(?<port>[^:/?]+)`;
const pathname = String.raw`(?<pathname>\/[^?]*)`;
const search = String.raw`(?<search>\?.*)`;

const host = String.raw`(${hostname}?(:${port})?)`;
const path = String.raw`(?<path>${pathname}?${search}?)`;
const origin = String.raw`(${protocol}?//${host}?)`;

const parser = new RegExp(`^${origin}?${path}?$`);

export interface ParseURLResult {
  protocol?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  search?: string;
  path?: string;
}

/**
 * Parse URL with fuzzy rules
 *
 * assumptions:
 * - Protocol must have trailing slashes
 * - Pathname must have leading slash
 */
export function parseURL(url: string): ParseURLResult {
  const result = url.match(parser);
  if (result) {
    return result.groups as any;
  }
  throw new Error(`Malformed url '${url}'`);
}
