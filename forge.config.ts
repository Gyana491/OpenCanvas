import "dotenv/config";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    executableName: "opencanvas",
    osxSign: {
      identity: "ad-hoc",
      preAutoEntitlements: false,
      // @ts-expect-error: hardenedRuntime is valid in electron-osx-sign but missing in types
      hardenedRuntime: false,
    },
  },
  rebuildConfig: {},
  makers: [
    ...(process.platform === 'win32' ? [
      new MakerSquirrel({
        name: "OpenCanvas",
        authors: "Gyana Ranjan",
        description: "OpenCanvas Desktop Application",
      })
    ] : []),
    new MakerZIP({}, ["darwin", "win32"]),
    new MakerRpm({}),
    new MakerDeb({}),
    new MakerDMG({}),
  ],
  publishers: [
    {
      /*
       * Publish release on GitHub with update feeds for auto-updates.
       * Apps will automatically check for updates and notify users.
       */
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "Gyana491",
          name: "OpenCanvas",
        },
        draft: true,
        prerelease: false,
        // Generate update manifest for auto-updates
        generateReleaseNotes: true,
      },
    },
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main.ts",
          config: "vite.main.config.mts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.mts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.mts",
        },
      ],
    }),

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

export default config;
