export interface ConnectBeginMessage {
  type: 'connect-begin';
  remote: RemoteInfo;
  hostname: string;
  port: number;
  headers: string[];
}

export interface ConnectEndMessage {
  type: 'connect-end';
  remote?: RemoteInfo;
  accepted: boolean;
  hidden: boolean;
}

export interface ConnectErrorMessage {
  type: 'connect-error';
  error: ErrorInfo;
}

export interface RequestBeginMessage {
  type: 'request-begin';
  remote: RemoteInfo;
  encrypted: boolean;
  method: string;
  url: string;
  headers: string[];
}

export interface RequestBodyChunkMessage {
  type: 'request-body-chunk';
}

export interface RequestBodyEndMessage {
  type: 'request-body-end';
}

export interface RequestErrorMessage {
  type: 'request-error';
  error: ErrorInfo;
}

export interface RequestAcceptedMessage {
  type: 'request-accepted';
}

export interface ResponseBeginMessage {
  type: 'response-begin';
  remote?: RemoteInfo;
  encrypted: boolean;
  statusCode: number;
  headers: string[];
}

export interface ResponseBodyChunkMessage {
  type: 'response-body-chunk';
}

export interface ResponseBodyEndMessage {
  type: 'response-body-end';
}

export interface ResponseErrorMessage {
  type: 'response-error';
  error: ErrorInfo;
}

export interface UpgradeBeginMessage {
  type: 'upgrade-begin';
  remote: RemoteInfo;
  encrypted: boolean;
  method: string;
  url: string;
  headers: string[];
}

export interface UpgradeEndMessage {
  type: 'upgrade-end';
  remote?: RemoteInfo;
  encrypted: boolean;
  accepted: boolean;
}

export interface UpgradeErrorMessage {
  type: 'upgrade-error';
  error: ErrorInfo;
}

export interface RemoteInfo {
  address: string;
  family: 'IPv4' | 'IPv6';
  port: number;
}

export interface ErrorInfo {
  message: string;
  stack?: string;
}
