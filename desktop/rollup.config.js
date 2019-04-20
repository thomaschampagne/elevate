import typescript from "rollup-plugin-typescript2";
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import {uglify} from "rollup-plugin-uglify";

const IS_ELECTRON_PROD = (process.env.ELECTRON_ENV && process.env.ELECTRON_ENV === "prod");

const skipUglify = () => {
	console.debug("Uglify skipped.")
};

module.exports = {
	input: "./desktop.run.ts",
	output: [
		{
			file: "../dist/desktop.run.js",
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
		typescript(),
		commonjs({
			namedExports: {
				"../node_modules/lodash/lodash.js": ["forEach"]
			}
		}),
		resolve(),
		(IS_ELECTRON_PROD) ? uglify() : skipUglify()
	]
};
