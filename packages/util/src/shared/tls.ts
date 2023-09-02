import * as tls from 'tls';

import { generateHostCertificate } from '@tuner-proxy/ca';
import { Server } from '@tuner-proxy/core';

import { persist } from '../helpers/persist';

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

interface SecureContextInfo {
  cert: string;
  key: string;
  context: tls.SecureContext;
}

const getTLSCertificateGenerator = persist(
  'tuner-util:tls-certificate-generator',
  (svr) => {
    const hostKeys = new Map<string, Promise<SecureContextInfo>>();
    return (servername: string) => {
      if (!hostKeys.has(servername)) {
        const promise = generateHostCertificate(svr.rootCA, [servername]).then(
          (res) => ({
            cert: res.cert,
            key: res.key,
            context: tls.createSecureContext(res),
          }),
        );
        promise.catch((error) => {
          hostKeys.delete(servername);
          throw error;
        });
        hostKeys.set(servername, promise);
      }
      return hostKeys.get(servername)!;
    };
  },
);
