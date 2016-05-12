var gulp = require('gulp-param')(require('gulp'), process.argv);
var plugins = require('gulp-load-plugins')();
var util = require('gulp-util');
var exec = require('child_process').exec;


var HOOK_FOLDER = './hook/';
var EXT_FOLDER = HOOK_FOLDER + 'extension/';
var DIST_FOLDER = './dist/';
var BUILD_FOLDER = './builds/';

var scripts = [
    'hook/extension/config/env.js',
    'hook/extension/modules/*.js',
    'hook/extension/node_modules/chart.js/Chart.min.js',
    'hook/extension/node_modules/fiber/src/fiber.min.js',
    'hook/extension/node_modules/fancybox/dist/js/jquery.fancybox.pack.js',
    'hook/extension/modules/*.js',
    'hook/extension/js/**/*.js'
];

var styles = [
    'hook/extension/node_modules/fancybox/dist/css/jquery.fancybox.css',
    'hook/extension/css/extendedData.css'
];

var resources = [
    'hook/extension/manifest.json',
    'hook/extension/icons/*',
    'hook/extension/node_modules/fancybox/dist/img/*.*',
];

gulp.task('extension', function(prod) {

    gulp.src(scripts, {
            base: 'hook/extension'
        })
        // .pipe(plugins.concat('script.js'))
        // .pipe(plugins.if(prod, plugins.uglify()))
        .pipe(gulp.dest(DIST_FOLDER));

    gulp.src(styles, {
            base: 'hook/extension'
        })
        // .pipe(plugins.less())
        // .pipe(plugins.csscomb())
        // .pipe(plugins.concat('style/main.css'))
        // .pipe(plugins.if(prod, plugins.cleanCss()))
        .pipe(gulp.dest(DIST_FOLDER));

    return gulp.src(resources, {
            base: 'hook/extension'
        })
        .pipe(gulp.dest(DIST_FOLDER));

});


/**
 * Option page
 */
gulp.task('options', function(prod) {

    // External files
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

    // Options files
    return gulp.src('hook/extension/options/**/*.*', {
            base: 'hook/extension'
        })
        .pipe(gulp.dest(DIST_FOLDER));
});

/**
 * Init task
 */
gulp.task('init', function() {

    util.log('Installing extension NPM dependencies');

    process.chdir(EXT_FOLDER);

    var child = exec('npm install', function(error, stdout, stderr) {

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
        }
    });
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

gulp.task('cleanNodeModules', ['cleanDist'], function() {

    util.log('Cleaning extension node_modules/ folder');

    return gulp.src('hook/extension/node_modules/')
        .pipe(plugins.clean({
            force: true
        }));
});

/**
 * Defining tasks
 */
gulp.task('default', ['init']);

gulp.task('clean', ['cleanDist', 'cleanNodeModules']);

gulp.task('build', ['extension', 'options']);

gulp.task('archive', ['build', 'makeZip']);

gulp.task('watch', function() {
    gulp.watch('hook/extension/**/*', ['build']);
});

// Usage:
// npm install
// gulp init
// gulp build
// gulp watch
// gulp archive




// Old Usage:
// gulp dist               # Create dist/ and move files to dist/ folder (default task)
// gulp archive            # create archive of dist/ folder
// gulp clean              # clean...
// gulp watch              # watch ext sources and move changes to dist/
