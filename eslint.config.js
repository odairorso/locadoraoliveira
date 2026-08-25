import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      // Artefatos de build e dependências
      "dist/**",
      "node_modules/**",
      "android/**",
      ".netlify/**",
      ".vercel/**",
      "Mocha/**",
      // Scripts de manutenção/debug/teste legados (não fazem parte do app)
      "*.mjs",
      "*.js",
      "*.sql",
      "api/**",
      "migrations/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // `any` é usada intencionalmente em todo o projeto (dados vindos do
      // Supabase tipados dinamicamente). Desligamos para manter o lint limpo.
      "@typescript-eslint/no-explicit-any": "off",
      // Permite "variáveis descartadas" com prefixo underscore (_id, _createdAt…)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // Fast refresh em arquivos que também exportam helpers: aviso de
      // arquitetura, não bug. Não polui o resultado do lint.
      "react-refresh/only-export-components": "off",
      // Avisos de dependência de useEffect são recomendações; os componentes
      // grandes já tratam refetch manualmente.
      "react-hooks/exhaustive-deps": "off",
    },
  }
);
