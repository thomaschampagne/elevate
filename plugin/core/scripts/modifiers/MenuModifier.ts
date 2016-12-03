/**
 * Handles main burger menu
 */
class MenuModifier implements IModifier {

    private athleteId: number;
    private appResources: IAppResources;

    constructor(athleteId: number, appResources: IAppResources) {
        this.athleteId = athleteId;
        this.appResources = appResources;
    }

    modify(): void {

        // Add kom-map to global navigation
        let globalNav: JQuery = $(".global-nav");
        let html: string = "<li class='drop-down-menu'>";

        let newIssueURL: string = 'https://github.com/thomaschampagne/stravistix/issues/new?body=**Bug%20description:**%20%0A%0A**Actual%20Behavior:**%20%0A%0A**Expected%20Behavior:**%20%0A%0A**Steps%20to%20Reproduce:**%20%0A-%20...%0A%20-%20...%0A%20-%20...%0A%0A**Chrome%20version**%20%0A%0A**Plugin%20version:**%20%0A%0A**Activities%20links?:**%20%0A%0A**Console%20errors?%20(press%20F12%20to%20see%20developer%20console,%20and%20copy%20paste%20here):**%20%0A%0A```%20%0Aput%20console%20errors%20here%20if%20exist%20%0A```%20%0A%0A**Link%20screenshots%20or%20youtube%20video%20link%20if%20necessary:**';

        let menuStyle: string = "style='font-size:20px; background-color: transparent; color: #fc4c02;'"; //TODO Globalize colors;
        let menuIcon: string = this.appResources.menuIconOrange;

        let styleSideRight: string = 'display: inline; float: right; border-top: 1px solid #DDD; border-left: 1px solid #DDD; width: 50%;';
        let styleSideLeft: string = 'border-top: 1px solid #DDD; width: 50%;';

        html += "<a title='Click Left > \"My Activity Feed\", click right > \"My Activities\"' href='https://www.strava.com/dashboard?feed_type=my_activity' class='selection' " + menuStyle + "><img style='vertical-align:middle' id='drop-down-menu_img' oncontextmenu='return false;' src='" + menuIcon + "'/></a>";
        html += "<script>document.getElementById('drop-down-menu_img').onmousedown = function(event) { if (event.which == 3) { window.location.href = 'https://www.strava.com/athlete/training?utm_source=top-nav';}}</script>";
        html += "<ul class='options' style='width: 300px; max-height: 650px !important; overflow:hidden;'>";
        html += "<li><a target='_blank' href='" + this.appResources.settingsLink + "#/fitnessTrend'><img style='vertical-align:middle' src='" + this.appResources.timelineIcon + "'/> <span>Multisports Fitness Trend</span></a></li>";
        html += "<li><a target='_blank' href='" + this.appResources.settingsLink + "'><img style='vertical-align:middle' src='" + this.appResources.settingsIcon + "'/> <span>StravistiX Settings</span></a></li>";
        html += "<li><a href='http://labs.strava.com/achievement-map/' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.komMapIcon + "'/> <span>KOM/CR Map</span></a></li>";
        html += "<li ><a href='#' class='sx_menu_heatmap'><img style='vertical-align:middle' src='" + this.appResources.heatmapIcon + "'/> <span>Heat Map</span></a></li>";
        html += "<li style='border-top: 1px solid #DDD;'><a style='font-style: italic;' href='" + this.appResources.settingsLink + "#/?showReleaseNotes=true' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.systemUpdatesIcon + "'/> <span><strong>" + this.appResources.extVersionName + "</strong> release notes</span></a></li>";

        html += "<li style='" + styleSideRight + "'><a style='font-style: italic;' href='https://chrome.google.com/webstore/detail/stravistix/dhiaggccakkgdfcadnklkbljcgicpckn/reviews' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.rateIcon + "'/> <span>Rate</span></a></li>";
        html += "<li style='" + styleSideLeft + "' ><a  style='font-style: italic;' href='https://twitter.com/champagnethomas' style='font-style: italic;' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.twitterIcon + "'/> <span>What's next?</span></a></li>";

        html += "<li style='" + styleSideRight + "'><a style='font-style: italic;' href='" + this.appResources.settingsLink + "#/?showDonation=true' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.donateIcon + "'/> <span>Donate</span></a></li>";
        html += "<li style='" + styleSideLeft + "'><a style='font-style: italic;' href='http://thomaschampagne.github.io/' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.bikeIcon + "'/> <span> Author site</span></a></li>";

        html += "<li style='" + styleSideRight + "'><a style='font-style: italic;' href='" + newIssueURL + "' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.bugIcon + "'/> <span>Report bug</span></a></li>";
        html += "<li style='border-top: 1px solid #DDD;" + styleSideLeft + "'><a target='_blank' href='" + this.appResources.settingsLink + "#/?showSharing=true'><img style='vertical-align:middle' src='" + this.appResources.shareIcon + "'/> <span>Share</span></a></li>";
        html += "</ul>";
        html += "</li>";

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position: Position) => {
                    $('.sx_menu_heatmap').attr('href', 'http://labs.strava.com/heatmap/#12/' + position.coords.longitude + '/' + position.coords.latitude + '/gray/both');
                    $('.sx_menu_heatmap').attr('target', '_blank');
                },
                (error: PositionError) => {
                    console.error(error);
                    $('.sx_menu_heatmap').attr('href', '#');
                    $('.sx_menu_heatmap').attr('target', '_self');
                    $('.sx_menu_heatmap').attr('onclick', 'alert("Some StravistiX functions will not work without your location position. Please make sure you have allowed location tracking on this site. Click on the location icon placed on the right inside the chrome web address bar => Clear tracking setting => Refresh page > Allow tracking.")');
                }
            );
        }
        globalNav.children().first().before(html);
    }
}