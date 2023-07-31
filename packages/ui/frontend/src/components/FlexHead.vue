<template>
  <header class="head-wrap">
    <div class="head-cnt scroll-x">
      <slot />
    </div>
  </header>
</template>

<style scoped lang="scss">
.head-wrap {
  position: relative;
  flex: 0 0 auto;
  height: 28px;
  line-height: 28px;
  background: var(--color-background-elevation-1);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    pointer-events: none;
  }

  &:not(:last-child)::after {
    border-bottom: 1px solid var(--color-details-hairline);
  }

  &:not(:first-child)::after {
    border-top: 1px solid var(--color-details-hairline);
  }
}

.head-cnt {
  width: 100%;
  display: flex;
  align-items: center;

  > :deep(.head-sep) {
    display: inline-block;
    margin: 0 4px;
    height: 16px;
    width: 0;
    border-right: 1px solid var(--color-details-hairline);
  }
}
</style>
