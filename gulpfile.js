/**
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * COMMANDS
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * gulp clean       // Clean dist/ folder & *.js *.map compiled sources
 * gulp build       // Generate dist/ folder. Use it for development
 * gulp specs       // Run unit tests & integration tests
 * gulp package     // Create .zip packaged archive to be published
 * gulp wipe        // Remove All generated files
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * TASKS GRAPH
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * clean       : cleanPackage => cleanDistAll => cleanInlineSources
 * build       : writeManifest => tsCompileToDist
 * specs       : tscCommand
 * makeArchive : build
 * package     : clean => makeArchive
 * wipe        : cleanRootNodeModules => cleanExtNodeModules => cleanPackage
 *
 */

/**
 * Required node module for running gulp tasks
 */
let fs = require("fs");
let exec = require("child_process").exec;
let _ = require("lodash");
let gulp = require("gulp");
let plugins = require("gulp-load-plugins")();
let util = require("gulp-util");
let runSequence = require("run-sequence");
let options = require("gulp-options");
let git = require("gulp-git");
let jeditor = require("gulp-json-editor");
let typeScript = require("gulp-typescript");
let karmaServer = require("karma").Server;

/**
 * Global folder variable
 */
let ROOT_FOLDER = __dirname;
let DIST_FOLDER = ROOT_FOLDER + "/dist/";
let PACKAGE_FOLDER = ROOT_FOLDER + "/package/";
let PACKAGE_NAME = null; // No value at the moment, dynamically set by "package" task
let CURRENT_COMMIT = null;

/**
 * Global folder variable
 */
let COMMON_JAVASCRIPT_SCRIPTS = ["plugin/common/**/*.js"];

let CORE_JAVASCRIPT_SCRIPTS = [
    "plugin/core/config/env.js",
    "plugin/core/modules/*.js",
    "plugin/core/scripts/**/*.js", // This shouldn"t copy js files to destination because of TypeScript (No JS files written anymore). Keep it in case of JavaScript files used by the way.

    // Added core SystemJS
    "plugin/node_modules/systemjs/dist/system.js",
    "plugin/node_modules/systemjs-plugin-css/css.js",

    "plugin/node_modules/geodesy/dms.js",
    "plugin/node_modules/geodesy/latlon-spherical.js",
    "plugin/node_modules/chart.js/dist/Chart.bundle.js",
    "plugin/node_modules/qrcode-js-package/qrcode.min.js",
    "plugin/node_modules/fancybox/dist/js/jquery.fancybox.pack.js",
    "plugin/node_modules/lodash/lodash.min.js",
    "plugin/node_modules/jquery/dist/jquery.js"
];

let CORE_STYLESHEETS = [
    "plugin/node_modules/fancybox/dist/css/jquery.fancybox.css",
    "plugin/core/css/core.css"
];

let MANIFEST = ["plugin/manifest.json"];

let CORE_RESOURCES = [
    "plugin/core/icons/*",
    "plugin/node_modules/fancybox/dist/img/*.*",
];

let OPTIONS_FILES = [
    "plugin/node_modules/angular-material/angular-material.css",
    "plugin/node_modules/angular-material-icons/angular-material-icons.css",
    "plugin/node_modules/angular-material-data-table/dist/md-data-table.min.css",
    "plugin/node_modules/nvd3/build/nv.d3.min.css",
    "plugin/node_modules/angular/angular.js",
    "plugin/node_modules/angular-route/angular-route.js",
    "plugin/node_modules/angular-sanitize/angular-sanitize.js",
    "plugin/node_modules/angular-animate/angular-animate.js",
    "plugin/node_modules/angular-aria/angular-aria.js",
    "plugin/node_modules/angular-messages/angular-messages.js",
    "plugin/node_modules/angular-material/angular-material.js",
    "plugin/node_modules/angular-material-icons/angular-material-icons.js",
    "plugin/node_modules/angular-material-data-table/dist/md-data-table.min.js",
    "plugin/node_modules/q/q.js",
    "plugin/node_modules/d3/d3.js",
    "plugin/node_modules/nvd3/build/nv.d3.min.js",
    "plugin/node_modules/angular-nvd3/dist/angular-nvd3.min.js",
    "plugin/node_modules/moment/moment.js",
    "plugin/node_modules/file-saver/FileSaver.min.js",

    "plugin/options/**/*",
    "!plugin/options/**/*.ts" // Do not copy TypeScripts script using "!". They are compiled to JS files which are already copied to destination folder. (@see PLUGIN_TYPESCRIPT_SCRIPTS var)
];

let INLINE_SOURCES = [
    "plugin/common/**/*.js",
    "plugin/common/**/*.map",
    "plugin/core/**/*.js",
    "plugin/core/**/*.map",
    "plugin/options/app/**/*.js",
    "plugin/options/app/**/*.map",
    "specs/**/*.map",
    "specs/**/*.js"
];

/**
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Gulp helper functions
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */

function execTypeScriptCommand(cmdDone, esTarget) {

    let command = "tsc" + ((esTarget) ? " --target " + esTarget : "");

    util.log("Running TypeScript command \'" + command + "\"");

    exec(command, (error, stdout, stderr) => {
        if (error) {
            util.log(error);
            util.log(stderr);
        } else {
            cmdDone();
        }
    });
}

/**
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Gulp Tasks
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
gulp.task("tsCompileToDist", () => { // Compile Typescript and copy them to DIST_FOLDER
    util.log("Start Remote TypeScript compilation... Compiled files will be copied to \"dest/\" folder.");
    let tsProject = typeScript.createProject("tsconfig.json", {rootDir: "plugin/"});
    return tsProject.src().pipe(tsProject()).pipe(gulp.dest(DIST_FOLDER));

});

gulp.task("tscCommand", (cmdDone) => { // Compile Typescript then copy js/map files next to .ts files
    util.log("Start Local TypeScript compilation (with command \"tsc\")... Compiled files will be copied next to .ts files");
    execTypeScriptCommand(cmdDone);
});

gulp.task("writeManifest", ["tsCompileToDist"], (done) => {

    // Handle manifest file, if preview mode or not... if preview then: version name change to short sha1 HEAD commit and version = 0
    if (options.has("preview")) {

        util.log("Generating preview build.");

        git.revParse({
            args: "--short HEAD",
            quiet: true
        }, (err, sha1Short) => {

            if (err) {
                throw new Error(err);
            }

            CURRENT_COMMIT = sha1Short;

            gulp.src(MANIFEST, {
                base: "plugin/"
            }).pipe(jeditor({
                "version": "0",
                "version_name": "preview@" + sha1Short
            })).pipe(gulp.dest(DIST_FOLDER)).on("end", () => {
                util.log("HEAD commit short sha1 is: " + sha1Short + ". Version name will be: preview@" + sha1Short);
                done();
            });
        });

    } else {

        gulp.src(MANIFEST, {
            base: "plugin/"
        }).pipe(gulp.dest(DIST_FOLDER)).on("end", () => {
            done();
        });
    }
});

gulp.task("build", ["writeManifest"], () => {

    util.log("Building destination folder with others files: core js scripts, stylesheets, common resources, options files");

    return gulp.src(_.union(COMMON_JAVASCRIPT_SCRIPTS, CORE_JAVASCRIPT_SCRIPTS, CORE_STYLESHEETS, CORE_RESOURCES, OPTIONS_FILES), {
        base: "plugin/"
    }).pipe(gulp.dest(DIST_FOLDER));

});

gulp.task("makeArchive", ["build"], () => {

    let version;

    if (options.has("preview")) {
        version = options.get("preview") ? options.get("preview") : (CURRENT_COMMIT) ? CURRENT_COMMIT : "preview";
    } else {
        version = "v" + JSON.parse(fs.readFileSync(DIST_FOLDER + "/manifest.json")).version
    }

    PACKAGE_NAME = "stravistix_" + version + "_" + (new Date().toISOString().replace(/T/, "_").replace(/\..+/, "").replace(/:/g, ".")) + ".zip";

    util.log("Now creating package archive: " + PACKAGE_NAME);

    return gulp.src(DIST_FOLDER + "/**")
        .pipe(plugins.zip(PACKAGE_NAME))
        .pipe(gulp.dest(PACKAGE_FOLDER));

});

gulp.task("specs", ["cleanInlineSources"], () => {

    execTypeScriptCommand(() => {

        util.log("Running jasmine tests through Karma server");
        new karmaServer({
            configFile: __dirname + "/karma.conf.js"
        }, (hasError) => {
            if (!hasError) {
            } else {
                process.exit(1);
            }
        }).start();

    });
});

gulp.task("cleanInlineSources", () => {
    util.log("Cleaning plugin/**/[*.js|*.map] compiled sources");
    return gulp.src(INLINE_SOURCES).pipe(plugins.clean({force: true}));
});

gulp.task("cleanDistAll", ["cleanInlineSources"], () => {
    util.log("Cleaning dist/ folder completly");
    return gulp.src(DIST_FOLDER)
        .pipe(plugins.clean({
            force: true
        }));
});

gulp.task("cleanPackage", ["cleanDistAll"], () => {
    util.log("Cleaning package/ folder");
    return gulp.src(PACKAGE_FOLDER).pipe(plugins.clean({
        force: true
    }));
});

gulp.task("cleanExtNodeModules", ["cleanDistAll"], () => {
    util.log("Cleaning extension node_modules/ folder");
    return gulp.src("plugin/node_modules/")
        .pipe(plugins.clean({
            force: true
        }));
});

gulp.task("cleanRootNodeModules", ["clean"], () => {
    util.log("Cleaning root extension node_modules/ folder");
    return gulp.src("node_modules/")
        .pipe(plugins.clean({
            force: true
        }));
});

// Do init install and build to dist/
gulp.task("default", ["build"]);

// Result in a zip file into builds/
gulp.task("package", (done) => {
    runSequence("clean", "makeArchive", () => {
        done();
    });
});

gulp.task("watch", () => {
    util.log("Watching local sources and generate build to \"dist/\" folder");
    gulp.watch([
        "plugin/**/*",
        "!plugin/node_modules/**/*",
    ], ["build"]);
});

// Clean dist/, package/, plugin/core/node_modules/
gulp.task("clean", ["cleanPackage"]);
gulp.task("wipe", ["cleanRootNodeModules", "cleanExtNodeModules", "cleanPackage"]);