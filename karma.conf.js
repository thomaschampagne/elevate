module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [
            'specs/**/*.spec.ts'
        ],

        exclude: [
            // webapp has separate karma config
            "**/webapp/**"
        ],

        plugins: [
            'karma-webpack',
            'karma-jasmine',
            'karma-chrome-launcher',
            'karma-phantomjs-launcher'
        ],
        preprocessors: {
            '**/*.spec.ts': ['webpack']
        },

        webpack: {
            resolve: {
                extensions: ['.ts']
            },
            module: {
                rules: [
                    {
                        exclude: [/node_modules/],
                        test: /\.ts$/,
                        use: "ts-loader"
                    },
                    {
                        exclude: [/node_modules/],
                        test: /\.json$/,
                        use: 'json-loader'
                    }
                ]
            }
        },
        mime: {
            'text/x-typescript': ['ts', 'tsx']
        },
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['PhantomJS'],
        browserConsoleLogOptions: {
            terminal: false
        },
        singleRun: false,
        concurrency: Infinity
    })
}
