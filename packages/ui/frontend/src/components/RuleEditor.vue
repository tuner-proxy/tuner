<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';

import FlexHead from './FlexHead.vue';
import { getVSCodeSandbox, VSCodeSandbox } from './rule-editor/initialize';
import template from './rule-editor/template?raw';

const emit = defineEmits<(type: 'close') => void>();

let sandbox: VSCodeSandbox;
let darkThemeMediaQuery: MediaQueryList;

onMounted(async () => {
  darkThemeMediaQuery = matchMedia('(prefers-color-scheme: dark)');

  const { monaco, ts, sandboxFactory } = await getVSCodeSandbox();

  sandbox = sandboxFactory.createTypeScriptSandbox(
    {
      domID: 'monaco-editor-embed',
      text: template,
      compilerOptions: {},
      monacoSettings: {
        automaticLayout: true,
        theme: darkThemeMediaQuery.matches ? 'vs-dark' : 'vs-light',
      },
    },
    monaco,
    ts,
  );

  sandbox.editor.addAction({
    id: 'save',
    label: 'Save',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
    run() {
      // TODO
      console.log('save', JSON.stringify(sandbox.editor.getValue()));
    },
  });

  sandbox.editor.focus();

  darkThemeMediaQuery.addEventListener('change', onThemeChange);
});

onBeforeUnmount(() => {
  darkThemeMediaQuery.removeEventListener('change', onThemeChange);
  for (const model of sandbox.monaco.editor.getModels()) {
    model.dispose();
  }
});

function onThemeChange() {
  sandbox.monaco.editor.setTheme(
    darkThemeMediaQuery.matches ? 'vs-dark' : 'vs-light',
  );
}
</script>

<template>
  <div class="ruleEditor-wrap">
    <FlexHead>
      <button
        class="icon-btn ruleEditor-close"
        @click="emit('close')"
      />
    </FlexHead>
    <div
      v-once
      id="monaco-editor-embed"
      class="ruleEditor-editor"
    />
  </div>
</template>

<style scoped lang="scss">
.ruleEditor-wrap {
  display: flex;
  flex-direction: column;
}

.ruleEditor-close {
  --icon-btn-image: url('../assets/cross.svg');
  --icon-btn-image-size: 8px 8px;
}

.ruleEditor-editor {
  flex: 1;
}
</style>
