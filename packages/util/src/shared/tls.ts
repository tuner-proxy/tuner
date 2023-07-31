import * as tls from 'tls';

import { generateHostCertificate } from '@tuner-proxy/core';

import { persist } from '../helpers/persist';

export const getSNICallback = persist('tuner-util:sni-callback', (svr) => {
  const hostKeys = new Map<string, Promise<tls.SecureContext>>();
  return (
    servername: string,
    callback: (err: Error | null, ctx?: tls.SecureContext) => void,
  ) => {
    if (!hostKeys.has(servername)) {
      const promise = generateHostCertificate(svr.rootCA, [servername])
        .then((res) => tls.createSecureContext(res))
        .catch((error) => {
          hostKeys.delete(servername);
          throw error;
        });
      hostKeys.set(servername, promise);
    }
    hostKeys.get(servername)!.then((res) => {
      callback(null, res);
    }, callback);
  };
});
