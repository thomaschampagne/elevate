const path = require("path");
const copy = require("copy-webpack-plugin");

module.exports = (env, argv) => {
	return {
		mode: "development",
		entry: {
			content: path.join(__dirname, "./scripts/content.ts"),
			boot: path.join(__dirname, "./scripts/boot.ts"),
			background: path.join(__dirname, "./scripts/background.ts"),
			installer: path.join(__dirname, "./scripts/installer.ts")
		},
		output: {
			path: path.join(__dirname, "dist", "extension"),
			filename: '[name].bundle.js',
			chunkFilename: '[name].bundle.js'
		},
		resolve: {
			extensions: [".ts", ".js", ".css"],
			alias: {
				"fancyboxCss": path.join(__dirname, "./node_modules/fancybox/dist/css/jquery.fancybox.css")
			}
		},
		module: {
			noParse: /lodash/,
			rules: [
				{
					test: /\.ts?$/,
					use: {
						loader: "ts-loader",
						options: {
							configFile: "tsconfig.json"
						}
					},
					exclude: [/node_modules/, /specs/, /\.spec.ts?$/]
				},
				{
					test: /\.css$/,
					use: ["style-loader", "css-loader"]
				},
				{
					test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
					loader: "url-loader",
					options: {
						limit: 10000
					}
				}
			]
		},
		plugins: [
			new copy([
				{
					from: "./icons",
					to: "icons"
				}
			])
		],
		performance: {
			hints: (argv.mode === "production") ? false : "warning"
		}
	};
};
