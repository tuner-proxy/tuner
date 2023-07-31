export const parseCookie = cacheable((cookie) =>
  cookie.split(';').map((item) => {
    const [name, ...value] = item.split('=');
    return {
      name: decodeURIComponent(name.trim()),
      value: decodeURIComponent(value.join('=').trim()),
    };
  }),
);

export interface SetCookieItem {
  name: string;
  value: string;
  params: Record<string, string | true>;
}

export const parseSetCookie = cacheable((cookie) => {
  const [head, ...paramList] = cookie.split(';');
  const [name, ...value] = head.split('=');

  return {
    name: decodeURIComponent(name.trim()),
    value: decodeURIComponent(value.join('=').trim()),
    params: parseParam(paramList),
  };
});

export interface ContentType {
  type: string;
  params: Record<string, string | true>;
}

export const parserContentType = cacheable((contentType) => {
  const [type, ...paramList] = contentType.split(';');
  return {
    type: type.trim().toLowerCase(),
    params: parseParam(paramList, true),
  };
});

function cacheable<T>(getter: (value: string) => T) {
  const cacheMap = new Map<string, T>();
  return (value?: string) => {
    if (!value) {
      return;
    }
    if (!cacheMap.has(value)) {
      cacheMap.set(value, getter(value));
    }
    return cacheMap.get(value) as T;
  };
}

function parseParam(paramList: string[], lowerCase = false) {
  const params: Record<string, string | true> = {};
  for (const param of paramList) {
    const [paramName, ...paramValue] = param.split('=');
    let name = paramName;
    if (lowerCase) {
      name = name.toLowerCase();
    }
    const value = decodeURIComponent(paramValue.join('=').trim());
    params[name.trim()] = value || true;
  }
  return params;
}
