import type { Server } from '@tuner-proxy/core';

declare module '@tuner-proxy/core' {
  interface Server {
    persist: Map<string, PersistItem>;
  }
}

interface PersistItem {
  version?: string | number;
  value: any;
  onDispose?: () => void;
}

export interface PersistOptions {
  version?: string | number;
}

export function definePersist<T>(
  key: string,
  create: (svr: Server, onDispose: (cb: () => void) => void) => T,
  options?: PersistOptions,
) {
  return (svr: Server): T => {
    if (!svr.persist) {
      svr.persist = new Map();
    }
    const item = svr.persist.get(key);
    if (item && item.version === options?.version) {
      return item.value;
    }
    if (item?.onDispose) {
      item.onDispose();
    }
    let onDispose: (() => void) | undefined;
    const value = create(svr, (cb) => {
      onDispose = cb;
    });
    svr.persist.set(key, {
      version: options?.version,
      value,
      onDispose,
    });
    return value;
  };
}
