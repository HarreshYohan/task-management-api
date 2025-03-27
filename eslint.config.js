// eslint.config.cjs
const eslint = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  eslint.configs.recommended,
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/test/**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: process.cwd(),
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
    },
  },
  prettierConfig,
  {
    ignores: [
      'dist/**', 
      'node_modules/**', 
      'coverage/**',
      'eslint.config.js',
      'eslint.config.cjs'
    ],
  },
];