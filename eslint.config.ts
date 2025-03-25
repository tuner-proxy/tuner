import vuePrettier from '@vue/eslint-config-prettier';
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript';
import pluginImport from 'eslint-plugin-import';
import pluginOxlint from 'eslint-plugin-oxlint';
import pluginVue from 'eslint-plugin-vue';

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/coverage/**'],
  },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  pluginOxlint.configs['flat/recommended'],
  vuePrettier,
  {
    plugins: {
      import: pluginImport,
    },
    rules: {
      'vue/require-prop-types': 'off',
      'vue/one-component-per-file': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          disallowTypeAnnotations: false,
          fixStyle: 'separate-type-imports',
        },
      ],

      'arrow-body-style': ['warn', 'as-needed'],
      'object-shorthand': ['warn', 'properties'],

      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
    },
  },
);
