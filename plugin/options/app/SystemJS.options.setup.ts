/* Configure SystemJS for option app */
SystemJS.config({
    baseURL: "chrome-extension://" + chrome.runtime.id + "/",
    paths: {
        "pluginRoot:": "../../",
        "npm:": "../../node_modules/",
    },
    packages: {
        "./": {
            format: "cjs",
        },
        "pluginRoot:common/": {
            format: "cjs",
        },
        "pluginRoot:core/": {
            format: "cjs",
        },
    },
    map: {

        /* JS Dependencies */
        "css": "npm:systemjs-plugin-css/css.js",
        "angular": "npm:angular/angular.js",
        "ngRoute": "npm:angular-route/angular-route.js",
        "ngSanitize": "npm:angular-sanitize/angular-sanitize.js",
        "ngAnimate": "npm:angular-animate/angular-animate.js",
        "ngAria": "npm:angular-aria/angular-aria.js",
        "ngMaterial": "npm:angular-material/angular-material.js",
        "angular-material-icons": "npm:angular-material-icons/angular-material-icons.js",
        "md.data.table": "npm:angular-material-data-table/dist/md-data-table.min.js",
        "d3": "npm:d3/d3.js",
        "nvd3": "npm:angular-nvd3/dist/angular-nvd3.min.js", //angular-nvd3
        "nvd3-core": "npm:nvd3/build/nv.d3.min.js",
        "moment": "npm:moment/moment.js",
        "lodash": "npm:lodash/lodash.min.js",
        "file-saver": "npm:file-saver/FileSaver.min.js",
        "q": "npm:q/q.js",

        /* Styles */
        "app.css": "./styles/app.css",
        "angular-material.css": "npm:angular-material/angular-material.css",
        "angular-material-icons.css": "npm:angular-material-icons/angular-material-icons.css",
        "angular-material-data-table.css": "npm:angular-material-data-table/dist/md-data-table.min.css",
        "nvd3.css": "npm:nvd3/build/nv.d3.min.css",
    },
    meta: {

        /* JS Dependencies loading method */
        "angular": {
            format: "global",
            exports: "angular",
        },
        "nvd3": { // angular-nvd3
            format: "global",
            deps: ["nvd3-core"],
        },
        "nvd3-core": { // nvd3
            format: "global",
            deps: ["d3"],
        },
        "file-saver": {
            format: "cjs",
        },
        "moment": {
            format: "global",
            exports: "moment",
        },

        /* Styles loading method */
        "app.css": {loader: "css"},
        "angular-material.css": {loader: "css"},
        "angular-material-icons.css": {loader: "css"},
        "angular-material-data-table.css": {loader: "css"},
        "nvd3.css": {loader: "css"},
    },
});

/* Now load with SystemJS */
try {

    Promise.all([

        SystemJS.import("app.css"),
        SystemJS.import("angular-material.css"),
        SystemJS.import("angular-material-icons.css"),
        SystemJS.import("angular-material-data-table.css"),
        SystemJS.import("nvd3.css"),

    ]).then(() => {

        /* CSS imported */
        return SystemJS.import("./App.js");

    }, (err) => {

        throw err;

    }).then(() => {

        /* App.js imported */
        return angular.bootstrap(document, ["App"]);

    }, (err) => {

        throw err;

    }).then(() => {

        /* Angular is bootstrapped */

        // Now show "body" (or #App) html element which has been "display: none;" by DOM on page load
        document.getElementById("App").style.display = "block";

    }, (err) => {

        throw err;

    });

} catch (err) {

    console.error(err);

}
