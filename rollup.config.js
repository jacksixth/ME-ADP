// rollup.config.js
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'deploy.js',
  output: {
    file: 'out/deploy.cjs',
    format: 'cjs',
    inlineDynamicImports: true,
    sourcemap: false,
  },
  plugins: [
    nodeResolve({
      preferBuiltins: true, // 明确使用内置模块，消除 readline 警告
    }),
    commonjs(),
    json(), // 支持导入 JSON 文件
  ],
  external: [
    './serverInfo.js',
    'fs',
    'path',
    'child_process',
    'crypto',
    'buffer',
    'stream',
    'util',
    'zlib'
  ] // 明确将 Node.js 内置模块设为外部依赖
};