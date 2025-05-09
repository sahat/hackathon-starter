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
      //ecmaVersion: 2022,  // was needed to override outdated airbnb configs, the default is latest
      sourceType: 'module',
    },

    rules: {
      'global-require': 'error',
      // Airbnb-specific restrictions
      strict: ['error', 'never'],
      'import/no-unresolved': ['error', { commonjs: true, caseSensitive: true }],
      'import/extensions': ['error', 'ignorePackages', { js: 'never', mjs: 'never', jsx: 'never' }],
      'import/order': ['error', { groups: [['builtin', 'external', 'internal']], distinctGroup: true }],
      'import/no-duplicates': 'error',
      'import/prefer-default-export': 'error',

      // Code style enforcement from Airbnb
      'arrow-body-style': ['error', 'as-needed'],
      'arrow-parens': ['error', 'always'],
      'brace-style': ['error', '1tbs'],
      'eol-last': ['error', 'always'],
      indent: ['error', 2],
      'object-curly-spacing': ['error', 'always'],
      'quote-props': ['error', 'as-needed'],
      semi: ['error', 'always'],
      'space-before-blocks': ['error', 'always'],
      'space-in-parens': ['error', 'never'],

      // Other strict Airbnb rules
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

      // Skipping some potential Airbnb rules
      //'camelcase': ['error'],
      //'comma-dangle': ['error', { arrays: 'always-multiline', objects: 'always-multiline' }],
      //'quotes': ['error', 'single', { avoidEscape: true }],
      //'max-len': ['error', 100],

      // Prior overrides, some of which may not be necessary
      //'consistent-return': 'off',
      //'no-param-reassign': 'off',
      //'no-underscore-dangle': 'off',
      //'no-shadow': 'off',
      //'no-console': 'off',
      //'no-plusplus': 'off',
      //'no-unused-expressions': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
      'chai-friendly/no-unused-expressions': 'error',
    },
  },
];
