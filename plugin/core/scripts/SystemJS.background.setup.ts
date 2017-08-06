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
        q: "npm:q/q.js",
    },
});

SystemJS.import("common/scripts/Background.js").then(() => {
    console.debug("Background module loaded by SystemJS");
}, (err) => {
    console.error(err);
});
