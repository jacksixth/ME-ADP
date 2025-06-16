// rollup.config.js
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';

export default {
  input: 'deploy.js',
  output: {
    file: 'out/deploy.cjs',
    format: 'cjs',
    inlineDynamicImports: true,
    sourcemap: false,
  },
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        __CLIENT__: typeof window !== 'undefined',
        __SERVER__: typeof window === 'undefined',
      },
    }),
    nodeResolve({
      preferBuiltins: true, // 明确使用内置模块，消除 readline 警告
    }),
    commonjs(),
    terser(), // 可选：压缩代码
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