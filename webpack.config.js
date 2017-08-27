const webappConfig = require('./config/webapp.webpack.config');
const coreConfig = require('./config/core.webpack.config');

module.exports = function (env) {
  if (env.dev) {
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
  }

  return [webappConfig, coreConfig];
}
