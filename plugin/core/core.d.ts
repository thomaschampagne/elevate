declare let Strava: any;

declare let follow: any; // variable for Google Analytics

declare module "fancybox";

interface JQueryStatic {
	fancybox: (str: any, options?: any) => void;
	force_appear: () => any;
}

interface JQuery {
	appear: () => any;
}

interface Window {
	currentAthlete: any;
	pageView: any; // Allow access of window.pageView where page wiew
	googleMapsApiLoaded: () => void;

	unescape(str: string): string; // Allow access of window.pageView where page wiew
	__stravistix_bridge__: any; // Used to pass data through the window object with a king of "bridge"
	__fixtures__: any;
}
