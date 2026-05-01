import { defineConfig } from "tsdown";

import pkg from "./package.json" with { type: "json" };

const peers = Object.keys(pkg.peerDependencies || {});

const sharedDeps = {
  neverBundle: ["react", "react-dom", "react/jsx-runtime", ...peers],
};

const sharedBase = {
  minify: true,
  treeshake: true,
  target: "es2022" as const,
};

const externalizeContextsPlugin = {
  name: "externalize-contexts",
  resolveId(id: string) {
    if (id.startsWith("@/context/") || id === "@/context") {
      return { id: "@dateforge/react-popover/context", external: true };
    }
  },
};

const moduleEntry = {
  index: "src/modules/index.ts",
  trigger: "src/modules/trigger/index.tsx",
  content: "src/modules/content/index.tsx",
  portal: "src/modules/portal/index.tsx",
  arrow: "src/modules/arrow/index.tsx",
  close: "src/modules/close/index.tsx",
  anchor: "src/modules/anchor/index.tsx",
};

export default defineConfig([
  {
    ...sharedBase,
    entry: { index: "src/index.ts", context: "src/context/index.ts" },
    outDir: "dist",
    clean: true,
    format: ["esm"],
    outExtensions: () => ({ dts: ".d.ts" }),
    dts: true,
    css: { inject: true, minify: true },
    deps: sharedDeps,
  },
  {
    ...sharedBase,
    entry: { index: "src/index.ts", context: "src/context/index.ts" },
    outDir: "dist",
    format: ["cjs"],
    outExtensions: () => ({ dts: ".d.cts" }),
    dts: true,
    css: { inject: false, minify: true },
    deps: sharedDeps,
  },
  {
    ...sharedBase,
    entry: moduleEntry,
    outDir: "dist/modules",
    format: ["esm"],
    outExtensions: () => ({ dts: ".d.ts" }),
    dts: true,
    css: { inject: true, minify: true },
    plugins: [externalizeContextsPlugin],
    deps: {
      neverBundle: [
        ...sharedDeps.neverBundle,
        "@dateforge/react-popover",
        "@dateforge/react-popover/context",
      ],
    },
  },
  {
    ...sharedBase,
    entry: moduleEntry,
    outDir: "dist/modules",
    format: ["cjs"],
    outExtensions: () => ({ dts: ".d.cts" }),
    dts: true,
    css: { inject: false, minify: true },
    plugins: [externalizeContextsPlugin],
    deps: {
      neverBundle: [
        ...sharedDeps.neverBundle,
        "@dateforge/react-popover",
        "@dateforge/react-popover/context",
      ],
    },
  },
]);
