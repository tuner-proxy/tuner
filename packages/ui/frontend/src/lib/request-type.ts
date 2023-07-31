import { RequestItem } from '../store/request';

import { isCss, isDoc, isImg, isJs, isJson } from './content-type';
import { parserContentType } from './header-parser';

export interface FilterItem {
  name: string;
  key: string;
  match: (request: RequestItem) => boolean;
}

export const FILTER_TYPES: FilterItem[] = [
  {
    name: 'JSON',
    key: 'json',
    match: (request) => isJson(getContentType(request)),
  },
  {
    name: 'JS',
    key: 'js',
    match: (request) => isJs(getContentType(request)),
  },
  {
    name: 'CSS',
    key: 'css',
    match: (request) => isCss(getContentType(request)),
  },
  {
    name: 'Img',
    key: 'image',
    match: (request) => isImg(getContentType(request)),
  },
  {
    name: 'Doc',
    key: 'doc',
    match: (request) => isDoc(getContentType(request)),
  },
  {
    name: 'Upgrade',
    key: 'upgrade',
    match: createRequestTypeMatcher('upgrade'),
  },
  {
    name: 'Connect',
    key: 'connect',
    match: createRequestTypeMatcher('connect'),
  },
  {
    name: 'Other',
    key: 'other',
    match: (request) =>
      !FILTER_TYPES.some((filter) => {
        if (filter.key === 'other') {
          return false;
        }
        return filter.match(request);
      }),
  },
];

function createRequestTypeMatcher(type: string) {
  return (request: RequestItem) => request.type === type;
}

function getContentType(request: RequestItem) {
  if (request.type !== 'request') {
    return;
  }
  return parserContentType(request.response?.headers['content-type'])?.type;
}
