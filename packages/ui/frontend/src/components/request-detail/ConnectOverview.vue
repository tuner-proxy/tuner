<script setup lang="ts">
import { computed } from 'vue';

import { stringifyHost } from '../../lib/util';
import { ConnectRequest } from '../../store/request';

import DetailItem from './common/DetailItem.vue';
import DetailSection from './common/DetailSection.vue';
import HeadersView from './common/HeadersView.vue';

const props = defineProps<{
  request: ConnectRequest;
}>();

const connectHost = computed(() =>
  stringifyHost(props.request.request.hostname, props.request.request.port),
);

const status = computed(() => {
  if (props.request.error) {
    return 'Error';
  }
  if (!props.request.response) {
    return 'Pending';
  }
  if (props.request.response.accepted) {
    return 'Captured';
  }
  return 'Finished';
});
</script>

<template>
  <DetailSection label="General">
    <DetailItem label="Tunnel Target">
      {{ connectHost }}
    </DetailItem>
    <DetailItem label="Client Address">
      {{ props.request.request.remote.address }}
    </DetailItem>
    <DetailItem
      v-if="props.request.response?.remote"
      label="Remote Address"
    >
      {{ props.request.response.remote.address }}
    </DetailItem>
    <DetailItem label="Request Status">
      {{ status }}
    </DetailItem>
  </DetailSection>
  <HeadersView
    label="Request Headers"
    :headers="props.request.request.rawHeaders"
  />
</template>
