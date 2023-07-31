<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue';

import { CommonRequest } from '../../../../store/request';

const props = defineProps<{
  message: CommonRequest['request'] | CommonRequest['response'];
}>();

const objectURL = ref<string>();

const blob = computed(() => {
  if (!props.message?.body.hasEnd) {
    return;
  }
  return new Blob(
    props.message.body.data.map((chunk) => new Uint8Array(chunk)),
  );
});

watchEffect(() => {
  if (objectURL.value) {
    URL.revokeObjectURL(objectURL.value);
  }
  if (!blob.value) {
    objectURL.value = undefined;
    return;
  }
  objectURL.value = URL.createObjectURL(blob.value);
});

onBeforeUnmount(() => {
  if (objectURL.value) {
    URL.revokeObjectURL(objectURL.value);
  }
});
</script>

<template>
  <div class="img-wrap">
    <div class="img-lightbox">
      <img
        v-if="objectURL"
        class="img-cnt"
        :src="objectURL"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:math';

.img-wrap {
  position: relative;
  height: 100%;
}

.img-lightbox {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-cnt {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  box-shadow: 0 5px 10px var(--box-shadow-outline-color);

  $grid-size: 12px;

  background-image: linear-gradient(45deg, #fff 25%, transparent 25%),
    linear-gradient(-45deg, #fff 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #fff 75%),
    linear-gradient(-45deg, #ddd 75%, #fff 75%);
  background-size: $grid-size $grid-size;
  background-position:
    0 0,
    0 math.div($grid-size, 2),
    math.div($grid-size, 2) math.div(-$grid-size, 2),
    math.div(-$grid-size, 2) 0px;
}
</style>
