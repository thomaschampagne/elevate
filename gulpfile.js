/**
 * * * * * * * * *
 * TASKS GRAPH
 * * * * * * * * *
 * clean        => cleanPackage => cleanDistAll => cleanExtNodeModules
 * cleanAll     => cleanPackage => cleanDistAll => cleanExtNodeModules => cleanRootNodeModules
 * build        => cleanDistSrcOnly => installExtNpmDependencies
 * makeArchive  => build
 * package      => clean => makeArchive
 *
 * * * * * * * * *
 * COMMANDS
 * * * * * * * * *
 * gulp clean
 * gulp build [--debug, --release] // Options no handled at the moment
 * gulp package [--debug, --release] // Options no handled at the moment
 */

/**
 * Required node module for running gulp tasks
 */
var fs = require('fs');
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var util = require('gulp-util');
var exec = require('child_process').exec;
var options = require('gulp-options');
var ftp = require('vinyl-ftp');
var git = require('gulp-git');
var jeditor = require("gulp-json-editor");

/**
 * Global folder variable
 */
var ROOT_FOLDER = __dirname;
var HOOK_FOLDER = ROOT_FOLDER + '/hook/';
var EXT_FOLDER = HOOK_FOLDER + '/extension/';
var DIST_FOLDER = ROOT_FOLDER + '/dist/';
var PACKAGE_FOLDER = ROOT_FOLDER + '/package/';
var PACKAGE_NAME = null; // No value at the moment, dynamically set by "package" task

/**
 * Global folder variable
 */
var EXT_SCRIPTS = [
    'hook/extension/config/env.js',
    'hook/extension/modules/*.js',
    'hook/extension/node_modules/chart.js/dist/Chart.bundle.js',
    'hook/extension/node_modules/fiber/src/fiber.min.js',
    'hook/extension/node_modules/qrcode-js-package/qrcode.min.js',
    'hook/extension/node_modules/fancybox/dist/js/jquery.fancybox.pack.js',
    'hook/extension/modules/*.js',
    'hook/extension/js/**/*.js'
];

var EXT_STYLESHEETS = [
    'hook/extension/node_modules/fancybox/dist/css/jquery.fancybox.css',
    'hook/extension/css/extendedData.css'
];

var MANIFEST = 'hook/extension/manifest.json';

var EXT_RESSOURCES = [
    'hook/extension/icons/*',
    'hook/extension/node_modules/fancybox/dist/img/*.*',
];

var OPT_FILES = [
    'hook/extension/node_modules/angular-material/angular-material.css',
    'hook/extension/node_modules/angular-material-icons/angular-material-icons.css',
    'hook/extension/node_modules/angular/angular.js',
    'hook/extension/node_modules/angular-route/angular-route.js',
    'hook/extension/node_modules/angular-sanitize/angular-sanitize.js',
    'hook/extension/node_modules/angular-animate/angular-animate.js',
    'hook/extension/node_modules/angular-aria/angular-aria.js',
    'hook/extension/node_modules/angular-messages/angular-messages.js',
    'hook/extension/node_modules/angular-material/angular-material.js',
    'hook/extension/node_modules/angular-material-icons/angular-material-icons.js',
    'hook/extension/node_modules/underscore/underscore-min.js',
    'hook/extension/options/**/*'
];

/**
 * Detect DEBUG & REALEASE MODES
 */
/*
var RELEASE_MODE = (options.has('release')) ? true : false;

var DEBUG_MODE = !RELEASE_MODE;

if (RELEASE_MODE) {
    util.log('RELEASE MODE ENABLED.');
}
if (DEBUG_MODE) {
    util.log('DEBUG MODE ENABLED.');
}
*/
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
        // .pipe(plugins.if(RELEASE_MODE, plugins.concat('script.js'))) // Concat if release
        // .pipe(plugins.if(RELEASE_MODE, gulp.dest(DIST_FOLDER + '/js/'), gulp.dest(DIST_FOLDER)));
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
     * Handle manifest file, if preview mode or not... if preview then: version name change to short sha1 HEAD commit and version = 0
     */
    if (options.has('preview')) {

        util.log('Preview mode...');

        git.revParse({
            args: '--short HEAD',
            quiet: true
        }, function(err, sha1Short) {

            if (err) {
                throw new Error(err);
            }

            gulp.src(MANIFEST, {
                    base: 'hook/extension'
                })
                .pipe(jeditor({
                    'version': '0',
                    'version_name': 'preview@' + sha1Short
                }))
                .pipe(gulp.dest(DIST_FOLDER));

            util.log('HEAD commit short sha1 is: ' + sha1Short);
        });
    } else {
        gulp.src(MANIFEST, {
                base: 'hook/extension'
            })
            .pipe(gulp.dest(DIST_FOLDER));
    }

    /**
     * Options JS and Css Mixed
     */
    return gulp.src(OPT_FILES, {
            base: 'hook/extension'
        })
        .pipe(gulp.dest(DIST_FOLDER));
});

/**
 * Init task
 */
gulp.task('installExtNpmDependencies', function(initDone) {

    util.log('Installing extension NPM dependencies');

    // Switch to ./hook/extension folder
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

            util.log('Use generated "dist/" folder as chrome unpacked extension folder. You will have to execute "gulp build" command before. Helper: "gulp watch" command will automatically trigger "gulp build" command on a file change event.');

            // Switch back to ./hook/extension/../.. aka "root" folder
            process.chdir(ROOT_FOLDER);
            initDone();
        }
    });
});

/**
 * Archiving
 */
gulp.task('makeArchive', ['build'], function() {

    PACKAGE_NAME = 'stravistix_v' + JSON.parse(fs.readFileSync(DIST_FOLDER + '/manifest.json')).version + '_' + (new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '.')) + '.zip';

    util.log('Now creating package archive: ' + PACKAGE_NAME);

    return gulp.src(DIST_FOLDER + '/**')
        .pipe(plugins.zip(PACKAGE_NAME))
        .pipe(gulp.dest(PACKAGE_FOLDER));

});

/**
 * Cleaning task
 */
gulp.task('cleanDistSrcOnly', function() {

    util.log('Cleaning dist/ folder, except dist/node_modules folder');
    return gulp.src([
            DIST_FOLDER + '/*',
            '!' + DIST_FOLDER + '/node_modules/',
        ])
        .pipe(plugins.clean({
            force: true
        }));
});

gulp.task('cleanDistAll', function() {

    util.log('Cleaning dist/ folder completly');
    return gulp.src(DIST_FOLDER)
        .pipe(plugins.clean({
            force: true
        }));
});

gulp.task('cleanPackage', function() {

    util.log('Cleaning package/ folder');
    return gulp.src(PACKAGE_FOLDER)
        .pipe(plugins.clean({
            force: true
        }));
});

gulp.task('cleanExtNodeModules', ['cleanDistAll'], function() {

    util.log('Cleaning extension node_modules/ folder');

    return gulp.src('hook/extension/node_modules/')
        .pipe(plugins.clean({
            force: true
        }));
});

gulp.task('cleanRootNodeModules', ['cleanDistAll'], function() {

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
gulp.task('package', ['clean', 'makeArchive']);

gulp.task('watch', function() {
    gulp.watch([
        'hook/extension/**/*',
        '!hook/extension/node_modules/**/*',
    ], ['cleanDistSrcOnly', 'build']);
});

// Clean dist/, package/, hook/extension/node_modules/
gulp.task('clean', ['cleanPackage', 'cleanDistAll', 'cleanExtNodeModules']);
gulp.task('cleanAll', ['clean', 'cleanRootNodeModules']);

// FTP publish
gulp.task('ftpPublish', ['package'], function() {

    if (PACKAGE_NAME) {

        util.log('FTP Publish of ' + PACKAGE_NAME);

        var ftpConfig = {
            host: 'yours',
            user: 'yours',
            pass: 'yours',
            remotePath: '/'
        };

        if (!options.has('env') && !options.has('json')) {

            throw new Error('Make sure to specify option "--json" or "--env"');

        } else if (options.has('json')) {

            if (fs.existsSync('./ftpConfig.json')) {
                util.log('Using ftp config from ./ftpConfig.json file');
                ftpConfig = JSON.parse(fs.readFileSync('./ftpConfig.json'));
            } else {
                throw new Error('Make sure to create ./ftpConfig.json with following config: ' + JSON.stringify(ftpConfig));
            }

        } else if (options.has('env')) {

            if (process.env.FTP_HOST && process.env.FTP_USER && process.env.FTP_PASSWORD) {
                ftpConfig.host = process.env.FTP_HOST;
                ftpConfig.user = process.env.FTP_USER;
                ftpConfig.pass = process.env.FTP_PASSWORD;
                ftpConfig.remotePath = process.env.FTP_REMOTE_PATH;
            } else {
                throw new Error('Missing FTP_HOST, FTP_USER or FTP_PASSWORD environnment variables. FTP_REMOTE_PATH can be also specified.');
            }
        }

        util.log('FTP Upload in progress...');

        var globs = [PACKAGE_FOLDER + '/' + PACKAGE_NAME];

        var conn = ftp.create({
            host: ftpConfig.host,
            user: ftpConfig.user,
            password: ftpConfig.pass,
            log: util.log
        });

        return gulp.src(globs, {
            base: './package/',
            buffer: false
        }).pipe(conn.dest(ftpConfig.remotePath));

    } else {
        throw new Error('No package name found. Unable to publish');
    }
});
