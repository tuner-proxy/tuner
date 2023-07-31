import { parserContentType } from './header-parser';

const enum ParseState {
  Boundary = 0,
  Header = 1,
  Content = 2,
}

export interface Input {
  filename?: string;
  name?: string;
  headers: Record<string, string>;
  data: string | Uint8Array;
}

const CR = '\r'.charCodeAt(0);
const LF = '\n'.charCodeAt(0);
const DASH = '-'.charCodeAt(0);

export function parseMultipart(
  bodyBuffer: Uint8Array,
  boundary: string,
): Input[] {
  const allParts: Input[] = [];

  const boundaryBuffer = new TextEncoder().encode(boundary);
  const boundaryLength = boundaryBuffer.length;

  let state = ParseState.Boundary;

  let lineStart = 0;
  let lineEnd = 0;
  let headerLines: [number, number][] = [];
  let bufferStart = 0;

  function nextLineEnd() {
    let fromIndex = lineStart;
    while (fromIndex < bodyBuffer.length) {
      const index = bodyBuffer.indexOf(CR, fromIndex);
      if (index < 0) {
        return bodyBuffer.length;
      }
      if (bodyBuffer[index + 1] === LF) {
        return index;
      }
      fromIndex = index + 1;
    }
    return bodyBuffer.length;
  }

  function isBoundary() {
    if (lineEnd - lineStart === boundaryLength + 4) {
      if (
        bodyBuffer[lineEnd - 1] !== DASH ||
        bodyBuffer[lineEnd - 2] !== DASH
      ) {
        return false;
      }
    } else {
      if (lineEnd - lineStart !== boundaryLength + 2) {
        return false;
      }
    }
    if (bodyBuffer[lineStart] !== DASH) {
      return false;
    }
    if (bodyBuffer[lineStart + 1] !== DASH) {
      return false;
    }
    for (let i = 0, ii = boundaryBuffer.length; i < ii; i++) {
      if (boundaryBuffer[i] !== bodyBuffer[lineStart + 2 + i]) {
        return false;
      }
    }
    return true;
  }

  while (lineStart < bodyBuffer.length) {
    switch (state) {
      case ParseState.Boundary: {
        lineEnd = nextLineEnd();
        if (isBoundary()) {
          state = ParseState.Header;
        }
        lineStart = lineEnd + 2;
        break;
      }
      case ParseState.Header: {
        lineEnd = nextLineEnd();
        if (lineEnd === lineStart) {
          state = ParseState.Content;
        } else {
          headerLines.push([lineStart, lineEnd]);
        }
        lineStart = lineEnd + 2;
        bufferStart = lineStart;
        break;
      }
      case ParseState.Content: {
        lineEnd = nextLineEnd();
        if (isBoundary()) {
          const headers: Record<string, string> = {};
          for (const [headerStart, headerEnd] of headerLines) {
            const [headerName, headerValue] = new TextDecoder()
              .decode(bodyBuffer.slice(headerStart, headerEnd))
              .split(/\s*:\s*/);
            headers[headerName.toLowerCase()] = headerValue;
          }
          let data: string | Uint8Array = bodyBuffer.slice(
            bufferStart,
            lineStart - 2,
          );
          if (!headers['content-type']) {
            data = new TextDecoder().decode(data);
          }
          const disposition = parserContentType(headers['content-disposition']);
          allParts.push({
            name: formatName(disposition?.params.name),
            filename: formatName(disposition?.params.filename),
            headers,
            data,
          });
          state = ParseState.Boundary;
          headerLines = [];
        }
        lineStart = lineEnd + 2;
        break;
      }
    }
  }

  return allParts;
}

function formatName(name?: string | boolean) {
  if (typeof name !== 'string') {
    return;
  }
  const last = name[name.length - 1];
  if (name[0] !== last) {
    return name;
  }
  if (name[0] === '"' || name[0] === "'") {
    return name.slice(1, -1);
  }
  return name;
}
