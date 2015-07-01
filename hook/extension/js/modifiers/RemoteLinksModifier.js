/**
 *   RemoteLinksModifier is responsible of ...
 */
function RemoteLinksModifier(highLightStravistiXFeature, appResources, authorOfActivity) {
    this.appResources_ = appResources;
    this.highLightStravistiXFeature_ = highLightStravistiXFeature;
    this.htmlRemoteViewForActivityStyle = '';
    this.htmlRemoteViewForSegmentStyle = '';
    this.authorOfActivity = authorOfActivity;
}

/**
 * Define prototype
 */
RemoteLinksModifier.prototype = {

    modify: function modify() {

        if (this.highLightStravistiXFeature_) {
            this.htmlRemoteViewForActivityStyle = 'background: #fc4c02; color: #333;'; // TODO Make colors global
            this.htmlRemoteViewForSegmentStyle = 'background: #fc4c02; color: white;'; // TODO Make colors global
            this.htmlRemoteViewTextStyle = 'color: white;'; // TODO Make colors global
        }

        if (!_.isUndefined(window.pageView)) {
            this.modifyActivityPage_();
        }
        // if segment page is matching url
        if (!_.isNull(window.location.pathname.match(/^\/segments\/(\d+)$/))) {
            this.modifySegmentPage_();
        }
    },

    /**
     * ...
     */
    modifyActivityPage_: function modifyActivityPage_() {

        var remoteViewActivityLinksArray = [
            ["VV Activity shorcut", 'http://veloviewer.com/activities/', '?referrer=stravistiX', ''],
            ["VV Seg. Compare", '#', '', 'onclick="javascript:stravistiX.remoteLinksModifier.veloviewerSegmentCompare(window.event)"'],
            ["Surface", 'http://strava-tools.raceshape.com/erea/?url=', '', '']
        ];

        // Activity page
        // Adding remote view links on left panel
        var htmlRemoteViewForActivity = "<li class='group' style='" + this.htmlRemoteViewForActivityStyle + "'>";
        htmlRemoteViewForActivity += "<div class='title'><span style='font-size: 14px;" + this.htmlRemoteViewTextStyle + "'><a id='stravistix_remote_title'>Remote Views</a></span> <img style='vertical-align:middle;width:16px' src='" + this.appResources_.remoteViewIcon + "'/></div>";
        htmlRemoteViewForActivity += "<ul style='display: none;' id='stravistix_remoteViews'>";
        $.each(remoteViewActivityLinksArray, function() {
            htmlRemoteViewForActivity += "<li>";
            htmlRemoteViewForActivity += "<a data-menu='' " + this[3] + " target='_blank' style='color: #333;' href='" + this[1] + pageView.activity().id + this[2] + "'>" + this[0] + "</a>";
        });
        htmlRemoteViewForActivity += "</ul>";
        htmlRemoteViewForActivity += "</li>";
        htmlRemoteViewForActivity = $(htmlRemoteViewForActivity);

        $("#pagenav").append(htmlRemoteViewForActivity).each(function() {

            $('[data-remote-views]').click(function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                self.showWeather(this.getAttribute('data-remote-views'));
            });

            $('#stravistix_remote_title').click(function(evt) {

                evt.preventDefault();
                evt.stopPropagation();

                if ($('#stravistix_remoteViews').is(':visible')) {
                    $('#stravistix_remoteViews').slideUp();
                } else {
                    $('#stravistix_remoteViews').slideDown();
                }

            });

        });

        // Add tcx export
        if (this.authorOfActivity) {
            var htmlForTCXExport = "<li><a href='" + window.location.pathname + "/export_tcx'>Export TCX</a></li>";
            $(".actions-menu .slide-menu .options").append(htmlForTCXExport);
        }
    },

    veloviewerSegmentCompare: function(evt) {

        evt.preventDefault();
        evt.stopPropagation();

        if (typeof(vv_getData) === 'undefined') {
            var s = document.createElement('script');
            s.src = 'https://s3.amazonaws.com/s3.veloviewer.com/js/compareSegments.js?v=' + Math.floor(Math.random() * 1000);
            document.getElementsByTagName('head')[0].appendChild(s);
            s.onload = function() {
                vv_getData();
            }
        } else {
            vv_getData();
        }
    },

    /**
     * ...
     */
    modifySegmentPage_: function modifySegmentPage_() {

        // // Segment external links
        var segmentData = window.location.pathname.match(/^\/segments\/(\d+)$/);

        if (segmentData == null) {
            return;
        }

        // Getting segment id
        var segmentId = segmentData[1];

        var remoteViewSegmentLinksArray = [
            ["<img width='24px' style='vertical-align:middle' src='" + this.appResources_.veloviewerIcon + "'/> <span>VeloViewer</span>", 'http://veloviewer.com/segment/', '?referrer=stravistiX'],
            ["<img width='24px' style='vertical-align:middle' src='" + this.appResources_.pollIcon + "'/> <span>Segment Stats</span>", 'http://www.jonathanokeeffe.com/strava/segmentDetails.php?segmentId=', '']
        ];
        var html = "<div class='module' style='padding-bottom: 10px;'>";
        html += "<div class='drop-down-menu' style='width: 100%; background: #fc4c02; color: white;'>";
        html += "<div class='selection' style='" + this.htmlRemoteViewForSegmentStyle + "'><img style='vertical-align:middle' src='" + this.appResources_.remoteViewIcon + "'/> <span>Remote Segment View</span></div>";
        html += "<ul class='options' style='" + this.htmlRemoteViewForActivityStyle + "'>";

        $.each(remoteViewSegmentLinksArray, function() {
            html += "<li><a target='_blank' href='" + this[1] + segmentId + this[2] + "' style='" + this.htmlRemoteViewTextStyle + "'>" + this[0] + "</a></li>";
        });
        html += "</ul>";
        html += "</div>";
        html += "</div>";
        $(html).prependTo('.sidebar.spans5');
    },
};
