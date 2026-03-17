import type { ConnectRequest } from '../wrapper/ConnectRequest.js';
import type { HTTPRequest } from '../wrapper/HTTPRequest.js';
import type { UpgradeRequest } from '../wrapper/UpgradeRequest.js';

export type TunerRequest = ConnectRequest | HTTPRequest | UpgradeRequest;

export type HandleRequestFn = (req: TunerRequest) => Promise<void>;
