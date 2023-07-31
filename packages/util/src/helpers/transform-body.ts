import fs from 'fs';

import { HTTPResponse, HTTPRequest, httpHandler } from '@tuner-proxy/core';
import waitFor from 'event-to-promise';

import { transformRes } from './response';

export type TransformRequestBodyHandler<T> = (
  data: T,
  req: HTTPRequest,
) => T | Promise<T>;

export type TransformResponseBodyHandler<T> = (
  data: T,
  req: HTTPRequest,
  res: HTTPResponse,
) => T | Promise<T>;

/**
 * Update request body as Buffer
 */
export const transformReqBody = (
  handler: TransformRequestBodyHandler<Buffer>,
) =>
  httpHandler(async (req, next) => {
    const data = await req.buffer();
    const newData = await handler(data, req);
    req.setBody(newData);
    return next();
  });

/**
 * Update request body as string
 */
export const transformReqText = (
  handler: TransformRequestBodyHandler<string>,
) =>
  httpHandler(async (req, next) => {
    const data = await req.text();
    const newData = await handler(data, req);
    req.setBody(newData);
    return next();
  });

/**
 * Update request body as JSON
 */
export const transformReqJSON = (handler: TransformRequestBodyHandler<any>) =>
  transformReqText(async (text, req) => {
    const data = JSON.parse(text);
    let newData = await handler(data, req);
    if (typeof newData === 'undefined') {
      newData = data;
    }
    return JSON.stringify(newData);
  });

/**
 * Update response body as Buffer
 */
export const transformResBody = (
  handler: TransformResponseBodyHandler<Buffer>,
) =>
  transformRes(async (res, req) => {
    const data = await res.buffer();
    const newData = await handler(data, req, res);
    res.setBody(newData);
    return res;
  });

/**
 * Update response body as string
 */
export const transformResText = (
  handler: TransformResponseBodyHandler<string>,
) =>
  transformRes(async (res, req) => {
    const data = await res.text();
    const newData = await handler(data, req, res);
    res.setBody(newData);
    return res;
  });

/**
 * Update response body as json
 */
export const transformResJSON = (handler: TransformResponseBodyHandler<any>) =>
  transformResText(async (text, req, res) => {
    const data = JSON.parse(text);
    let newData = await handler(data, req, res);
    if (typeof newData === 'undefined') {
      newData = data;
    }
    return JSON.stringify(newData);
  });

export type InjectHTMLPosition = 'begin' | 'end';

/**
 * Inject content to html response
 */
export const injectHTML = (
  content: string,
  position: InjectHTMLPosition = 'end',
) =>
  transformRes(async (res) => {
    const type = res.headers['content-type'];
    if (!type?.includes('text/html')) {
      return res;
    }
    let html = await res.text();
    if (position === 'begin') {
      html = content + html;
    } else {
      html += content;
    }
    res.setBody(html);
    return res;
  });

/**
 * Save response body to local file
 */
export const save = (path: string) =>
  transformRes(async (res) => {
    const body = res.stream({ encoding: null });
    const file = fs.createWriteStream(path);

    await waitFor(file, 'open');
    await waitFor(body.pipe(file), 'end');

    return res;
  });
