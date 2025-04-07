const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const path = require("path");

module.exports = {
  packagerConfig: {
    out: "./out", // Output directory for built applications
    name: "npchatbot", // Name of the application
    arch: "arm64", // Architecture of the application
    platform: "all", // Platforms to build for (all platforms)
    dir: "./", // Directory containing the source code
    icon: "./client/public/favicon/npicon.icns",
    asar: {
      unpack: "**/users.db", // Files to unpack from the asar archive
    },
  },
  //   packagerConfig: {
  //     asar: {
  //       unpack: "**/users.db",
  //     },
  //     name: "npchatbot",
  //     icon: "./client/public/favicon/favicon.ico",
  //     arch: "x64",
  //     platform: "all",
  //     dir: "./",
  //     out: "./dist",
  //   },
  rebuildConfig: {},
  makers: [
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
