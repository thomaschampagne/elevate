import * as _ from "lodash";
import {IAppResources} from "../interfaces/IAppResources";
import {IUserSettings} from "../interfaces/IUserSettings";

export class WindyTyModifier implements IModifier {

    protected activityId: number;
    protected appResources: IAppResources;
    protected userSettings: IUserSettings;
    protected baryCenterPosition: LatLon;

    constructor(activityId: number, appResources: IAppResources, userSettings: IUserSettings) {
        this.activityId = activityId;
        this.appResources = appResources;
        this.userSettings = userSettings;
    }

    public modify(): void {
        if (_.isUndefined(window.pageView)) {
            return;
        }

        this.getActivityBaryCenter((baryCenterPosition: LatLon) => {

            if (!baryCenterPosition) {
                console.log("Skipping WindyTyModifier execution, no baryCenterPosition available");
                return;
            }

            this.baryCenterPosition = baryCenterPosition;
            this.modifyPage();
        });
    }

    protected getActivityBaryCenter(callback: (latLon: LatLon) => void): void {

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

            callback(new LatLon(baryCenterPoint[0], baryCenterPoint[1]));

        });
    }

    protected modifyPage(): void {

        const remoteViewActivityLinksArray: string[][] = [
            ["Wind", "wind"],
            ["Temp", "temp"],
            ["Clouds", "clouds"],
            ["Humidity", "rh"],
        ];

        let html: string = "<li class='group'>";
        html += "<div class='title' style='font-size: 14px; cursor: pointer;' id='stravistix_weather_title'>Weather</div>";
        html += "<ul style='display: none;' id='stravistix_weatherList'>";
        $.each(remoteViewActivityLinksArray, function() {
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
        const defaultZoomLevel: number = 11;
        const windyTyHour: number = Math.round(date.getUTCHours() / 6) * 6;
        const windUnitConfig: string = "metric.wind." + this.userSettings.windUnit;
        const temperatureUnitConfig: string = "metric.temp." + this.userSettings.temperatureUnit;

        const url: string = "https://embed.windyty.com/?" +
            this.baryCenterPosition.lat + "," +
            this.baryCenterPosition.lon + "," +
            defaultZoomLevel + "," +
            date.toISOString().split("T")[0] + "-" + this.pad(windyTyHour, 2) + "," +
            type + "," +
            windUnitConfig + "," +
            temperatureUnitConfig;

        console.debug("Load wheather url: " + url);

        $.fancybox({
            width: "100%",
            height: "100%",
            autoScale: true,
            transitionIn: "fade",
            transitionOut: "fade",
            type: "iframe",
            content: '<iframe src="' + url + '" width="' + window.innerWidth * 0.950 + '" height="' + window.innerHeight * 0.875 + '" frameborder="0"></iframe>',
        });
    }

    protected pad(number: number, width: number, z?: any): string {
        z = z || "0";
        const n: string = number + "";
        return (n.length >= width) ? n : new Array(width - n.length + 1).join(z) + n;
    }

}
