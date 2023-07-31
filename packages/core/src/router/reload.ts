let reloadCallbacks: Array<() => void> = [];

export function onReload(cb: () => void) {
  reloadCallbacks.push(cb);
}

export function dispatchReloadEvent() {
  const callbacks = reloadCallbacks;
  reloadCallbacks = [];
  for (const cb of callbacks) {
    cb();
  }
}
