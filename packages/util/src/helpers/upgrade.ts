import { UpgradeRequest } from '@tuner-proxy/core';
import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });

/**
 * Creates a WebSocket connection with UpgradeRequest
 */
export const ws = (req: UpgradeRequest) =>
  new Promise<WebSocket>((resolve) => {
    wss.handleUpgrade(req.raw, req.socket, req.head, resolve);
  });
