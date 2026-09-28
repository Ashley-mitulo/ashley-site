// build-browser-engine.mjs — esbuild 打包浏览器端求解引擎
// 产物： ../engine.bundle.js (IIFE, window.PortKgEngine)
// 用 --alias 把 fs/path 指向浏览器 shim，并把 ./solver-eval 等解析到源项目 src/server
import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = '/mnt/d/openclaw/workspace/port-general-kg/src/server';
const OUT = path.join(__dirname, '..', 'engine.bundle.js');

await esbuild.build({
  entryPoints: [path.join(__dirname, 'engine-entry.js')],
  bundle: true,
  outfile: OUT,
  format: 'iife',
  platform: 'browser',
  target: 'es2019',
  // 关键：把相对模块解析到源项目后端源码
  plugins: [{
    name: 'resolve-backend',
    setup(build) {
      build.onResolve({ filter: /^(\.\/)?(solver-eval|dry-bulk-engine)$/ }, (args) => {
        return { path: path.join(SRC, args.path.replace(/^\.\//, '') + '.js') };
      });
      // engine-entry 里的 require 也走这里
      build.onResolve({ filter: /solver-eval/ }, () => ({ path: path.join(SRC, 'solver-eval.js') }));
    }
  }],
  alias: {
    fs: path.join(__dirname, 'fs-browser.js'),
    path: path.join(__dirname, 'fs-browser.js'),
  },
  define: { __dirname: '"/"' },
  legalComments: 'none',
  logLevel: 'info',
});

console.log('✔ 打包完成 -> ' + OUT);