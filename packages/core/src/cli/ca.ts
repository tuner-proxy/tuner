import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';

import { generateRootCA } from '../ca';
import { log } from '../utils';

export interface ResolveOptions {
  cert: string;
  key: string;
  force?: boolean;
}

export async function resolveRootCA(options: ResolveOptions) {
  try {
    const [cert, key] = await Promise.all([
      fs.promises.readFile(options.cert, 'utf-8'),
      fs.promises.readFile(options.key, 'utf-8'),
    ]);
    log(chalk.gray(`Root CA already exists in ${options.cert}`));
    return { cert, key };
  } catch (error) {
    log(
      chalk.gray(`Failed to load root CA in ${options.cert}, regenerating...`),
    );
  }
  if (!options.force) {
    assertNotExists(options.cert);
    assertNotExists(options.key);
  }
  const ca = await generateRootCA();
  await Promise.all([
    writeCert(options.key, ca.key),
    writeCert(options.cert, ca.cert),
  ]);
  log(chalk.gray(`Root CA generated in ${options.cert}`));
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

function assertNotExists(filename: string) {
  if (fs.existsSync(filename)) {
    throw new Error(`${filename} already exists`);
  }
}
