module.exports = function (config) {
    config.set({
        basePath: './',
        browsers: ['PhantomJS', /* Chrome , 'ChromeCanary'*/],
        frameworks: ['systemjs', 'jasmine', 'promise'],
        plugins: [
            'karma-jasmine',
            'karma-systemjs',
            'karma-promise',
            'karma-phantomjs-launcher',
            'karma-chrome-launcher',
            'karma-json-fixtures-preprocessor'
        ],
        phantomjsLauncher: {
            exitOnResourceError: true  // Have phantomjs exit if a ResourceError is encountered (useful if karma exits without killing phantom)
        },
        files: [
            'plugin/node_modules/q/q.js',
            'plugin/node_modules/jquery/dist/jquery.js',
            'plugin/node_modules/lodash/lodash.min.js',
            'plugin/node_modules/chart.js/dist/Chart.bundle.js',
            'plugin/node_modules/d3/d3.js',
            'plugin/node_modules/file-saver/FileSaver.min.js',
            'plugin/node_modules/qrcode/build/qrcode.min.js',
            'plugin/common/**/*.js',
            'plugin/core/**/*.js',
            'specs/**/*.js',
            'specs/fixtures/**/*.json'

        ],
        exclude: [
            'plugin/common/scripts/Background.js',
            'plugin/core/scripts/SystemJS.*.js',
            'plugin/core/scripts/InstallUpdateHandler.js',
            'plugin/core/scripts/interfaces/*.js',
            'plugin/core/scripts/Content.js',
            'plugin/core/modules/jquery.appear.js'
        ],
        systemjs: {
            serveFiles: [
                '**/*.map'
            ], // Patterns for files that you want Karma to make available, but not loaded until a module requests them. eg. Third-party libraries.
            config: { // SystemJS configuration
                packages: {
                    'plugin/common/': {
                        format: 'cjs'
                    },
                    'plugin/core/': {
                        format: 'cjs'
                    },
                    'specs/': {
                        format: 'cjs'
                    }
                },
                paths: {
                    'traceur': './node_modules/traceur/dist/commonjs/traceur.js', // karma-systemjs required
                    'systemjs': './node_modules/systemjs/dist/system.js', // karma-systemjs required
                    'npm@plugin:': './base/plugin/node_modules/'
                },
                map: {
                    'q': 'npm@plugin:q/q.js',
                    'jquery': 'npm@plugin:jquery/dist/jquery.js',
                    'lodash': 'npm@plugin:lodash/lodash.min.js',
                    'chart.js': 'npm@plugin:chart.js/dist/Chart.bundle.js',
                    'd3': 'npm@plugin:d3/d3.js',
                    "qrcode": "npm@plugin:qrcode/build/qrcode.min.js",
                    'file-saver': 'npm@plugin:file-saver/FileSaver.min.js'
                }
            }
        },
        preprocessors: {
            'specs/fixtures/**/*.json': ['json_fixtures']
        },
        jsonFixturesPreprocessor: {
            // strip this from the file path \ fixture name
            stripPrefix: 'specs/',
            // strip this to the file path \ fixture name
            prependPrefix: '',
            // change the global fixtures variable name
            variableName: '__fixtures__',
            // camelize fixture filenames (e.g 'fixtures/aa-bb_cc.json' becames __fixtures__['fixtures/aaBbCc'])
            camelizeFilenames: true,
            // transform the filename
            transformPath: function (path) {
                return path + '.js';
            }
        },
        colors: true,
        singleRun: true,
        browserConsoleLogOptions: {
            // path: './specs.log',
            terminal: false
        }
    });
};