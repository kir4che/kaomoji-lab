import globals from 'globals';
import tseslint from 'typescript-eslint';
import { FlatCompat } from '@eslint/eslintrc';
import { defineConfig } from 'eslint/config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default defineConfig([
  ...compat.extends('next/core-web-vitals'),
  ...compat.extends('prettier'),

  {
    ignores: [
      '.next/**',
      '.env',
      'node_modules',
      'public/**',
      'next.config.ts',
      'postcss.config.mjs',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
    },
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'react/react-in-jsx-scope': 'off',
      'no-undef': 'warn',
      'class-methods-use-this': 'warn',
      'no-unused-expressions': 'warn',
      'no-useless-constructor': 'off',
      'no-loop-func': 'off',
      'prefer-const': 'warn',

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'warn',

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'warn',

      'no-var': 'error',
      'no-console': 'warn',
      'no-debugger': 'error',

      'import/no-unused-modules': 'warn',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/scripts/**/*.{js,ts}', '**/config/**/*.{js,ts}'],
    rules: {
      'no-console': 'off',
    },
  },
]);
