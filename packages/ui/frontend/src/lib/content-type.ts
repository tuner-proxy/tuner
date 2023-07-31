export const isJson = createContentTypeMatcher([
  'application/json',
  'text/x-json',
]);

export const isJs = createContentTypeMatcher([
  'application/javascript',
  'application/x-javascript',
  'text/javascript',
  'text/x-javascript',
]);

export const isCss = createContentTypeMatcher(['text/css']);

export const isDoc = createContentTypeMatcher([
  'text/html',
  'text/plain',
  'text/xml',
  'application/xml',
  'application/xhtml+xml',
]);

export function isImg(type?: string) {
  return !!type?.startsWith('image/');
}

export const isForm = createContentTypeMatcher([
  'application/x-www-form-urlencoded',
  'multipart/form-data',
]);

function createContentTypeMatcher(types: string[]) {
  return (type?: string) => {
    if (!type) {
      return false;
    }
    return types.includes(type);
  };
}
