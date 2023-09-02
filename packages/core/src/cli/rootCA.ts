import * as fs from 'fs';

import { generate } from '@tuner-proxy/ca';
import chalk from 'chalk';

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
  const ca = await tryReadRootCA(options);
  if (ca) {
    return ca;
  }
  log(
    chalk.gray(
      `Failed to read root CA from "${options.cert}", regenerating...`,
    ),
  );
  return generate({
    force: true,
    cert: options.cert,
    key: options.key,
  });
}

async function tryReadRootCA(options: GetRootCAOptions) {
  try {
    const [cert, key] = await Promise.all([
      fs.promises.readFile(options.cert, 'utf-8'),
      fs.promises.readFile(options.key, 'utf-8'),
    ]);
    return { cert, key };
  } catch (error) {
    return undefined;
  }
}
