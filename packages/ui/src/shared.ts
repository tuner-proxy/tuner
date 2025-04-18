import type { Socket } from 'node:net';
import type { Duplex } from 'node:stream';

import type { RemoteInfo } from './types/message';

export function getRemoteInfo(
  stream?: Duplex | null | void,
): RemoteInfo | undefined {
  const socket = stream as Socket | null;
  if (!socket?.remoteAddress) {
    return;
  }
  return {
    address: socket.remoteAddress!,
    family: socket.remoteFamily as any,
    port: socket.remotePort!,
  };
}

let uidIndex = 1;

export function genUID() {
  const timestamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2);

  const uid = (uidIndex++).toString(36);

  return `tuner.${timestamp}.${uid}.${rand}`;
}
