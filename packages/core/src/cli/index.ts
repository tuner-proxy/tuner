import chalk from 'chalk';
import { program } from 'commander';

import { log } from '../utils';

import { run } from './run';

process.on('uncaughtException', (error: any) => {
  log(chalk.red('Uncaught exception'), '\n', error.stack);
});

process.on('unhandledRejection', (error: any) => {
  log(chalk.red('Unhandled rejection'), '\n', error.stack);
});

program
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  .version(require('../../package.json').version)
  .arguments('[entry]')
  .option('-p, --port <port>', 'proxy server port', '8123')
  .option('-k, --key <path>', 'ssl private key path', 'ssl/key.pem')
  .option('-c, --cert <path>', 'ssl certificate path', 'ssl/cert.pem')
  .action((entry, args) => {
    run(entry, args);
  });

program.parse(process.argv);
