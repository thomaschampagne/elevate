import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";

// eslint-disable-next-line no-undef
const IS_ELECTRON_PROD = process.env.ELECTRON_ENV && process.env.ELECTRON_ENV === "prod";

// eslint-disable-next-line no-undef
console.info('Building desktop bundle in "' + (IS_ELECTRON_PROD ? "production" : "development") + '" mode.');

const plugins = [
  typescript({
    tsconfig: "./tsconfig.json",
    include: ["./src/**/*.ts", "!./src/**/*.spec.ts", "./../appcore/modules/**/*.ts"]
  }),
  resolve({ preferBuiltins: true }),
  commonjs({
    ignore: ["assert", "net"],
    sourceMap: false
  }),
  json(),
  IS_ELECTRON_PROD ? terser() : null
];

// eslint-disable-next-line no-undef
module.exports = [
  {
    input: "./src/main.ts",
    output: [
      {
        file: "./dist/desktop.bundle.js",
        format: "cjs",
        // Executed before anything else in the bundle. The "app-root-path" package
        // (transitive dep of "garmin-connect") crashes in the packaged Electron main
        // process: bundling makes require.main undefined and there is no
        // process.argv[1], so its resolver calls path.dirname(undefined).
        // APP_ROOT_PATH short-circuits that resolver before it can fail.
        banner: "if(!process.env.APP_ROOT_PATH){process.env.APP_ROOT_PATH=__dirname;}"
      }
    ],
    watch: {
      chokidar: false
    },
    external: [
      "electron",
      "fs",
      "os",
      "util",
      "http",
      "https",
      "url",
      "path",
      "crypto",
      "tls",
      "events",
      "tty",
      "child_process",
      "stream",
      "zlib",
      "dgram",
      "buffer"
    ],
    plugins: plugins
  },
  // Electron pre-loader
  {
    input: "./src/pre-loading/pre-loader.ts",
    external: ["electron"],
    output: [
      {
        file: "./dist/pre-loader.js",
        format: "cjs"
      }
    ],
    plugins: plugins
  },
  // Workers
  {
    input: "./src/workers/sports-lib.worker.ts",
    external: ["worker_threads", "fs"],
    output: [
      {
        file: "./dist/workers/sports-lib.worker.js",
        format: "cjs"
      }
    ],
    plugins: plugins
  },
  {
    input: "./src/workers/activity-compute.worker.ts",
    external: ["worker_threads", "crypto"],
    output: [
      {
        file: "./dist/workers/activity-compute.worker.js",
        format: "cjs"
      }
    ],
    plugins: plugins
  }
];
