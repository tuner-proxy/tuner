const HOST_REGEX = /^(?<hostname>.*?)(:(?<port>\d*))?$/;

/**
 * @see https://url.spec.whatwg.org/#url-miscellaneous
 */
export const DEFAULT_PORT: Record<string, number> = {
  'ftp:': 21,
  'http:': 80,
  'https:': 443,
  'ws:': 80,
  'wss:': 443,
};

export const { log } = console;

export function parseHost(value: string): [string, string | undefined] {
  const { groups } = value.match(HOST_REGEX) as any;
  let { hostname } = groups;
  if (hostname[0] === '[' && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }
  return [hostname, groups.port];
}

export function stringifyHost(
  hostname: string,
  port?: string | number,
  defaultPort?: string | number,
) {
  let normalized = hostname;
  if (normalized.includes(':') && normalized[0] !== '[') {
    normalized = `[${normalized}]`;
  }
  if (!port) {
    return normalized;
  }
  if (!defaultPort) {
    return `${normalized}:${port}`;
  }
  if (`${port}` === `${defaultPort}`) {
    return normalized;
  }
  return `${normalized}:${port}`;
}
