const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const path = require("path");

// Packager tests these against forward-slash paths relative to the project root.
// Only client/build and client/public are needed at runtime; shipping client/node_modules
// and client/src makes asar creation stall while crawling hundreds of thousands of files.
const packagerIgnore = [
  /^\/client\/(?!(build|public)(\/|$))/,
  /^\/(__tests__|coverage|test-files|out|dist|\.github|\.vscode)(\/|$)/,
  /\.test\.js$/,
  /\.spec\.js$/,
  /^\/jest\.setup\.js$/,
];

module.exports = {
  /* Dynamic packagerConfig based on platform */
  packagerConfig: (() => {
    if (process.platform === "win32") {
      // Windows-specific packagerConfig
      return {
        asar: {
          unpack: "**/users.db",
          smartUnpack: false,
        },
        name: "npchatbot",
        icon: "./client/public/favicon/favicon.ico",
        arch: "x64",
        platform: "win32",
        dir: "./",
        out: "./dist",
        overwrite: true,
        ignore: packagerIgnore,
      };
    } else if (process.platform === "darwin") {
      // MacOS-specific packagerConfig
      return {
        osxSign: false,
        asar: {
          unpack: "**/users.db",
          smartUnpack: false,
        },
        out: "./out",
        name: "npchatbot",
        arch: "arm64",
        platform: "darwin",
        dir: "./",
        icon: "./client/public/favicon/npicon.icns",
        overwrite: false, // Prevents app rebuild if just remaking the DMG
        ignore: packagerIgnore,
      };
    } else {
      // Default to an empty configuration for unsupported platforms
      return {};
    }
  })(),

  rebuildConfig: {},

  /* Dynamic makers based on platform */
  makers: (() => {
    if (process.platform === "win32") {
      // Windows-specific makers
      return [
        {
          name: "@electron-forge/maker-squirrel",
          platforms: ["win32"],
          config: {
            authors: "Marcus McBride",
            description: "Interactive Music Commands for Twitch & Serato",
            name: "npchatbot",
            exe: "npchatbot.exe",
            setupExe: "npchatbot-setup.exe",
            setupIcon: "./client/public/favicon/installer-icon.ico",
            loadingGif: "./client/public/spinner.gif",
          },
        },
      ];
    } else if (process.platform === "darwin") {
      // MacOS-specific makers
      return [
        {
          name: "@electron-forge/maker-zip",
          platforms: ["darwin"],
        },
        {
          name: "@electron-forge/maker-dmg",
          platforms: ["darwin"],
          config: {
            name: "npchatbot",
            icon: path.resolve(
              __dirname,
              "./client/public/favicon/npicon.icns"
            ),
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
                path: path.resolve(
                  __dirname,
                  "out/npchatbot-darwin-arm64/npchatbot.app"
                ),
              },
              { x: 480, y: 220, type: "link", path: "/Applications" },
            ],
          },
        },
      ];
    } else {
      // Default to no makers for unsupported platforms
      return [];
    }
  })(),

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
