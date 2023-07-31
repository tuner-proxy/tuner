import { onBeforeUnmount, onMounted } from 'vue';

export function useWindowEvent(
  event: string,
  callback: (...args: any[]) => any,
) {
  onMounted(() => {
    window.addEventListener(event, callback);
  });
  onBeforeUnmount(() => {
    window.removeEventListener(event, callback);
  });
}
