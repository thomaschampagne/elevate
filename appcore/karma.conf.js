// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html
const defaultBrowserKarmaConfig = {
	browsers: [
		"HeadlessChrome"
	],
	customLaunchers: {
		HeadlessChrome: {
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
	}
};

const provideBrowsersKarmaConfig = () => {

	const fs = require("fs");
	const customBrowsersKarmaConfigPath = __dirname + "/../browsers.karma.conf.js";

	let browsersKarmaConfig = null;
	if (fs.existsSync(customBrowsersKarmaConfigPath)) {
		browsersKarmaConfig = require(customBrowsersKarmaConfigPath);
		if (!browsersKarmaConfig.browsers || !browsersKarmaConfig.customLaunchers) {
			browsersKarmaConfig = null;
		}
	}

	if (browsersKarmaConfig) {
		console.log("Using CUSTOM browser config");
	} else {
		console.log("Using DEFAULT browser config");
		browsersKarmaConfig = defaultBrowserKarmaConfig;
	}
	return browsersKarmaConfig;
};

const browsersKarmaConfig = provideBrowsersKarmaConfig();

module.exports = function (config) {
	config.set({
		basePath: "",
		frameworks: ["jasmine", "@angular-devkit/build-angular"],
		plugins: [
			require("karma-jasmine"),
			require("karma-chrome-launcher"),
			require("karma-jasmine-html-reporter"),
			require("karma-coverage-istanbul-reporter"),
			require("karma-spec-reporter"),
			require("@angular-devkit/build-angular/plugins/karma")
		],
		client: {
			clearContext: false // leave Jasmine Spec Runner output visible in browser
		},
		/** * maximum number of tries a browser will attempt in the case of a disconnection */
		browserDisconnectTolerance: 3,
		/** * How long will Karma wait for a message from a browser before disconnecting from it (in ms). */
		browserNoActivityTimeout: 60 * 1000,
		coverageIstanbulReporter: {
			dir: require('path').join(__dirname, 'coverage'), reports: ["html", "lcovonly"],
			fixWebpackSourcePaths: true
		},
		angularCli: {
			environment: "dev"
		},
		reporters: ["progress", "kjhtml", "spec"],
		port: 9876,
		colors: true,
		logLevel: config.LOG_INFO,
		autoWatch: true,
		browsers: browsersKarmaConfig.browsers,
		customLaunchers: browsersKarmaConfig.customLaunchers,
		specReporter: {
			maxLogLines: 5,             	// limit number of lines logged per test
			suppressErrorSummary: false, 	// do not print error summary
			suppressFailed: false,      	// do not print information about failed tests
			suppressPassed: false,      	// do not print information about passed tests
			suppressSkipped: true,      	// do not print information about skipped tests
			showSpecTiming: true,      		// print the time elapsed for each spec
			failFast: false              	// test would finish with error when a first fail occurs.
		},
		singleRun: false
	});
};
