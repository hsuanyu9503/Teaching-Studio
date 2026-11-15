import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', '.review-packets', 'release'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // 安全基線：禁止直接注入 HTML 與動態執行程式碼（SPEC §17.1）。
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: '不得直接注入 HTML（SPEC §17.1）。' },
        { selector: "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]", message: '不得直接注入 HTML（SPEC §17.1）。' },
        { selector: "CallExpression[callee.property.name='insertAdjacentHTML']", message: '不得直接注入 HTML（SPEC §17.1）。' },
      ],
    },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/governance/**/*.mjs', '*.js'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.node },
  },
);
