<script setup lang="ts">
import { computed } from 'vue';

import { ColumnDefinition } from '../lib/list-column';

const props = defineProps<{
  column: ColumnDefinition;
  resizeStyle?: Record<string, string>;
}>();

const wrapClass = computed(() => {
  if (props.column.align) {
    return [`listColumn-wrap--${props.column.align}`];
  }
  return [];
});

const cntStyle = computed(() => {
  const styles: Record<string, string> = {};
  if (props.column.defaultWidth) {
    styles.width = `${props.column.defaultWidth}px`;
  }
  if (props.column.flex) {
    styles.flex = props.column.flex;
  }
  return {
    ...styles,
    ...props.resizeStyle,
  };
});
</script>

<template>
  <span
    :class="['listColumn-wrap', wrapClass]"
    :style="cntStyle"
  >
    <span class="listColumn-cnt">
      <slot />
    </span>
  </span>
</template>

<style scoped lang="scss">
.listColumn-wrap {
  flex: 0 0 auto;
  display: inline-block;
  text-align: left;

  &--center {
    text-align: center;
  }

  &--right {
    text-align: right;
  }
}

.listColumn-cnt {
  display: block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
