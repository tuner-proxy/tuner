import path from 'path';

import fs from 'fs-extra';
import inquirer from 'inquirer';
import klaw from 'klaw';

const cwd = process.cwd();
const templatePath = path.join(import.meta.dirname, '../template');

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

  for await (const file of klaw(templatePath)) {
    if (!file.stats.isFile()) {
      continue;
    }
    const basename = path.basename(file.path).replace(/^_/, '.');
    const relative = path.relative(templatePath, file.path);
    const targetPath = path.join(projectRoot, path.dirname(relative), basename);
    await fs.mkdirp(path.dirname(targetPath));
    await fs.copyFile(file.path, targetPath);
  }

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

  console.log(`  ${pkgManager} install`);
  if (['win32', 'darwin'].includes(process.platform)) {
    if (pkgManager === 'yarn') {
      console.log('  yarn run init --install');
    } else {
      console.log(`  ${pkgManager} run init -- --install`);
    }
  }
  console.log(`  ${pkgManager} run start`);

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
