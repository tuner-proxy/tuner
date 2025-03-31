import type { ConnectRequest } from '../wrapper/ConnectRequest';
import type { HTTPRequest } from '../wrapper/HTTPRequest';
import type { UpgradeRequest } from '../wrapper/UpgradeRequest';

export type TunerRequest = ConnectRequest | HTTPRequest | UpgradeRequest;
