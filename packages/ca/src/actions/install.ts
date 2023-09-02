import { installRootCA } from '../install';

export function install(certFile: string) {
  installRootCA(certFile);
  console.log(`Root CA ${certFile} has been installed`);
}
