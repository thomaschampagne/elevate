/**
 * * * * * * * * *
 * TASKS GRAPH
 * * * * * * * * *
 * clean        => cleanPackage => cleanDistAll => cleanExtNodeModules
 * cleanAll     => cleanRootNodeModules => clean
 * build        => writeManifest => tsCompile => npmInstall
 * specs        => buildSpecs
 * buildSpecs   => build
 * makeArchive  => build
 * package      => clean => makeArchive
 *
 * * * * * * * * *
 * COMMANDS
 * * * * * * * * *
 * gulp clean
 * gulp build
 * gulp specs
 * gulp package
 */

/**
 * Required node module for running gulp tasks
 */
var fs = require('fs');
var _ = require('underscore');
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var util = require('gulp-util');
var runSequence = require('run-sequence');
var exec = require('child_process').exec;
var options = require('gulp-options');
var ftp = require('vinyl-ftp');
var git = require('gulp-git');
var jeditor = require("gulp-json-editor");
var typeScript = require("gulp-typescript");
var tsProject = typeScript.createProject("tsconfig.json");
var karmaServer = require('karma').Server;

/**
 * Global folder variable
 */
var ROOT_FOLDER = __dirname;
var EXT_FOLDER = ROOT_FOLDER + '/plugin/';
var DIST_FOLDER = ROOT_FOLDER + '/dist/';
var PACKAGE_FOLDER = ROOT_FOLDER + '/package/';
var SPECS_FOLDER = ROOT_FOLDER + '/specs/';
var PACKAGE_NAME = null; // No value at the moment, dynamically set by "package" task
var CURRENT_COMMIT = null;

/**
 * Global folder variable
 */

var PLUGIN_TYPESCRIPT_SCRIPTS = ['plugin/**/*.ts']; // CORE & OPTIONS

var CORE_JAVASCRIPT_SCRIPTS = [
    'plugin/core/config/env.js',
    'plugin/core/modules/*.js',
    'plugin/core/scripts/**/*.js', // This shouldn't copy js files to destination because of TypeScript (No JS files written anymore). Keep it in case of JavaScript files used by the way.
    'plugin/node_modules/geodesy/dms.js',
    'plugin/node_modules/geodesy/latlon-spherical.js',
    'plugin/node_modules/chart.js/dist/Chart.bundle.js',
    'plugin/node_modules/qrcode-js-package/qrcode.min.js',
    'plugin/node_modules/fancybox/dist/js/jquery.fancybox.pack.js',
    'plugin/node_modules/underscore/underscore-min.js',
    'plugin/node_modules/jquery/dist/jquery.js',
];

var CORE_STYLESHEETS = [
    'plugin/node_modules/fancybox/dist/css/jquery.fancybox.css',
    'plugin/core/css/core.css'
];

var MANIFEST = ['plugin/manifest.json'];

var CORE_RESOURCES = [
    'plugin/core/icons/*',
    'plugin/node_modules/fancybox/dist/img/*.*',
];

var OPTIONS_FILES = [
    'plugin/node_modules/angular-material/angular-material.css',
    'plugin/node_modules/angular-material-icons/angular-material-icons.css',
    'plugin/node_modules/angular-material-data-table/dist/md-data-table.min.css',
    'plugin/node_modules/nvd3/build/nv.d3.min.css',
    'plugin/node_modules/angular/angular.js',
    'plugin/node_modules/angular-route/angular-route.js',
    'plugin/node_modules/angular-sanitize/angular-sanitize.js',
    'plugin/node_modules/angular-animate/angular-animate.js',
    'plugin/node_modules/angular-aria/angular-aria.js',
    'plugin/node_modules/angular-messages/angular-messages.js',
    'plugin/node_modules/angular-material/angular-material.js',
    'plugin/node_modules/angular-material-icons/angular-material-icons.js',
    'plugin/node_modules/angular-material-data-table/dist/md-data-table.min.js',
    'plugin/node_modules/q/q.js',
    'plugin/node_modules/d3/d3.js',
    'plugin/node_modules/nvd3/build/nv.d3.min.js',
    'plugin/node_modules/angular-nvd3/dist/angular-nvd3.min.js',
    'plugin/node_modules/moment/moment.js',
    'plugin/node_modules/angular-moment/angular-moment.js',
    'plugin/node_modules/file-saver/FileSaver.min.js',
    'plugin/options/**/*',
    '!plugin/options/**/*.ts' // Do not copy TypeScripts script using "!". They are compiled to JS files which are already copied to destination folder. (@see PLUGIN_TYPESCRIPT_SCRIPTS var)
];

/**
 * Gulp Tasks
 */
gulp.task('tsCompile', ['npmInstall'], function () { // Compile Typescript and copy them to DIST_FOLDER

    util.log('Start TypeScript compilation... then copy files to destination folder.');

    return gulp.src(PLUGIN_TYPESCRIPT_SCRIPTS, {
        base: 'plugin/'
    }).pipe(typeScript(tsProject)).pipe(gulp.dest(DIST_FOLDER));

});


gulp.task('writeManifest', ['tsCompile'], function (done) {

    // Handle manifest file, if preview mode or not... if preview then: version name change to short sha1 HEAD commit and version = 0
    if (options.has('preview')) {

        util.log('Generating preview build.');

        git.revParse({
            args: '--short HEAD',
            quiet: true
        }, function (err, sha1Short) {

            if (err) {
                throw new Error(err);
            }

            CURRENT_COMMIT = sha1Short

            gulp.src(MANIFEST, {
                base: 'plugin/'
            }).pipe(jeditor({
                'version': '0',
                'version_name': 'preview@' + sha1Short
            })).pipe(gulp.dest(DIST_FOLDER)).on('end', function () {
                util.log('HEAD commit short sha1 is: ' + sha1Short + '. Version name will be: preview@' + sha1Short);
                done();
            });
        });

    } else {

        gulp.src(MANIFEST, {
            base: 'plugin/'
        }).pipe(gulp.dest(DIST_FOLDER)).on('end', function () {
            done();
        });
    }
});

gulp.task('build', ['writeManifest'], function () {

    util.log('Building destination folder with others files: core js scripts, stylesheets, common resources, options files');

    return gulp.src(_.union(CORE_JAVASCRIPT_SCRIPTS, CORE_STYLESHEETS, CORE_RESOURCES, OPTIONS_FILES), {
        base: 'plugin/'
    }).pipe(gulp.dest(DIST_FOLDER));

});

gulp.task('npmInstall', function (initDone) {

    util.log('Installing extension NPM dependencies');

    // Switch to ./plugin folder
    process.chdir(EXT_FOLDER);

    exec('npm install', function (error, stdout, stderr) {

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

            // Switch back to ./plugin/core/../.. aka "root" folder
            process.chdir(ROOT_FOLDER);
            initDone();
        }
    });
});

gulp.task('makeArchive', ['build'], function () {

    var version;

    if (options.has('preview')) {
        version = options.get('preview') ? options.get('preview') : (CURRENT_COMMIT) ? CURRENT_COMMIT : 'preview';
    } else {
        version = 'v' + JSON.parse(fs.readFileSync(DIST_FOLDER + '/manifest.json')).version
    }

    PACKAGE_NAME = 'stravistix_' + version + '_' + (new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '.')) + '.zip';

    util.log('Now creating package archive: ' + PACKAGE_NAME);

    return gulp.src(DIST_FOLDER + '/**')
        .pipe(plugins.zip(PACKAGE_NAME))
        .pipe(gulp.dest(PACKAGE_FOLDER));

});

gulp.task('buildSpecs', ['build'], function () {

    util.log('Compile TypeScript specs to JS for Karma testing');

    return gulp.src([SPECS_FOLDER + '/**/*.ts'], {
        base: './'
    }).pipe(typeScript(tsProject)).pipe(gulp.dest('./'));

});

gulp.task('specs', ['buildSpecs'], function () {
    util.log('Running jasmine tests through Karma server');
    new karmaServer({
        configFile: __dirname + '/karma.conf.js'
    }, function (hasError) {

        if (!hasError) {
            util.log('Cleaning compiled JS files inside ' + SPECS_FOLDER + ' folder');
            return gulp.src([
                SPECS_FOLDER + '/**/*.js'
            ]).pipe(plugins.clean({
                force: true
            }));
        } else {
            process.exit(1);
        }

    }).start();
});

gulp.task('cleanDistAll', function () {

    util.log('Cleaning dist/ folder completly');
    return gulp.src(DIST_FOLDER)
        .pipe(plugins.clean({
            force: true
        }));
});

gulp.task('cleanPackage', ['cleanDistAll'], function () {
    util.log('Cleaning package/ folder');
    return gulp.src(PACKAGE_FOLDER).pipe(plugins.clean({
        force: true
    }));
});

gulp.task('cleanExtNodeModules', ['cleanDistAll'], function () {

    util.log('Cleaning extension node_modules/ folder');

    return gulp.src('plugin/node_modules/')
        .pipe(plugins.clean({
            force: true
        }));
});

gulp.task('cleanRootNodeModules', ['clean'], function () {

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
gulp.task('package', function (done) {
    runSequence('clean', 'makeArchive', function () {
        done();
    });
});

gulp.task('watch', function () {
    gulp.watch([
        'plugin/**/*',
        '!plugin/node_modules/**/*',
    ], ['build']);
});

// Clean dist/, package/, plugin/core/node_modules/
gulp.task('clean', ['cleanPackage']);
gulp.task('cleanAll', ['cleanRootNodeModules']);

// FTP publish
gulp.task('ftpPublish', ['package'], function () {

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
