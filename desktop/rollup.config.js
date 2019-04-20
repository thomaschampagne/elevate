import typescript from "rollup-plugin-typescript2";
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import {uglify} from "rollup-plugin-uglify";

const IS_ELECTRON_PROD = (process.env.ELECTRON_ENV && process.env.ELECTRON_ENV === "prod");

const skipUglify = () => {
	console.debug("Uglify skipped.")
};

module.exports = {
	input: "./src/main.ts",
	output: [
		{
			file: "../dist/main.js",
			format: "cjs"
		}
	],
	watch: {
		chokidar: false
	},
	external: [
		"fs",
		"os",
		"util",
		"http",
		"https",
		"url",
		"path",
		"crypto",
		"electron"
	],
	plugins: [
		typescript({
			include: [
				"./src/**/*.ts",
				"!./src/**/*.spec.ts",
				"./../plugin/app/modules/**/*.ts"
			]
		}),
		commonjs({
			namedExports: {
				"../node_modules/lodash/lodash.js": ["forEach"]
			}
		}),
		resolve(),
		(IS_ELECTRON_PROD) ? uglify() : skipUglify()
	]
};
