import typescript from "rollup-plugin-typescript2";

module.exports = {
	input: "./desktop.run.ts",
	output: [
		{
			file: "../dist/desktop.run.js",
			format: "cjs",
		}
	],
	watch: {
		chokidar: false
	},
	external: ["url", "path", "electron", "electron-log"],
	plugins: [
		typescript({})

	]
};
