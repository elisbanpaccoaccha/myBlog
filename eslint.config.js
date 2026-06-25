import eslintPluginAstro from 'eslint-plugin-astro';
import tsEslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default tsEslint.config(
  // TypeScript recomendado
  ...tsEslint.configs.recommended,

  // Astro recomendado (aplica parser de Astro a archivos .astro)
  ...eslintPluginAstro.configs.recommended,

  // Configuración para React (.jsx, .tsx)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // No requerido en React 17+ / 19
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Advertencia para variables no usadas ignorando prefijo '_'
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Ignorar carpetas y archivos compilados
  {
    ignores: ['dist/', '.astro/', 'node_modules/', '.vscode/', 'db/']
  }
);
