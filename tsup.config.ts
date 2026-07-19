import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts"
  ],

  outDir: "dist",

  format: [
    "esm"
  ],

  platform: "node",

  target: "node24",

  bundle: false,

  splitting: false,

  sourcemap: true,

  clean: true,

  minify: false,

  dts: false
});