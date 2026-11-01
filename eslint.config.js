
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// ==========================================
// KURIO MARKETPLACE — ESLINT CONFIGURATION
// ==========================================

export default defineConfig([
  // Arquivos gerados automaticamente.
  // Não devem ser analisados pelo ESLint.
  globalIgnores([
    'dist',
    'public/mockServiceWorker.js',
  ]),

  // ========================================
  // REGRAS PARA TYPESCRIPT E REACT
  // ========================================

  {
    files: ['**/*.{ts,tsx}'],

    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],

    languageOptions: {
      globals: globals.browser,
    },
  },
])
