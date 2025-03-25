<script setup lang="ts">
import { format } from 'prettier';
import * as parserBabel from 'prettier/plugins/babel';
import * as pluginEstree from 'prettier/plugins/estree';
import * as parserHtml from 'prettier/plugins/html';
import * as parserCss from 'prettier/plugins/postcss';
import { computed, ref, watch } from 'vue';

import { isCss, isDoc, isJs, isJson } from '../../../../lib/content-type';
import { parserContentType } from '../../../../lib/header-parser';
import { useBodyAsText } from '../../../../lib/request-body';
import type { CommonRequestMessage } from '../../../../store/request';
import FlexHead from '../../../FlexHead.vue';
import TextView from '../../../TextView.vue';

const CONTENT_TYPES = [
  {
    lang: 'javascript',
    match: isJs,
    parser: 'babel',
  },
  {
    lang: 'html',
    match: isDoc,
    parser: 'html',
  },
  {
    lang: 'css',
    match: isCss,
    parser: 'css',
  },
  {
    lang: 'json',
    match: isJson,
    parser: 'json',
  },
];

const props = defineProps<{
  message: CommonRequestMessage;
}>();

const lang = computed(() => {
  const contentType = parserContentType(props.message.headers['content-type']);
  if (contentType) {
    return CONTENT_TYPES.find((item) => item.match(contentType.type));
  }
  return undefined;
});

const rawBody = useBodyAsText(computed(() => props.message.body));

const formatted = ref(false);

const safeFormat = async (code: string, parser: string) => {
  try {
    return await format(code, {
      parser,
      plugins: [parserBabel, parserHtml, parserCss, pluginEstree],
    });
  } catch (error) {
    console.error('Prettify body failed:', error);
    return code;
  }
};

const bodyPromise = computed(() => {
  if (!formatted.value || !lang.value) {
    return rawBody.value;
  }
  const value = rawBody.value;
  return safeFormat(value, lang.value.parser);
});

const displayBody = ref('');

watch(
  bodyPromise,
  async () => {
    displayBody.value = await bodyPromise.value;
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <div class="text-wrap">
    <div class="text-cnt">
      <TextView
        :lang="lang?.lang"
        :value="displayBody"
      />
    </div>
    <FlexHead
      v-if="lang?.parser"
      class="text-foot"
    >
      <input
        v-model="formatted"
        type="checkbox"
        class="icon-btn text-format"
      />
    </FlexHead>
  </div>
</template>

<style scoped lang="scss">
.text-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.text-cnt {
  flex: 1;
  height: 1px;
}

.text-foot {
  position: sticky;
  bottom: 0;
}

.text-format {
  --icon-btn-image: url('../../../../assets/format.svg');
  --icon-btn-image-size: 14px 12px;
}
</style>
