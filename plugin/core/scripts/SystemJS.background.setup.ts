SystemJS.config({
	baseURL: "chrome-extension://" + chrome.runtime.id + "/",
	paths: {
		"npm:": "core/node_modules/",
	},
	packages: {
		"shared/": {
			format: "cjs",
		},
		"core": {
			format: "cjs",
		},
	},
	map: {
		q: "npm:q/q.js",
		lodash: "npm:lodash/lodash.min.js",
	},
});

SystemJS.import("core/scripts/Background.js").then(() => {
	console.debug("Background module loaded by SystemJS");
}, (err) => {
	console.error(err);
});
