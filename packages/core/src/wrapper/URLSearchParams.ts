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

  append(...args: Parameters<URLSearchParams['append']>) {
    return this.getSearchParams(true).append(...args);
  }

  delete(...args: Parameters<URLSearchParams['delete']>) {
    return this.getSearchParams(true).delete(...args);
  }

  set(...args: Parameters<URLSearchParams['set']>) {
    return this.getSearchParams(true).set(...args);
  }

  sort(...args: Parameters<URLSearchParams['sort']>) {
    return this.getSearchParams(true).sort(...args);
  }

  entries(...args: Parameters<URLSearchParams['entries']>) {
    return this.getSearchParams().entries(...args);
  }

  forEach(...args: Parameters<URLSearchParams['forEach']>) {
    return this.getSearchParams().forEach(...args);
  }

  get(...args: Parameters<URLSearchParams['get']>) {
    return this.getSearchParams().get(...args);
  }

  getAll(...args: Parameters<URLSearchParams['getAll']>) {
    return this.getSearchParams().getAll(...args);
  }

  has(...args: Parameters<URLSearchParams['has']>) {
    return this.getSearchParams().has(...args);
  }

  keys(...args: Parameters<URLSearchParams['keys']>) {
    return this.getSearchParams().keys(...args);
  }

  values(...args: Parameters<URLSearchParams['values']>) {
    return this.getSearchParams().values(...args);
  }

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
