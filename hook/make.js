var extensionSource = 'extension';
var distDirectory = 'dist';
var buildDirectory = 'builds';
var fs;
var ncp;
var EasyZip;


// Installing node module for hook, then for extension, next launch dist/build process
console.log('Installing node dependencies...');
var exec = require('child_process').exec;
var child = exec('npm install', function(error, stdout, stderr) {
    
    console.log(stdout);

    if (error !== null) {

        console.log('exec error: ' + error);

    } else {

        process.chdir(extensionSource);

        exec('npm install', function(error, stdout, stderr) {

            process.chdir('..');

            console.log(stdout);

            console.log('Node dependencies installed.');

            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                fs = require('fs');
                ncp = require('ncp').ncp;
                EasyZip = require('easy-zip').EasyZip;

                // Launching make build
                setTimeout(function() {
                    make();
                }, 0);
            }
        });
    }
});

var make = function() {

    cleanDistributionFolder();

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

            // console.log('Copying file <' + filenameToCopy + '>');

            return true;
        }
    }

    console.log('Create distribution structure');

    ncp(extensionSource, distDirectory, options, function(err) {
        if (err) {
            return console.error(err);
        } else {
            try {
                var buildName = generateBuildName(distDirectory + '/manifest.json');
                var buildDirectoryFromDistDirectory = '../' + buildDirectory;

                // Switch to distDirectory
                process.chdir(distDirectory);

                //zip a folder 
                var archiver = new EasyZip();

                console.log('Making build into ' + buildDirectory + '/' + buildName);

                // Make Archive
                archiver.zipFolder('.', function() {

                    if (!fs.existsSync(buildDirectoryFromDistDirectory)) {
                        fs.mkdirSync(buildDirectoryFromDistDirectory);
                    }

                    archiver.writeToFile(buildDirectoryFromDistDirectory + '/' + buildName);

                    console.log('Build finished');
                });

            } catch (err) {
                console.error('chdir: ' + err);
            }
        }
    });
}

// Cleanup distribution directory
var cleanDistributionFolder = function() {

    console.log('Clean distribution folder');

    if (fs.existsSync(distDirectory)) {
        deleteFolderRecursive(distDirectory);
        fs.mkdirSync(distDirectory);
    } else {
        fs.mkdirSync(distDirectory);
    }
}

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

var generateBuildName = function(manifestFile) {
    var manifestData = JSON.parse(fs.readFileSync(manifestFile).toString());
    var d = new Date();
    return 'StravaPlus_v' + manifestData.version + '_' + d.toDateString().split(' ').join('_') + '_' + d.toLocaleTimeString().split(':').join('_') + '.zip';
};
