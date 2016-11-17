/// <reference path="../plugin/core/modules/StorageManager.ts" />
/// <reference path="../plugin/core/config/env.ts" />
/// <reference path="../plugin/core/scripts/UserSettings.ts" />
/// <reference path="../plugin/core/scripts/Helper.ts" />
/// <reference path="../plugin/core/scripts/interfaces/ActivityData.ts" />
/// <reference path="../plugin/core/scripts/interfaces/AppResources.ts" />
/// <reference path="../plugin/core/scripts/interfaces/Sync.ts" />
/// <reference path="../plugin/core/scripts/interfaces/ComputeActivityThreadMessage.ts" />
/// <reference path="../plugin/core/scripts/processors/VacuumProcessor.ts" />
/// <reference path="../plugin/core/scripts/processors/ActivityComputer.ts" />
/// <reference path="../plugin/core/scripts/processors/ActivitiesProcessor.ts" />
/// <reference path="../plugin/core/scripts/processors/workers/ComputeAnalysisWorker.ts" />
/// <reference path="../plugin/core/scripts/synchronizer/ActivitiesSynchronizer.ts" />

declare let Strava: any;

// Class declaration for chrome typing
declare class MediaStream {}
declare class MediaStreamConstraints {}
declare class DirectoryEntry {}

declare class QRCode {
    constructor(elementId: string, options: any);
    static CorrectLevel: {
        L: string;
        M: string;
        Q: string;
        H: string;
    }
}

interface JQueryStatic {
    fancybox: (str: any, options?: any) => void;
}

interface Window {
    currentAthlete: any;
    pageView: any; // Allow access of window.pageView where page wiew
    unescape(str: string): string; // Allow access of window.pageView where page wiew
    googleMapsApiLoaded: () => void;
 	__fixtures__: any;
}

interface Math {
    sign: (num: number) => number;
}

interface RegExpConstructor {
    new (pattern: RegExp, flags?: string): RegExp;
    (pattern: RegExp, flags?: string): RegExp;
}

declare class LatLon {
    constructor(lat: number, lon: number);

    lat: number;
    lon: number;

    destinationPoint(distance: number, number: number): LatLon;
}

interface Env {
    preview: boolean;
    analyticsTrackingID: string; // GA ID
    displayUpdatePopup: boolean; // Must be false in release
    debugMode: boolean; // Must be false in release
    useActivityStreamCache: boolean // Must be true in release
}

interface Constants {
    VERSION: string;
    EXTENSION_ID: string;
    OPTIONS_URL: string;
}