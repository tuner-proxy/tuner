import { defineStore } from 'pinia';
import { ref } from 'vue';

export type EventListener<T> = (event: T) => void;

const KEEP_ALIVE_TIMEOUT = 2000;

export const useConnectionStore = defineStore('connection', () => {
  const readyState = ref<number>(WebSocket.CLOSED);
  const opening = ref<boolean>(false);

  let socket: WebSocket | null = null;
  let keepAliveTimer: ReturnType<typeof setInterval>;

  const eventListeners: Record<string, EventListener<any>[]> = {
    open: [],
    close: [],
    error: [],
    message: [],
  };

  function open() {
    opening.value = true;

    const currentReadyState = socket?.readyState;
    if (
      currentReadyState === WebSocket.CONNECTING ||
      currentReadyState === WebSocket.OPEN
    ) {
      readyState.value = currentReadyState;
      return;
    }

    socket = new WebSocket(`wss://${location.host}/__tuner_ui`, ['tuner-ui']);

    socket.binaryType = 'arraybuffer';

    socket.addEventListener('open', (event) => broadcastEvent('open', event));
    socket.addEventListener('close', (event) => broadcastEvent('close', event));
    socket.addEventListener('error', (event) => broadcastEvent('error', event));
    socket.addEventListener('message', (event) =>
      broadcastEvent('message', event),
    );

    readyState.value = socket.readyState;

    clearInterval(keepAliveTimer);
    keepAliveTimer = setInterval(ping, KEEP_ALIVE_TIMEOUT);
  }

  function close() {
    opening.value = false;
    clearInterval(keepAliveTimer);

    if (!socket) {
      return;
    }
    socket.close();
    readyState.value = socket.readyState;
  }

  function ping() {
    if (socket?.readyState === WebSocket.CONNECTING) {
      readyState.value = socket.readyState;
      return;
    }
    if (socket?.readyState === WebSocket.OPEN) {
      readyState.value = socket.readyState;
      socket.send(JSON.stringify({ type: 'ping' }));
      return;
    }
    open();
  }

  function addEventListener(type: string, cb: EventListener<any>) {
    eventListeners[type].push(cb);
    return () => {
      removeEventListener(type, cb);
    };
  }

  function removeEventListener(type: string, cb: EventListener<any>) {
    const index = eventListeners[type].indexOf(cb);
    if (index >= 0) {
      eventListeners[type].splice(index, 1);
    }
  }

  function broadcastEvent(type: string, event: Event) {
    if (event.target !== socket) {
      return;
    }
    readyState.value = socket!.readyState;
    for (const listener of eventListeners[type]) {
      listener(event);
    }
  }

  return {
    readyState,
    opening,
    open,
    close,
    addEventListener,
    removeEventListener,
  };
});
