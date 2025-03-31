import { describe, expect, it } from 'vitest';

import { parseURL } from '../parseURL';

describe('parseURL', () => {
  parse('protocol', 'https://');
  parse('multiple protocol', 'https|wss://');

  parse('ip', '//0.0.0.0');
  parse('ip mask', '//[10.0.0.0/16]');
  parse('ip range', '//[10.0.0.0-10.1.2.3]');
  parse('ipv6', '//[2001::1]');
  parse('ipv6 range', '//[2001::abc-2001::1:ffff]');

  parse('hostname', '//example.com');
  parse('dns wildcard', '//*.*.example.com');

  parse('port', '//:80|443');

  parse('pathname', '/example-path/name');
  parse('pathname with route params', '/example-path/:param/::longParam');

  parse('query', '?foo&bar=baz');

  parse(
    'full',
    'https|wss://*.*.example.com:80|443/example-path/name?foo&bar=baz',
  );

  it('throws', () => {
    expect(() => parseURL('malformed-url')).toThrow();
  });
});

function parse(name: string, url: string) {
  it(name, () => {
    expect(parseURL(url)).toMatchSnapshot();
  });
}
