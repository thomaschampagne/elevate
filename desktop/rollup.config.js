import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";

const IS_ELECTRON_PROD = process.env.ELECTRON_ENV && process.env.ELECTRON_ENV === "prod";

// tslint:disable-next-line:no-console
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

module.exports = [
  {
    input: "./src/main.ts",
    output: [
      {
        file: "./dist/desktop.bundle.js",
        format: "cjs"
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
      "zlib"
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
