<script setup lang="ts">
import { computed } from 'vue';

import { getRequestHref } from '../../../lib/request-href';
import { formatBodySize, getBodySize } from '../../../lib/util';
import { BodyState, CommonRequest } from '../../../store/request';
import DetailItem from '../common/DetailItem.vue';
import DetailSection from '../common/DetailSection.vue';
import ErrorView from '../common/ErrorView.vue';
import HeadersView from '../common/HeadersView.vue';

const METHODS_WITHOUT_BODY = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];

const STATUS_CODE_WITHOUT_BDOY = [204, 304];

const props = defineProps<{
  request: CommonRequest;
}>();

const requestURL = computed(() => getRequestHref(props.request));

const requestLength = computed(() => formatSize(props.request.request.body));

const contentLength = computed(() => formatSize(props.request.response?.body));

const hasRequestBody = computed(() => {
  const request = props.request.request;
  if (request.body.data.length) {
    return true;
  }
  return !METHODS_WITHOUT_BODY.includes(request.method);
});

const hasResponseBody = computed(() => {
  const response = props.request.response;
  if (!response) {
    return false;
  }
  if (response.body.data.length) {
    return true;
  }
  return !STATUS_CODE_WITHOUT_BDOY.includes(response.statusCode);
});

const status = computed(() => {
  if (props.request.request.error) {
    return 'Request Error';
  }
  if (props.request.accepted) {
    return 'Captured';
  }
  if (!props.request.response) {
    return 'Pending';
  }
  if (props.request.response.error) {
    return 'Response Error';
  }
  return 'Finish';
});

function formatSize(body?: BodyState) {
  if (!body) {
    return '0 B (Not Finished)';
  }
  const size = getBodySize(body.data);
  let result = formatBodySize(size);
  if (size > 1024) {
    result += ` (${size.toLocaleString()} B)`;
  }
  if (body.hasEnd) {
    return result;
  }
  return `${result} (Not Finished)`;
}
</script>

<template>
  <div class="requestOverview-wrap">
    <DetailSection label="General">
      <DetailItem label="Request URL">
        {{ requestURL }}
      </DetailItem>
      <DetailItem label="Request Method">
        {{ props.request.request.method }}
      </DetailItem>
      <DetailItem
        v-if="props.request.response"
        label="Status Code"
      >
        {{ props.request.response.statusCode }}
      </DetailItem>
      <DetailItem
        v-if="hasRequestBody"
        label="Request Length"
      >
        {{ requestLength }}
      </DetailItem>
      <DetailItem
        v-if="hasResponseBody"
        label="Content Length"
      >
        {{ contentLength }}
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
      :error="props.request.request.error"
    />

    <ErrorView
      label="Response Error"
      :error="props.request.response?.error"
    />

    <HeadersView
      label="Response Headers"
      :headers="props.request.response?.rawHeaders"
    />

    <HeadersView
      label="Request Headers"
      :headers="props.request.request.rawHeaders"
    />
  </div>
</template>

<style scoped lang="scss">
.requestOverview-wrap {
  height: 100%;
  overflow: auto;
}
</style>
