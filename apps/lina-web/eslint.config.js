import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist", "node_modules", "public/stoplight"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...eslint.configs.recommended,
    languageOptions: {
      globals: globals.node,
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              message:
                "Import the required public Semi component subpath so the frozen TipTap 2 workspace stays isolated from Semi's internal TipTap 3 editor dependencies.",
              name: "@douyinfe/semi-ui",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["error", { allowConstantExport: true }],
    },
  },
  {
    // The copied TapCanvas closure is checked as migration input. Keep hook ordering and
    // TypeScript correctness active, but do not manufacture a clean migration by bulk
    // rewriting its existing `any` boundary or dead Hono-era branches in Phase 2.
    basePath: "../lina-plugins/linapro-tapcanvas-studio/frontend/tapcanvas",
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-useless-assignment": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/use-memo": "off",
      "react-refresh/only-export-components": "off",
    },
  },
);
