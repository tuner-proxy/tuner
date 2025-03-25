import type { Ref } from 'vue';
import { computed } from 'vue';

import type { BodyState } from '../store/request';
import { useRequestStore } from '../store/request';

export function useBodyAsText(body: Ref<BodyState>) {
  const requestStore = useRequestStore();
  return computed(() => {
    requestStore.decodeBodyAsText(body.value);
    return body.value.decodeState!.text;
  });
}
