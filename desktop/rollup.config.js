import typescript from "rollup-plugin-typescript2";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import {terser} from "rollup-plugin-terser";

const NODE_GLOBALS = [
	"electron",
	"fs",
	"os",
	"util",
	"http",
	"https",
	"url",
	"path",
	"crypto",
	"net",
	"tls",
	"events",
	"tty",
	"child_process",
	"stream"
];

const LODASH_METHODS_DECLARATION = [
	"forEach",
	"isEmpty",
	"isArray",
	"omit",
	"mean",
	"isUndefined",
	"isFinite",
	"last",
	"slice",
	"isNumber",
	"propertyOf",
	"sum",
	"max",
	"floor",
	"isNull",
	"isNaN",
	"clone",
	"sortBy",
	"first",
	"find"
];

const IS_ELECTRON_PROD = (process.env.ELECTRON_ENV && process.env.ELECTRON_ENV === "prod");

module.exports = {
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
	external: NODE_GLOBALS,
	plugins: [
		typescript({
			include: [
				"./src/**/*.ts",
				"!./src/**/*.spec.ts",
				"./../appcore/modules/**/*.ts"
			]
		}),
		commonjs({
			namedExports: {
				"./node_modules/lodash/lodash.js": LODASH_METHODS_DECLARATION,
				"../appcore/node_modules/lodash/lodash.js": LODASH_METHODS_DECLARATION,
				"../appcore/node_modules/pako/index.js": ["gzip", "inflate", "ungzip"],
				"./node_modules/https-proxy-agent/index.js": ["HttpsProxyAgent"],
				"./node_modules/get-proxy-settings/dist/index.js": ["getProxySettings"]
			},
			ignore: ["assert"]
		}),
		resolve(),
		(IS_ELECTRON_PROD) ? terser() : null
	]
};
