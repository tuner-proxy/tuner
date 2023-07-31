import { Server } from '@tuner-proxy/core';

interface PersistItem {
  version?: string | number;
  value: any;
}

const persistMap = new WeakMap<Server, Map<string, PersistItem>>();

export interface PersistOptions<T> {
  version?: string | number;
  dispose?: (value: T, svr: Server) => void;
}

export function persist<T>(
  key: string,
  create: (svr: Server) => T,
  options?: PersistOptions<T>,
) {
  return (svr: Server): T => {
    if (!persistMap.has(svr)) {
      persistMap.set(svr, new Map());
    }
    const valueMap = persistMap.get(svr)!;
    const item = valueMap.get(key);
    if (item && item.version === options?.version) {
      return item.value;
    }
    if (item) {
      options?.dispose?.(item.value, svr);
    }
    const value = create(svr);
    valueMap.set(key, { version: options?.version, value });
    return value;
  };
}
