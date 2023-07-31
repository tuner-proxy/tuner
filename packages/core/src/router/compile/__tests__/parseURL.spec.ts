import { parseURL } from '../parseURL';

describe('parseURL', () => {
  parse('protocol', 'https://');
  parse('multiple protocol', 'https|wss://');

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
