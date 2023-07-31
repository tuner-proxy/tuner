<script setup lang="ts">
import { ref } from 'vue';

import { useWindowEvent } from '../../../lib/window-event';

const props = defineProps<{
  label: string;
}>();

const focused = ref(false);
const elRef = ref<HTMLElement>();

useWindowEvent('mousedown', (event: Event) => {
  if (!elRef.value?.contains(event.target as HTMLElement)) {
    focused.value = false;
  }
});

function onMouseDown() {
  focused.value = true;
}
</script>

<template>
  <div
    ref="elRef"
    class="detailItem-wrap"
    :class="{
      'detailItem-wrap--focused': focused,
    }"
    @mousedown="onMouseDown"
  >
    <label class="detailItem-label">{{ props.label }}: </label>
    <slot />
  </div>
</template>

<style scoped lang="scss">
.detailItem-wrap {
  padding-left: 25px;
  font-size: 12px;
  font-family: menlo, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  cursor: default;
  line-height: 20px;

  &--focused {
    color: var(--legacy-selection-fg-color);
    background: var(--legacy-selection-bg-color);
  }
}

.detailItem-label {
  display: inline;
  color: var(--color-text-secondary);
  font-weight: 700;

  .detailItem-wrap--focused & {
    color: var(--legacy-selection-fg-color);
  }
}
</style>
