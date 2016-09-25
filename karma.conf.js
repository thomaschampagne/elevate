module.exports = function (config) {
    config.set({
        browsers: ['PhantomJS'],
        frameworks: ['jasmine'],
        files: [
            'dist/config/env.js',
            'dist/modules/**/*.js',
            'dist/js/modifiers/extendedActivityData/views/AbstractDataView.js',
            'dist/js/**/*.js',
            'specsDist/**/*.js'
        ],
        exclude: [
            'dist/js/Background.js',
            'dist/js/Constants.js',
            'dist/js/Content.js',
            'dist/modules/jquery.appear.js',
            'dist/js/ReleaseNotes.js'
        ],
        singleRun: true
    });
};
