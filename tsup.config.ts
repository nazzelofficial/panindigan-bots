import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",

  format: ["esm"],
  platform: "node",
  target: "node24",

  splitting: false,
  sourcemap: true,
  clean: true,

  bundle: true,
  treeshake: true,
  minify: false,

  dts: false,

  shims: false,

  skipNodeModulesBundle: true
});