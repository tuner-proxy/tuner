import * as fs from 'fs';
import * as path from 'path';

import { generateRootCA } from '../keygen';

export interface GetRootCAOptions {
  cert: string;
  key: string;
}

export interface RootCA {
  cert: string;
  key: string;
}

export async function getRootCA(options: GetRootCAOptions) {
  try {
    return {
      cert: fs.readFileSync(options.cert, 'utf-8'),
      key: fs.readFileSync(options.key, 'utf-8'),
    };
  } catch (error) {
    // noop
  }
  const ca = await generateRootCA();
  try {
    fs.mkdirSync(path.dirname(options.cert), { mode: 0o700, recursive: true });
    fs.mkdirSync(path.dirname(options.key), { mode: 0o700, recursive: true });
    fs.writeFileSync(options.cert, ca.cert, { mode: 0o600 });
    fs.writeFileSync(options.key, ca.key, { mode: 0o600 });
  } catch (error) {
    // noop
  }
  return ca;
}
