<script setup lang="ts">
import { computed, onMounted, onUpdated, ref, watch } from 'vue';

import { ColumnDefinition, COLUMNS } from '../lib/list-column';
import { formatRequestList } from '../lib/request-list';
import { useWindowEvent } from '../lib/window-event';
import { RequestItem } from '../store/request';

import RequestListColumn from './RequestListColumn.vue';

const HEADER_HEIGHT = 27;
const ROW_HEIGHT = 25;

const navigationKeys = ['ArrowUp', 'ArrowDown', 'Home', 'End'];

const props = defineProps<{
  list: RequestItem[];
  selectedUid?: string;
  highlightUids?: Array<string | undefined>;
  restrainStickToBottom?: boolean;
}>();

const emit = defineEmits<{
  (type: 'select', uid: string): void;
  (type: 'contextmenu', event: MouseEvent, uid: string): void;
}>();

const requestList = computed(() => formatRequestList(props.list));
const listRef = ref<HTMLElement>();

let stickToBottom = true;

watch(
  () => props.restrainStickToBottom,
  (value) => {
    if (value) {
      stickToBottom = false;
    } else {
      onScroll();
    }
  },
);

watch(
  () => {
    if (!props.selectedUid) {
      return -1;
    }
    return requestList.value.findIndex(
      (item) => item.uid === props.selectedUid,
    );
  },
  (index) => {
    if (!listRef.value || index < 0) {
      return;
    }
    const scrollTop = listRef.value.scrollTop;
    const maxScrollTop = index * ROW_HEIGHT;
    if (scrollTop > maxScrollTop) {
      listRef.value.scrollTop = maxScrollTop;
      onScroll();
      return;
    }
    const clientHeight = listRef.value.clientHeight;
    const minScrollTop =
      maxScrollTop - clientHeight + HEADER_HEIGHT + ROW_HEIGHT;
    if (scrollTop < minScrollTop) {
      listRef.value.scrollTop = minScrollTop;
      onScroll();
    }
  },
);

onMounted(checkScrollToBottom);
onUpdated(checkScrollToBottom);

function checkScrollToBottom() {
  if (stickToBottom && listRef.value) {
    listRef.value.scrollBy(0, listRef.value.scrollHeight);
  }
}

let scrollTop = 0;

function onScroll() {
  const el = listRef.value;
  if (!el) {
    return;
  }
  const oldScrollTop = scrollTop;
  scrollTop = el.scrollTop;
  if (props.restrainStickToBottom) {
    stickToBottom = false;
    return;
  }
  const isAtBottom = scrollTop + el.clientHeight >= el.scrollHeight - 5;
  if (scrollTop < oldScrollTop) {
    stickToBottom = isAtBottom;
  } else if (isAtBottom) {
    stickToBottom = true;
  }
}

const focusInList = ref(false);

useWindowEvent('mousedown', (event: MouseEvent) => {
  const el = event.target as HTMLElement;
  focusInList.value = !!listRef.value?.contains(el);
});

useWindowEvent('keydown', (event: KeyboardEvent) => {
  if (!focusInList.value || !navigationKeys.includes(event.key)) {
    return;
  }
  event.preventDefault();
  const list = requestList.value;
  const length = list.length;
  if (!props.selectedUid || !length) {
    return;
  }
  const currentIndex = list.findIndex((item) => item.uid === props.selectedUid);
  if (currentIndex < 0) {
    emit('select', list[0].uid);
    return;
  }
  let targetIndex = currentIndex;
  switch (event.key) {
    case 'ArrowUp':
      if (event.metaKey || event.ctrlKey) {
        targetIndex = 0;
      } else {
        targetIndex -= 1;
      }
      break;
    case 'ArrowDown':
      if (event.metaKey || event.ctrlKey) {
        targetIndex = Infinity;
      } else {
        targetIndex += 1;
      }
      break;
    case 'Home':
      targetIndex = 0;
      break;
    case 'End':
      targetIndex = Infinity;
      break;
  }
  targetIndex = Math.max(0, Math.min(length - 1, targetIndex));
  emit('select', list[targetIndex].uid);
});

function onSelectRequest(event: MouseEvent, uid: string) {
  if (event.button === 0) {
    emit('select', uid);
  }
}

function onContextMenu(event: MouseEvent, uid: string) {
  emit('contextmenu', event, uid);
}

const resizeColumnState = ref<{ key: string; width: number; fromX: number }>();
const resizeStyleMap = ref<Record<string, Record<string, string>>>({});

const sepRefs: Record<string, any> = {};

function onResizeColumnStart(event: MouseEvent, target: ColumnDefinition) {
  const index = COLUMNS.findIndex((column) => column.key === target.key);
  const columnWidth = getColumnWidth();

  resizeColumnState.value = {
    key: target.key,
    width: columnWidth[target.key],
    fromX: event.pageX,
  };

  const styles: Record<string, Record<string, string>> = {};
  for (let i = 0; i <= index; i++) {
    const { key } = COLUMNS[i];
    styles[key] = {
      flex: '0 0 auto',
      width: `${columnWidth[key]}px`,
    };
  }
  for (let i = index + 1, ii = COLUMNS.length; i < ii; i++) {
    const { key } = COLUMNS[i];
    styles[key] = {
      flex: '1 0 auto',
      width: `${columnWidth[key]}px`,
    };
  }
  resizeStyleMap.value = styles;
}

useWindowEvent('mousemove', (event: MouseEvent) => {
  const state = resizeColumnState.value;
  if (!state) {
    return;
  }
  resizeStyleMap.value[state.key] = {
    flex: '0 0 auto',
    width: `${state.width + event.pageX - state.fromX}px`,
  };
});

useWindowEvent('mouseup', () => {
  const state = resizeColumnState.value;
  if (!state) {
    return;
  }
  const columnWidth = getColumnWidth();
  const styles: Record<string, Record<string, string>> = {};
  for (const column of COLUMNS) {
    styles[column.key] = {
      width: `${columnWidth[column.key]}px`,
    };
  }
  resizeStyleMap.value = styles;
  resizeColumnState.value = undefined;
});

function onResetColumnResize() {
  resizeStyleMap.value = {};
}

function onSepRef(component: any, column: ColumnDefinition) {
  sepRefs[column.key] = component;
}

function getColumnWidth() {
  const width: Record<string, number> = {};
  for (const column of COLUMNS) {
    width[column.key] = sepRefs[column.key].$el.offsetWidth;
  }
  return width;
}
</script>

<template>
  <div
    ref="listRef"
    class="list-container"
    :class="{
      'list-container--focused': focusInList,
    }"
    @scroll="onScroll"
  >
    <div class="list-scroll">
      <header class="list-head">
        <RequestListColumn
          v-for="column in COLUMNS"
          :key="column.key"
          class="list-column"
          :column="column"
          :resize-style="resizeStyleMap[column.key]"
        >
          {{ column.name }}
        </RequestListColumn>
        <span class="list-column" />
      </header>
      <ol class="list-cnt">
        <li
          v-for="item in requestList"
          :key="item.uid"
          class="list-item"
          :class="{
            'list-item--highlight':
              item.uid === props.selectedUid ||
              props.highlightUids?.includes(item.uid),
          }"
          @mousedown="onSelectRequest($event, item.uid)"
          @contextmenu="onContextMenu($event, item.uid)"
        >
          <RequestListColumn
            v-for="column in COLUMNS"
            :key="column.key"
            class="list-column"
            :column="column"
            :resize-style="resizeStyleMap[column.key]"
          >
            {{ (item as any)[column.key] }}
          </RequestListColumn>
          <span class="list-column" />
        </li>
      </ol>
      <section
        class="list-sepList"
        :class="{
          'list-sepList--active': resizeColumnState,
        }"
      >
        <RequestListColumn
          v-for="column in COLUMNS"
          :key="column.key"
          :ref="(com: any) => onSepRef(com, column)"
          class="list-column list-sep"
          :column="column"
          :resize-style="resizeStyleMap[column.key]"
        >
          <div
            class="list-sepHandle"
            @dblclick="onResetColumnResize"
            @mousedown.left="onResizeColumnStart($event, column)"
          />
        </RequestListColumn>
        <span class="list-column" />
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list-container {
  font-size: 12px;
  line-height: 17px;
  overflow: auto;
}

.list-scroll {
  position: relative;
  min-height: 100%;
}

.list-head,
.list-item,
.list-sepList {
  display: flex;
}

.list-head {
  position: sticky;
  top: 0;

  .list-column {
    position: relative;
    padding: 5px 6px;
    background: var(--color-background-elevation-1);
    border-bottom: 1px solid var(--color-details-hairline);
  }
}

.list-cnt {
  list-style: none;
  margin: 0;
  padding: 0;
}

.list-item {
  scroll-margin: 27px 0 0;
  cursor: pointer;

  &--highlight {
    .list-column {
      background: var(--network-grid-selected-color);
    }

    .list-container--focused & .list-column {
      background: var(--network-grid-focus-selected-color);
      color: var(--color-selected-option);
    }
  }

  &:not(&--highlight) {
    .list-column {
      background: var(--network-grid-default-color);
    }

    &:nth-child(2n) .list-column {
      background: var(--network-grid-stripe-color);
    }

    &:hover .list-column {
      background: var(--network-grid-hovered-color);
    }
  }
}

.list-column {
  padding: 4px 6px;
  min-width: 20px;
  box-sizing: border-box;
}

.list-sepList {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: col-resize;
  pointer-events: none;

  &--active {
    pointer-events: all;
  }
}

.list-sep {
  position: relative;
  padding: 0;
  pointer-events: none;
  border-right: 1px solid var(--color-details-hairline);

  &:last-child .list-sepHandle {
    right: 0;
    width: 3px;
  }
}

.list-sepHandle {
  position: absolute;
  right: -3px;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 1;
  pointer-events: all;
}
</style>
