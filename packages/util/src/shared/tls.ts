import tls from 'node:tls';

import { generateHostCertificate } from '@tuner-proxy/core';
import type { Server } from '@tuner-proxy/core';

import { definePersist } from '../helpers/persist';

interface SecureContextInfo {
  cert: string;
  key: string;
  context: tls.SecureContext;
}

const getTLSCertificateGenerator = definePersist(
  'tuner-util:tls-certificate-generator',
  (svr) => {
    const certPromiseCache = new Map<string, Promise<SecureContextInfo>>();
    return (servername: string) => {
      if (!certPromiseCache.has(servername)) {
        const promise = generateHostCertificate(svr.rootCA, [servername]).then(
          (res) => ({
            cert: res.cert,
            key: res.key,
            context: tls.createSecureContext(res),
          }),
        );
        promise.catch((error) => {
          certPromiseCache.delete(servername);
          throw error;
        });
        certPromiseCache.set(servername, promise);
      }
      return certPromiseCache.get(servername)!;
    };
  },
);

export async function getTlsOptions(
  svr: Server,
  servername: string | undefined,
): Promise<tls.TlsOptions> {
  const getCertificate = getTLSCertificateGenerator(svr);
  if (servername) {
    const { cert, key } = await getCertificate(servername);
    return { cert, key };
  }
  return {
    SNICallback(servername, callback) {
      getCertificate(servername).then((res) => {
        callback(null, res.context);
      }, callback);
    },
  };
}
