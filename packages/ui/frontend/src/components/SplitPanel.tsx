import { defineComponent, ref, VNode } from 'vue';

import { useWindowEvent } from '../lib/window-event';

import style from './SplitPanel.module.scss';

interface WidthRecord {
  index: number;
  width: number;
}

const PANEL_MIN_WIDTH = 50;

export default defineComponent({
  setup({}, { slots }) {
    const resizeState = ref<{ targetIndex: number, startX: number, startWidths: WidthRecord[] }>();
    const resizeStyles = ref<Record<number, Record<string, string>>>({});

    const panelRefs = new Map<number, HTMLElement>();

    function onPanelRef(index: number, el: HTMLElement | null) {
      if (el) {
        panelRefs.set(index, el);
      } else {
        panelRefs.delete(index);
      }
    }

    function onResizeStart(event: MouseEvent, index: number) {
      if (event.button !== 0) {
        return;
      }
      const startWidths: WidthRecord[] = [];
      for (const [index, el] of panelRefs.entries()) {
        startWidths.push({ index, width: el.offsetWidth });
      }
      startWidths.sort((a, b) => a.index - b.index);
      resizeState.value = {
        targetIndex: startWidths.findIndex(item => item.index === index),
        startX: event.pageX,
        startWidths,
      };
    }

    useWindowEvent('mousemove', (event: MouseEvent) => {
      if (!resizeState.value) {
        return;
      }
      const { targetIndex, startX, startWidths } = resizeState.value;
      const styles: Record<number, Record<string, string>> = {};

      const delta = event.pageX - startX;
      const direction = Math.sign(delta) || 1;
      const expandIndex = targetIndex + Math.min(-direction, 0);

      let remain = delta;

      forEach(startWidths, direction, ({ index, width }, i) => {
        if (i === expandIndex) {
          return;
        }
        if (!remain || i * direction < targetIndex * direction) {
          styles[index] = { flex: `1 1 ${width}px` };
          return;
        }
        const newWidth = Math.max(width - remain * direction, PANEL_MIN_WIDTH);
        styles[index] = { flex: `1 1 ${newWidth}px` };
        remain -= direction * (width - newWidth);
      });

      const { index, width } = startWidths[expandIndex];
      styles[index] = { flex: `1 1 ${width + direction * (delta - remain)}px` };

      resizeStyles.value = styles;
    });

    useWindowEvent('mouseup', () => {
      if (!resizeState.value) {
        return;
      }
      resizeState.value = undefined;
    });

    function onResetResize() {
      resizeStyles.value = {};
    }

    function renderItem(vnode: VNode, index: number) {
      if (typeof vnode.type === 'symbol') {
        return null;
      }
      return <>
        {renderResizer(index)}
        <div
          class={style.item}
          style={resizeStyles.value[index]}
          ref={el => onPanelRef(index, el as any)}
        >
          {vnode}
        </div>
      </>;
    }

    function renderResizer(index: number) {
      if (!index) {
        return null;
      }
      return (
        <div class={style.resizer}>
          <div
            class={style.resizeHandle}
            onMousedown={event => onResizeStart(event, index)}
            onDblclick={onResetResize}
          />
        </div>
      );
    }

    return () => {
      const vnodes = slots.default?.();
      if (!vnodes) {
        return <div class={style.wrap} />;
      }
      const currentCount = vnodes.filter(vnode => typeof vnode.type !== 'symbol').length;
      const resizeCount = Object.keys(resizeStyles.value).length;
      if (resizeCount && currentCount !== resizeCount) {
        resizeStyles.value = {};
      }
      return (
        <div class={style.wrap}>
          {vnodes.map(renderItem)}
        </div>
      );
    };
  },
});

function forEach<T>(list: T[], direction: number, callback: (val: T, index: number) => void) {
  if (direction >= 0) {
    for (let i = 0, ii = list.length; i < ii; i++) {
      callback(list[i], i);
    }
  } else {
    for (let i = list.length - 1; i >= 0; i--) {
      callback(list[i], i);
    }
  }
}
