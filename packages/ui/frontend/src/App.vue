<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';

import ContextMenu, { MenuItem } from './components/ContextMenu.vue';
import FlexHead from './components/FlexHead.vue';
import RequestDetail from './components/RequestDetail.vue';
import RequestList from './components/RequestList.vue';
import SplitPanel from './components/SplitPanel';
import { copyTextData } from './lib/clipboard';
import { getRequestHref } from './lib/request-href';
import { FilterItem, FILTER_TYPES } from './lib/request-type';
import { stringifyHost } from './lib/util';
import { useConnectionStore } from './store/connection';
import { useRequestStore } from './store/request';

const requestStore = useRequestStore();
const connectionStore = useConnectionStore();

const WebSocket = window.WebSocket;

const selectedRequestUid = ref<string>();
const selectedRequest = computed(() => {
  if (selectedRequestUid.value == null) {
    return;
  }
  return requestStore.requestList.find(
    (sess) => sess.uid === selectedRequestUid.value,
  );
});

function onSelectRequest(uid: string) {
  selectedRequestUid.value = uid;
}

function onCancelSelection() {
  selectedRequestUid.value = undefined;
}

const menuRef = ref<InstanceType<typeof ContextMenu>>();
const contextMenuUid = ref<string>();

function onShowContextMenu(event: MouseEvent, uid: string) {
  const request = requestStore.requestList.find((req) => req.uid === uid);
  if (!request) {
    return;
  }

  event.preventDefault();

  if (selectedRequestUid.value) {
    selectedRequestUid.value = uid;
  } else {
    contextMenuUid.value = uid;
  }

  const items: Array<MenuItem | 'sep'> = [];

  if (request.type === 'request') {
    if (request.request.body.hasEnd) {
      items.push({
        name: 'Replay request',
        handler: () => {
          const form = new FormData();
          form.append(
            'params',
            JSON.stringify({
              encrypted: request.request.encrypted,
              host: request.request.headers.host,
              method: request.request.method,
              url: request.request.url,
              headers: request.request.rawHeaders,
            }),
          );
          form.append('body', new Blob(request.request.body.data));
          fetch('/@tuner/api/compose/send', { method: 'POST', body: form });
        },
      });
    }
    if (request.request.method === 'GET') {
      items.push({
        name: 'Open in new tab',
        handler: () => {
          window.open(getRequestHref(request));
        },
      });
    }
  }

  if (items.length) {
    items.push('sep');
  }

  if (request.type === 'connect') {
    items.push({
      name: 'Copy connect target',
      handler: () => {
        copyTextData(
          stringifyHost(request.request.hostname, request.request.port),
        );
      },
    });
  } else {
    items.push({
      name: 'Copy link address',
      handler: () => {
        copyTextData(getRequestHref(request));
      },
    });
  }

  menuRef.value!.show({
    x: event.clientX,
    y: event.clientY,
    items,
  });
}

function onHideContextMenu() {
  contextMenuUid.value = undefined;
}

const filterKeyword = ref('');
const filterType = shallowRef<FilterItem>();

const filteredList = computed(() => {
  const keyword = filterKeyword.value.trim().toUpperCase();
  if (!keyword && !filterType.value) {
    return requestStore.requestList;
  }
  return requestStore.requestList.filter((item) => {
    if (filterType.value && !filterType.value.match(item)) {
      return false;
    }
    return getRequestHref(item).toUpperCase().includes(keyword);
  });
});

function onClearFilter() {
  filterKeyword.value = '';
}

function onSelectFilterType(filter?: FilterItem) {
  filterType.value = filter;
}
</script>

<template>
  <div class="app-container">
    <FlexHead>
      <button
        class="icon-btn app-btn"
        :class="{
          'app-btn--active':
            connectionStore.opening &&
            connectionStore.readyState === WebSocket.OPEN,
          'app-btn--connecting':
            connectionStore.opening &&
            connectionStore.readyState !== WebSocket.OPEN,
          'app-btn--disconnect': !connectionStore.opening,
        }"
        :title="
          connectionStore.opening
            ? 'Stop recording network log'
            : 'Record network log'
        "
        @click="requestStore.toggleConnection"
      />
      <button
        class="icon-btn app-btn app-btn--clear"
        title="Clear"
        @click="requestStore.clearRequestList"
      />

      <span class="head-sep" />

      <span class="app-filter">
        <input
          v-model="filterKeyword"
          class="app-filterIpt"
          :class="{
            'app-filterIpt--active': filterKeyword,
          }"
          placeholder="Filter"
        />
        <button
          v-if="filterKeyword"
          class="app-filterClear"
          title="Clear input"
          @mousedown.prevent
          @click="onClearFilter"
        />
      </span>

      <span class="head-sep" />

      <button
        class="app-filterType"
        :class="{
          'app-filterType--active': filterType === null,
        }"
        title="All"
        @click="onSelectFilterType(undefined)"
      >
        All
      </button>
      <button
        v-for="filter in FILTER_TYPES"
        :key="filter.key"
        class="app-filterType"
        :class="{
          'app-filterType--active': filterType?.key === filter.key,
        }"
        :title="filter.name"
        @click="onSelectFilterType(filter)"
      >
        {{ filter.name }}
      </button>
    </FlexHead>

    <SplitPanel class="app-main">
      <RequestList
        key="request-list"
        class="app-panel"
        :list="filteredList"
        :selected-uid="selectedRequestUid"
        :highlight-uids="[contextMenuUid]"
        :filter-keyword="filterKeyword"
        :restrain-stick-to-bottom="!!contextMenuUid"
        @select="onSelectRequest"
        @contextmenu="onShowContextMenu"
      />

      <RequestDetail
        v-if="selectedRequest"
        key="request-detail"
        class="app-panel"
        :request="selectedRequest"
        @close="onCancelSelection"
      />
    </SplitPanel>
  </div>

  <ContextMenu
    ref="menuRef"
    @hide="onHideContextMenu"
  />
</template>

<style lang="scss" scoped>
.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-btn {
  &--active {
    --icon-btn-image: url('./assets/active.svg');
    --icon-btn-color: var(--color-accent-red);

    &:hover {
      --icon-btn-color: var(--color-accent-red);
    }
  }

  &--connecting {
    --icon-btn-image: url('./assets/active.svg');
  }

  &--disconnect {
    --icon-btn-image: url('./assets/pause.svg');
  }

  &--clear {
    --icon-btn-image: url('./assets/clear.svg');
  }

  &--rules {
    --icon-btn-image: url('./assets/code.svg');
  }
}

.app-filter {
  position: relative;
  display: flex;
}

.app-filterIpt {
  margin: 0 4px;
  width: 160px;
  padding-right: 18px;
  border: 0;
  outline: none;
  color: var(--color-text-primary);
  background: var(--color-background);

  &:hover {
    box-shadow: var(--legacy-focus-ring-inactive-shadow);
  }

  &--active,
  &--active:hover,
  &:focus {
    box-shadow: var(--legacy-focus-ring-active-shadow);
  }
}

.app-filterClear {
  position: absolute;
  right: 6px;
  top: 50%;
  width: 12px;
  height: 12px;
  padding: 0;
  border: 0;
  transform: translateY(-50%);
  cursor: pointer;
  background: var(--tuner-input-clear-bg-color);
  mask-image: url('./assets/clear-filter.svg');

  &:hover {
    background: var(--tuner-input-clear-bg-hovered-color);
  }
}

.app-filterType {
  margin: 0 2px;
  border: 0;
  padding: 3px 6px;
  font-size: 12px;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;

  &:hover {
    background: var(--color-background-elevation-2);
  }

  &--active,
  &--active:hover,
  &:active {
    background: var(--color-background-highlight);
  }
}

.app-main {
  position: relative;
  flex: 1;
  height: 1px;
}

.app-panel {
  height: 100%;
  background: var(--color-background);

  @media screen and (max-width: 480px) {
    position: absolute;
    left: 0;
    width: 100%;
  }
}
</style>
