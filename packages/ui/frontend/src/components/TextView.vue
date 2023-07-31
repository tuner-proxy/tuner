<script setup lang="ts">
import {
  defaultHighlightStyle,
  LanguageSupport,
  syntaxHighlighting,
} from '@codemirror/language';
import {
  Compartment,
  EditorSelection,
  EditorState,
  Extension,
} from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  lang?: string;
  value: string;
}>();

const themeCompartment = new Compartment();
const syntaxCompartment = createCompartment();

const syntaxLoaders = new Map<string, () => Promise<LanguageSupport>>([
  ['css', () => import('@codemirror/lang-css').then((mod) => mod.css())],
  ['html', () => import('@codemirror/lang-html').then((mod) => mod.html())],
  [
    'javascript',
    () => import('@codemirror/lang-javascript').then((mod) => mod.javascript()),
  ],
  ['json', () => import('@codemirror/lang-json').then((mod) => mod.json())],
]);

const themes = {
  dark: () => [EditorView.darkTheme.of(true), oneDark],
  light: () => [
    EditorView.darkTheme.of(false),
    syntaxHighlighting(defaultHighlightStyle),
  ],
};

const ready = ref(false);
const elRef = ref<HTMLElement>();

let editor: EditorView;
let darkThemeMediaQuery: MediaQueryList;

onMounted(async () => {
  editor = createTextEditor();
  darkThemeMediaQuery = matchMedia('(prefers-color-scheme: dark)');

  updateColorTheme(darkThemeMediaQuery.matches);

  ready.value = true;

  await updateSyntaxHighlighting(props.lang);
});

watch(
  () => props.value,
  (newValue) => {
    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: newValue,
      },
    });
  },
);

function createTextEditor() {
  return new EditorView({
    parent: elRef.value!,
    state: EditorState.create({
      doc: props.value,
      extensions: [
        /**
         * Show line numbers
         */
        lineNumbers(),
        /**
         * Highlight active line and gutter
         */
        highlightActiveLine(),
        highlightActiveLineGutter(),
        /**
         * Apply dark theme
         */
        themeCompartment.of([]),
        /**
         * Apply language
         */
        syntaxCompartment.use(),
        /**
         * Readonly
         */
        EditorState.readOnly.of(true),
        /**
         * Vertical scroll
         */
        EditorView.theme({
          '&': {
            height: '100%',
          },
        }),
        keymap.of([
          /**
           * Dont scroll to bottom when select all
           */
          {
            key: 'Mod-a',
            preventDefault: true,
            run(view) {
              view.dispatch({
                selection: EditorSelection.create([
                  EditorSelection.range(0, view.state.doc.length),
                ]),
                scrollIntoView: false,
              });
              return false;
            },
          },
        ]),
      ],
    }),
  });
}

watch(() => props.lang, updateSyntaxHighlighting);

onMounted(() => {
  darkThemeMediaQuery.addEventListener('change', onDarkThemeQueryChange);
});

onBeforeUnmount(() => {
  darkThemeMediaQuery.removeEventListener('change', onDarkThemeQueryChange);
});

function onDarkThemeQueryChange() {
  updateColorTheme(darkThemeMediaQuery.matches);
}

function updateColorTheme(matches: boolean) {
  const theme = matches ? themes.dark() : themes.light();
  editor.dispatch({
    effects: themeCompartment.reconfigure(theme),
  });
}

function updateSyntaxHighlighting(lang?: string) {
  if (!lang || !syntaxLoaders.has(lang)) {
    return syntaxCompartment.update(() => []);
  }
  return syntaxCompartment.update(syntaxLoaders.get(lang)!);
}

function createCompartment() {
  const compartment = new Compartment();

  let promise: Extension | Promise<Extension>;

  async function update(getter: () => Extension | Promise<Extension>) {
    const newPromise = getter();
    promise = newPromise;
    const result = await promise;
    if (!editor || promise !== newPromise) {
      return;
    }
    editor.dispatch({
      effects: compartment.reconfigure(result),
    });
  }

  return {
    use: () => compartment.of([]),
    update,
  };
}
</script>

<template>
  <div
    v-show="ready"
    ref="elRef"
    class="textView-container"
  />
</template>

<style scoped lang="scss">
.textView-container {
  width: 100%;
  height: 100%;
}
</style>
