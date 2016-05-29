/**
 *   MenuModifier is responsible of ...
 */
function MenuModifier(athleteId, appResources) {
    this.athleteId_ = athleteId;
    this.appResources_ = appResources;
}

/**
 * Define prototype
 */
MenuModifier.prototype = {

    modify: function modify() {

        // Add kom-map to global navigation
        var globalNav = $(".global-nav");
        var stravaMenuHtml = "<li class='drop-down-menu' height='auto'>";

        var menuStyle = null;
        var menuIcon;

        menuStyle = "style='font-size:20px; background-color: transparent; color: #fc4c02;'"; //TODO Globalize colors
        menuIcon = this.appResources_.menuIconOrange;


        var styleSideRight = 'display: inline; float: right; border-top: 1px solid #DDD; border-left: 1px solid #DDD; width: 50%;';
        var styleSideLeft = 'border-top: 1px solid #DDD; width: 50%;';

        stravaMenuHtml += "<a title='Click Left > \"My Activity Feed\", click right > \"My Activities\"' href='https://www.strava.com/dashboard?feed_type=my_activity' class='selection' " + menuStyle + "><img style='vertical-align:middle' id='drop-down-menu_img' oncontextmenu='return false;' src='" + menuIcon + "'/></a>";
        stravaMenuHtml += "<script>document.getElementById('drop-down-menu_img').onmousedown = function(event) { if (event.which == 3) { window.location.href = 'https://www.strava.com/athlete/training?utm_source=top-nav';}}</script>";
        stravaMenuHtml += "<ul class='options' height='' style='width: 300px; max-height: 650px !important; overflow:hidden;'>";
        stravaMenuHtml += "<li><a target='_blank' href='" + this.appResources_.settingsLink + "'><img style='vertical-align:middle' src='" + this.appResources_.settingsIcon + "'/> <span mssg_id='menu/common_settings'>Common Settings</span></a></li>";
        stravaMenuHtml += "<li><a target='_blank' href='" + this.appResources_.settingsLink + "#/healthSettings'><img style='vertical-align:middle' src='" + this.appResources_.heartIcon + "'> <span mssg_id='menu/health_settings'>Health Settings</span></a></li>";
        stravaMenuHtml += "<li><a target='_blank' href='" + this.appResources_.settingsLink + "#/zonesSettings'><img style='vertical-align:middle' src='" + this.appResources_.zonesIcon + "'> <span mssg_id='menu/zone_settings'>Zones Settings</span></a></li>";
        stravaMenuHtml += "<li><a href='http://labs.strava.com/achievement-map/' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.komMapIcon + "'/> <span mssg_id='menu/kom_map'>KOM/CR Map</span></a></li>";
        stravaMenuHtml += "<li id='splus_menu_heatmap'><a href='#' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.heatmapIcon + "'/> <span mssg_id='menu/heat_map'>Heat Map</span></a></li>";
        // stravaMenuHtml += "<li><a href='http://veloviewer.com/athlete/" + this.athleteId_ + "/summary' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.veloviewerDashboardIcon + "'/> <span>Dashboard <i>VeloViewer</i></span></a></li>";
        // stravaMenuHtml += "<li><a href='http://veloviewer.com/athlete/" + this.athleteId_ + "/challenges' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.veloviewerChallengesIcon + "'/> <span>Strava Challenges <i>VeloViewer</i></span></a></li>";
        stravaMenuHtml += "<li style='border-top: 1px solid #DDD;'><a style='font-style: italic;' href='" + this.appResources_.settingsLink + "#/releaseNotes' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.systemUpdatesIcon + "'/> <span mssg_id='menu/release_notes' mssg_subStr='" + this.appResources_.extVersionName + "'><strong>v" + this.appResources_.extVersionName + "</strong> release notes</span></a></li>";

        stravaMenuHtml += "<li style='" + styleSideRight + "'><a style='font-style: italic;' href='https://chrome.google.com/webstore/detail/stravistix/dhiaggccakkgdfcadnklkbljcgicpckn/reviews' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.rateIcon + "'/> <span mssg_id='menu/rate'>Rate</span></a></li>";
        stravaMenuHtml += "<li style='" + styleSideLeft + "' ><a  style='font-style: italic;' href='https://twitter.com/champagnethomas' style='font-style: italic;' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.twitterIcon + "'/> <span mssg_id='menu/what_next'>What's next?</span></a></li>";

        stravaMenuHtml += "<li style='" + styleSideRight + "'><a style='font-style: italic;' href='" + this.appResources_.settingsLink + "#/donate' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.donateIcon + "'/> <span mssg_id='menu/donate'>Donate</span></a></li>";
        stravaMenuHtml += "<li style='" + styleSideLeft + "'><a style='font-style: italic;' href='http://thomaschampagne.github.io/' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.bikeIcon + "'/> <span mssg_id='menu/author_site'> Author site</span></a></li>";
        stravaMenuHtml += "<li style='border-top: 1px solid #DDD;'><a target='_blank' href='" + this.appResources_.settingsLink + "#/share'><img style='vertical-align:middle' src='" + this.appResources_.shareIcon + "'/> <span mssg_id='menu/share_ext'>Share this extension</span></a></li>";
        stravaMenuHtml += "</ul>";
        stravaMenuHtml += "</li>";

        var gblInstance = this.appResources_.globalizeInstance;
        // #10 - Test method to do brute force translation
        // Step 1: Parse the damn HTML to a DOM node for usage
        var stravaMenuDOMNode = $($.parseHTML(stravaMenuHtml));
        Helper.translateDOMNode(gblInstance, stravaMenuDOMNode);

        // TODO Move geolocation permission ask out ?
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    $('#splus_menu_heatmap').find('a').attr('href', 'http://labs.strava.com/heatmap/#12/' + position.coords.longitude + '/' + position.coords.latitude + '/gray/both');
                },
                function(error) {
                    if (error !== null) {
                        $('#splus_menu_heatmap').find('a').attr('href', '#');
                        $('#splus_menu_heatmap').find('a').attr('target', '_self');
                        $('#splus_menu_heatmap').find('a').attr('onclick', 'alert("Some StravistiX functions will not work without your location position. Please make sure you have allowed location tracking on this site. Click on the location icon placed on the right inside the chrome web address bar => Clear tracking setting => Refresh page > Allow tracking.")');
                    }
                }
            );
        }

        globalNav.children().first().before(stravaMenuDOMNode);

        // $.fancybox('<div><h1>Modal example :)</h1><p>Remove this by searching the pattern "5s874d45gfds4ds7s7dsdsq87a7q4s7f7d8ds7f" in code</p></div>');
    },
};
