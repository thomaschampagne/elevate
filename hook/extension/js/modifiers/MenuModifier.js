/**
 *   MenuModifier is responsible of ...
 */
function MenuModifier(athleteId, highLightStravaPlusFeature, appResources) {
    this.athleteId_ = athleteId;
    this.appResources_ = appResources;
    this.highLightStravaPlusFeature_ = highLightStravaPlusFeature;
}

/**
 * Define prototype
 */
MenuModifier.prototype = {

    modify: function modify() {

        // Add kom-map to global navigation
        var globalNav = jQuery(".global-nav");
        var stravaMenuHtml = "<li class='drop-down-menu' height='auto'>";

        var menuStyle = null;
        var menuIcon;

        if (this.highLightStravaPlusFeature_) {
            menuStyle = "style='font-size:20px; background-color: #fc4c02; color: white;'"; //TODO Globalize colors
            menuIcon = this.appResources_.menuIconBlack;
        } else {
            menuStyle = "style='font-size:20px; background-color: white; color: #fc4c02;'"; //TODO Globalize colors
            menuIcon = this.appResources_.menuIconOrange;
        }

        var styleSideRight = 'display: inline; float: right; border-top: 1px solid #DDD; border-left: 1px solid #DDD; width: 50%;';
        var styleSideLeft = 'border-top: 1px solid #DDD; width: 50%;';

        stravaMenuHtml += "<a href='#' class='selection' " + menuStyle + "><img style='vertical-align:middle' src='" + menuIcon + "'/></a>";
        stravaMenuHtml += "<ul class='options' height='' style='width: 300px; max-height: 650px !important; overflow:hidden;'>";
        stravaMenuHtml += "<li><a target='_blank' href='" + this.appResources_.settingsLink + "'><img style='vertical-align:middle' src='" + this.appResources_.settingsIcon + "'/> <span>StravaPlus Settings</span></a></li>";
        stravaMenuHtml += "<li><a href='http://labs.strava.com/kom-map/#" + this.athleteId_ + "' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.komMapIcon + "'/> <span>KOM/CR Map</span></a></li>";
        stravaMenuHtml += "<li id='splus_menu_heatmap'><a href='#' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.heatmapIcon + "'/> <span>Heat Map</span></a></li>";
        stravaMenuHtml += "<li><a href='http://veloviewer.com/athlete/" + this.athleteId_ + "/summary' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.veloviewerDashboardIcon + "'/> <span>Dashboard <i>VeloViewer</i></span></a></li>";
        stravaMenuHtml += "<li><a href='http://veloviewer.com/athlete/" + this.athleteId_ + "/challenges' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.veloviewerChallengesIcon + "'/> <span>Strava Challenges <i>VeloViewer</i></span></a></li>";
        stravaMenuHtml += "<li style='border-top: 1px solid #DDD;'><a style='font-style: italic;' href='" + this.appResources_.settingsLink + "#/releaseNotes' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.systemUpdatesIcon + "'/> <span><strong>v" + this.appResources_.extVersion + "</strong> release notes</span></a></li>";

        stravaMenuHtml += "<li style='" + styleSideRight + "'><a style='font-style: italic;' href='https://chrome.google.com/webstore/support/dhiaggccakkgdfcadnklkbljcgicpckn' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.bugIcon + "'/> <span>Report</span></a></li>";
        stravaMenuHtml += "<li style='" + styleSideLeft + "' ><a  style='font-style: italic;' href='https://twitter.com/champagnethomas' style='font-style: italic;' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.newReleaseIcon + "'/> <span>Keep updated</span></a></li>";

        stravaMenuHtml += "<li style='" + styleSideRight + "'><a style='font-style: italic;' href='" + this.appResources_.settingsLink + "#/donate' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.donateIcon + "'/> <span>Donate</span></a></li>";
        stravaMenuHtml += "<li style='" + styleSideLeft + "'><a style='font-style: italic;' href='http://thomaschampagne.github.io/' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.bikeIcon + "'/> <span> Author site</span></a></li>";
        stravaMenuHtml += "</ul>";
        stravaMenuHtml += "</li>";

        //TODO Move geolocation permission ask out ?
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    jQuery('#splus_menu_heatmap').find('a').attr('href', 'http://labs.strava.com/heatmap/#12/' + position.coords.longitude + '/' + position.coords.latitude + '/gray/both');
                },
                function(error) {
                    if (error != null) {
                        jQuery('#splus_menu_heatmap').find('a').attr('href', '#');
                        jQuery('#splus_menu_heatmap').find('a').attr('target', '_self');
                        jQuery('#splus_menu_heatmap').find('a').attr('onclick', 'alert("Some Strava+ functions will not work without your location position. Please make sure you have allowed location tracking on this site. Click on the location icon placed on the right inside the chrome web address bar => Clear tracking setting => Refresh page > Allow tracking.")');
                    }
                }
            );
        }
        globalNav.children().first().before(stravaMenuHtml);
    },
};
