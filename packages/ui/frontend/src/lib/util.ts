export function formatHeaders(headers?: string[], lowerCase = true) {
  const result: Record<string, string> = {};
  if (!headers) {
    return result;
  }
  for (let i = 0, ii = headers.length; i < ii; i += 2) {
    let key = headers[i];
    if (lowerCase) {
      key = key.toLowerCase();
    }
    result[key] = headers[i + 1];
  }
  return result;
}

export function getHeaders(headers: string[] | undefined, name: string) {
  if (!headers) {
    return [];
  }
  const normalizedName = name.toUpperCase();
  const result: string[] = [];
  for (let i = 0, ii = headers.length; i < ii; i += 2) {
    if (headers[i].toUpperCase() === normalizedName) {
      result.push(headers[i + 1]);
    }
  }
  return result;
}

export function stringifyHost(hostname: string, port: string | number) {
  let normalized = hostname;
  if (normalized.includes(':') && normalized[0] !== '[') {
    normalized = `[${normalized}]`;
  }
  return `${normalized}:${port}`;
}

export function getBodySize(chunks?: ArrayBuffer[]) {
  if (!chunks) {
    return 0;
  }
  let size = 0;
  for (const chunk of chunks) {
    size += chunk.byteLength;
  }
  return size;
}

export function formatBodySize(size: number) {
  for (const unit of ['B', 'kB', 'MB', 'GB']) {
    if (size < 1024) {
      return `${formatNumber(size)} ${unit}`;
    }
    // eslint-disable-next-line no-param-reassign
    size /= 1024;
  }
  return `${formatNumber(size)} TB`;
}

export function isWebSocketUpgrade(upgrade?: string) {
  if (!upgrade) {
    return false;
  }
  return upgrade
    .split(/\s*,\s*/g)
    .map((item) => item.split('/')[0])
    .includes('websocket');
}

function formatNumber(num: number) {
  return (Math.round(num * 10) / 10).toLocaleString();
}
