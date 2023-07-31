<script setup lang="ts">
import { computed, ref } from 'vue';

import { useBodyAsText } from '../../../../lib/request-body';
import { CommonRequestMessage } from '../../../../store/request';
import FlexHead from '../../../FlexHead.vue';
import DetailItem from '../../common/DetailItem.vue';
import DetailSection from '../../common/DetailSection.vue';

import { JsonValue } from './JsonValue';

const props = defineProps<{
  message: CommonRequestMessage;
}>();

const textBody = useBodyAsText(computed(() => props.message.body));

const data = computed(() => {
  try {
    return { data: JSON.parse(textBody.value) };
  } catch (error: any) {
    return { error };
  }
});

const jsonViewRef = ref<any>();

function onToggleAll() {
  jsonViewRef.value!.toggleAll();
}
</script>

<template>
  <DetailSection
    v-if="data.error"
    label="Parse Error"
  >
    <DetailItem label="Error Message">
      {{ data.error.message }}
    </DetailItem>
  </DetailSection>

  <div
    v-else
    class="json-wrap"
  >
    <section class="json-cnt">
      <div class="json-data">
        <JsonValue
          ref="jsonViewRef"
          :value="data.data"
        />
      </div>
    </section>
    <FlexHead class="json-foot">
      <button
        class="icon-btn json-toggle"
        title="Toggle All"
        @click="onToggleAll"
      />
    </FlexHead>
  </div>
</template>

<style scoped lang="scss">
.json-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.json-cnt {
  flex: 1;
  overflow: auto;
}

.json-data {
  padding: 5px 10px;
  font-size: 12px;
  line-height: 16px;
  font-family: menlo, monospace;
  cursor: default;
}

.json-foot {
  position: sticky;
  bottom: 0;
}

.json-toggle {
  --icon-btn-image: url('../../../../assets/format.svg');
  --icon-btn-image-size: 14px 12px;
}
</style>
