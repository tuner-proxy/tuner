import { describe, expect, it } from 'vitest';

import type { RouteElement } from '../../handler';
import { flattenRoutes } from '../flatten';

describe('flatten', () => {
  test('common', [
    '//example.com',
    (req) => {
      req.response = { status: 200 };
    },
  ]);

  test('multiple handlers', [
    '//example.com',
    [
      () => {
        // noop
      },
      (req) => {
        req.response = { status: 404 };
      },
    ],
  ]);

  test('with child routes', [
    '//example.com',
    '//demo.com',
    [
      (req) => {
        req.response = { status: 200 };
      },
      '/not-found',
      (req) => {
        req.response = { status: 404 };
      },
    ],
  ]);

  test('disable fragment', [
    '//example.com',
    '!//demo.com',
    (req) => {
      req.response = { status: 200 };
    },
  ]);

  test('disable fragment', [
    '//example.com',
    [
      '!',
      (req) => {
        req.response = { status: 200 };
      },
    ],
  ]);
});

function test(name: string, routes: RouteElement[]) {
  it(name, () => {
    expect(flattenRoutes(routes)).toMatchSnapshot();
  });
}
