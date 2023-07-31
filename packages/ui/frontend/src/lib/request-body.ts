import { computed, Ref } from 'vue';

import { BodyState, useRequestStore } from '../store/request';

export function useBodyAsText(body: Ref<BodyState>) {
  const requestStore = useRequestStore();
  return computed(() => {
    requestStore.decodeBodyAsText(body.value);
    return body.value.decodeState!.text;
  });
}
