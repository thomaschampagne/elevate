declare const Strava: any;
declare const d3: any;

declare module "fancybox";

interface JQueryStatic {
  fancybox: (str: any, options?: any) => void;
  force_appear: () => any;
}

interface JQuery {
  appear: () => any;
}

interface Window {
  jQuery: any;
  $: any;
  fancybox: any;
  currentAthlete: any;
  pageView: any; // Allow access of window.pageView where page wiew
  googleMapsApiLoaded: () => void;
  __elevate_bridge__: any; // Used to pass data through the window object with a king of "bridge"
  unescape(str: string): string; // Allow access of window.pageView where page wiew
}
