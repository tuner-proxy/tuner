import {
  MatchInfo,
  createHostnameMatcher,
  createPathnameMatcher,
  createPortMatcher,
  createProtocolMatcher,
  createSearchParamsMatcher,
  createURLMatcher,
} from '../matcher';

describe('matcher', () => {
  match('protocol', createProtocolMatcher, [
    {
      pattern: '',
      toMatch: createCases('protocol', ['http:']),
    },
    {
      pattern: 'http:',
      toMatch: createCases('protocol', ['http:']),
      toNotMatch: createCases('protocol', ['https:']),
    },
    {
      pattern: 'http|https:',
      toMatch: createCases('protocol', ['http:', 'https:']),
      toNotMatch: createCases('protocol', ['ws:', 'wss:']),
    },
  ]);

  match('hostname', createHostnameMatcher, [
    {
      pattern: '',
      toMatch: createCases('hostname', ['example.com']),
    },
    {
      pattern: 'example.com',
      toMatch: createCases('hostname', ['example.com']),
      toNotMatch: createCases('hostname', ['foo.com', 'foo.example.com']),
    },
    {
      pattern: '*.example.com',
      toMatch: createCases('hostname', ['foo.example.com']),
      toNotMatch: createCases('hostname', [
        'example.com',
        'foo.com',
        'foo.bar.example.com',
      ]),
    },
    {
      pattern: '*.*.example.com',
      toMatch: createCases('hostname', [
        'foo.example.com',
        'foo.bar.example.com',
        'foo.bar.baz.example.com',
      ]),
      toNotMatch: createCases('hostname', [
        'example.com',
        'foo.com',
        'foo.example.com.net',
      ]),
    },
  ]);

  match('port', createPortMatcher, [
    {
      pattern: '',
      toMatch: createCases('port', [80, '80']),
    },
    {
      pattern: '80',
      toMatch: createCases('port', [80, '80']),
      toNotMatch: createCases('port', [443, '443']),
    },
    {
      pattern: '80|443',
      toMatch: createCases('port', [80, '80', 443, '443']),
      toNotMatch: createCases('port', [21, '21']),
    },
  ]);

  match('search', createSearchParamsMatcher, [
    {
      pattern: '',
      toMatch: createCases('searchParams', [
        new URLSearchParams(''),
        new URLSearchParams('?foo=bar&baz'),
      ]),
    },
    {
      pattern: '?foo',
      toMatch: createCases('searchParams', [
        new URLSearchParams('?foo'),
        new URLSearchParams('?foo=bar'),
        new URLSearchParams('?foo&baz'),
        new URLSearchParams('?foo=bar&baz'),
      ]),
      toNotMatch: createCases('searchParams', [
        new URLSearchParams(''),
        new URLSearchParams('?bar'),
      ]),
    },
    {
      pattern: '?foo=bar',
      toMatch: createCases('searchParams', [
        new URLSearchParams('?foo=bar'),
        new URLSearchParams('?foo=bar&baz'),
      ]),
      toNotMatch: createCases('searchParams', [
        new URLSearchParams(''),
        new URLSearchParams('?foo'),
        new URLSearchParams('?foo=baz'),
      ]),
    },
  ]);

  match('pathname', createPathnameMatcher, [
    {
      pattern: '',
      toMatch: createCases('pathname', ['/', '/foo/bar']),
    },
    {
      pattern: '/absolute/path-name',
      toMatch: createCases('pathname', ['/absolute/path-name']),
      toNotMatch: createCases('pathname', [
        '/absolute',
        '/absolute/path-name/',
        '/absolute/path-name/child',
      ]),
    },
    {
      pattern: '/with/:param',
      toMatch: createCases('pathname', ['/with/param-value']),
      toNotMatch: createCases('pathname', [
        '/with',
        '/with/',
        '/with/param/child',
      ]),
    },
    {
      pattern: '/with/::longParam',
      toMatch: createCases('pathname', [
        '/with/param-value',
        '/with/long/param/value',
      ]),
      toNotMatch: createCases('pathname', ['/with', '/with/', '/not-match/']),
    },
  ]);

  match('full', createURLMatcher, [
    {
      pattern:
        'http|https://*.*.example.com:80|443/pathname/::param?foo&bar=baz',
      toMatch: [
        {
          protocol: 'http:',
          hostname: 'foo.example.com',
          port: 443,
          pathname: '/pathname/with/param',
          searchParams: new URLSearchParams('?foo=baz&bar=baz'),
        },
      ],
      toNotMatch: [
        {
          protocol: 'ws:',
        },
        {
          protocol: 'http:',
          port: 21,
        },
        {
          protocol: 'http:',
          port: 443,
          hostname: 'foo.com',
        },
        {
          protocol: 'http:',
          port: 443,
          hostname: 'foo.example.com',
          searchParams: new URLSearchParams('?foo&bar=bak'),
        },
      ],
    },
  ]);
});

interface TestCase {
  pattern: string;
  toMatch?: Partial<MatchInfo>[];
  toNotMatch?: Partial<MatchInfo>[];
}

function match(
  name: string,
  createMatcher: (pattern: string) => (info: any) => unknown,
  caseList: TestCase[],
) {
  for (const { pattern, toMatch, toNotMatch } of caseList) {
    for (const info of toMatch || []) {
      it(`${name} '${pattern}' match ${stringify(info)}`, () => {
        const res = createMatcher(pattern)(info);
        expect(res).toBeTruthy();
        expect(res).toMatchSnapshot();
      });
    }
    for (const info of toNotMatch || []) {
      it(`${name} '${pattern}' not match ${stringify(info)}`, () => {
        const res = createMatcher(pattern)(info);
        expect(res).toBeFalsy();
        expect(res).toMatchSnapshot();
      });
    }
  }
}

function stringify(value: any) {
  return JSON.stringify(value, (key, value) => {
    if (value instanceof URLSearchParams) {
      return `${value}`;
    }
    return value;
  });
}

function createCases(key: keyof MatchInfo, values: unknown[]) {
  return values.map((value) => ({ [key]: value }));
}
