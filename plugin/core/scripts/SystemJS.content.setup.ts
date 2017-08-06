SystemJS.config({
    baseURL: "chrome-extension://" + chrome.runtime.id + "/",
    paths: {
        "npm:": "node_modules/",
    },
    packages: {
        "common/": {
            format: "cjs",
        },
        "core": {
            format: "cjs",
        },
    },
    map: {
        lodash: "npm:lodash/lodash.min.js",
    },
    lodash: {
        format: "cjs",
    },
});

SystemJS.import("core/scripts/Content.js").then(null, console.error.bind(console));
