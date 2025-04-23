const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const path = require("path");

module.exports = {
  packagerConfig: {
    // Prevent Forge from signing during packaging – we’ll sign manually
    osxSign: false,

    // Required by plugin-auto-unpack-natives
    asar: {
      unpack: "**/users.db",
      smartUnpack: false,
    },

    // Set output directory + general packaging config
    out: "./out",
    name: "npchatbot",
    arch: "arm64",
    platform: "darwin", // Ensures only mac builds happen when you want to prep release
    dir: "./",
    icon: "./client/public/favicon/npicon.icns",

    // ⚠ Prevent repackaging if you’re just re-making the DMG after signing
    overwrite: false, // <--- disables app rebuild
  },

  rebuildConfig: {},

  makers: [
    // Windows installer – retain for future packaging
    // {
    //   name: "@electron-forge/maker-squirrel",
    //   platforms: ["win32"],
    //   config: {
    //     authors: "Marcus McBride",
    //     description: "Interactive Music Commmands for Twitch & Serato",
    //     name: "npchatbot",
    //     exe: "npchatbot.exe",
    //     setupExe: "npchatbot-setup.exe",
    //     setupIcon: "./client/public/favicon/installer-icon.ico",
    //     loadingGif: "./client/public/spinner.gif",
    //   },
    // },

    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
    {
      name: "@electron-forge/maker-dmg",
      platforms: ["darwin"],
      config: {
        name: "npchatbot",
        icon: path.resolve(__dirname, "./client/public/favicon/npicon.icns"),
        // background: "./client/public/gradient.png",
        overwrite: true,
        format: "ULFO",
        window: {
          width: 660,
          height: 400,
        },
        contents: [
          {
            x: 170,
            y: 220,
            type: "file",
            // This MUST point to the notarized, stapled .app that already exists
            path: "./out/npchatbot-darwin-arm64/npchatbot.app",
          },
          { x: 480, y: 220, type: "link", path: "/Applications" },
        ],
      },
    },
  ],

  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
