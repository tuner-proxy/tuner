import * as stream from 'stream';

import waitFor from 'event-to-promise';

import {
  ContentEncodingType,
  createCompressStream,
  createDecompressStream,
  normalizeContentEncoding,
} from '../encoding';

import { StreamManager } from './StreamManager';

export type BodyContent = string | Buffer | stream.Readable;

export interface BodyInfo {
  /**
   * Raw body data
   */
  content?: BodyContent;
  /**
   * Compress method
   */
  encoding?: ContentEncodingType;
}

export interface ReadOptions {
  /**
   * Whether to decode the body content
   *
   * @default `true`
   */
  decode?: boolean;
  /**
   * Whether to consume the underlying Readable stream
   *
   * @default `false`
   */
  consume?: boolean;
  /**
   * Encoding for result Buffer / Readable
   */
  encoding?: string | null;
}

export function readStream(body: BodyInfo, options: ReadOptions = {}) {
  let input: stream.Readable;
  if (
    !body.content ||
    typeof body.content === 'string' ||
    Buffer.isBuffer(body.content)
  ) {
    input = createPassThrough(body.content);
  } else {
    input = StreamManager.get(body.content).getStream(options.consume);
  }
  if (!needDecode(body, options)) {
    return input;
  }
  return createCompressStream(
    createDecompressStream(input, body.encoding),
    normalizeContentEncoding(options.encoding),
  );
}

export async function readBuffer(body: BodyInfo, options: ReadOptions = {}) {
  if (!needDecode(body, options)) {
    if (typeof body.content === 'string') {
      return Buffer.from(body.content);
    }
    if (Buffer.isBuffer(body.content)) {
      return body.content;
    }
  }
  const stream = readStream(body, options);
  const chunks: Buffer[] = [];
  stream.on('data', (chunk) => {
    chunks.push(chunk);
  });
  await waitFor(stream, 'end');
  return Buffer.concat(chunks);
}

export async function readText(
  body: BodyInfo,
  options: Omit<ReadOptions, 'decode' | 'encoding'> = {},
) {
  if (!body.encoding) {
    if (typeof body.content === 'string') {
      return body.content;
    }
    if (Buffer.isBuffer(body.content)) {
      return body.content.toString();
    }
  }
  const buffer = await readBuffer(body, options);
  return buffer.toString();
}

export async function readJson(
  body: BodyInfo,
  options: Omit<ReadOptions, 'decode' | 'encoding'> = {},
) {
  const text = await readText(body, options);
  return JSON.parse(text);
}

function createPassThrough(content?: string | Buffer) {
  const pass = new stream.PassThrough();
  if (content != null) {
    pass.write(content);
  }
  pass.end();
  return pass;
}

function needDecode(body: BodyInfo, options: ReadOptions) {
  if (options.decode === false) {
    return false;
  }
  return body.encoding !== normalizeContentEncoding(options.encoding);
}
