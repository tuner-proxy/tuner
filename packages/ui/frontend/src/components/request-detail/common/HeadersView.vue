<script setup lang="ts">
import { computed } from 'vue';

import DetailItem from './DetailItem.vue';
import DetailSection from './DetailSection.vue';

const props = defineProps<{
  label: string;
  headers?: string[];
}>();

const formattedHeaders = computed(() => {
  if (!props.headers) {
    return [];
  }
  const headers: [string, string][] = [];
  for (let i = 0, ii = props.headers.length; i < ii; i += 2) {
    headers.push([props.headers[i], props.headers[i + 1]]);
  }
  return headers;
});
</script>

<template>
  <DetailSection
    v-if="props.headers?.length"
    :label="props.label"
  >
    <DetailItem
      v-for="(header, index) in formattedHeaders"
      :key="index"
      :label="header[0]"
    >
      {{ header[1] }}
    </DetailItem>
  </DetailSection>
</template>
