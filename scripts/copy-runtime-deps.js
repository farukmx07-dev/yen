const fs = require('fs');
const path = require('path');

const RUNTIME_MODULES = ['mysql2', 'ws', 'sharp'];

function copyModuleTree(moduleName, destRoot, srcRoot, copied = new Set()) {
  if (copied.has(moduleName)) return;
  const src = path.join(srcRoot, moduleName);
  if (!fs.existsSync(src)) return;

  const dest = path.join(destRoot, moduleName);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  copied.add(moduleName);

  const pkgPath = path.join(src, 'package.json');
  if (!fs.existsSync(pkgPath)) return;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  for (const dep of Object.keys(pkg.dependencies || {})) {
    copyModuleTree(dep, destRoot, srcRoot, copied);
  }
  for (const dep of Object.keys(pkg.optionalDependencies || {})) {
    copyModuleTree(dep, destRoot, srcRoot, copied);
  }
}

function copyRuntimeDeps(options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const srcRoot = options.srcRoot || path.join(projectRoot, 'node_modules');
  const destRoot =
    options.destRoot || path.join(projectRoot, '.next', 'standalone', 'node_modules');

  if (!fs.existsSync(srcRoot)) {
    console.warn('[copy-runtime-deps] node_modules bulunamadi:', srcRoot);
    return [];
  }

  fs.mkdirSync(destRoot, { recursive: true });

  const copied = new Set();
  for (const mod of RUNTIME_MODULES) {
    copyModuleTree(mod, destRoot, srcRoot, copied);
  }

  return [...copied];
}

if (require.main === module) {
  const srcRoot = process.env.SRC_NODE_MODULES;
  const destRoot = process.env.DEST_NODE_MODULES;
  const copied = copyRuntimeDeps({
    projectRoot: process.cwd(),
    srcRoot: srcRoot || path.join(process.cwd(), 'node_modules'),
    destRoot: destRoot || path.join(process.cwd(), '.next', 'standalone', 'node_modules'),
  });
  console.log('[copy-runtime-deps]', copied.join(', ') || 'hicbir modul kopyalanmadi');
}

module.exports = { copyRuntimeDeps, copyModuleTree };
