<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';

import { useWindowEvent } from '../lib/window-event';

export interface ShowOptions {
  x: number;
  y: number;
  items: Array<MenuItem | 'sep'>;
}

export interface MenuItem {
  name: string;
  handler: (event: MouseEvent) => void;
}

const emit = defineEmits<(type: 'hide') => void>();

defineExpose({ show, hide });

const showOptions = ref<ShowOptions>();

function show(options: ShowOptions) {
  showOptions.value = options;
}

function hide() {
  showOptions.value = undefined;
  emit('hide');
}

useWindowEvent('blur', hide);
useWindowEvent('click', hide);
useWindowEvent('mousedown', hide);

const menuRef = shallowRef<HTMLElement>();

const position = computed(() => {
  const options = showOptions.value;
  if (!options) {
    return;
  }
  if (!menuRef.value) {
    return { x: -9999, y: -9999 };
  }
  const { offsetWidth, offsetHeight } = menuRef.value;
  let x = options.x;
  if (x + offsetWidth > window.innerWidth) {
    x -= offsetWidth;
  }
  let y = options.y;
  if (y + offsetHeight > window.innerHeight) {
    y -= offsetHeight;
  }
  return { x, y };
});

function onClickItem(event: MouseEvent, item: MenuItem) {
  item.handler(event);
  showOptions.value = undefined;
}
</script>

<template>
  <Teleport to="body">
    <menu
      v-if="showOptions"
      class="ctxMenu-wrap"
      @mousedown.stop="hide"
    >
      <ol
        ref="menuRef"
        class="ctxMenu-menu"
        :style="{ left: `${position!.x}px`, top: `${position!.y}px` }"
        @click.stop
        @mousedown.stop
        @contextmenu.prevent
      >
        <template
          v-for="(item, index) in showOptions.items"
          :key="index"
        >
          <li
            v-if="item === 'sep'"
            class="ctxMenu-sep"
          />
          <li
            v-else
            class="ctxMenu-item"
            @click="onClickItem($event, item)"
          >
            {{ item.name }}
          </li>
        </template>
      </ol>
    </menu>
  </Teleport>
</template>

<style scoped lang="scss">
.ctxMenu-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  z-index: 100;
}

.ctxMenu-menu {
  position: fixed;
  margin: -3px 0;
  padding: 5px;
  list-style: none;
  font-size: 13px;
  background: var(--tuner-context-menu-bg-color);
  border-radius: 6px;
  box-shadow: 0 3px 12px 0 var(--box-shadow-outline-color);
  backdrop-filter: blur(15px);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 300%;
    height: 300%;
    transform-origin: 0 0;
    border-radius: 3 * 6px;
    box-sizing: border-box;
    transform: scale(0.33333);
    border: 1px solid var(--color-details-hairline);
    pointer-events: none;
  }
}

.ctxMenu-sep {
  position: relative;
  margin: 5px 0;
  height: 1px;

  &::after {
    content: '';
    position: absolute;
    left: 9px;
    right: 9px;
    bottom: 0;
    border-bottom: 1px solid var(--color-details-hairline);
  }
}

.ctxMenu-item {
  padding: 0 10px;
  line-height: 23px;
  border-radius: 4px;
  white-space: nowrap;

  &:hover {
    background: var(--tuner-context-menu-active-bg-color);
    color: var(--color-selected-option);
  }
}
</style>
