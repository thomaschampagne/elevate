const fs = require("fs");
const moment = require("moment");
const { SourceMapDevToolPlugin } = require("webpack");
const webappConfig = require("./config/webapp.webpack.config");
const coreConfig = require("./config/core.webpack.config");
const WebpackZipPlugin = require("webpack-zip-plugin");

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

    if (env && env.archive) {
      const version = JSON.parse(fs.readFileSync("./plugin/manifest.json")).version;
      const currentDateString = moment().format("YYYY-MM-DD_hh.mm.ss");

      const archiveName = `stravistix_${version}_${currentDateString}.zip`;
      coreConfig.plugins.push(
        new WebpackZipPlugin({
          initialFile: "./dist",
          endPath: "./package",
          zipName: archiveName
        })
      );
    }
  }

  return [webappConfig, coreConfig];
}
