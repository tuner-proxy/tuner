<script setup lang="ts">
import { computed } from 'vue';

import { parserContentType } from '../../../../lib/header-parser';
import { parseMultipart } from '../../../../lib/multipart-parser';
import { useBodyAsText } from '../../../../lib/request-body';
import { CommonRequestMessage } from '../../../../store/request';
import DetailItem from '../../common/DetailItem.vue';
import DetailSection from '../../common/DetailSection.vue';

const props = defineProps<{
  message: CommonRequestMessage;
}>();

const textBody = useBodyAsText(computed(() => props.message.body));

interface FormItem {
  label: string;
  text: string;
  file?: {
    filename?: string;
    type?: string;
    buffer: Uint8Array;
  };
}

const data = computed<FormItem[]>(() => {
  const contentType = parserContentType(props.message.headers['content-type']);
  if (contentType?.type !== 'multipart/form-data') {
    return Array.from(new URLSearchParams(textBody.value)).map(
      ([label, text]) => ({ label, text }),
    );
  }
  let length = 0;
  for (const chunk of props.message.body.data) {
    length += chunk.byteLength;
  }
  const buffer = new Uint8Array(length);
  let offset = 0;
  for (const chunk of props.message.body.data) {
    buffer.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }
  return parseMultipart(
    buffer as any,
    contentType.params.boundary as string,
  ).map((item) => {
    if (typeof item.data === 'string') {
      return {
        label: item.name || '',
        text: item.data,
      };
    }
    return {
      label: item.name || '',
      text: item.filename ? `(binary ${item.filename})` : '(binary)',
      file: {
        filename: item.filename,
        type: item.headers['content-type'],
        buffer: item.data,
      },
    };
  });
});

function downloadFile(item: FormItem) {
  const file = item.file!;
  const blob = new Blob([file.buffer], { type: file.type });
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.setAttribute('href', url);
  el.setAttribute('download', file.filename || 'tuner-export.txt');
  document.body.appendChild(el);
  el.click();
  document.body.removeChild(el);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <DetailSection label="Form Data">
    <DetailItem
      v-for="(item, index) in data"
      :key="index"
      :label="item.label"
    >
      <a
        v-if="item.file"
        href="javascript:"
        class="formView-downloadLink"
        @mousedown.stop
        @click="downloadFile(item)"
      >
        {{ item.text }}
      </a>
      <span v-else>{{ item.text }}</span>
    </DetailItem>
  </DetailSection>
</template>

<style scoped lang="scss">
.formView-downloadLink {
  color: var(--color-text-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
