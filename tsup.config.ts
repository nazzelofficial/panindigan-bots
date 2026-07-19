import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/deploy-commands.ts"
  ],

  outDir: "dist",

  format: ["esm"],

  platform: "node",
  target: "node24",

  bundle: true,
  splitting: false,

  sourcemap: true,
  clean: true,

  minify: false,
  treeshake: true,

  dts: false,

  skipNodeModulesBundle: true,

  noExternal: [
    /^@\//
  ]
});