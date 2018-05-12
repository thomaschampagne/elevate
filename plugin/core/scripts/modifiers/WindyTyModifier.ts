import * as _ from "lodash";
import * as $ from "jquery";
import { UserSettingsModel } from "../../../shared/models/user-settings/user-settings.model";
import { AppResourcesModel } from "../models/app-resources.model";
import { Helper } from "../Helper";
import { SpeedUnitDataModel } from "../../../shared/models/activity-data/speed-unit-data.model";
import { LatLonSpherical } from "geodesy";

export class WindyTyModifier implements IModifier {
	protected activityId: number;

	protected appResources: AppResourcesModel;
	protected userSettings: UserSettingsModel;
	protected baryCenterPosition: LatLonSpherical;
	protected speedUnitData: SpeedUnitDataModel;

	constructor(activityId: number, appResources: AppResourcesModel, userSettings: UserSettingsModel) {
		this.activityId = activityId;
		this.appResources = appResources;
		this.userSettings = userSettings;
		this.speedUnitData = Helper.getSpeedUnitData();
	}

	public modify(): void {
		if (_.isUndefined(window.pageView)) {
			return;
		}

		this.getActivityBaryCenter((baryCenterPosition: LatLonSpherical) => {

			if (!baryCenterPosition) {
				console.log("Skipping WindyTyModifier execution, no baryCenterPosition available");
				return;
			}

			this.baryCenterPosition = baryCenterPosition;
			this.modifyPage();
		});
	}

	protected getActivityBaryCenter(callback: (latLon: LatLonSpherical) => void): void {

		const url: string = "/activities/" + this.activityId + "/streams?stream_types[]=latlng";

		$.ajax({
			url,
			dataType: "json",
		}).done((jsonResponse) => {

			if (_.isEmpty(jsonResponse.latlng)) {
				callback(null);
				return;
			}

			// Store first, middle and last position from latlng. These 3 position will help to findout barycenter position of th activity
			const firstMiddleLastPosition: number[] = [];
			firstMiddleLastPosition.push(jsonResponse.latlng[0]);
			firstMiddleLastPosition.push(jsonResponse.latlng[Math.round((jsonResponse.latlng.length - 1) / 2)]);
			firstMiddleLastPosition.push(jsonResponse.latlng[jsonResponse.latlng.length - 1]);

			const startPoint: number[] = jsonResponse.latlng[0];
			const midPoint: number[] = jsonResponse.latlng[Math.round((jsonResponse.latlng.length - 1) / 2)];
			const endPoint: number[] = jsonResponse.latlng[jsonResponse.latlng.length - 1];

			const baryCenterPoint: number[] = [];

			// Add start + end vector
			baryCenterPoint[0] = (startPoint[0] + endPoint[0]) / 2;
			baryCenterPoint[1] = (startPoint[1] + endPoint[1]) / 2;

			// Add middPoint
			baryCenterPoint[0] = (baryCenterPoint[0] + midPoint[0]) / 2;
			baryCenterPoint[1] = (baryCenterPoint[1] + midPoint[1]) / 2;

			callback(new LatLonSpherical(baryCenterPoint[0], baryCenterPoint[1]));

		});
	}

	protected modifyPage(): void {

		const remoteViewActivityLinksArray: string[][] = [
			["Wind", "wind"],
			["Temp", "temp"],
			["Clouds", "clouds"],
			["Humidity", "rh"],
		];

		let html = "<li class='group'>";
		html += "<div class='title' style='cursor: pointer;' id='stravistix_weather_title'>Weather</div>";
		html += "<ul style='display: none;' id='stravistix_weatherList'>";
		$.each(remoteViewActivityLinksArray, function () {
			html += "<li>";
			html += "<a data-wheater-windyty='" + this[1] + "' href='#'>" + this[0] + "</a>";
			html += "</li>";
		});
		html += "</ul>";

		$("#pagenav").append($(html)).each(() => {

			$("[data-wheater-windyty]").click((evt: JQuery.Event) => {
				evt.preventDefault();
				evt.stopPropagation();
				this.showWeather($(evt.target).attr("data-wheater-windyty"));
			});

			$("#stravistix_weather_title").click((evt: JQuery.Event) => {

				evt.preventDefault();
				evt.stopPropagation();

				if ($("#stravistix_weatherList").is(":visible")) {
					$("#stravistix_weatherList").slideUp();
				} else {
					$("#stravistix_weatherList").slideDown();
				}

			});

		});
	}

	protected showWeather(type: string): void {

		const date: Date = new Date(window.pageView.activity().get("startDateLocal") * 1000);
		const defaultZoomLevel = 11;
		const windyTyHour: number = Math.round(date.getUTCHours() / 6) * 6;

		const windUnitConfig: string = "metricWind=" + ((this.speedUnitData.units === "km") ? "km/h" : "mph");
		const temperatureUnitConfig: string = "metricTemp=" + this.userSettings.temperatureUnit;

		const url: string = "https://embed.windy.com/embed2.html?"
			+ "lat=" + this.baryCenterPosition.lat
			+ "&lon=" + this.baryCenterPosition.lon
			+ "&zoom=" + defaultZoomLevel
			+ "&level=surface"
			+ "&overlay=" + type
			+ "&menu=&message=&marker=&forecast=12"
			+ "&calendar=then"
			+ "&location=coordinates"
			+ "&type=map&actualGrid="
			+ "&metricWind=" + windUnitConfig
			+ "&metricTemp=°" + temperatureUnitConfig;

		console.debug("Load wheather url: " + url);

		$.fancybox({
			width: "100%",
			height: "100%",
			autoScale: true,
			transitionIn: "fade",
			transitionOut: "fade",
			type: "iframe",
			content: "<iframe src=\"" + url + "\" width=\"" + window.innerWidth * 0.950 + "\" height=\"" + window.innerHeight * 0.875 + "\" frameborder=\"0\"></iframe>",
		});
	}

	protected pad(number: number, width: number, z?: any): string {
		z = z || "0";
		const n: string = number + "";
		return (n.length >= width) ? n : new Array(width - n.length + 1).join(z) + n;
	}

}
