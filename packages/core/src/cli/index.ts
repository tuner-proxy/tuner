import chalk from 'chalk';
import { program } from 'commander';

import { log } from '../shared/utils.js';

import { init } from './actions/init.js';
import { start } from './actions/start.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

process.on('uncaughtException', (error: any) => {
  log(chalk.red('Uncaught exception'), '\n', error.stack);
});

process.on('unhandledRejection', (error: any) => {
  log(chalk.red('Unhandled rejection'), '\n', error.stack);
});

program.version(require('../package.json').version);

program
  .command('start')
  .argument('[entry]', 'path to the proxy rules', './')
  .option('-p, --port <port>', 'proxy server port', '8123')
  .option('-k, --key <path>', 'private key path', 'ssl/key.pem')
  .option('-c, --cert <path>', 'certificate path', 'ssl/cert.pem')
  .action((entry, args) => start(entry, args));

program
  .command('init')
  .option('-k, --key <path>', 'private key path', 'ssl/key.pem')
  .option('-c, --cert <path>', 'certificate path', 'ssl/cert.pem')
  .option('--install', 'install the certificate as trusted root CA', false)
  .option('-f, --force', 'force create new SSL certificate', false)
  .action((args) => init(args));

program.parse(process.argv);
