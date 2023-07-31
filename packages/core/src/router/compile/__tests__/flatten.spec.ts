import { RouteElement } from '../../handler';
import { flattenRoutes } from '../flatten';

describe('flatten', () => {
  test('common', ['//example.com', { status: 200 }]);

  test('multiple handlers', [
    '//example.com',
    [
      () => {
        // noop
      },
      { status: 404 },
    ],
  ]);

  test('with child routes', [
    '//example.com',
    '//demo.com',
    [{ status: 200 }, '/not-found', { status: 404 }],
  ]);

  test('disable fragment', ['//example.com', '!//demo.com', { status: 200 }]);

  test('disable fragment', ['//example.com', ['!', { status: 200 }]]);
});

function test(name: string, routes: RouteElement[]) {
  it(name, () => {
    expect(flattenRoutes(routes)).toMatchSnapshot();
  });
}
