module.exports = function (config) {
    config.set({
        browsers: ['PhantomJS'],
        frameworks: ['jasmine'],
        files: [
            'dist/js/processors/*.js',
            'specsDist/**/*.js'
        ],
        singleRun: true
    });
};
