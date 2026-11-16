import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // 构建产物与 Next 运行时目录不参与 lint（原规则只忽略 dist）
  globalIgnores(['dist', '.next', 'out', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // 以下划线开头的参数＝有意不使用（拖拽回调只需签名一致，不消费参数）
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Fast Refresh 约束只对组件库目录生效：app/ 下的 layout/page 天然导出 metadata，会误报
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactRefresh.configs.vite],
  },
])
