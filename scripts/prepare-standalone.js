const fs = require("fs");
const path = require("path");

const standaloneDir = path.join(".next", "standalone");

if (!fs.existsSync(standaloneDir)) {
  console.log("Standalone output not found, skipping asset copy.");
  process.exit(0);
}

fs.cpSync(path.join(".next", "static"), path.join(standaloneDir, ".next", "static"), {
  recursive: true,
});
fs.cpSync("public", path.join(standaloneDir, "public"), { recursive: true });

if (fs.existsSync("data")) {
  const destData = path.join(standaloneDir, "data");
  const destSettings = path.join(destData, "settings.json");
  const srcSettings = path.join("data", "settings.json");
  const preserveSettings = fs.existsSync(destSettings);

  fs.mkdirSync(destData, { recursive: true });

  for (const entry of fs.readdirSync("data", { withFileTypes: true })) {
    if (preserveSettings && entry.name === "settings.json") {
      continue;
    }
    const srcPath = path.join("data", entry.name);
    const destPath = path.join(destData, entry.name);
    if (entry.isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  if (!preserveSettings && fs.existsSync(srcSettings)) {
    fs.copyFileSync(srcSettings, destSettings);
  }

  console.log(
    preserveSettings
      ? "data/ copied to standalone output (existing settings.json preserved)."
      : "data/ copied to standalone output."
  );
}

function copyModule(moduleName) {
  const src = path.join("node_modules", moduleName);
  const dest = path.join(standaloneDir, "node_modules", moduleName);
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  return true;
}

// Next.js standalone tracing may omit sharp platform binaries.
for (const name of fs.readdirSync("node_modules")) {
  if (name === "sharp" || name.startsWith("@img")) {
    copyModule(name);
  }
}

if (copyModule("sharp")) {
  console.log("sharp copied to standalone output.");
} else {
  console.warn("sharp not found in node_modules — run: npm install sharp");
}

for (const mod of ["mysql2", "ws"]) {
  if (copyModule(mod)) {
    console.log(`${mod} copied to standalone output.`);
  }
}

const { copyRuntimeDeps } = require("./copy-runtime-deps");
const runtimeCopied = copyRuntimeDeps();
if (runtimeCopied.length > 0) {
  console.log("Runtime deps copied:", runtimeCopied.join(", "));
}

function copyDirRelative(relativePath) {
  const src = path.join(process.cwd(), relativePath);
  const dest = path.join(standaloneDir, relativePath);
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  return true;
}

if (copyDirRelative("lib/ws")) {
  console.log("lib/ws copied to standalone output.");
}

if (copyDirRelative("scripts/server-guards.js")) {
  console.log("scripts/server-guards.js copied to standalone output.");
}

if (copyDirRelative("scripts/admin-live-sync.js")) {
  console.log("scripts/admin-live-sync.js copied to standalone output.");
}

if (copyDirRelative("scripts/log-cleanup-scheduler.js")) {
  console.log("scripts/log-cleanup-scheduler.js copied to standalone output.");
}

if (copyDirRelative("scripts/find-available-port.js")) {
  console.log("scripts/find-available-port.js copied to standalone output.");
}

if (fs.existsSync("server.js")) {
  fs.copyFileSync("server.js", path.join(standaloneDir, "server.js"));
  console.log("server.js copied to standalone output.");
}

const requiredServerFilesSrc = path.join(".next", "required-server-files.json");
const requiredServerFilesDest = path.join(standaloneDir, ".next", "required-server-files.json");
if (fs.existsSync(requiredServerFilesSrc) && !fs.existsSync(requiredServerFilesDest)) {
  fs.mkdirSync(path.dirname(requiredServerFilesDest), { recursive: true });
  fs.copyFileSync(requiredServerFilesSrc, requiredServerFilesDest);
  console.log("required-server-files.json copied to standalone output.");
}

console.log("Standalone assets copied.");
