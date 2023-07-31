<script setup lang="ts">
import { computed, shallowRef } from 'vue';

import { useWindowEvent } from '../../../../lib/window-event';
import { CommonRequestMessage } from '../../../../store/request';

const VIEWPORT_PADDING = 5;

const props = defineProps<{
  message: CommonRequestMessage;
}>();

const hexText = computed(() => {
  let offset = 0;
  let phase = 0;

  let valueBuffer = '';
  let offsetBuffer = `${'0'.repeat(8)}  `;

  let result = '';
  for (const chunk of props.message.body.data) {
    for (const code of new Uint8Array(chunk)) {
      if (offsetBuffer) {
        result += offsetBuffer;
        offsetBuffer = '';
      }

      result += ` ${code.toString(16).padStart(2, '0')}`;

      if (code < 32 || code >= 127) {
        valueBuffer += '.';
      } else {
        valueBuffer += String.fromCharCode(code);
      }

      phase += 1;
      if (phase < 16) {
        continue;
      }
      phase = 0;

      result += `  ${valueBuffer}\n`;
      valueBuffer = '';

      offset += 1;
      offsetBuffer = `${offset.toString(16).padStart(7, '0')}0  `;
    }
  }

  if (valueBuffer) {
    result += `${'   '.repeat(16 - phase)}  ${valueBuffer.padEnd(16, ' ')}`;
  }

  return result;
});

const hexLines = computed(() => hexText.value.split('\n').length);

const characterSize = shallowRef<{ width: number; height: number }>();
function onMeasure(el?: any) {
  if (!el || characterSize.value) {
    return;
  }
  setTimeout(() => {
    characterSize.value = {
      width: el.offsetWidth / 76,
      height: el.offsetHeight,
    };
  });
}

const coord = shallowRef<{ row: number; col: number }>();

function onMouseMove(event: MouseEvent) {
  if (!characterSize.value) {
    return;
  }
  const el = event.target as HTMLElement;

  const x = el.scrollLeft + event.offsetX - VIEWPORT_PADDING;
  const y = el.scrollTop + event.offsetY - VIEWPORT_PADDING;
  if (x < 0 || y < 0) {
    coord.value = undefined;
    return;
  }

  const { width, height } = characterSize.value;
  const row = Math.floor(y / height);
  if (row >= hexLines.value) {
    coord.value = undefined;
    return;
  }

  const col = Math.floor(x / width);
  const original = coord.value;
  if (original?.row !== row || original.col !== col) {
    coord.value = { row, col };
  }
}

useWindowEvent('mousemove', () => {
  coord.value = undefined;
});

const cursor = computed(() => {
  if (!coord.value || !characterSize.value) {
    return;
  }
  const { width, height } = characterSize.value;
  const { row, col } = coord.value;

  const rowTransform = `translateY(${row * height + VIEWPORT_PADDING}px)`;
  if (col < 11 || col > 75 || col === 58 || col === 59) {
    return { row: rowTransform };
  }

  let focusCol: number;
  if (col < 58) {
    focusCol = Math.floor((col - 11) / 3);
  } else {
    focusCol = Math.floor(col - 60);
  }

  return {
    row: rowTransform,
    data: `translateX(${(focusCol * 3 + 11) * width + VIEWPORT_PADDING}px)`,
    value: `translateX(${(focusCol + 60) * width + VIEWPORT_PADDING}px)`,
  };
});
</script>

<template>
  <div
    class="hex-wrap"
    @mousemove.stop="onMouseMove"
  >
    <pre class="hex-view">{{ hexText }}</pre>

    <pre
      v-if="!characterSize"
      class="hex-measure"
    ><span :ref="onMeasure">{{ '0'.repeat(76) }}</span></pre>

    <div
      v-if="cursor && characterSize"
      class="hex-cursor"
      :style="{
        height: `${characterSize.height}px`,
        transform: cursor.row,
      }"
    >
      <div
        v-if="cursor.data"
        class="hex-cursor-item"
        :style="{
          width: `${characterSize.width * 2}px`,
          transform: cursor.data,
        }"
      />
      <div
        v-if="cursor.value"
        class="hex-cursor-item"
        :style="{
          width: `${characterSize.width}px`,
          transform: cursor.value,
        }"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.hex-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}

.hex-view {
  position: relative;
  margin: 0;
  width: 100%;
  height: 100%;
  padding: 5px;
  box-sizing: border-box;
  z-index: 1;
  white-space: pre;
  resize: none;
  cursor: text;
  border: 0;
  outline: none;
  user-select: text;
  background: transparent;
  color: var(--primary-color);
}

.hex-measure {
  position: absolute;
  top: -9999px;
  left: -9999px;
  visibility: hidden;
  opacity: 0;
}

.hex-cursor {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: var(--tuner-hex-bg-color);
  pointer-events: none;
}

.hex-cursor-item {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--tuner-hex-active-bg-color);
}
</style>
