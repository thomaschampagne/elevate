module.exports = function (config) {
    config.set({
        browsers: ['PhantomJS'],
        frameworks: ['jasmine'],
        files: [
            'dist/config/env.js',
            'dist/modules/**/*.js',
            'dist/node_modules/underscore/underscore-min.js',
            'dist/js/modifiers/extendedActivityData/views/AbstractDataView.js',
            'dist/js/**/*.js',
            'specs/**/*.js',
            'specs/fixtures/**/*.json'
        ],
        exclude: [
            'dist/js/Background.js',
            'dist/js/Constants.js',
            'dist/js/Content.js',
            'dist/modules/jquery.appear.js',
            'dist/js/ReleaseNotes.js'
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
