import _ from "lodash";
import $ from "jquery";
import { AppResourcesModel } from "../models/app-resources.model";
import { Helper } from "../helper";
import LatLonSpherical from "geodesy/latlon-spherical";
import { AbstractModifier } from "./abstract.modifier";
import { SpeedUnitDataModel } from "@elevate/shared/models/activity-data/speed-unit-data.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

export class WindyTyModifier extends AbstractModifier {
  protected activityId: number;

  protected appResources: AppResourcesModel;
  protected userSettings: ExtensionUserSettings;
  protected baryCenterPosition: LatLonSpherical;
  protected speedUnitData: SpeedUnitDataModel;

  constructor(activityId: number, appResources: AppResourcesModel, userSettings: ExtensionUserSettings) {
    super();
    this.activityId = activityId;
    this.appResources = appResources;
    this.userSettings = userSettings;
    this.speedUnitData = Helper.getSpeedUnitData(window.currentAthlete.get("measurement_preference"));
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
    const hasLatLngStreamData =
      window.pageView &&
      window.pageView.streamsRequest &&
      window.pageView.streamsRequest.streams &&
      window.pageView.streamsRequest.streams.streamData &&
      window.pageView.streamsRequest.streams.streamData.data &&
      window.pageView.streamsRequest.streams.streamData.data.latlng;

    if (!hasLatLngStreamData) {
      callback(null);
      return;
    }

    const latLng: number[][] = window.pageView.streamsRequest.streams.streamData.data.latlng;

    // Store first, middle and last position from latLng. These 3 position will help to findout barycenter position of th activity
    const startPoint: number[] = latLng[0];
    const midPoint: number[] = latLng[Math.round((latLng.length - 1) / 2)];
    const endPoint: number[] = latLng[latLng.length - 1];

    const baryCenterPoint: number[] = [];

    // Add start + end vector
    baryCenterPoint[0] = (startPoint[0] + endPoint[0]) / 2;
    baryCenterPoint[1] = (startPoint[1] + endPoint[1]) / 2;

    // Add middPoint
    baryCenterPoint[0] = (baryCenterPoint[0] + midPoint[0]) / 2;
    baryCenterPoint[1] = (baryCenterPoint[1] + midPoint[1]) / 2;

    callback(new LatLonSpherical(baryCenterPoint[0], baryCenterPoint[1]));
  }

  protected modifyPage(): void {
    const remoteViewActivityLinksArray: string[][] = [
      ["Wind", "wind"],
      ["Temp", "temp"],
      ["Clouds", "clouds"],
      ["Humidity", "rh"]
    ];

    let html = "<li class='group'>";
    html += "<div class='title' style='cursor: pointer;' id='elevate_weather_title'>Weather</div>";
    html += "<ul style='display: none;' id='elevate_weatherList'>";
    $.each(remoteViewActivityLinksArray, function () {
      html += "<li>";
      html += "<a data-wheater-windyty='" + this[1] + "' href='#'>" + this[0] + "</a>";
      html += "</li>";
    });
    html += "</ul>";

    $("#pagenav")
      .append($(html))
      .each(() => {
        $("[data-wheater-windyty]").click((evt: JQuery.Event) => {
          evt.preventDefault();
          evt.stopPropagation();
          this.showWeather($((evt as any).target).attr("data-wheater-windyty"));
        });

        $("#elevate_weather_title").click((evt: JQuery.Event) => {
          evt.preventDefault();
          evt.stopPropagation();

          if ($("#elevate_weatherList").is(":visible")) {
            $("#elevate_weatherList").slideUp();
          } else {
            $("#elevate_weatherList").slideDown();
          }
        });
      });
  }

  protected showWeather(type: string): void {
    const defaultZoomLevel = 11;

    const windUnitConfig: string = "metricWind=" + (this.speedUnitData.units === "km" ? "km/h" : "mph");
    const temperatureUnitConfig: string = "metricTemp=" + this.userSettings.temperatureUnit;

    const url: string =
      "https://embed.windy.com/embed2.html?" +
      "lat=" +
      this.baryCenterPosition.lat +
      "&lon=" +
      this.baryCenterPosition.lon +
      "&zoom=" +
      defaultZoomLevel +
      "&level=surface" +
      "&overlay=" +
      type +
      "&menu=&message=&marker=&forecast=12" +
      "&calendar=then" +
      "&location=coordinates" +
      "&type=map&actualGrid=" +
      "&metricWind=" +
      windUnitConfig +
      "&metricTemp=°" +
      temperatureUnitConfig;

    console.debug("Load wheather url: " + url);

    window.$.fancybox({
      width: "100%",
      height: "100%",
      autoScale: true,
      transitionIn: "fade",
      transitionOut: "fade",
      type: "iframe",
      content:
        '<iframe src="' +
        url +
        '" width="' +
        window.innerWidth * 0.95 +
        '" height="' +
        window.innerHeight * 0.875 +
        '" frameborder="0"></iframe>'
    });
  }

  protected pad(number: number, width: number, z?: any): string {
    z = z || "0";
    const n: string = number + "";
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }
}
