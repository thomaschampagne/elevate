module.exports = function (config) {
	config.set({
		basePath: "./",
		browsers: ["ChromeHeadless"],
		frameworks: ["systemjs", "jasmine", "promise"],
		plugins: [
			"karma-jasmine",
			"karma-systemjs",
			"karma-promise",
			"karma-chrome-launcher",
			"karma-json-fixtures-preprocessor"
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
			"plugin/core/node_modules/q/q.js",
			"plugin/core/node_modules/jquery/dist/jquery.js",
			"plugin/core/node_modules/lodash/lodash.min.js",
			"plugin/core/node_modules/chart.js/dist/Chart.min.js",
			"plugin/core/node_modules/d3/d3.js",
			"plugin/core/node_modules/file-saver/FileSaver.min.js",
			"plugin/core/node_modules/qrcode/build/qrcode.min.js",
			"plugin/shared/**/*.js",
			"plugin/core/config/*.js",
			"plugin/core/scripts/**/*.js",

			// Specs files
			"plugin/core/specs/**/*.js",
			"plugin/core/specs/fixtures/**/*.json"

		],
		exclude: [
			"plugin/core/scripts/Background.js",
			"plugin/core/scripts/SystemJS.*.js",
			"plugin/core/scripts/InstallUpdateHandler.js",
			"plugin/core/scripts/models/*.js",
			"plugin/core/scripts/Content.js",
			"plugin/core/modules/jquery.appear.js"
		],
		systemjs: {
			serveFiles: [
				"**/*.map"
			], // Patterns for files that you want Karma to make available, but not loaded until a module requests them. eg. Third-party libraries.
			config: { // SystemJS configuration
				packages: {
					"plugin/shared/": {
						format: "cjs"
					},
					"plugin/core/": {
						format: "cjs"
					},
					"specs/": {
						format: "cjs"
					}
				},
				paths: {
					"traceur": "./node_modules/traceur/dist/commonjs/traceur.js", // karma-systemjs required
					"systemjs": "./node_modules/systemjs/dist/system.js", // karma-systemjs required
					"npm@plugin:": "./base/plugin/core/node_modules/"
				},
				map: {
					"q": "npm@plugin:q/q.js",
					"jquery": "npm@plugin:jquery/dist/jquery.js",
					"lodash": "npm@plugin:lodash/lodash.min.js",
					"chart.js": "npm@plugin:chart.js/dist/Chart.min.js",
					"d3": "npm@plugin:d3/d3.js",
					"qrcode": "npm@plugin:qrcode/build/qrcode.min.js",
					"file-saver": "npm@plugin:file-saver/FileSaver.min.js"
				}
			}
		},
		preprocessors: {
			"plugin/core/specs/fixtures/**/*.json": ["json_fixtures"]
		},
		jsonFixturesPreprocessor: {
			// strip this from the file path \ fixture name
			stripPrefix: "specs/",
			// strip this to the file path \ fixture name
			prependPrefix: "",
			// change the global fixtures variable name
			variableName: "__fixtures__",
			// camelize fixture filenames (e.g "fixtures/aa-bb_cc.json" becames __fixtures__["fixtures/aaBbCc"])
			camelizeFilenames: true,
			// transform the filename
			transformPath: function (path) {
				return path + ".js";
			}
		},
		colors: true,
		singleRun: true,
		browserConsoleLogOptions: {
			// path: "./specs.log",
			terminal: false
		}
	});
};
