declare let Strava: any;

declare let follow: any; // variable for Google Analytics

interface JQueryStatic {
    fancybox: (str: any, options?: any) => void;
}

interface Window {
    currentAthlete: any;
    pageView: any; // Allow access of window.pageView where page wiew
    googleMapsApiLoaded: () => void;

	unescape(str: string): string; // Allow access of window.pageView where page wiew
    __stravistix_bridge__: any; // Used to pass data through the window object with a king of "bridge"
    __fixtures__: any;
}

declare class LatLon {
    constructor(lat: number, lon: number);

    public lat: number;
    public lon: number;

    public destinationPoint(distance: number, number: number): LatLon;
}
