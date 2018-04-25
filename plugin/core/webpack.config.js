const path = require("path");
const copy = require("copy-webpack-plugin");
const rootPath = path.join(__dirname, "../../");

module.exports = {
	mode: "development", // TODO Choose mode from CLI!
	entry: {
		contentScripts: path.join(__dirname, "./scripts/Content.ts"),
		injectedScripts: path.join(__dirname, "./scripts/Injector.ts"),
		background: path.join(__dirname, "./scripts/Background.ts"),
		updateHandler: path.join(__dirname, "./scripts/InstallUpdateHandler.ts")
	},
	output: {
		path: path.join(rootPath, "dist", "core"),
		filename: "[name].js"
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".css"],
		alias: {
			"fancyboxCss": path.join(__dirname, "./node_modules/fancybox/dist/css/jquery.fancybox.css")
		}
	},
	module: {
		rules: [
			{
				test: /\.ts?$/,
				use: 'ts-loader',
				exclude: [/node_modules/, /\.spec.ts?$/]
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"]
			},
			{
				test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
				loader: "url-loader",
				options: {
					"limit": 10000
				}
			}
		]
	},
	plugins: [
		new copy([
			{
				"from": "./icons",
				"to": "icons"
			}
		])
	]
};
