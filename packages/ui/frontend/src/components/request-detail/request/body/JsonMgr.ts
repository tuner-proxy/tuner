import { inject, provide, reactive, ref } from 'vue';

import { copyTextData } from '../../../../lib/clipboard';
import { useWindowEvent } from '../../../../lib/window-event';
import ContextMenu from '../../../ContextMenu.vue';

const jsonMgrKey = Symbol('json-value-context');

export type JsonMgr = ReturnType<typeof createJsonMgr>;

export interface ContextMenuOptions {
  x: number;
  y: number;
  items: { name: string; handler: (event: MouseEvent) => void }[];
}

export function useJsonMgr() {
  return inject<JsonMgr>(jsonMgrKey)!;
}

export function provideJsonMgr(value: any) {
  const mgr = createJsonMgr(value);
  provide(jsonMgrKey, mgr);
  return mgr;
}

function createJsonMgr(value: any) {
  const focusedPath = ref<number[]>();

  const refMap = new Map<string, HTMLElement>();
  const keysMap = new Map<string, string[]>();
  const valueMap = new Map<string, any>();

  const expandedMap = reactive<Record<string, boolean>>({});
  const buildChildrenMap = reactive<Record<string, boolean>>({});

  const arrowMap: Record<string, () => void> = {
    ArrowUp: focusUp,
    ArrowDown: focusDown,
    ArrowLeft: focusLeft,
    ArrowRight: focusRight,
  };

  useWindowEvent('keydown', (event: KeyboardEvent) => {
    if (!focusedPath.value) {
      return;
    }
    if (!arrowMap[event.key]) {
      return;
    }
    event.preventDefault();
    arrowMap[event.key]();
    refMap.get(focusedPath.value.join('.'))?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });
  });

  useWindowEvent('mousedown', (event: MouseEvent) => {
    if (!isInFocusedElement(event)) {
      focusedPath.value = undefined;
    }
  });

  useWindowEvent('contextmenu', (event: MouseEvent) => {
    if (!isInFocusedElement(event)) {
      focusedPath.value = undefined;
    }
  });

  useWindowEvent('copy', (event: ClipboardEvent) => {
    const path = focusedPath.value;
    if (!path) {
      return;
    }
    if (document.getSelection()?.toString()) {
      return;
    }
    event.clipboardData?.setData(
      'text/plain',
      `${getPropertyPath(path)} = ${stringifyPropertyValue(path)}`,
    );
    event.preventDefault();
  });

  function onRef(path: number[], el: HTMLElement) {
    refMap.set(path.join('.'), el);
  }

  function onKeys(path: number[], keys: string[]) {
    if (!path.length) {
      buildChildrenMap[''] = true;
      expandedMap[''] = true;
    }
    keysMap.set(path.join('.'), keys);
  }

  function onValue(path: number[], value: any) {
    valueMap.set(path.join('.'), value);
  }

  function onFocus(path: number[]) {
    focusedPath.value = path.slice();
  }

  let contextMenuHandler: InstanceType<typeof ContextMenu> | undefined;

  function onContextMenuRef(handler: any) {
    contextMenuHandler = handler;
  }

  function onContextMenu(event: MouseEvent, path: number[]) {
    event.stopPropagation();
    if (!contextMenuHandler) {
      return;
    }
    focusedPath.value = path.slice();
    contextMenuHandler.show({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          name: 'Copy property path',
          handler: () => copyTextData(getPropertyPath(path)),
        },
        {
          name: 'Copy value',
          handler: () => copyTextData(stringifyPropertyValue(path)),
        },
        {
          name: 'Copy expression',
          handler: () =>
            copyTextData(
              `${getPropertyPath(path)} = ${stringifyPropertyValue(path)}`,
            ),
        },
      ],
    });
  }

  function onToggle(path: number[]) {
    const strPath = path.join('.');
    buildChildrenMap[strPath] = true;
    expandedMap[strPath] = !expandedMap[strPath];
  }

  function onToggleAll() {
    const keys = Array.from(keysMap.keys());
    if (keys.every((key) => !key || !expandedMap[key])) {
      expandValueDeep([], value);
      return;
    }
    for (const key of keys) {
      expandedMap[key] = false;
      buildChildrenMap[key] = false;
    }
    if (keysMap.has('')) {
      expandedMap[''] = true;
      buildChildrenMap[''] = true;
    }
  }

  function isFocused(path: number[]) {
    return focusedPath.value?.join('.') === path.join('.');
  }

  function isExpanded(path: number[]) {
    return expandedMap[path.join('.')];
  }

  function shouldBuildChildren(path: number[]) {
    return buildChildrenMap[path.join('.')];
  }

  function focusUp() {
    const path = focusedPath.value!;
    const currentIndex = path[path.length - 1];

    // Focus on parent
    if (!currentIndex) {
      path.pop();
      return;
    }

    // Focus on previous sibling
    const cursor = [...path.slice(0, -1), currentIndex - 1];
    while (isExpanded(cursor)) {
      const keysLength = keysMap.get(cursor.join('.'))?.length;
      if (!keysLength) {
        break;
      }
      cursor.push(keysLength - 1);
    }
    focusedPath.value = cursor;
  }

  function focusDown() {
    const path = focusedPath.value!;
    const strPath = path.join('.');

    // Focus on first child
    if (expandedMap[strPath] && keysMap.get(strPath)?.length) {
      path.push(0);
      return;
    }

    // Find next sibling
    let cursor = path;
    while (cursor.length) {
      const currentIndex = cursor[cursor.length - 1];
      const parentPath = cursor.slice(0, -1);

      if (keysMap.get(parentPath.join('.'))!.length > currentIndex + 1) {
        focusedPath.value = [...parentPath, currentIndex + 1];
        return;
      }

      cursor = parentPath;
    }
  }

  function focusLeft() {
    const strPath = focusedPath.value!.join('.');
    if (expandedMap[strPath]) {
      expandedMap[strPath] = false;
    } else {
      focusedPath.value!.pop();
    }
  }

  function focusRight() {
    const strPath = focusedPath.value!.join('.');
    if (!keysMap.get(strPath)) {
      return;
    }
    if (!expandedMap[strPath]) {
      buildChildrenMap[strPath] = true;
      expandedMap[strPath] = true;
    } else {
      focusedPath.value!.push(0);
    }
  }

  function getPropertyPath(targetPath: number[]) {
    let path = 'data';
    let indexPath = '';
    for (const index of targetPath) {
      const keys: string[] | undefined = keysMap.get(indexPath);
      if (!keys) {
        throw new Error(`Missing keys for value in '${path}' (${indexPath})`);
      }
      const segment = keys[index];
      if (/^[$a-zA-Z_][$\w\d]*$/.test(segment)) {
        path += `.${segment}`;
      } else if (String(Number(segment)) === segment) {
        path += `[${segment}]`;
      } else {
        path += `[${JSON.stringify(segment)}]`;
      }
      indexPath += indexPath ? `.${index}` : index;
    }
    return path;
  }

  function stringifyPropertyValue(path: number[]) {
    return JSON.stringify(valueMap.get(path.join('.')) ?? null, null, 2);
  }

  function isInFocusedElement(event: MouseEvent) {
    if (!focusedPath.value) {
      return false;
    }
    return refMap
      .get(focusedPath.value.join('.'))
      ?.contains(event.target as HTMLElement);
  }

  function expandValueDeep(path: number[], value: any) {
    if (!value || typeof value !== 'object') {
      return;
    }
    const strPath = path.join('.');
    const keys = Object.keys(value);

    expandedMap[strPath] = true;
    buildChildrenMap[strPath] = true;

    keysMap.set(strPath, keys);

    for (let i = 0, ii = keys.length; i < ii; i++) {
      expandValueDeep([...path, i], value[keys[i]]);
    }
  }

  return {
    focusedPath,
    onContextMenuRef,
    onRef,
    onKeys,
    onValue,
    onFocus,
    onContextMenu,
    onToggle,
    onToggleAll,
    isFocused,
    isExpanded,
    shouldBuildChildren,
  };
}
