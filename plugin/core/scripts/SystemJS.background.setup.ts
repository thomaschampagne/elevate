SystemJS.config({
    baseURL: "chrome-extension://" + chrome.runtime.id + "/",
    paths: {
        "npm:": "node_modules/",
    },
    packages: {
        core: {
            format: "cjs",
        },
    },
    map: {
        q: "npm:q/q.js",
    },
});

SystemJS.import("core/scripts/Background.js").then(() => {
    console.debug("Background module loaded by SystemJS");
}, (err) => {
    console.error(err);
});
