import * as stream from 'stream';

import waitFor from 'event-to-promise';

export class StreamManager {
  private static cache = new WeakMap<stream.Readable, StreamManager>();

  static get(stream: stream.Readable) {
    if (!StreamManager.cache.get(stream)) {
      StreamManager.cache.set(stream, new StreamManager(stream));
    }
    return StreamManager.cache.get(stream)!;
  }

  private chunks: Buffer[] | null = [];

  private raw: stream.Readable;

  private onEnd: Promise<void>;

  private constructor(raw: stream.Readable) {
    this.raw = raw;
    this.onEnd = waitFor(raw, 'end');
    raw.on('data', (chunk) => {
      if (this.chunks) {
        this.chunks.push(chunk);
      }
    });
  }

  getStream(consume = false) {
    if (!this.chunks) {
      throw new Error('Stream already consumed');
    }
    const pass = new stream.PassThrough();
    for (const chunk of this.chunks) {
      pass.write(chunk);
    }
    this.raw.on('data', (chunk) => {
      pass.write(chunk);
    });
    if (consume) {
      this.chunks = null;
    }
    this.onEnd.then(() => {
      pass.end();
    });
    return pass;
  }
}
