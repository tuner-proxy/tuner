<script setup lang="ts">
import { computed } from 'vue';

import { CommonRequest, UpgradeRequest } from '../../../store/request';
import DetailItem from '../common/DetailItem.vue';
import DetailSection from '../common/DetailSection.vue';

import BodyView from './BodyView.vue';

const props = defineProps<{
  request: CommonRequest | UpgradeRequest;
}>();

const query = computed(() => {
  const index = props.request.request.url.indexOf('?');
  if (index < 0) {
    return [];
  }
  return Array.from(
    new URLSearchParams(props.request.request.url.slice(index)),
  );
});

const bodyMessage = computed(() => {
  if (props.request.type === 'upgrade') {
    return;
  }
  const { request } = props.request;
  if (!request.body.data.length) {
    return;
  }
  return request;
});
</script>

<template>
  <div class="payload-wrap">
    <DetailSection
      v-if="query.length"
      label="Query String Parameters"
    >
      <DetailItem
        v-for="(item, index) in query"
        :key="index"
        :label="item[0]"
      >
        {{ item[1] }}
      </DetailItem>
    </DetailSection>

    <section class="payload-body">
      <BodyView
        v-if="bodyMessage"
        :url="props.request.request.url"
        :message="bodyMessage"
      />
    </section>
  </div>
</template>

<style scoped lang="scss">
.payload-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.payload-body {
  flex: 1;
}
</style>
