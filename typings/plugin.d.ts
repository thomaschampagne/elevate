/// <reference path="../hook/extension/config/env.ts" />
/// <reference path="../hook/extension/js/UserSettings.ts" />
/// <reference path="../hook/extension/js/Helper.ts" />
/// <reference path="../hook/extension/js/interfaces/ActivityData.ts" />
/// <reference path="../hook/extension/js/processors/VacuumProcessor.ts" />
/// <reference path="../hook/extension/js/processors/ActivityComputer.ts" />

declare let Strava: any;

// Class declaration for chrome typing
declare class MediaStream {}
declare class MediaStreamConstraints {}
declare class DirectoryEntry {}

interface JQueryStatic {
    fancybox: (str: any) => void;
}

interface Window {
    currentAthlete: any;
    pageView: any; // Allow access of window.pageView where page wiew
    unescape(str: string): string; // Allow access of window.pageView where page wiew
    __mocks__: any;
}

interface RegExpConstructor {
    new (pattern: RegExp, flags?: string): RegExp;
    (pattern: RegExp, flags?: string): RegExp;
}

declare class LatLon {
    constructor(lat: number, lon: number);
    lat(): number;
    lon(): number;
    boundingBox(number: number): Array<number>;
}

interface Env {
    preview: boolean;
    analyticsTrackingID: string; // GA ID
    forceUpdated: boolean; // Must be false in release
    debugMode: boolean; // Must be false in release
    useActivityStreamCache: boolean // Must be true in release
}

interface Constants {
    VERSION: string;
    EXTENSION_ID: string;
    OPTIONS_URL: string;
}