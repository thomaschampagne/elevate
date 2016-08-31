/**
 *   RemoteLinksModifier is responsible of ...
 */
function RemoteLinksModifier(appResources, authorOfActivity) {
    this.appResources_ = appResources;
    this.authorOfActivity = authorOfActivity;
}

/**
 * Define prototype
 */
RemoteLinksModifier.prototype = {

    modify: function modify() {

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
    modifyActivityPage_: function() {

        var remoteViewActivityLinksArray = [
            ["VeloViewer", 'http://veloviewer.com/activities/', '?referrer=stravistiX', ''],
            // ["VeloViewer Seg. Compare", '#', '', 'onclick="javascript:stravistiX.remoteLinksModifier.veloviewerSegmentCompare(window.event)"'],
            ["Surface", 'http://strava-tools.raceshape.com/erea/?url=', '', '']
        ];

        // Activity page
        // Adding remote view links on left panel
        var htmlRemoteViewForActivity = "<li class='group'>";
        htmlRemoteViewForActivity += "<div class='title' id='stravistix_remote_title' style='font-size: 14px; cursor: pointer;'>Remote Views</div>";
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
            };
        } else {
            vv_getData();
        }
    },

    /**
     * ...
     */
    modifySegmentPage_: function() {

        // // Segment external links
        var segmentData = window.location.pathname.match(/^\/segments\/(\d+)$/);

        if (segmentData === null) {
            return;
        }

        // Getting segment id
        var segmentId = segmentData[1];

        var remoteViewSegmentLinksArray = [
            ["<img width='24px' style='vertical-align:middle' src='" + this.appResources_.veloviewerIcon + "'/> <span>VeloViewer</span>", 'http://veloviewer.com/segment/', '?referrer=stravistiX'],
            ["<img width='24px' style='vertical-align:middle' src='" + this.appResources_.pollIcon + "'/> <span>Segment details (Jonathan Okeeffe)</span>", 'http://www.jonathanokeeffe.com/strava/segmentDetails.php?segmentId=', '']
        ];
        var html = "<div class='dropdown' style='padding-bottom: 10px;'>";
        html += "<div class='drop-down-menu' style='width: 100%;' >";
        html += "<button class='btn btn-default dropdown-toggle'><img style='vertical-align:middle' src='" + this.appResources_.remoteViewIcon + "'/> <span>Remote Segment View</span> <span class='app-icon-wrapper '><span class='app-icon icon-strong-caret-down icon-dark icon-xs'></span></span></button>";
        html += "<ul class='options' style='z-index: 999;'>";

        $.each(remoteViewSegmentLinksArray, function() {
            html += "<li><a target='_blank' href='" + this[1] + segmentId + this[2] + "'>" + this[0] + "</a></li>";
        });
        html += "</ul>";
        html += "</div>";
        html += "</div>";
        $(html).prependTo('.segment-activity-my-efforts');
    },
};
