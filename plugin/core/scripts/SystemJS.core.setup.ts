const _coreConfig: ICoreConfig = {
    systemJsConfig: {
        baseURL: null, // SystemJS baseURL is set on "startCoreEvent" event handling through "CoreSetup.listenForStartCoreEvent()"
        paths: {
            "npm:": "node_modules/",
            "modules:": "core/modules/",
        },
        packages: {
            "common/": {
                format: "cjs",
            },
            "core": {
                format: "cjs",
            },
            "npm:geodesy": {
                format: "cjs",
            },
        },
        map: {

            /* Npm Modules */
            "css": "npm:systemjs-plugin-css/css.js",
            "chart.js": "npm:chart.js/dist/Chart.bundle.js",
            "d3": "npm:d3/d3.js",
            "q": "npm:q/q.js",
            "jquery": "npm:jquery/dist/jquery.js",
            "dms": "npm:geodesy/dms.js",
            "sphericalLatLon": "npm:geodesy/latlon-spherical.js",
            "lodash": "npm:lodash/lodash.min.js",
            "fancybox": "npm:fancybox/dist/js/jquery.fancybox.pack.js",
            "qrcode": "npm:qrcode/build/qrcode.min.js",
            "file-saver": "npm:file-saver/FileSaver.min.js",

            /* Custom modules */
            "jqueryAppear": "modules:jquery.appear.js",

            /* Styles */
            "fancybox.css": "npm:fancybox/dist/css/jquery.fancybox.css",
            "core.css": "core/css/core.css",
        },
        meta: {
            "fancybox.css": {
                loader: "css",
            },
            "core.css": {
                loader: "css",
            },
            "sphericalLatLon": {
                exports: "LatLon",
                format: "global",
            },
            "file-saver": {
                format: "cjs",
            },
            "lodash": {
                format: "cjs",
            },
            "d3": {
                format: "cjs",
            },
        },
    },
    requiredNonEsModules: [ // Required non ES modules into the core
        "jqueryAppear",
        "fancybox",
        "sphericalLatLon",
    ],
    requiredCss: [
        "fancybox.css",
        "core.css",
    ],
};

interface ICoreConfig {
    systemJsConfig: SystemJSLoader.Config;
    requiredNonEsModules: string[];
    requiredCss: string[];
}

class CoreSetup {

    public static startCoreEvent: string = "startCoreEvent"; // Same than Content.startCoreEvent

    protected coreConfig: ICoreConfig;

    constructor(config: ICoreConfig) {

        this.coreConfig = {
            systemJsConfig: null,
            requiredNonEsModules: null,
            requiredCss: null,
        };
        this.coreConfig.systemJsConfig = config.systemJsConfig;
        this.coreConfig.requiredNonEsModules = config.requiredNonEsModules;
        this.coreConfig.requiredCss = config.requiredCss;
    }

    public init(): void {
        this.listenForStartCoreEvent();
    }

    protected setupSystemJsConfig(extensionId: string) {
        this.coreConfig.systemJsConfig.baseURL = "chrome-extension://" + extensionId + "/";
        SystemJS.config(this.coreConfig.systemJsConfig);
    }

    protected listenForStartCoreEvent(): void {

        //Listen for the event
        addEventListener(CoreSetup.startCoreEvent, (eventReceived: any) => {

            const startCoreData /*: IStartCoreData*/ = eventReceived.detail;

            this.setupSystemJsConfig(startCoreData.constants.EXTENSION_ID);

            const requiredNonEsModulesPromises: Array<Promise<any>> = Array<Promise<any>>();

            for (let i: number = 0; i < this.coreConfig.requiredNonEsModules.length; i++) {
                requiredNonEsModulesPromises.push(SystemJS.import(this.coreConfig.requiredNonEsModules[i]));
            }

            const requiredCssPromises: Array<Promise<any>> = Array<Promise<any>>();

            for (let i: number = 0; i < this.coreConfig.requiredCss.length; i++) {
                requiredCssPromises.push(SystemJS.import(this.coreConfig.requiredCss[i]));
            }

            // Load required non ES modules into the core
            Promise.all(requiredNonEsModulesPromises).then(() => {

                return Promise.all(requiredCssPromises);

            }, (err) => {

                console.error(err);

            }).then(() => {

                return SystemJS.import("common/scripts/Constants.js");

            }, (err) => {
                console.error(err);

            }).then((module) => {

                module.constants = startCoreData.constants;
                return SystemJS.import("core/scripts/StravistiX.js");

            }, (err) => {
                console.error(err);

            }).then((module) => {

                new module.StravistiX(startCoreData.chromeSettings, startCoreData.appResources);

            }, (err) => {
                console.error(err);
            });

        }, false);

    }
}

let setup: CoreSetup = new CoreSetup(_coreConfig);
setup.init(); // Let's go !
