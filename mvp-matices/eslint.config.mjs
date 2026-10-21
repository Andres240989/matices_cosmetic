import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier/flat";

const internalModules = (...names) => names.flatMap((name) => [`@/${name}`, `@/${name}/**`]);

// Enforces the dependency rule from docs/ARQUITECTURA.md section 3.
// Modules that do not exist yet (ingestion, store, pipeline, app...) are listed on purpose:
// the rule is already in place when they are created.
const forbidImports = (files, group, message) => ({
  files,
  rules: {
    "no-restricted-imports": ["error", { patterns: [{ group, message }] }],
  },
});

export default defineConfig([
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { ignoreRestSiblings: true }],
    },
  },
  forbidImports(
    ["src/contracts/**"],
    internalModules("engine", "ingestion", "store", "pipeline", "lib", "components", "app"),
    "contracts/ may only depend on zod.",
  ),
  forbidImports(
    ["src/engine/**"],
    [
      ...internalModules("ingestion", "store", "pipeline", "lib", "components", "app"),
      "@anthropic-ai/sdk",
      "@libsql/client",
      "fs",
      "node:fs",
    ],
    "engine/ is pure: it may only depend on contracts/.",
  ),
  {
    // The engine is deterministic: the date of analysis is always injected as `asOf`.
    files: ["src/engine/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: "engine/ never reads the clock: use the injected `asOf`.",
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: "engine/ never reads the clock: use the injected `asOf`.",
        },
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: "engine/ is deterministic: no Math.random.",
        },
      ],
    },
  },
  forbidImports(
    ["src/ingestion/**"],
    [...internalModules("engine", "store", "pipeline", "lib", "components", "app")],
    "ingestion/ turns files and APIs into contracts; it never sees rules or decisions.",
  ),
  forbidImports(
    ["src/store/**"],
    [...internalModules("engine", "ingestion", "pipeline", "lib", "components", "app")],
    "store/ may only depend on contracts/ and the database client.",
  ),
  forbidImports(
    ["src/pipeline/**"],
    internalModules("lib", "components", "app"),
    "pipeline/ must not depend on the frontend.",
  ),
  {
    ...forbidImports(
      ["src/app/**", "src/components/**", "src/lib/**"],
      [
        ...internalModules("engine", "ingestion", "store", "pipeline", "app/api"),
        "@libsql/client",
        "read-excel-file",
        "read-excel-file/**",
      ],
      "The frontend talks to the backend only through src/lib/api-client.ts.",
    ),
    ignores: ["src/app/api/**"],
  },
  forbidImports(
    ["src/app/api/**"],
    [...internalModules("engine", "ingestion", "lib", "components")],
    "API routes call pipeline/ (and store/ for reads); never the engine or ingestion directly.",
  ),
  globalIgnores(["node_modules/**", "dist/**", ".next/**", "next-env.d.ts"]),
]);
