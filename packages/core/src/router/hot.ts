import chokidar from 'chokidar';
import debounce from 'lodash.debounce';

import { dispatchReloadEvent } from './reload';
import { HandleRequestFn, loadRouter } from './router';

export function loadHotRouter(entry: string): HandleRequestFn {
  let handleRequest = loadRouter(entry);

  const onChange = () => {
    dispatchReloadEvent();
    handleRequest = loadRouter(entry);
  };

  chokidar
    .watch(entry, { ignored: /node_modules/ })
    .on('change', debounce(onChange, 200, { maxWait: 1000 }));

  return (...args) => handleRequest(...args);
}
