import { SpawnSyncReturns, spawnSync } from 'child_process';

export function installRootCA(certFile: string) {
  const platform = process.platform;
  if (platform === 'darwin') {
    return installMac(certFile);
  }
  if (platform === 'win32') {
    return installWin(certFile);
  }
  throw new Error(
    `Platform ${platform} is unsupported to install root CA for now`,
  );
}

function installMac(certPath: string) {
  const result = spawnSync(
    'security',
    ['add-trusted-cert', '-k', getKeyChain(), certPath],
    {
      encoding: 'utf-8',
    },
  );
  checkSuccess(result);
  const msg = `${result.stdout}`;
  if (/Error:/i.test(msg)) {
    throw new Error(msg);
  }
}

function getKeyChain() {
  const result = spawnSync('security', ['default-keychain'], {
    encoding: 'utf-8',
  });
  checkSuccess(result);
  return `${result.stdout}`.split('"')[1];
}

function installWin(certFile: string) {
  const result = spawnSync(
    'certutil',
    ['-addstore', '-user', 'Root', certFile],
    {
      encoding: 'utf-8',
    },
  );
  checkSuccess(result);
  if (/ERROR_CANCELLED/i.test(`${result.stdout}`)) {
    throw new Error('The authorization was canceled by the user.');
  }
}

function checkSuccess(result: SpawnSyncReturns<string>) {
  const stderr = result.stderr;
  if (stderr && stderr.length) {
    throw new Error(`${stderr}`);
  }
}
