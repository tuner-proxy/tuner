<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  label: string;
}>();

const expanding = ref(true);

function onToggle() {
  expanding.value = !expanding.value;
}
</script>

<template>
  <section
    class="detailSection-wrap"
    :class="{
      'detailSection-wrap--expand': expanding,
    }"
  >
    <label
      class="detailSection-label"
      @dblclick="onToggle"
    >
      {{ props.label }}
    </label>
    <section
      v-show="expanding"
      class="detailSection-cnt"
    >
      <slot />
    </section>
  </section>
</template>

<style scoped lang="scss">
.detailSection-wrap {
  padding-bottom: 5px;
  border-bottom: 1px solid var(--color-details-hairline);
}

.detailSection-label {
  display: flex;
  align-items: center;
  padding-left: 5px;
  font-size: 12px;
  line-height: 26px;
  font-weight: 700;

  &::before {
    content: '';
    margin-right: -2px;
    height: 12px;
    width: 13px;
    background-color: var(--color-text-secondary);

    mask-image: url('../../../assets/triangles.svg');
    mask-size: 32px 24px;
    mask-position: 0 0;

    .detailSection-wrap--expand & {
      mask-position: -16px 0;
    }
  }
}

.detailSection-cnt {
  user-select: text;

  .detailSection-wrap:last-child & {
    border-bottom: 0;
  }
}
</style>
