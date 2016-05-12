/**
 * Required node module for running gulp tasks
 */
var fs = require('fs');
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var util = require('gulp-util');
var exec = require('child_process').exec;

/**
 * Global folder variable
 */
var ROOT_FOLDER = __dirname;
var HOOK_FOLDER = ROOT_FOLDER + '/hook/';
var EXT_FOLDER = HOOK_FOLDER + '/extension/';
var DIST_FOLDER = ROOT_FOLDER + '/dist/';
var RELEASE_FOLDER = ROOT_FOLDER + '/release/';

/**
 * Global folder variable
 */
var EXT_SCRIPTS = [
    'hook/extension/config/env.js',
    'hook/extension/modules/*.js',
    'hook/extension/node_modules/chart.js/Chart.min.js',
    'hook/extension/node_modules/fiber/src/fiber.min.js',
    'hook/extension/node_modules/fancybox/dist/js/jquery.fancybox.pack.js',
    'hook/extension/modules/*.js',
    'hook/extension/js/**/*.js'
];

var EXT_STYLESHEETS = [
    'hook/extension/node_modules/fancybox/dist/css/jquery.fancybox.css',
    'hook/extension/css/extendedData.css'
];

var EXT_RESSOURCES = [
    'hook/extension/manifest.json',
    'hook/extension/icons/*',
    'hook/extension/node_modules/fancybox/dist/img/*.*',
];

/**
 * Gulp Tasks
 */
gulp.task('build', ['installExtNpmDependencies'], function() {


    util.log('Start extension core and options files copy');

    /**
     * Extension core
     */
    gulp.src(EXT_SCRIPTS, {
            base: 'hook/extension'
        })
        .pipe(gulp.dest(DIST_FOLDER));

    gulp.src(EXT_STYLESHEETS, {
            base: 'hook/extension'
        })
        .pipe(gulp.dest(DIST_FOLDER));


    gulp.src(EXT_RESSOURCES, {
            base: 'hook/extension'
        })
        .pipe(gulp.dest(DIST_FOLDER));


    /**
     * Options
     */

    gulp.src([
        'hook/extension/node_modules/bootstrap/dist/**/*.*',
        'hook/extension/node_modules/angular/angular.min.js',
        'hook/extension/node_modules/angular-route/angular-route.min.js',
        'hook/extension/node_modules/angular-bootstrap/ui-bootstrap.min.js',
        'hook/extension/node_modules/angular-bootstrap/ui-bootstrap-tpls.min.js',
        'hook/extension/node_modules/underscore/underscore-min.js'
    ], {
        base: 'hook/extension'
    }).pipe(gulp.dest(DIST_FOLDER));

    return gulp.src("hook/extension/options/**/*.*", {
            base: 'hook/extension'
        })
        .pipe(gulp.dest(DIST_FOLDER));

});

/**
 * Init task
 */
gulp.task('installExtNpmDependencies', function(initDone) {

    util.log('Installing extension NPM dependencies');

    process.chdir(EXT_FOLDER);

    exec('npm install', function(error, stdout, stderr) {

        if (error) {
            util.log(error);
            util.log(stderr);
        } else {
            if (stdout) {
                util.log(stdout);
                util.log('Install done.');
            } else {
                util.log('Nothing to install');
            }
            util.log('You can develop into "hook/extension/" folder.');
            util.log('Use "hook/extension/" as unpacked extension folder.');
            util.log('Or... use "dist/" as unpacked extension folder. You will have to execute "gulp build" command before.');
            util.log('Note: "gulp watch" command will automatically trigger "gulp build" command on a file change event.');
            util.log('Done.');
            process.chdir(ROOT_FOLDER); // Go back to root folder !
            initDone();
        }
    });
});

/**
 * Archiving
 */
gulp.task('makeArchive', ['build'], function() {

    util.log('Now creating release archive');

    var generateReleaseName = function(manifestFile) {
        var manifestData = JSON.parse(fs.readFileSync(manifestFile).toString());
        var d = new Date();
        return 'StravistiX_v' + manifestData.version + '_' + d.toDateString().split(' ').join('_') + '_' + d.toLocaleTimeString().split(':').join('_') + '.zip';
    };

    var buildName = generateReleaseName(DIST_FOLDER + '/manifest.json');

    return gulp.src(DIST_FOLDER + '/**')
        .pipe(plugins.zip(buildName))
        .pipe(gulp.dest(RELEASE_FOLDER));

});


/**
 * Cleaning task
 */
gulp.task('cleanDist', function() {

    util.log('Cleaning dist/ folder');
    return gulp.src(DIST_FOLDER)
        .pipe(plugins.clean({
            force: true
        }));
});

gulp.task('cleanBuilds', function() {

    util.log('Cleaning dist/ folder');
    return gulp.src(RELEASE_FOLDER)
        .pipe(plugins.clean({
            force: true
        }));
});

gulp.task('cleanExtNodeModules', ['cleanDist'], function() {

    util.log('Cleaning extension node_modules/ folder');

    return gulp.src('hook/extension/node_modules/')
        .pipe(plugins.clean({
            force: true
        }));
});

gulp.task('cleanRootNodeModules', ['cleanDist'], function() {

    util.log('Cleaning root extension node_modules/ folder');

    return gulp.src('node_modules/')
        .pipe(plugins.clean({
            force: true
        }));
});

/**
 * Defining tasks
 */
// Do init install and build to dist/
gulp.task('default', ['build']);

// Result in a zip file into builds/
gulp.task('release', ['clean', 'makeArchive']);

gulp.task('watch', function() {
    gulp.watch('hook/extension/**/*', ['build']);
});

// Clean dist/, release/, hook/extension/node_modules/
gulp.task('clean', ['cleanBuilds', 'cleanDist', 'cleanExtNodeModules']);

gulp.task('cleanAll', ['clean', 'cleanRootNodeModules']);
