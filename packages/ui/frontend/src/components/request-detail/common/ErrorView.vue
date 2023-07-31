<script setup lang="ts">
import { ErrorInfo } from '@ui/types/message';

import DetailItem from './DetailItem.vue';
import DetailSection from './DetailSection.vue';

const props = defineProps<{
  label: string;
  error?: ErrorInfo;
}>();
</script>

<template>
  <DetailSection
    v-if="props.error"
    :label="props.label"
  >
    <DetailItem label="Message">
      {{ props.error.message }}
    </DetailItem>
    <DetailItem label="Stack">
      {{ props.error.stack }}
    </DetailItem>
  </DetailSection>
</template>
