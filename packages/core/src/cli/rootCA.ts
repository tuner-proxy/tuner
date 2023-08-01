import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';

import { generateRootCA } from '../keygen';
import { log } from '../utils';

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
    const [cert, key] = await Promise.all([
      fs.promises.readFile(options.cert, 'utf-8'),
      fs.promises.readFile(options.key, 'utf-8'),
    ]);
    return { cert, key };
  } catch (error) {
    log(
      chalk.gray(
        `Failed to read root CA from "${options.cert}", regenerating...`,
      ),
    );
  }
  const ca = await generateRootCA();
  await Promise.all([
    writeCert('cert', options.cert, ca.cert),
    writeCert('key', options.key, ca.key),
  ]);
  return ca;
}

async function writeCert(type: string, filename: string, content: string) {
  try {
    await fs.promises.mkdir(path.dirname(filename), {
      mode: 0o700,
      recursive: true,
    });
    await fs.promises.writeFile(filename, content, {
      mode: 0o600,
    });
  } catch (error) {
    log(
      chalk.red(`Failed to write root CA ${type} into "${filename}"`),
      '\n',
      error,
    );
  }
}
