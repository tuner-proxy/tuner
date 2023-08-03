import path from 'path';

import * as fs from 'fs-extra';
import inquirer from 'inquirer';

const cwd = process.cwd();

init();

async function init() {
  const { rootPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'rootPath',
      message: 'Project root:',
      default: process.argv[2] || 'tuner-routes',
    },
  ]);

  const projectRoot = path.resolve(rootPath);

  if (await fs.pathExists(projectRoot)) {
    const stat = await fs.stat(projectRoot);
    if (!stat.isDirectory()) {
      throw new Error(`Target file "${projectRoot}" already exists`);
    }
    const files = await fs.readdir(projectRoot);
    if (files.length) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Target directory "${projectRoot}" is not empty. Remove existing files and continue?.`,
          default: false,
        },
      ]);
      if (!overwrite) {
        throw new Error('Operation cancelled');
      }
      await Promise.all(
        files.map((file) => fs.remove(path.join(projectRoot, file))),
      );
    }
  }

  console.log(`\nScaffolding project in ${projectRoot}...`);

  await fs.mkdirp(path.dirname(projectRoot));
  await fs.copy(path.join(__dirname, '../template'), projectRoot);

  console.log(`\nDone. Now run:\n`);

  if (projectRoot !== cwd) {
    const cdProjectName = path.relative(cwd, projectRoot);
    console.log(
      `  cd ${
        cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName
      }`,
    );
  }

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm';

  switch (pkgManager) {
    case 'yarn':
      console.log('  yarn');
      console.log('  yarn start');
      break;
    default:
      console.log(`  ${pkgManager} install`);
      console.log(`  ${pkgManager} run start`);
      break;
  }

  console.log();
}

function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(' ')[0];
  const pkgSpecArr = pkgSpec.split('/');
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}
