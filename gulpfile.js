var gulp = require('gulp-param')(require('gulp'), process.argv);
var plugins = require('gulp-load-plugins')();
var gutil = require('gulp-util');

var SRC = './src/';
var DIST = './dist/';

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
        .pipe(gulp.dest(DIST));

    gulp.src(styles, {
            base: 'hook/extension'
        })
        // .pipe(plugins.less())
        // .pipe(plugins.csscomb())
        // .pipe(plugins.concat('style/main.css'))
        // .pipe(plugins.if(prod, plugins.cleanCss()))
        .pipe(gulp.dest(DIST));

    return gulp.src(resources, {
            base: 'hook/extension'
        })
        .pipe(gulp.dest(DIST));

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
    }).pipe(gulp.dest(DIST));

    // Options files
    return gulp.src('hook/extension/options/**/*.*', {
            base: 'hook/extension'
        })
        .pipe(gulp.dest(DIST));
});

/**
 * Cleaning task
 */
gulp.task('clean', function() {
    return gulp.src(DIST)
        .pipe(plugins.clean({
            force: true
        }));
});

// Defining tasks
gulp.task('build', ['extension', 'options']);
// gulp.task('build', ['scripts', 'styles' , 'resources' ]);
gulp.task('default', ['build']);
