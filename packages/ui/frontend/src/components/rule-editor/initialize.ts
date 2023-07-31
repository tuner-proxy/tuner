import { editor } from 'monaco-editor';
import vscodeLoaderURL from 'vscode-loader/src/loader?url';

declare global {
  const ts: any;
}

let initializePromise: Promise<VSCodeInterface> | undefined;

export interface VSCodeInterface {
  monaco: typeof import('monaco-editor');
  ts: any;
  sandboxFactory: VSCodeSandboxFactory;
}

export interface VSCodeSandboxFactory {
  createTypeScriptSandbox: (
    options: any,
    monaco: any,
    ts: any,
  ) => VSCodeSandbox;
}

export interface VSCodeSandbox {
  editor: editor.IStandaloneCodeEditor;
  monaco: typeof import('monaco-editor');
}

export function getVSCodeSandbox() {
  if (!initializePromise) {
    initializePromise = loadVSCodeSandbox();
  }
  return initializePromise;
}

async function loadVSCodeSandbox() {
  await loadScript(vscodeLoaderURL);

  const global: any = globalThis;
  const require: AMDLoader.IRequireFunc = global.require;

  require.config({
    paths: {
      vs: '/@tuner/vs',
      sandbox: 'https://www.typescriptlang.org/js/sandbox',
    },
    ignoreDuplicateModules: ['vs/editor/editor.main'],
  });

  return new Promise<any>((resolve, reject) => {
    require([
      'sandbox/index',
      'vs/editor/editor.main',
      'vs/language/typescript/tsWorker',
    ], (sandboxFactory: any, monaco: typeof import('monaco-editor')) => {
      const ts: typeof import('typescript') = global.ts;

      if (!monaco || !ts || !sandboxFactory) {
        reject(
          new Error('Could not get all the dependencies of sandbox set up'),
        );
        return;
      }
      resolve({ monaco, ts, sandboxFactory });
    });
  });
}

function loadScript(src: string) {
  return new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.addEventListener('load', () => {
      resolve();
    });
    document.body.appendChild(script);
  });
}
