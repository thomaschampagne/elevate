module.exports = function (config) {
	config.set({
		basePath: "./",
		browsers: ["ChromeHeadless"],
		frameworks: ["jasmine", "promise"],
		reporters: ["progress"],
		plugins: [
			"karma-webpack",
			"karma-jasmine",
			"karma-promise",
			"karma-chrome-launcher"
		],
		customLaunchers: {
			ChromeHeadless: {
				base: "Chrome",
				flags: [
					"--no-sandbox",
					// See https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md
					"--headless",
					"--disable-gpu",
					// Without a remote debugging port, Google Chrome exits immediately.
					" --remote-debugging-port=9222"
				]
			}
		},
		files: [
			"specs/**/*.spec.ts"
		],
		preprocessors: {
			"**/*.spec.ts": ["webpack"]
		},
		webpack: {
			mode: "development",
			resolve: {
				extensions: [".ts"]
			},
			module: {
				rules: [
					{
						exclude: [/node_modules/],
						test: /\.ts$/,
						use: {
							loader: "ts-loader",
							options: {
								configFile: "tsconfig.spec.json"
							}
						}
					}
				]
			}
		},
		mime: {
			"text/x-typescript": ["ts", "tsx"]
		},
		colors: true,
		singleRun: true,
		browserConsoleLogOptions: {
			// path: "./specs.log",
			terminal: false
		}
	});
};
