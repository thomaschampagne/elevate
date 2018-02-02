/**
 * Handles main burger menu
 */
import { IAppResources } from "../interfaces/IAppResources";

export class MenuModifier implements IModifier {

    private athleteId: number;
    private appResources: IAppResources;

    constructor(athleteId: number, appResources: IAppResources) {
        this.athleteId = athleteId;
        this.appResources = appResources;
    }

    public modify(): void {

        // Add kom-map to global navigation
        const globalNav: JQuery = $(".global-nav");
        let html: string = "<li class='drop-down-menu'>";

        const menuStyle: string = "style='font-size:20px; background-color: transparent; color: #fc4c02;'"; //TODO Globalize colors;
        const menuIcon: string = this.appResources.menuIconOrange;

        const styleSideRight: string = "display: inline; float: right; border-top: 1px solid #DDD; border-left: 1px solid #DDD; width: 50%;";
        const styleSideLeft: string = "border-top: 1px solid #DDD; width: 50%;";

        html += "<a title='Click Left > \"My Activity Feed\", click right > \"My Activities\"' href='https://www.strava.com/dashboard?feed_type=my_activity' class='selection' " + menuStyle + "><img style='vertical-align:middle' id='drop-down-menu_img' oncontextmenu='return false;' src='" + menuIcon + "'/></a>";
        html += "<script>document.getElementById('drop-down-menu_img').onmousedown = function(event) { if (event.which == 3) { window.location.href = 'https://www.strava.com/athlete/training?utm_source=top-nav';}}</script>";
        html += "<ul class='options' style='width: 300px; max-height: 650px !important; overflow:hidden;'>";
		html += "<li><a target='_blank' href='" + this.appResources.settingsLink + "#/fitnessTrend'><img style='vertical-align:middle' src='" + this.appResources.timelineIcon + "'/> <span>Fitness Trend</span></a></li>";
		html += "<li><a target='_blank' href='" + this.appResources.settingsLink + "#/yearProgressions'><img style='vertical-align:middle' src='" + this.appResources.dateRange + "'/> <span>Year Progressions</span></a></li>";
		html += "<li><a target='_blank' href='" + this.appResources.settingsLink + "#/commonSettings'><img style='vertical-align:middle' src='" + this.appResources.settingsIcon + "'/> <span>StravistiX Settings</span></a></li>";
		html += "<li><a target='_blank' href='" + this.appResources.settingsLink + "#/athleteSettings'><img style='vertical-align:middle' src='" + this.appResources.athleteIcon + "'/> <span>Athlete Settings</span></a></li>";
        html += "<li><a href='http://labs.strava.com/achievement-map/' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.komMapIcon + "'/> <span>KOM/CR Map</span></a></li>";
        html += "<li ><a href='#' class='sx_menu_heatmap'><img style='vertical-align:middle' src='" + this.appResources.heatmapIcon + "'/> <span>Heat Map</span></a></li>";
		html += "<li style='border-top: 1px solid #DDD;'><a style='font-style: italic;' href='" + this.appResources.settingsLink + "#/donate' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.donateIcon + "'/> <span>Donate</span></a></li>";
		html += "<li style='border-top: 1px solid #DDD;'><a style='font-style: italic;' href='" + this.appResources.settingsLink + "#/releasesNotes' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.systemUpdatesIcon + "'/> <span><strong>" + this.appResources.extVersionName + "</strong> release notes</span></a></li>";

        html += "<li style='" + styleSideRight + "'><a style='font-style: italic;' href='https://chrome.google.com/webstore/detail/stravistix/dhiaggccakkgdfcadnklkbljcgicpckn/reviews' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.rateIcon + "'/> <span>Rate</span></a></li>";
        html += "<li style='" + styleSideLeft + "' ><a  style='font-style: italic;' href='https://twitter.com/champagnethomas' style='font-style: italic;' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.twitterIcon + "'/> <span>What's next?</span></a></li>";

        html += "<li style='" + styleSideRight + "'><a style='font-style: italic;' href='https://www.strava.com/clubs/stravistix' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.peopleIcon + "'/> <span>Join Club</span></a></li>";
        html += "<li style='" + styleSideLeft + "'><a style='font-style: italic;' href='https://github.com/thomaschampagne/stravistix/wiki/Frequently-Asked-Questions' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.helpIcon + "'/> <span> FAQ</span></a></li>";

		html += "<li style='" + styleSideRight + "'><a style='font-style: italic;' href='" + this.appResources.settingsLink + "#/report' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.bugIcon + "'/> <span>Report bug</span></a></li>";
		html += "<li style='border-top: 1px solid #DDD;" + styleSideLeft + "'><a target='_blank' href='" + this.appResources.settingsLink + "#/?showSharing=true'><img style='vertical-align:middle' src='" + this.appResources.shareIcon + "'/> <span>Share</span></a></li>";
        html += "</ul>";
        html += "</li>";

        if (window.navigator.geolocation) {
            window.navigator.geolocation.getCurrentPosition(
                (position: Position) => {
                    $(".sx_menu_heatmap").attr("href", "http://labs.strava.com/heatmap/#12/" + position.coords.longitude + "/" + position.coords.latitude + "/gray/both");
                    $(".sx_menu_heatmap").attr("target", "_blank");
                },
                (error: PositionError) => {
                    console.error(error);
                    $(".sx_menu_heatmap").attr("href", "#");
                    $(".sx_menu_heatmap").attr("target", "_self");
					$(".sx_menu_heatmap").attr("onclick", "alert(\"Some StravistiX functions will not work without your location position. Please make sure you have allowed location tracking on this site. Click on the location icon placed on the right inside the chrome web address bar => Clear tracking setting => Refresh page > Allow tracking.\")");
                },
            );
        }
        globalNav.children().first().before(html);
    }
}
