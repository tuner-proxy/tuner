import type { Readable } from 'node:stream';
import { PassThrough } from 'node:stream';
import zlib from 'node:zlib';

export type ContentEncodingType = 'gzip' | 'deflate' | 'br';

const gzipOptions = {
  flush: zlib.constants.Z_SYNC_FLUSH,
  finishFlush: zlib.constants.Z_SYNC_FLUSH,
};

export function createCompressStream(
  input: Readable,
  encoding?: ContentEncodingType,
) {
  if (encoding === 'gzip') {
    return input.pipe(zlib.createGzip(gzipOptions));
  }
  if (encoding === 'deflate') {
    return input.pipe(zlib.createDeflate());
  }
  if (encoding === 'br') {
    return input.pipe(zlib.createBrotliCompress());
  }
  return input;
}

export function createDecompressStream(
  input: Readable,
  encoding?: ContentEncodingType,
) {
  if (encoding === 'gzip') {
    return input.pipe(zlib.createGunzip(gzipOptions));
  }
  if (encoding === 'deflate') {
    const output = new PassThrough();
    const inputClone = input.pipe(new PassThrough());
    input.once('data', (chunk) => {
      if ((chunk[0] & 0x0f) === 0x08) {
        inputClone.pipe(zlib.createInflate()).pipe(output);
      } else {
        inputClone.pipe(zlib.createInflateRaw()).pipe(output);
      }
    });
    return output;
  }
  if (encoding === 'br') {
    return input.pipe(zlib.createBrotliDecompress());
  }
  return input;
}

export function normalizeContentEncoding(
  encoding?: string | null,
): ContentEncodingType | undefined {
  if (encoding === 'gzip' || encoding === 'x-gzip') {
    return 'gzip';
  }
  if (encoding === 'deflate' || encoding === 'x-deflate') {
    return 'deflate';
  }
  if (encoding === 'br') {
    return 'br';
  }
}
