module.exports = function (config) {
    config.set({
        browsers: ['PhantomJS'],
        frameworks: ['jasmine'],
        files: [
            'dist/core/config/env.js',
            'dist/core/modules/**/*.js',
            'dist/node_modules/underscore/underscore-min.js',
            'dist/node_modules/q/q.js',
            'dist/node_modules/jquery/dist/jquery.js',
            'dist/core/scripts/modifiers/extendedActivityData/views/AbstractDataView.js',
            'dist/core/scripts/**/*.js',
            'specs/**/*.js',
            'specs/fixtures/**/*.json'
        ],
        exclude: [
            'dist/core/scripts/Background.js',
            'dist/core/scripts/Constants.js',
            'dist/core/scripts/Content.js',
            'dist/core/modules/jquery.appear.js',
            'dist/core/scripts/ReleaseNotes.js'
        ],
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
        singleRun: true
    });
};