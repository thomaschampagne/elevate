SystemJS.config({
    baseURL: 'chrome-extension://' + chrome.runtime.id + '/',
    paths: {
        'npm:': 'node_modules/',
    },
    packages: {
        'core': {
            format: 'cjs'
        }
    },
    map: {
        'underscore': 'npm:underscore/underscore-min.js',
    }
});

SystemJS.import('core/scripts/Content.js').then(null, console.error.bind(console));