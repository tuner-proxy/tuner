<script setup lang="ts">
const props = defineProps<{
  active?: boolean;
}>();

const emit = defineEmits<(type: 'click') => void>();
</script>

<template>
  <span
    class="flexHeadTab-wrap"
    :class="{ 'flexHeadTab-wrap--active': props.active }"
    @click="emit('click')"
  >
    <slot />
  </span>
</template>

<style scoped lang="scss">
.flexHeadTab-wrap {
  position: relative;
  flex: 0 0 auto;
  padding: 0 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: default;

  &:hover {
    color: var(--legacy-tab-selected-fg-color);
    background: var(--color-background-elevation-2);
  }

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 0;
    border-bottom: 1px solid var(--color-details-hairline);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1;
    border-bottom: 2px solid var(--legacy-accent-color);
    transform: scaleY(0);
    transform-origin: 0 100%;
    transition: transform 0.1s;
  }

  &--active {
    color: var(--legacy-tab-selected-fg-color);
    &::after {
      transform: none;
    }
  }
}
</style>
