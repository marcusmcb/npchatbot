// utility method run manually to sign the dev dependencies
// in the Electron app for macOS distribution

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const identity = "Developer ID Application: Marcus McBride (J42R5X7F49)";
const entitlementsPath = path.resolve(__dirname, "entitlements.plist");

function sign(target, extraOptions = "") {
  console.log(`Signing: ${target}`);
  execSync(
    `codesign --force --deep --sign "${identity}" --options runtime --timestamp --entitlements "${entitlementsPath}" ${extraOptions} "${target}"`,
    { stdio: "inherit" }
  );
}

function findNativeBinaries(dir, extensions = [".node", ".dylib", ""]) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results.push(...findNativeBinaries(fullPath, extensions));
    } else if (extensions.some((ext) => file.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

async function signApp(appPath) {
  const frameworksDir = path.join(appPath, "Contents/Frameworks");

  // Sign all helper apps
  const helpers = [
    "npchatbot Helper (GPU).app",
    "npchatbot Helper (Plugin).app",
    "npchatbot Helper (Renderer).app",
    "npchatbot Helper.app",
  ];
  for (const helper of helpers) {
    sign(path.join(frameworksDir, helper));
  }

  // Sign all known frameworks
  const frameworks = [
    "Electron Framework.framework",
    "Mantle.framework",
    "ReactiveObjC.framework",
    "Squirrel.framework",
  ];
  for (const fw of frameworks) {
    sign(path.join(frameworksDir, fw));
  }

  // Sign nested libraries (e.g., .dylib, ShipIt, crashpad_handler)
  const libDirs = [
    "Electron Framework.framework/Versions/A/Libraries",
    "Electron Framework.framework/Versions/A/Helpers",
    "Squirrel.framework/Versions/A/Resources",
  ];
  for (const dir of libDirs) {
    const fullDir = path.join(frameworksDir, dir);
    if (fs.existsSync(fullDir)) {
      const libs = findNativeBinaries(fullDir);
      libs.forEach((lib) => sign(lib));
    }
  }

  // Sign native node modules including fsevents in all nested paths
  const appResources = path.join(appPath, "Contents/Resources");
  const unpackedDirs = [
    "app.asar.unpacked",
    "app.asar.unpacked/node_modules",
    "app.asar.unpacked/client/node_modules",
    "app.asar.unpacked/npchatbot.app.backup",
    "app.asar.unpacked/npchatbot.app.backup/node_modules",
    "app.asar.unpacked/npchatbot.app.backup/client/node_modules",
  ];
  for (const subdir of unpackedDirs) {
    const dir = path.join(appResources, subdir);
    if (fs.existsSync(dir)) {
      const nodeBinaries = findNativeBinaries(dir, [".node"]);
      nodeBinaries.forEach((bin) => sign(bin));
    }
  }

  // Sign the main binary
  sign(path.join(appPath, "Contents/MacOS/npchatbot"));

  // Finally sign the entire .app bundle
  sign(appPath);
}

// CLI entry point
const appPath = process.argv[2];
if (!appPath) {
  console.error("Usage: node sign.js <path-to-app>");
  process.exit(1);
}

signApp(appPath);
