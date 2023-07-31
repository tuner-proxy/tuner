<script setup lang="ts">
import { computed } from 'vue';

import { getRequestHref } from '../../lib/request-href';
import { UpgradeRequest } from '../../store/request';

import DetailItem from './common/DetailItem.vue';
import DetailSection from './common/DetailSection.vue';
import ErrorView from './common/ErrorView.vue';
import HeadersView from './common/HeadersView.vue';

const props = defineProps<{
  request: UpgradeRequest;
}>();

const requestURL = computed(() => getRequestHref(props.request));

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
    <DetailItem label="Request URL">
      {{ requestURL }}
    </DetailItem>
    <DetailItem label="Request Method">
      {{ props.request.request.method }}
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

  <ErrorView
    label="Request Error"
    :error="props.request.error"
  />

  <HeadersView
    label="Request Headers"
    :headers="props.request.request.rawHeaders"
  />
</template>
