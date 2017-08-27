const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const basepath = path.join(__dirname, "..")

module.exports = {
  "entry": {
    "contentScripts": path.join(basepath, "plugin/core/scripts/Content.ts"),
    "injectedScripts": path.join(basepath, "plugin/core/scripts/ScriptsInjector.ts"),
    "background": path.join(basepath, "plugin/common/scripts/Background.ts"),
    "updateHandler": path.join(basepath, "plugin/core/scripts/InstallUpdateHandler.ts")
  },
  output: {
    "path": path.join(basepath, "dist", "core"),
    "filename": "[name].js"
  },
  resolve: {
    "extensions": [".ts", ".tsx", ".js", ".css"],
    "alias": {
      "fancyboxCss": path.join(__dirname, "../node_modules/fancybox/dist/css/jquery.fancybox.css")
    }
  },
  "module": {
    "loaders": [
      {
        "exclude": [/node_modules/, /\.spec.ts?$/],
        "test": /\.ts?$/,
        "loader": "ts-loader"
      },
      {
        "test": /\.css$/,
        "use": ["style-loader", "css-loader"]
      },
      {
        "test": /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        "loader": "url-loader",
        "options": {
          "limit": 10000
        }
      }
    ]
  },
  "plugins": [
    // copy plugin assets
    new CopyWebpackPlugin([
      {
        "from": "plugin/core/icons",
        "to": "icons"
      }, {
        "from": "plugin/manifest.json",
        "to": "../manifest.json"
      }
    ])
  ]
};
