<script setup lang="tsx">
import { computed, ref } from 'vue';

import { useWindowEvent } from '../lib/window-event';
import { CommonRequest, RequestItem, UpgradeRequest } from '../store/request';

import FlexHead from './FlexHead.vue';
import FlexHeadTab from './FlexHeadTab.vue';
import ConnectOverview from './request-detail/ConnectOverview.vue';
import UpgradeOverview from './request-detail/UpgradeOverview.vue';
import CoookieDetailVue from './request-detail/request/CoookieDetail.vue';
import RequestOverview from './request-detail/request/RequestOverview.vue';
import RequestPayload from './request-detail/request/RequestPayload.vue';
import ResponseBody from './request-detail/request/ResponseBody.vue';

const props = defineProps<{
  request: RequestItem;
}>();

const emit = defineEmits<(type: 'close') => void>();

useWindowEvent('keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close');
  }
});

interface TabItem {
  name: string;
  key: any;
  component: any;
}

const tabList = computed<TabItem[]>(() => {
  if (props.request.type === 'connect') {
    return [
      {
        name: 'Overview',
        key: 'overview',
        component: ConnectOverview,
      },
    ];
  }
  if (props.request.type === 'upgrade') {
    return [
      {
        name: 'Overview',
        key: 'overview',
        component: UpgradeOverview,
      },
      {
        name: 'Payload',
        key: 'payload',
        component: RequestPayload,
        when: hasPayload(props.request.request),
      },
      {
        name: 'Cookies',
        key: 'cookies',
        component: CoookieDetailVue,
        when: props.request.request.headers.cookie,
      },
    ].filter((item) => item.when !== false);
  }
  return [
    {
      name: 'Overview',
      key: 'overview',
      component: RequestOverview,
    },
    {
      name: 'Payload',
      key: 'payload',
      component: RequestPayload,
      when: hasPayload(props.request.request),
    },
    {
      name: 'Response',
      key: 'response',
      component: ResponseBody,
    },
    {
      name: 'Cookies',
      key: 'cookies',
      component: CoookieDetailVue,
      when:
        !!props.request.request.headers.cookie ||
        !!props.request.response?.headers['set-cookie'],
    },
  ].filter((item) => item.when !== false);
});

const activeTabKey = ref('overview');
const activeTab = computed(
  () =>
    tabList.value.find((tab) => tab.key === activeTabKey.value) ||
    tabList.value[0],
);

function onSelectTab(item: TabItem) {
  activeTabKey.value = item.key;
}

type RequestMessage = CommonRequest['request'] &
  CommonRequest['response'] &
  UpgradeRequest['request'];

function hasPayload(message?: Partial<RequestMessage>) {
  if (!message) {
    return false;
  }
  if (message.body?.data.length) {
    return true;
  }
  if (message.url && new URL(message.url, 'http://tuner/').search) {
    return true;
  }
  return false;
}
</script>

<template>
  <div class="reqDetail-wrap">
    <FlexHead class="reqDetail-head">
      <button
        class="icon-btn reqDetail-close"
        title="Close"
        @click="emit('close')"
      />
      <FlexHeadTab
        v-for="(item, index) in tabList"
        :key="index"
        :active="activeTab.key === item.key"
        @click="onSelectTab(item)"
      >
        {{ item.name }}
      </FlexHeadTab>
    </FlexHead>

    <section class="reqDetail-cnt">
      <component
        :is="activeTab.component"
        :key="props.request.uid"
        :request="props.request"
      />
    </section>
  </div>
</template>

<style scoped lang="scss">
.reqDetail-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

.reqDetail-head {
  position: relative;
  line-height: 28px;
  border-bottom: 0;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 0;
    border-bottom: 1px solid var(--color-details-hairline);
  }
}

.reqDetail-close {
  --icon-btn-image: url('../assets/cross.svg');
  --icon-btn-image-size: 8px 8px;
}

.reqDetail-cnt {
  flex: 1;
  height: 1px;
}
</style>
