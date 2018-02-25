// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
	config.set({
		basePath: '',
		frameworks: ['jasmine', '@angular/cli'],
		plugins: [
			require('karma-jasmine'),
			require('karma-chrome-launcher'),
			require('karma-jasmine-html-reporter'),
			require('karma-coverage-istanbul-reporter'),
			require('@angular/cli/plugins/karma')
		],
		client: {
			clearContext: false // leave Jasmine Spec Runner output visible in browser
		},
		/** * maximum number of tries a browser will attempt in the case of a disconnection */
		browserDisconnectTolerance: 3,
		/** * How long will Karma wait for a message from a browser before disconnecting from it (in ms). */
		browserNoActivityTimeout: 60 * 1000,
		coverageIstanbulReporter: {
			reports: ['html', 'lcovonly'],
			fixWebpackSourcePaths: true
		},
		angularCli: {
			environment: 'dev'
		},
		reporters: ['progress', 'kjhtml'],
		port: 9876,
		colors: true,
		logLevel: config.LOG_INFO,
		autoWatch: true,
		browsers: [
			'Chrome'
		],
		customLaunchers: {
			ChromeHeadless: { // See https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md
				base: 'Chrome',
				flags: [
					'--no-sandbox',
					'--headless',
					'--disable-gpu',
					'--disable-browser-side-navigation',
					' --remote-debugging-port=9222' // Without a remote debugging port, Google Chrome exits immediately.
				]
			}
		},
		singleRun: false
	});
};
