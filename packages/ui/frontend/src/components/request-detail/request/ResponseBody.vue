<script setup lang="ts">
import { computed } from 'vue';

import { CommonRequest } from '../../../store/request';

import BodyView from './BodyView.vue';

const props = defineProps<{
  request: CommonRequest;
}>();

const bodyMessage = computed(() => {
  const { response } = props.request;
  if (!response?.body.data.length) {
    return;
  }
  return response;
});
</script>

<template>
  <BodyView
    v-if="bodyMessage"
    class="resBody-body"
    :url="props.request.request.url"
    :message="bodyMessage"
  />
  <section
    v-else
    class="resBody-empty"
  >
    This request has no response data available.
  </section>
</template>

<style scoped lang="scss">
.resBody-body {
  height: 100%;
}

.resBody-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  text-align: center;
  overflow: hidden;
  font-size: 1.5em;
  font-weight: 700;
  color: var(--color-text-secondary);
}
</style>
