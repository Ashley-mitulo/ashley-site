// engine-entry.js — 浏览器端求解引擎入口（esbuild bundle -> window.PortKgEngine）
// solve(solverId, params) 完全模拟后端 /api/solvers/:id/eval：内置 solver 定义 + 干散货 seed。
'use strict';

// 内联求解器定义（来自 data/solvers/*.json）
const SOLVERS = {
  'S1-BERTHING-FEASIBILITY': require('/mnt/d/openclaw/workspace/manager/website-project/public/apps/port-general-kg/browser-engine/solvers-inline/S1-BERTHING-FEASIBILITY.js'),
  'S2-THROUGHPUT': require('/mnt/d/openclaw/workspace/manager/website-project/public/apps/port-general-kg/browser-engine/solvers-inline/S2-THROUGHPUT.js'),
  'S3-YARD': require('/mnt/d/openclaw/workspace/manager/website-project/public/apps/port-general-kg/browser-engine/solvers-inline/S3-YARD.js'),
  'S4-COMPLIANCE': require('/mnt/d/openclaw/workspace/manager/website-project/public/apps/port-general-kg/browser-engine/solvers-inline/S4-COMPLIANCE.js'),
  'S5-WORKABILITY': require('/mnt/d/openclaw/workspace/manager/website-project/public/apps/port-general-kg/browser-engine/solvers-inline/S5-WORKABILITY.js'),
  'S6-IMPORT-ELIGIBILITY': require('/mnt/d/openclaw/workspace/manager/website-project/public/apps/port-general-kg/browser-engine/solvers-inline/S6-IMPORT-ELIGIBILITY.js'),
  'S7-COAL-STACK-COMPLIANCE': require('/mnt/d/openclaw/workspace/manager/website-project/public/apps/port-general-kg/browser-engine/solvers-inline/S7-COAL-STACK-COMPLIANCE.js'),
};

// 复用源 solver-eval（它在源码里 require('./dry-bulk-engine')，esbuild 已内联）
const { evalSolver, checkChain, shortBerthName } = require('/mnt/d/openclaw/workspace/port-general-kg/src/server/solver-eval');
const engine = require('/mnt/d/openclaw/workspace/port-general-kg/src/server/dry-bulk-engine');

function solve(solverId, params) {
  const solver = SOLVERS[solverId];
  if (!solver) throw new Error('fail-fast: 未知求解器 ' + solverId);
  const seed = engine.getSeed();   // dry-bulk seed（后端也是这个）
  return evalSolver(solver, params || {}, seed);
}

window.PortKgEngine = {
  solve: solve,
  evalSolver: evalSolver,
  getSolvers: function () { return Object.keys(SOLVERS); },
  checkChain: checkChain,
  shortBerthName: shortBerthName,
};
window.__PortKgEngineReady__ = true;