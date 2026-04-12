import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import prettier from "eslint-config-prettier";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { defineConfig, globalIgnores } from "eslint/config";

import vitest from "@vitest/eslint-plugin";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

const ignores = [
  "**/jest.config.js",
  "**/node_modules/*",
  "**/tsconfig.json",
  "**/dist/*",
  "**/tsconfig.json",
  "**/examples/*",
];

export default defineConfig([
  globalIgnores(ignores),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettier,
  {
    files: ["**/*.ts"],
    settings: {
      "import/resolver": [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          bun: true,
          project: "./tsconfig.json",
        }),
      ],
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "@stylistic": stylistic,
      unicorn: eslintPluginUnicorn,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        ecmaFeatures: {
          jsx: true,
        },
      },
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.es2022,
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "unicorn/catch-error-name": [
        "error",
        {
          name: "err",
        },
      ],
      "@stylistic/no-multiple-empty-lines": [
        "error",
        { max: 1, maxBOF: 0, maxEOF: 0 },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-console": "error",
      "@stylistic/semi": "off",
      "no-unused-vars": "off", // Disabled to use the @typescript-eslint/no-explicit-any
      "no-restricted-syntax": ["error", "FunctionExpression"],
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreVoid: false },
      ],
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@stylistic/padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: "*",
          next: [
            "const",
            "export",
            "try",
            "throw",
            "if",
            "enum",
            "interface",
            "type",
          ],
        },
      ],
    },
  },
  {
    files: ["tests/**/*.{js,ts}"],
    plugins: {
      vitest,
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },
]);
