// tsup.config.ts
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["deploy.ts"],
  outDir: "out",
  format: ["esm"], // Node 通常用 cjs，或加 'esm' 支持两种
  target: "node18",
  splitting: false,
  sourcemap: false,
  clean: true,
  dts: false, // 如果你用 TypeScript，并需要类型声明
  esbuildOptions(options) {
    options.banner = {
      js: '"use strict";',
    }
  },
  shims: false, // 禁用对浏览器 polyfill 的 shim
})
