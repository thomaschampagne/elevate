const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    contentScripts: path.join(__dirname, 'plugin/core/scripts/Content.ts'),
    injectedScripts: path.join(__dirname, 'plugin/core/scripts/ScriptsInjector.ts'),
    background: path.join(__dirname, 'plugin/common/scripts/Background.ts'),
    updateHandler: path.join(__dirname, 'plugin/core/scripts/InstallUpdateHandler.ts')
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  // devtool: 'inline-source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.css'],
    alias: {
      fancyboxCss: path.join(__dirname, 'node_modules/fancybox/dist/css/jquery.fancybox.css')
    }
  },
  module: {
    loaders: [
      {
        exclude: [/node_modules/, /\.spec.tsx?$/],
        test: /\.tsx?$/,
        loader: 'ts-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }
    ]
  },
  plugins: [
    // copy assets
    new CopyWebpackPlugin([
      {
        from: 'plugin/core/icons',
        to: 'core/icons'
      }, {
        from: 'plugin/manifest.json'
      }
    ]),
    new webpack.ProvidePlugin({
      'jQuery': 'jquery',
      '$': 'jquery'
    }),
    // new webpack.optimize.UglifyJsPlugin({
    //   sourceMap: true
    // })
  ]
};
