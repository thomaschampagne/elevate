import * as _ from "lodash";
import { UserSettingsModel } from "../../../common/scripts/models/UserSettings";
import { IAppResources } from "../interfaces/IAppResources";

export class GoogleMapsModifier implements IModifier {

    protected activityId: number;
    protected appResources: IAppResources;
	protected userSettings: UserSettingsModel;
    protected pathArray: number[][];
    protected map: google.maps.Map;

	constructor(activityId: number, appResources: IAppResources, userSettings: UserSettingsModel) {
        this.activityId = activityId;
        this.appResources = appResources;
        this.userSettings = userSettings;
    }

    public modify(): void {

        // Skip modify if analysis section is watched
        if (this.isAnalysisSection()) {
            console.log("[GoogleMapsModifier] Skipping Analysis Section");
            return;
        }

        // Next load the Google API from external
        this.getGoogleMapsApi();

        this.googleMapsApiLoaded(this.activityId);

        // If segment Item has been clicked then fetch info on segment and display
        /*
         let self = this;
         $('[data-segment-effort-id]').click(function() {
         let effortIdClicked = $(this).attr('data-segment-effort-id');
         self.fetchSegmentInfoAndDisplayWithGoogleMap(self.pathArray, effortIdClicked);
         });
         */
    }

    protected googleMapsApiLoaded(activityId: number): boolean {

        // Place the gmaps buttons
        this.placeGoogleMapsButtons(activityId);

        // Handle case when user overview button
        // If user click left overview button then reload gmap buttons placement
		$("[data-menu=\"overview\"]").click(() => {

            // Execute at the end with set timeout
            setTimeout(() => {
                // Place the gmaps buttons
                this.placeGoogleMapsButtons(activityId);

            });

        });

        // If user click left segment button (running ie) then reload gmap buttons placement
		$("[data-menu=\"segments\"]").click(() => {

            // Execute at the end with set timeout
            setTimeout(() => {
                this.placeGoogleMapsButtons(activityId); // Place the gmaps buttons
            });
        });

        return true;

    }

    protected showWaitLoadingMessage(): void {
		$.fancybox("<div style=\"text-align: center; padding-top: 15px;\"><img src=\"" + this.appResources.loadingIcon + "\"/></div>", {
            autoScale: true,
            closeBtn: false,
        });
    }

    protected placeGoogleMapsButtons(activityId: number): void {

        // Place show button over MapBox activity main map
        this.placeMainGoogleMapButton(activityId);

        // PLACE SEGMENT AREA BUTTON 'View in Google Maps'
        this.placeSegmentAreaGoogleMapButton(activityId);
    }

    protected placeMainGoogleMapButton(activityId: number): void {

        // Do not add Main Google Map Button if native strava map not displayed
        if (!$("#map-canvas") || $("#map-canvas").is(":hidden") || $("#showInGoogleMap").length) {
            return;
        }

		$("#map-canvas").before("<a class=\"button btn-block btn-primary\" id=\"showInGoogleMap\">View in Google Maps</a>").each(() => {

            $("#showInGoogleMap").on("click", () => {

                // Show loading message while loading gmaps and path
                this.showWaitLoadingMessage();

                this.fetchPathFromStream(activityId, (pathArray: number[][]) => {

                    this.pathArray = pathArray;

                    // Check if effort id is given
                    const effortId: number = this.getEffortId();

                    if (effortId) {
                        this.fetchSegmentInfoAndDisplayWithGoogleMap(this.pathArray, effortId);
                    } else {
                        this.displayGoogleMapWithPath(this.pathArray);
                    }

                });

            });

        });
    }

    protected placeSegmentAreaGoogleMapButton(activityId: number): void {

        // Listening for Segment Change visualization
        if (!Strava.Labs) return;

        const view: any = Strava.Labs.Activities.SegmentLeaderboardView;

        if (!view) return;

        const functionRender: Function = view.prototype.render;

        const that = this;

		view.prototype.render = function () {

            const r: any = functionRender.apply(this, Array.prototype.slice.call(arguments));

            // Button already existing, skiping...
            if ($("#showSegInGoogleMap").length) {
                return;
            }

            let anchor: JQuery;

            if ($(".effort-map")) { // Try to attach segment button to effort map if cycling activity
                anchor = $(".effort-map");
            } else if ($("#map-canvas")) { // Try to attach segment button to map canvas if running activity
                anchor = $("#map-canvas");
            } else {
                anchor = null;
            }

            if (!anchor) {
                console.error("No anchor found to attach segment google map button");
            }

			anchor.before("<a class=\"button btn-block btn-primary\" id=\"showSegInGoogleMap\">View in Google Maps</a>").each(() => {

                $("#showSegInGoogleMap").on("click", () => {

                    that.showWaitLoadingMessage();

                    that.fetchPathFromStream(activityId, (pathArray: number[][]) => {

                        that.pathArray = pathArray;

                        // Check if effort id is given
                        const effortId: number = that.getEffortId();

                        if (effortId) {
                            that.fetchSegmentInfoAndDisplayWithGoogleMap(that.pathArray, effortId);
                        } else {
                            console.error("Cannot display map: effortId not given");
                        }
                    });
                });
            });

            return r;
        };
    }

    public getEffortId(): number {
        return parseInt(window.location.pathname.split("/")[4] || window.location.hash.replace("#", "")) || null;
    }

    public isAnalysisSection(): boolean {
        return !_.isEmpty(window.location.pathname.match("analysis"));
    }

    protected fetchPathFromStream(activityId: number, callback: (pathArray: number[][]) => void): void {
        const streamPathUrl: string = "/activities/" + activityId + "/streams?stream_types[]=latlng";
        $.ajax({
            url: streamPathUrl,
            dataType: "json",
        }).done((jsonResponse: any) => {
            callback(jsonResponse.latlng);
        });
    }

    protected fetchSegmentInfoFromEffortId(effortId: number, callback: (segmentInfoResponse: any) => void): void {

        let segmentInfoResponse: any;

        $.ajax({
            url: "/segment_efforts/" + effortId,
            type: "GET",
            beforeSend: (xhr: JQueryXHR) => {
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            },
            dataType: "json",
            success: (xhrResponseText: string) => {
                segmentInfoResponse = xhrResponseText;
            },
            error: (err: JQueryXHR) => {
                console.error(err);
            },
        }).then(() => {

            // Call Activity Processor with bounds
            if (!segmentInfoResponse.start_index && segmentInfoResponse.end_index) {
                console.error("No start_index end_index found for");
            }
            callback(segmentInfoResponse);
        });
    }

    protected fetchSegmentInfoAndDisplayWithGoogleMap(pathArray: number[][], effortId: number): void {

        // Display GoogleMap With Path And Segment Effort highlighted
        this.fetchSegmentInfoFromEffortId(effortId, (segmentInfoResponse: any) => {
            // Slice latlong array
            this.displayGoogleMapWithPath(
                pathArray, [segmentInfoResponse.start_index, segmentInfoResponse.end_index],
            );
        });
    }

    protected displayGoogleMapWithPath(mainPathArray: number[][], highlightFromTo?: number[]): void {

        const mapSize: number[] = [
            window.innerWidth * 0.950,
            window.innerHeight * 0.875,
        ];

		const html: string = "<div style=\"padding-bottom:10px; text-align:center;\"><div style=\"height:" + mapSize[1] + "px;width:" + mapSize[0] + "px;\" id=\"gmaps_canvas\"></div><a target=\"_blank\" href=\"" + this.appResources.settingsLink + "#/commonSettings?searchText=Google%20Maps\">Go to extension settings if you want to set specific layer OR disable google maps buttons</a></div>";

        $.fancybox(html, {
            autoScale: true,
            transitionIn: "fade",
            transitionOut: "fade",
        });

        // Test if exit then no append before
        if (!$("#gmaps_canvas").length) {

            $("#map-canvas").before(html).each(() => {
                this.applyToMap(mainPathArray, highlightFromTo);
            });
        } else {
            this.applyToMap(mainPathArray, highlightFromTo);
        }

    }

    protected applyToMap(mainPathArray: number[][], highlightFromTo: number[]): void {

        let layerType: google.maps.MapTypeId;

        // If user layer settings value exist into Google Maps Layer Type then use it
        switch (this.userSettings.reviveGoogleMapsLayerType.toUpperCase()) {

            case "HYBRID":
                layerType = google.maps.MapTypeId.HYBRID;
                break;
            case "ROADMAP":
                layerType = google.maps.MapTypeId.ROADMAP;
                break;
            case "SATELLITE":
                layerType = google.maps.MapTypeId.SATELLITE;
                break;
            case "TERRAIN":
                layerType = google.maps.MapTypeId.TERRAIN;
                break;
            default:
                layerType = google.maps.MapTypeId.TERRAIN;
                break;
        }

        // if (!this.map) {
        this.map = new google.maps.Map(document.getElementById("gmaps_canvas"), {
            mapTypeId: layerType,
            overviewMapControl: true,
        });
        // }

        const points: google.maps.LatLng[] = [];
        let bounds: google.maps.LatLngBounds = new google.maps.LatLngBounds();

        _.forEach(mainPathArray, (position) => {
            const point: google.maps.LatLng = new google.maps.LatLng(position[0], position[1]);
            points.push(point);
            bounds.extend(point);
        });

        const mainPathPoly: google.maps.Polyline = new google.maps.Polyline({
            // use your own style here
            path: points,
            strokeColor: "#FF0000",
            strokeOpacity: .7,
            strokeWeight: 4,
        });

        // Set path to map
        mainPathPoly.setMap(this.map);

        // fit bounds to track
        this.map.fitBounds(bounds);

        if (highlightFromTo) {

            const secondPathPoly: google.maps.Polyline = new google.maps.Polyline({
                path: points.slice(highlightFromTo[0], highlightFromTo[1]),
                strokeColor: "#105cb6",
                strokeOpacity: 1,
                strokeWeight: 4,
            });

            // Erase bounds and computed new ones with highlighted path
            bounds = new google.maps.LatLngBounds();
            _.forEach(mainPathArray.slice(highlightFromTo[0], highlightFromTo[1]), (position: number[]) => {
                const p: google.maps.LatLng = new google.maps.LatLng(position[0], position[1]);
                bounds.extend(p);
            });

            // Update with new bounds from highlighted path
            this.map.fitBounds(bounds);

            // Apply new poly line
            secondPathPoly.setMap(this.map);
        }
    }

    protected getGoogleMapsApi(): void {
        const script_tag: HTMLScriptElement = document.createElement("script");
        script_tag.setAttribute("type", "text/javascript");
        script_tag.setAttribute("src", "https://maps.google.com/maps/api/js?sensor=false");
        // script_tag.setAttribute("src", "https://maps.google.com/maps/api/js?sensor=false&callback=googleMapsApiLoaded");
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
    }
}
