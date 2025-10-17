import chaiFriendly from 'eslint-plugin-chai-friendly';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintPluginImport from 'eslint-plugin-import';

export default [
  eslintConfigPrettier, // Disable Prettier‑handled style rules - prettier owns styling
  {
    ignores: ['tmp/**', 'tmp'],

    plugins: {
      'chai-friendly': chaiFriendly,
      import: eslintPluginImport,
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
      sourceType: 'module',
    },

    rules: {
      // Plugin-specific rules
      'chai-friendly/no-unused-expressions': 'error',
      'import/no-unresolved': ['error', { commonjs: true, caseSensitive: true }],
      'import/extensions': ['error', 'ignorePackages', { js: 'never', mjs: 'never', jsx: 'never' }],
      'import/order': ['error', { groups: [['builtin', 'external', 'internal']], distinctGroup: true }],
      'import/no-duplicates': 'error',
      'import/prefer-default-export': 'error',
      'import/no-named-as-default': 'error',
      'import/no-named-as-default-member': 'error',

      // Quality rules (Airbnb-style, non-style)
      'class-methods-use-this': 'error',
      //'consistent-return': 'error',
      'default-case': 'error',
      'default-param-last': 'error',
      'dot-location': ['error', 'property'],
      'no-cond-assign': ['error', 'except-parens'],
      'no-constant-condition': 'error',
      'no-constructor-return': 'error',
      'no-empty-function': ['error', { allow: ['arrowFunctions'] }],
      //'no-param-reassign': ['error', { props: true }],
      //'no-shadow': ['error', { builtinGlobals: false }],
      'no-throw-literal': 'error',
      'no-useless-concat': 'error',
      'prefer-const': 'error',
      'prefer-destructuring': ['error', { object: true, array: false }],
      yoda: ['error', 'never'],
      'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],

      // Logic and safety
      'global-require': 'error',
      strict: ['error', 'never'],
      'arrow-body-style': ['error', 'as-needed'],
      'arrow-parens': ['error', 'always'],
      curly: ['error', 'multi-line'],
      'dot-notation': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-alert': 'warn',
      'no-else-return': ['error', { allowElseIf: false }],
      'no-eval': 'error',
      'no-loop-func': 'error',
      'no-multi-spaces': 'error',
      'no-new': 'error',
      'no-restricted-properties': ['error', { object: 'Math', property: 'pow', message: 'Use ** instead.' }],
      'no-return-assign': ['error', 'always'],
      'no-self-compare': 'error',
      'prefer-template': 'error',
      radix: 'error',

      // Overrides
      'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
    },
  },
];
