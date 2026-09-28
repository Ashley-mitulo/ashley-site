// fs-browser.js — 浏览器版 fs/path shim（供 esbuild alias）
// 打包时把 data/ 下的 JSON 内联，readFileSync(路径) 从内联字典返回。
// 用法：esbuild --alias:fs=./fs-browser.js --alias:path=./fs-browser.js --define:__dirname='"/"'
'use strict';

// 内联数据字典：key = 去掉前导 '/' 的相对路径；value = 原始 JSON 文本
const INLINE = {
  'data/seed/yard-capacity-sensitivity.json': require('./data-inline/seed/yard-capacity-sensitivity.json.js'),
  'data/generalCargo/seed.json': require('./data-inline/generalCargo/seed.json.js'),
  'data/coal/seed.json': require('./data-inline/coal/seed.json.js'),
  'data/grain/seed.json': require('./data-inline/grain/seed.json.js'),
  'data/dry-bulk/seed.json': require('./data-inline/dry-bulk/seed.json.js'),
  'data/seed/dry-bulk.regs.json': require('./data-inline/seed/dry-bulk.regs.json.js'),
};

function keyify(p) {
  // 归一化：去前导 /、去 ./
  let s = String(p || '').replace(/\\/g, '/');
  s = s.replace(/^\/+/, '');
  const parts = [];
  s.split('/').forEach(function (seg) {
    if (seg === '.' || seg === '') return;
    if (seg === '..') { parts.pop(); return; }
    parts.push(seg);
  });
  return parts.join('/');
}

function readFileSync(p, enc) {
  const key = keyify(p);
  if (key in INLINE) {
    const val = INLINE[key];
    // val 已是解析后的对象（require 返回 module.exports）。调用者用 JSON.parse(...,'utf8')，需给字符串。
    return JSON.stringify(val);
  }
  throw new Error('fs-browser: 找不到内联数据 ' + key + ' (原始: ' + p + ')');
}

exports.readFileSync = readFileSync;
// path shim
function join() {
  return Array.prototype.filter.call(arguments, function (a) { return a != null && a !== ''; }).join('/');
}
function dirname(p) { const s = String(p || '').replace(/\\/g, '/'); const i = s.lastIndexOf('/'); return i < 0 ? '.' : s.slice(0, i); }
exports.join = join;
exports.dirname = dirname;
exports.resolve = join;