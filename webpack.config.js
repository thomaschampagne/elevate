const { SourceMapDevToolPlugin } = require("webpack");
const webappConfig = require("./config/webapp.webpack.config");
const coreConfig = require("./config/core.webpack.config");
const StravistixPackagePlugin = require("./config/stravistix-package-plugin");

module.exports = function (env) {
  if (env && env.dev) {
    const devtool = "cheap-module-source-map";
    webappConfig.devtool = devtool;
    coreConfig.devtool = devtool;
  } else {
    webappConfig.plugins.push(
      new SourceMapDevToolPlugin({
        "filename": "[file].map[query]",
        "moduleFilenameTemplate": "[resource-path]",
        "fallbackModuleFilenameTemplate": "[resource-path]?[hash]",
        "sourceRoot": "webpack:///"
      })
    );

    if (env && env.package) {
      coreConfig.plugins.push(
        new StravistixPackagePlugin({
          sourceDir: "./dist",
          destinationDir: "./package",
          manifestPath: "./dist/manifest.json",
          preview: !!env.preview
        })
      );
    }
  }

  return [webappConfig, coreConfig];
}
