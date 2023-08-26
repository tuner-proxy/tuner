declare module 'sni' {
  declare function extractSNI(data: Buffer): string | null;
  export = extractSNI;
}
