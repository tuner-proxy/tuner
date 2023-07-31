import * as ui from '@ui/index';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { isCss, isDoc, isForm, isJs, isJson } from '../lib/content-type';
import { parserContentType } from '../lib/header-parser';
import { formatHeaders } from '../lib/util';

import { useConnectionStore } from './connection';

export type RequestItem = ConnectRequest | CommonRequest | UpgradeRequest;

export type CommonRequestMessage = Exclude<
  CommonRequest['request'] | CommonRequest['response'],
  undefined
>;

export interface ConnectRequest {
  type: 'connect';
  uid: string;
  request: {
    remote: ui.RemoteInfo;
    hostname: string;
    port: number;
    headers: Record<string, string>;
    rawHeaders: string[];
  };
  response?: {
    remote?: ui.RemoteInfo;
    accepted: boolean;
    hidden: boolean;
  };
  error?: ui.ErrorInfo;
}

export interface CommonRequest {
  type: 'request';
  uid: string;
  request: {
    remote: ui.RemoteInfo;
    encrypted: boolean;
    method: string;
    url: string;
    headers: Record<string, string>;
    rawHeaders: string[];
    body: BodyState;
    error?: ui.ErrorInfo;
  };
  accepted?: boolean;
  response?: {
    remote?: ui.RemoteInfo;
    encrypted: boolean;
    statusCode: number;
    headers: Record<string, string>;
    rawHeaders: string[];
    body: BodyState;
    error?: ui.ErrorInfo;
  };
}

export interface UpgradeRequest {
  type: 'upgrade';
  uid: string;
  request: {
    remote: ui.RemoteInfo;
    encrypted: boolean;
    method: string;
    url: string;
    headers: Record<string, string>;
    rawHeaders: string[];
  };
  response?: {
    remote?: ui.RemoteInfo;
    encrypted: boolean;
    accepted: boolean;
  };
  error?: ui.ErrorInfo;
}

export interface BodyState {
  data: ArrayBuffer[];
  hasEnd: boolean;
  decodeState?: {
    decoder: TextDecoder;
    text: string;
  };
}

export const useRequestStore = defineStore('request', () => {
  const connectionStore = useConnectionStore();
  const requestList = ref<RequestItem[]>([]);

  connectionStore.open();

  function clearRequestList() {
    requestList.value = [];
  }

  function toggleConnection() {
    if (connectionStore.opening) {
      connectionStore.close();
    } else {
      connectionStore.open();
    }
  }

  function decodeBodyAsText(body: BodyState) {
    if (body.decodeState) {
      return;
    }
    const decoder = new TextDecoder();
    let text = '';
    for (const chunk of body.data) {
      text += decoder.decode(chunk, { stream: true });
    }
    if (body.hasEnd) {
      text += decoder.decode();
    }
    body.decodeState = { decoder, text };
  }

  function checkDecodeBody(
    msg: CommonRequest['request'] | CommonRequest['response'],
  ) {
    const contentType = parserContentType(msg?.headers['content-type']);
    if (!contentType) {
      return;
    }
    if (isTextContentType(contentType.type)) {
      decodeBodyAsText(msg!.body);
    }
  }

  function getRequestByUid<T = RequestItem>(uid: string): T | undefined {
    return requestList.value.find((sess) => sess.uid === uid) as T;
  }

  const messageHandlers = {
    'connect-begin': handleConnectBeginMessage,
    'connect-end': handleConnectEndMessage,
    'connect-error': handleConnectErrorMessage,
    'request-begin': handleRequestBeginMessage,
    'request-body-chunk': handleRequestBodyChunkMessage,
    'request-body-end': handleRequestBodyEndMessage,
    'request-error': handleRequestErrorMessage,
    'request-accepted': handleRequestAcceptedMessage,
    'response-begin': handleResponseBeginMessage,
    'response-body-chunk': handleResponseBodyChunkMessage,
    'response-body-end': handleResponseBodyEndMessage,
    'response-error': handleResponseErrorMessage,
    'upgrade-begin': handleUpgradeBeginMessage,
    'upgrade-end': handleUpgradeEndMessage,
    'upgrade-error': handleUpgradeErrorMessage,
  };

  connectionStore.addEventListener('message', (event: MessageEvent) => {
    if (typeof event.data === 'string') {
      handleCommonMessage(JSON.parse(event.data));
    } else {
      handleBinaryData(event.data);
    }
  });

  let chunkReceiver: BodyState | undefined;

  function handleBinaryData(chunk: ArrayBuffer) {
    if (!chunkReceiver) {
      return;
    }
    chunkReceiver.data.push(chunk);
    if (chunkReceiver.decodeState) {
      chunkReceiver.decodeState.text +=
        chunkReceiver.decodeState.decoder.decode(chunk, { stream: true });
    }
    chunkReceiver = undefined;
  }

  function handleBodyEnd(body?: BodyState) {
    if (!body) {
      return;
    }
    if (body.decodeState) {
      body.decodeState.text += body.decodeState.decoder.decode();
    }
    body.hasEnd = true;
  }

  /**
   * Handle websocket JSON message
   */

  function handleCommonMessage({ uid, data }: ui.TunerUIMessage) {
    chunkReceiver = undefined;
    if (!connectionStore.opening) {
      return;
    }
    const handler = messageHandlers[data.type];
    if (!handler) {
      throw new Error(`Unknown message type '${data.type}'`);
    }
    handler(uid, data as any);
  }

  function handleConnectBeginMessage(uid: string, msg: ui.ConnectBeginMessage) {
    requestList.value.push({
      type: 'connect',
      uid,
      request: {
        ...getCommonParams(msg),
        hostname: msg.hostname,
        port: msg.port,
      },
    });
  }

  function handleConnectEndMessage(uid: string, msg: ui.ConnectEndMessage) {
    const request = getRequestByUid<ConnectRequest>(uid);
    if (!request) {
      return;
    }
    request.response = {
      remote: msg.remote,
      accepted: msg.accepted,
      hidden: msg.hidden,
    };
  }

  function handleConnectErrorMessage(uid: string, msg: ui.ConnectErrorMessage) {
    const request = getRequestByUid<ConnectRequest>(uid);
    if (request) {
      request.error = msg.error;
    }
  }

  function handleRequestBeginMessage(uid: string, msg: ui.RequestBeginMessage) {
    const request: CommonRequest['request'] = {
      ...getCommonParams(msg),
      encrypted: msg.encrypted,
      method: msg.method,
      url: msg.url,
      body: { data: [], hasEnd: false },
    };
    requestList.value.push({
      type: 'request',
      uid,
      request,
    });
    checkDecodeBody(request);
  }

  function handleRequestBodyChunkMessage(
    uid: string,
    _msg: ui.RequestBodyChunkMessage,
  ) {
    const request = getRequestByUid<CommonRequest>(uid);
    chunkReceiver = request?.request.body;
  }

  function handleRequestBodyEndMessage(
    uid: string,
    _msg: ui.RequestBodyEndMessage,
  ) {
    const request = getRequestByUid<CommonRequest>(uid);
    handleBodyEnd(request?.request.body);
  }

  function handleRequestErrorMessage(uid: string, msg: ui.RequestErrorMessage) {
    const request = getRequestByUid<CommonRequest>(uid);
    if (request) {
      request.request.error = msg.error;
    }
  }

  function handleRequestAcceptedMessage(
    uid: string,
    _msg: ui.RequestAcceptedMessage,
  ) {
    const request = getRequestByUid<CommonRequest>(uid);
    if (request) {
      request.accepted = true;
    }
  }

  function handleResponseBeginMessage(
    uid: string,
    msg: ui.ResponseBeginMessage,
  ) {
    const request = getRequestByUid<CommonRequest>(uid);
    if (!request) {
      return;
    }
    request.response = {
      ...getCommonParams(msg),
      encrypted: msg.encrypted,
      statusCode: msg.statusCode,
      body: { data: [], hasEnd: false },
    };
    checkDecodeBody(request.response);
  }

  function handleResponseBodyChunkMessage(
    uid: string,
    _msg: ui.RequestBodyChunkMessage,
  ) {
    const request = getRequestByUid<CommonRequest>(uid);
    chunkReceiver = request?.response?.body;
  }

  function handleResponseBodyEndMessage(
    uid: string,
    _msg: ui.RequestBodyEndMessage,
  ) {
    const request = getRequestByUid<CommonRequest>(uid);
    handleBodyEnd(request?.response?.body);
  }

  function handleResponseErrorMessage(
    uid: string,
    msg: ui.ResponseErrorMessage,
  ) {
    const request = getRequestByUid<CommonRequest>(uid);
    if (request?.response) {
      request.response.error = msg.error;
    }
  }

  function handleUpgradeBeginMessage(uid: string, msg: ui.UpgradeBeginMessage) {
    requestList.value.push({
      type: 'upgrade',
      uid,
      request: {
        ...getCommonParams(msg),
        encrypted: msg.encrypted,
        method: msg.method,
        url: msg.url,
      },
    });
  }

  function handleUpgradeEndMessage(uid: string, msg: ui.UpgradeEndMessage) {
    const request = getRequestByUid<UpgradeRequest>(uid);
    if (!request) {
      return;
    }
    request.response = {
      remote: msg.remote,
      encrypted: msg.encrypted,
      accepted: msg.accepted,
    };
  }

  function handleUpgradeErrorMessage(uid: string, msg: ui.UpgradeErrorMessage) {
    const request = getRequestByUid<UpgradeRequest>(uid);
    if (request) {
      request.error = msg.error;
    }
  }

  return {
    requestList,
    clearRequestList,
    toggleConnection,
    decodeBodyAsText,
  };
});

type CommonRequestHead =
  | ui.ConnectBeginMessage
  | ui.UpgradeBeginMessage
  | ui.RequestBeginMessage
  | ui.ResponseBeginMessage;

function getCommonParams(msg: CommonRequestHead) {
  return {
    remote: msg.remote!,
    rawHeaders: msg.headers,
    headers: formatHeaders(msg.headers),
  };
}

function isTextContentType(type: string) {
  if (type.startsWith('text/')) {
    return true;
  }
  return (
    isJson(type) || isJs(type) || isCss(type) || isDoc(type) || isForm(type)
  );
}
