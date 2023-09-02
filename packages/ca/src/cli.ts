import { program } from 'commander';

import { generate } from './actions/generate';
import { install } from './actions/install';

program
  .command('generate')
  .description('Generate root CA')
  .option('--key [path]', 'Output path for the private key file', 'ssl/key.pem')
  .option(
    '--cert [path]',
    'Output path for the certificate file',
    'ssl/cert.pem',
  )
  .option('-f, --force', 'Force generate root CA')
  .action(async (options) => {
    await generate(options);
  });

program
  .command('install')
  .description('Install root CA')
  .argument('[key-path]', 'Path to root CA certificate file', 'ssl/cert.pem')
  .action(install);

program.parse(process.argv);
