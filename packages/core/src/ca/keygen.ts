import * as crypto from 'node:crypto';
import * as net from 'node:net';
import * as os from 'node:os';
import * as util from 'node:util';

import forge from 'node-forge';

import type { Certificate } from './types';

const generateKeyPair = util.promisify(forge.pki.rsa.generateKeyPair);

const hostname = os
  .hostname()
  .replace(/[^a-zA-Z0-9]/g, '-')
  .slice(0, 32);

const DAY = 24 * 60 * 60 * 1000;

const CAAttrs = [
  {
    name: 'commonName',
    value: `Tuner ${hostname}`,
  },
  {
    name: 'countryName',
    value: 'Internet',
  },
  {
    shortName: 'ST',
    value: 'Internet',
  },
  {
    name: 'localityName',
    value: 'Internet',
  },
  {
    name: 'organizationName',
    value: `${hostname}.tuner`,
  },
  {
    shortName: 'OU',
    value: `${hostname}.tuner`,
  },
];

function randomSerialNumber() {
  return crypto.randomBytes(16).toString('hex');
}

interface GenerateCertificateOptions {
  keys: forge.pki.rsa.KeyPair;
  expires: number;
  subject: forge.pki.CertificateField[];
  issuer: forge.pki.CertificateField[];
  extensions: any[];
  privateKey?: forge.pki.PrivateKey;
}

function generateCertificate({
  keys,
  expires,
  subject,
  issuer,
  extensions,
  privateKey,
}: GenerateCertificateOptions): Certificate {
  const cert = forge.pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = randomSerialNumber();

  const notBeforeDate = new Date();
  notBeforeDate.setMonth(notBeforeDate.getMonth() - 1);

  // https://chromium.googlesource.com/chromium/src/+/refs/heads/main/net/cert/cert_verify_proc.cc#887
  cert.validity.notBefore = notBeforeDate;
  cert.validity.notAfter = new Date(+notBeforeDate + expires);

  cert.setSubject(subject);
  cert.setIssuer(issuer);
  cert.setExtensions(extensions);

  cert.sign(privateKey || keys.privateKey, forge.md.sha256.create());

  return {
    cert: forge.pki.certificateToPem(cert),
    key: forge.pki.privateKeyToPem(keys.privateKey),
  };
}

export async function generateRootCA() {
  return generateCertificate({
    keys: await generateKeyPair({ bits: 2048 }),
    expires: 10 * 365 * DAY,
    subject: CAAttrs,
    issuer: CAAttrs,
    extensions: [
      {
        name: 'basicConstraints',
        cA: true,
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true,
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true,
      },
      {
        name: 'nsCertType',
        client: true,
        server: true,
        email: true,
        objsign: true,
        sslCA: true,
        emailCA: true,
        objCA: true,
      },
    ],
  });
}

export async function generateHostCertificate(
  ca: Certificate,
  hosts: string[],
) {
  return generateCertificate({
    keys: await generateKeyPair({ bits: 2048 }),
    // https://chromium.googlesource.com/chromium/src/+/refs/heads/main/net/cert/cert_verify_proc.cc#887
    expires: 398 * DAY,
    subject: [
      {
        name: 'commonName',
        value: hosts[0],
      },
      {
        name: 'countryName',
        value: 'Internet',
      },
      {
        shortName: 'ST',
        value: 'Internet',
      },
      {
        name: 'localityName',
        value: 'Internet',
      },
      {
        name: 'organizationName',
        value: `${hostname}.tuner`,
      },
      {
        shortName: 'OU',
        value: `${hostname}.tuner`,
      },
    ],
    issuer: forge.pki.certificateFromPem(ca.cert).issuer.attributes,
    extensions: [
      {
        name: 'basicConstraints',
        cA: false,
      },
      {
        name: 'keyUsage',
        keyCertSign: false,
        digitalSignature: true,
        nonRepudiation: false,
        keyEncipherment: true,
        dataEncipherment: true,
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: false,
        emailProtection: false,
        timeStamping: false,
      },
      {
        name: 'nsCertType',
        client: true,
        server: true,
        email: false,
        objsign: false,
        sslCA: false,
        emailCA: false,
        objCA: false,
      },
      {
        name: 'subjectAltName',
        altNames: hosts.map((host) =>
          net.isIP(host)
            ? {
                type: 7,
                ip: host,
              }
            : {
                type: 2,
                value: host,
              },
        ),
      },
    ],
    privateKey: forge.pki.privateKeyFromPem(ca.key),
  });
}
