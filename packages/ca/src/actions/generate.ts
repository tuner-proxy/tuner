import * as fs from 'fs';
import * as path from 'path';

import { generateRootCA } from '../keygen';

export interface GenerateOptions {
  key: string;
  cert: string;
  force: boolean;
}

export async function generate(options: GenerateOptions) {
  if (!options.force) {
    assertMissing(options.key);
    assertMissing(options.cert);
  }
  const ca = await generateRootCA();
  await Promise.all([
    writeCert(options.key, ca.key),
    writeCert(options.cert, ca.cert),
  ]);
  return ca;
}

async function writeCert(filename: string, content: string) {
  await fs.promises.mkdir(path.dirname(filename), {
    mode: 0o700,
    recursive: true,
  });
  await fs.promises.writeFile(filename, content, {
    mode: 0o600,
  });
}

function assertMissing(filename: string) {
  if (fs.existsSync(filename)) {
    throw new Error(`${filename} already exists`);
  }
}
