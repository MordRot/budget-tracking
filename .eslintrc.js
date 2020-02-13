module.exports = {
  root: true,

  parserOptions: {
    parser: 'babel-eslint',
    sourceType: 'module',
  },

  env: {
    browser: true,
    node: true,
  },

  extends: ['airbnb-base', 'plugin:vue/recommended'],

  globals: {
    __static: true,
  },

  plugins: [
    'import',
    'vue',
    'html',
  ],

  rules: {
    'global-require': 0,
    'import/no-unresolved': 0,
    'no-param-reassign': 0,
    'no-shadow': 0,
    'import/extensions': 0,
    'import/newline-after-import': 0,
    'no-multi-assign': 0,
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'no-console': 'off',
    'linebreak-style': process.platform === 'win32' ? 0 : 2,
  },

  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
