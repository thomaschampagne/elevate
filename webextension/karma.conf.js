// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html
const defaultBrowserKarmaConfig = {
  browsers: ["HeadlessChrome"],
  customLaunchers: {
    HeadlessChrome: {
      base: "Chromium",
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
  const customBrowsersKarmaConfigPath = __dirname + "/browsers.karma.conf.js";

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
    frameworks: ["jasmine", "promise"],
    reporters: ["progress", "spec"],
    plugins: ["karma-webpack", "karma-jasmine", "karma-promise", "karma-chrome-launcher", "karma-spec-reporter"],
    browsers: browsersKarmaConfig.browsers,
    customLaunchers: browsersKarmaConfig.customLaunchers,
    files: ["specs/**/*.spec.ts"],
    preprocessors: {
      "**/*.spec.ts": ["webpack"]
    },
    webpack: {
      mode: "development",
      resolve: {
        extensions: [".ts", ".js"]
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
      maxLogLines: 5, // limit number of lines logged per test
      suppressErrorSummary: false, // do not print error summary
      suppressFailed: false, // do not print information about failed tests
      suppressPassed: false, // do not print information about passed tests
      suppressSkipped: true, // do not print information about skipped tests
      showSpecTiming: true, // print the time elapsed for each spec
      failFast: false // test would finish with error when a first fail occurs.
    },
    autoWatch: true,
    colors: true,
    singleRun: false,
    browserConsoleLogOptions: {
      // path: "./specs.log",
      terminal: false
    }
  });
};
