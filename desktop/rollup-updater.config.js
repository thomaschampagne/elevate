import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

const IS_ELECTRON_PROD = process.env.ELECTRON_ENV && process.env.ELECTRON_ENV === "prod";

console.info('Building updater bundle in "' + (IS_ELECTRON_PROD ? "production" : "development") + '" mode.');

module.exports = {
  input: "./src/updater/window/index.ts",
  output: [
    {
      file: "./dist/updater/index.js",
      format: "cjs",
    },
  ],
  external: [],
  plugins: [
    typescript({
      include: ["./src/updater/updater.ts"],
      removeComments: true,
    }),
    resolve(),
    commonjs({ sourceMap: false }),
    IS_ELECTRON_PROD ? terser() : null,
  ],
};
