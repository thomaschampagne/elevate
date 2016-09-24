module.exports = function (config) {
    config.set({
        browsers: ['Chrome'],
        frameworks: ['jasmine'],
        files: [
            'dist/js/processors/*.js',
            'specsDist/**/*.js'
        ],
        singleRun: true
    });
};
