import type { UpgradeRequest } from '@tuner-proxy/core';
import type WebSocket from 'ws';
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });

/**
 * Establish WebSocket connection with UpgradeRequest
 */
export const ws = (req: UpgradeRequest) =>
  new Promise<WebSocket>((resolve) => {
    wss.handleUpgrade(req.raw, req.socket, req.head, resolve);
  });
