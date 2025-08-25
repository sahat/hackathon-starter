import chaiFriendly from 'eslint-plugin-chai-friendly';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintPluginImport from 'eslint-plugin-import';

export default [
  eslintConfigPrettier,
  {
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

      // Airbnb-style quality rules
      'global-require': 'error',
      strict: ['error', 'never'],
      'arrow-body-style': ['error', 'as-needed'],
      'arrow-parens': ['error', 'always'],
      'brace-style': ['error', '1tbs'],
      'eol-last': ['error', 'always'],
      'object-curly-spacing': ['error', 'always'],
      'quote-props': ['error', 'as-needed'],
      semi: ['error', 'always'],
      'space-before-blocks': ['error', 'always'],
      'space-in-parens': ['error', 'never'],

      // Logic and safety
      curly: ['error', 'multi-line'],
      'dot-notation': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-alert': ['warn'],
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
