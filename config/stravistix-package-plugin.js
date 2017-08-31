const fs = require("fs");
const exec = require("child_process").exec;
const zipFolder = require("zip-folder");
const moment = require("moment");

module.exports = StravistixPackagePlugin;

function StravistixPackagePlugin(options) {
  if (!options || !options.sourceDir || !options.destinationDir || !options.manifestPath) {
    throw Error("options should be object which contains sourceDir destinationDir and manifestPath properties");
  }
  this.options = options;
}

StravistixPackagePlugin.prototype.apply = function (compiler) {
  const options = this.options;

  compiler.plugin("done", (stats) => {

    if (!fs.existsSync(options.destinationDir)) {
      fs.mkdirSync(options.destinationDir);
    }

    if (options.preview) {
      getGitShortSha1((sha1) => {
        const versionName = sha1;
        modifyManifest(options.manifestPath, sha1, () => {
          saveZipFile(options.sourceDir, options.destinationDir, versionName);
        });
      });
    } else {
      const versionName = getVersionFromManifest(options.manifestPath);
      saveZipFile(options.sourceDir, options.destinationDir, versionName);
    }
  });
}

/**
 * get short version of HEAD sha1 hash
 * @param {function} callback (shortSha1) => {...}
 */
function getGitShortSha1(callback) {
  exec("git rev-parse --short HEAD", (error, stdout) => {
    if (error) {
      throw error;
    }
    callback(stdout.trim());
  });
}

/**
 * get current plugin version from manifest
 * @param {string} manifestPath path to manifest.json file
 */
function getVersionFromManifest(manifestPath) {
  return `v${JSON.parse(fs.readFileSync(manifestPath)).version}`;
}

/**
 * modify manifest version
 * @param {string} manifestPath manifest.json path
 * @param {string} shortSha1 short sha1 hash
 * @param {function} callback notify about modify manifest file finish
 */
function modifyManifest(manifestPath, shortSha1, callback) {
  fs.readFile(manifestPath, "utf8", (err, fileContent) => {
    if (err) {
      throw err;
    }

    const versionName = `preview@${shortSha1}`;

    const manifestJson = JSON.parse(fileContent);

    manifestJson.version = "0";
    manifestJson.version_name = versionName;

    const updatedManifest = JSON.stringify(manifestJson, null, 2)

    fs.writeFile(manifestPath, updatedManifest, callback);
  });
}

/**
 * Create zip archive base on source directory
 * @param {string} sourceDir source directory
 * @param {string} destinationDir destination directory
 * @param {string} versionName version name
 */
function saveZipFile(sourceDir, destinationDir, versionName) {
  const currentDateString = moment().format("YYYY-MM-DD_hh.mm.ss");
  const archiveName = `stravistix_${versionName}_${currentDateString}.zip`;

  zipFolder(sourceDir, `${destinationDir}/${archiveName}`, (err) => {
    if (err) {
      throw err;
    }
  });
}
