export type LazyURLSearchParamsInit =
  | Iterable<[string, string]>
  | string
  | Record<string, string | ReadonlyArray<string>>
  | Iterable<[string, string]>
  | ReadonlyArray<[string, string]>;

export class LazyURLSearchParams {
  [Symbol.toStringTag] = 'URLSearchParams';

  private dirty = false;

  private searchText = '';

  private searchParams?: URLSearchParams;

  constructor(init?: LazyURLSearchParamsInit) {
    if (init) {
      if (typeof init === 'string') {
        this.searchText = init;
      } else {
        this.dirty = true;
        this.searchParams = new URLSearchParams(init as any);
      }
    }
  }

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URLSearchParams/append)
   */
  append(...args: Parameters<URLSearchParams['append']>) {
    return this.getSearchParams(true).append(...args);
  }

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URLSearchParams/delete)
   */
  delete(...args: Parameters<URLSearchParams['delete']>) {
    return this.getSearchParams(true).delete(...args);
  }

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URLSearchParams/set)
   */
  set(...args: Parameters<URLSearchParams['set']>) {
    return this.getSearchParams(true).set(...args);
  }

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URLSearchParams/sort)
   */
  sort(...args: Parameters<URLSearchParams['sort']>) {
    return this.getSearchParams(true).sort(...args);
  }

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URLSearchParams/entries)
   */
  entries(...args: Parameters<URLSearchParams['entries']>) {
    return this.getSearchParams().entries(...args);
  }

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URLSearchParams/forEach)
   */
  forEach(...args: Parameters<URLSearchParams['forEach']>) {
    return this.getSearchParams().forEach(...args);
  }

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URLSearchParams/get)
   */
  get(...args: Parameters<URLSearchParams['get']>) {
    return this.getSearchParams().get(...args);
  }

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URLSearchParams/getAll)
   */
  getAll(...args: Parameters<URLSearchParams['getAll']>) {
    return this.getSearchParams().getAll(...args);
  }

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URLSearchParams/has)
   */
  has(...args: Parameters<URLSearchParams['has']>) {
    return this.getSearchParams().has(...args);
  }

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URLSearchParams/keys)
   */
  keys(...args: Parameters<URLSearchParams['keys']>) {
    return this.getSearchParams().keys(...args);
  }

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URLSearchParams/values)
   */
  values(...args: Parameters<URLSearchParams['values']>) {
    return this.getSearchParams().values(...args);
  }

  /**
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/URLSearchParams/toString)
   */
  toString() {
    return this.dirty ? String(this.searchParams) : this.searchText;
  }

  getSearchParams(update = false) {
    if (!this.searchParams) {
      this.searchParams = new URLSearchParams(this.searchText);
    }
    if (update) {
      this.dirty = true;
    }
    return this.searchParams;
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}
