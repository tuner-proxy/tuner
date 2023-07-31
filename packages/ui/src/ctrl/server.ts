import { upgradeHandler } from '@tuner-proxy/core';
import { WebSocket, WebSocketServer } from 'ws';

import * as message from '../types/message';

export interface TunerUIMessage {
  uid: string;
  data: MessageData;
}

export type MessageData =
  | message.ConnectBeginMessage
  | message.ConnectEndMessage
  | message.ConnectErrorMessage
  | message.RequestBeginMessage
  | message.RequestBodyChunkMessage
  | message.RequestBodyEndMessage
  | message.RequestErrorMessage
  | message.RequestAcceptedMessage
  | message.ResponseBeginMessage
  | message.ResponseBodyChunkMessage
  | message.ResponseBodyEndMessage
  | message.ResponseErrorMessage
  | message.UpgradeBeginMessage
  | message.UpgradeEndMessage
  | message.UpgradeErrorMessage;

const wsServer = new WebSocketServer({
  noServer: true,
  clientTracking: true,
});

export function uiMessage() {
  return upgradeHandler(async (req, next) => {
    if (req.headers['sec-websocket-protocol'] !== 'tuner-ui') {
      return next();
    }
    await new Promise<WebSocket>((resolve) => {
      wsServer.handleUpgrade(req.raw, req.socket, req.head, resolve);
    });
  });
}

export function broadcast(uid: string, data: MessageData) {
  broadcastData(JSON.stringify({ uid, data }));
}

export function broadcastData(data: string | Buffer) {
  for (const client of Array.from(wsServer.clients)) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}
