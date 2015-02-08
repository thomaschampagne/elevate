var fs = require('fs');
var path = require('path');
var nodeCopy;
var EasyZip;

var HOOK_FOLDER = __dirname + '/hook/';
var EXT_FOLDER = HOOK_FOLDER + 'extension/';
var DIST_FOLDER = __dirname + '/dist/';
var BUILD_FOLDER = __dirname + '/builds/';

var action = process.argv.slice(2)[0];

setTimeout(function() {

    if (typeof action === 'undefined' || (action !== 'init' && action !== 'dist' && action !== 'build' && action !== 'clean')) {

        showUsage();

    } else {

        switch (action) {

            case 'init':
                init();
                break;

            case 'dist':
                dist();
                break;

            case 'build':
                build();
                break;

            case 'clean':
                clean(function() {
                    console.log('builds/, dist/ and node_modules/ folders cleaned');
                });
                break;
        }
    }

}.bind(this), 0);

/**
 *
 */
var init = function(callback) {

    var exec = require('child_process').exec;

    var child = exec('npm install', function(error, stdout, stderr) {

        process.chdir(HOOK_FOLDER);

        console.log(stdout);

        if (error !== null) {

            console.log('exec error: ' + error);

        } else {

            process.chdir(EXT_FOLDER);

            exec('npm install', function(error, stdout, stderr) {

                process.chdir('..');

                console.log(stdout);

                if (error !== null) {

                    console.log('exec error: ' + error);

                } else {

                    console.log('Node dependencies are installed.');

                    if (typeof callback !== 'undefined') {
                        callback();
                    }
                }
            }.bind(this));
        }
    }.bind(this));

};


/**
 *
 */
var dist = function(callback) {

    init(function() {

        // Init finish require are now possible
        nodeCopy = require('ncp').ncp;
        EasyZip = require('easy-zip').EasyZip;

        // Clean dist/ folder or create it..
        cleanDistributionFolder();

        console.log('Making distribution folder...');

        var options = {
            filter: function(filenameToCopy) {

                if (filenameToCopy.match('/docs/') ||
                    filenameToCopy.match('/src/') ||
                    filenameToCopy.match('/tests/') ||
                    filenameToCopy.match('/test/') ||
                    filenameToCopy.match('/grunt/') ||
                    filenameToCopy.match('/.*\\.gzip$') ||
                    filenameToCopy.match('/.*\\.md$') ||
                    filenameToCopy.match('/package\\.json') ||
                    filenameToCopy.match('/bower\\.json')) {
                    return false;
                }
                return true;
            }
        }

        // Copy extension/ folder to ../dist/ folder
        nodeCopy(EXT_FOLDER, DIST_FOLDER, options, function(err) {
            if (err) {
                return console.error(err);
            } else {
                console.log('Distribution folder finished. Sources are in dist/');
                if (typeof callback !== 'undefined') {
                    callback();
                }
            }
        });
    });
};


/**
 *
 */
var build = function() {

    dist(function() {

        var buildName = generateBuildName(DIST_FOLDER + '/manifest.json');

        console.log('Creating archive ' + buildName + '...');

        process.chdir(DIST_FOLDER);

        //zip a folder 
        var archiver = new EasyZip();

        archiver.zipFolder('.', function() {

            if (!fs.existsSync(BUILD_FOLDER)) {
                fs.mkdirSync(BUILD_FOLDER);
            }

            archiver.writeToFile(BUILD_FOLDER + '/' + buildName);

            console.log('Build finished in ' + BUILD_FOLDER + buildName);
        });

    });
};


var clean = function (callback) {
    deleteFolderRecursive('node_modules');
    deleteFolderRecursive(EXT_FOLDER + 'node_modules');
    deleteFolderRecursive(DIST_FOLDER);
    deleteFolderRecursive(BUILD_FOLDER);
    callback();
};

/**
 *
 */
var showUsage = function() {
    console.log('Usage:');
    console.log('node ' + path.basename(__filename) + ' <init|dist|build|clean>\r\n');
    console.log('init: Install dependencies');
    console.log('dist: Create distribution folder');
    console.log('build: Create archive of distribution folder');
    console.log('clean: Clean builds/, dist/ and node_modules/ folders');
};


/**
 *  Cleanup distribution directory
 */
var cleanDistributionFolder = function() {

    if (fs.existsSync(DIST_FOLDER)) {
        console.log('Clean distribution folder');
        deleteFolderRecursive(DIST_FOLDER);
        fs.mkdirSync(DIST_FOLDER);
    } else {
        console.log('Create distribution folder');
        fs.mkdirSync(DIST_FOLDER);
    }
}

/**
 *
 */
var deleteFolderRecursive = function(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

/**
 *
 */
var generateBuildName = function(manifestFile) {
    var manifestData = JSON.parse(fs.readFileSync(manifestFile).toString());
    var d = new Date();
    return 'StravaPlus_v' + manifestData.version + '_' + d.toDateString().split(' ').join('_') + '_' + d.toLocaleTimeString().split(':').join('_') + '.zip';
};
