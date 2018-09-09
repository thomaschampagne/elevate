module.exports = function (config) {
	config.set({
		basePath: "./",
		browsers: ["Chrome"],
		frameworks: ["jasmine", "promise"],
		reporters: ["progress", "spec"],
		plugins: [
			"karma-webpack",
			"karma-jasmine",
			"karma-promise",
			"karma-chrome-launcher",
			"karma-spec-reporter"
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
		specReporter: {
			maxLogLines: 5,             	// limit number of lines logged per test
			suppressErrorSummary: false, 	// do not print error summary
			suppressFailed: false,      	// do not print information about failed tests
			suppressPassed: false,      	// do not print information about passed tests
			suppressSkipped: true,      	// do not print information about skipped tests
			showSpecTiming: true,      		// print the time elapsed for each spec
			failFast: false              	// test would finish with error when a first fail occurs.
		},
		colors: true,
		singleRun: false,
		browserConsoleLogOptions: {
			// path: "./specs.log",
			terminal: false
		}
	});
};
