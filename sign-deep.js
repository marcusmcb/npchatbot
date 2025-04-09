const path = require("path");
const { signAsync } = require("electron-osx-sign");

const signDeep = async ({ appOutDir }) => {
  const appPath = path.join(appOutDir, "npchatbot.app");

  console.log("🔐 Deep signing in progress...");

  try {
    await signAsync({
      app: appPath,
      identity: "Developer ID Application: Marcus McBride (J42R5X7F49)",
      hardenedRuntime: true,
      entitlements: "entitlements.plist",
      "entitlements-inherit": "entitlements.plist",
      signatureFlags: "library",
      strictVerify: true,
      timestamp: true,
      gatekeeperAssess: false, // speeds things up
      preAutoEntitlements: false,
      deep: true,
      verbose: true,
    });

    console.log("✅ Deep signing completed successfully.");
  } catch (error) {
    console.error("❌ Deep signing failed:", error);
    process.exit(1);
  }
};

module.exports = signDeep;
