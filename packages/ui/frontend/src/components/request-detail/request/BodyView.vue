<script setup lang="tsx">
import { computed, onMounted, ref, watch } from 'vue';

import {
  isCss,
  isDoc,
  isForm,
  isImg,
  isJs,
  isJson,
} from '../../../lib/content-type';
import { parserContentType } from '../../../lib/header-parser';
import { CommonRequestMessage } from '../../../store/request';
import FlexHead from '../../FlexHead.vue';

import FormView from './body/FormView.vue';
import HexView from './body/HexView.vue';
import ImageView from './body/ImageView.vue';
import JsonView from './body/JsonView.vue';
import TextView from './body/TextView.vue';

const props = defineProps<{
  message: CommonRequestMessage;
  url?: string;
}>();

const hasBody = computed(() => props.message?.body.data.length);

interface BodyType {
  name: string;
  key: string;
  component: any;
  requireEnd?: boolean;
  match: (type: string) => boolean;
}

const BODY_TYPES: BodyType[] = [
  {
    name: 'JSON',
    key: 'json',
    requireEnd: true,
    component: JsonView,
    match: isJson,
  },
  {
    name: 'Text',
    key: 'text',
    component: TextView,
    match: (type) => isJs(type) || isDoc(type) || isCss(type) || isJson(type),
  },
  {
    name: 'Image',
    key: 'image',
    requireEnd: true,
    component: ImageView,
    match: isImg,
  },
  {
    name: 'Form',
    key: 'form',
    component: FormView,
    match: isForm,
  },
  {
    name: 'Hex',
    key: 'hex',
    component: HexView,
    match: () => false,
  },
];

const contentInfo = computed(() => {
  const contentType = parserContentType(props.message.headers['content-type']);
  if (!contentType) {
    return { type: 'hex', charset: 'utf-8' };
  }
  const charset = contentType.params.charset || 'utf-8';
  for (const type of BODY_TYPES) {
    if (type.requireEnd && !props.message.body.hasEnd) {
      continue;
    }
    if (type.match(contentType.type)) {
      return { type: type.key, charset };
    }
  }
  return { type: 'hex', charset };
});

const currentBodyTypeKey = ref(contentInfo.value.type);
const currentBodyType = computed(() =>
  BODY_TYPES.find((type) => type.key === currentBodyTypeKey.value),
);

watch(
  () => props.message,
  () => {
    currentBodyTypeKey.value = contentInfo.value.type;
  },
);

let mime: typeof import('mime-types') | undefined;
onMounted(async () => {
  mime = await import('mime-types');
});

function downloadBody() {
  let fileName = props.url?.split('?')[0].split('/').pop();
  if (!fileName) {
    fileName = `export-body-${Date.now()}`;
  }
  const contentType = parserContentType(props.message.headers['content-type']);
  const ext = mime?.extension(contentType?.type ?? 'application/octet-stream');
  if (ext && !fileName.endsWith(`.${ext}`)) {
    fileName += `.${ext}`;
  }
  const url = URL.createObjectURL(new Blob(props.message.body.data));
  const el = document.createElement('a');
  el.style.display = 'none';
  el.href = url;
  el.download = fileName;
  document.body.appendChild(el);
  el.click();
  document.body.removeChild(el);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="body-wrap">
    <FlexHead class="body-head">
      <button
        class="icon-btn body-download"
        title="Download"
        @click="downloadBody"
      />

      <div class="head-sep" />

      <select
        v-model="currentBodyTypeKey"
        class="body-type"
      >
        <option
          v-for="item in BODY_TYPES"
          :key="item.key"
          :value="item.key"
        >
          {{ item.name }}
        </option>
      </select>
    </FlexHead>

    <section class="body-cnt">
      <component
        :is="currentBodyType.component"
        v-if="currentBodyType && hasBody"
        :message="props.message"
      />
    </section>
  </div>
</template>

<style scoped lang="scss">
.body-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.body-head {
  position: sticky;
  top: 0;
  z-index: 1;
}

.body-type {
  height: 22px;
  border: 0;
  outline: none;
  background: transparent;
  border-radius: 4px;
  color: var(--primary-color);

  &:focus {
    background: var(--color-background-elevation-2);
  }
}

.body-download {
  --icon-btn-image: url('../../../assets/download.svg');
  --icon-btn-image-size: 10px 12px;
}

.body-cnt {
  flex: 1;
  height: 1px;
}
</style>
