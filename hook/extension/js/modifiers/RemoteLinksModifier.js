/**
 *   RemoteLinksModifier is responsible of ...
 */
function RemoteLinksModifier(highLightStravaPlusFeature, appResources, authorOfActivity) {
    this.appResources_ = appResources;
    this.highLightStravaPlusFeature_ = highLightStravaPlusFeature;
    this.htmlRemoteViewForActivityStyle = '';
    this.htmlRemoteViewForSegmentStyle = '';
    this.authorOfActivity = authorOfActivity;
}

/**
 * Define prototype
 */
RemoteLinksModifier.prototype = {

    modify: function modify() {

        if (this.highLightStravaPlusFeature_) {
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
            ["<img width='16px' src='" + this.appResources_.veloviewerIcon + "'/> VeloViewer", 'http://veloviewer.com/activities/', '?referrer=stravaPlus'],
            ["<img width='16px' src='" + this.appResources_.labIcon + "'/> FlyBy", 'http://labs.strava.com/flyby/viewer/#', ''],
            ["<img width='16px' src='" + this.appResources_.raceshapeIcon + "'/> Surface", 'http://strava-tools.raceshape.com/erea/?url=', ''],
            ["<img width='16px' src='" + this.appResources_.veloviewerIcon + "'/> MapFlipper", 'http://veloviewer.com/mapFlipper', 'mapflipper']
];


        // Activity page
        // Adding remote view links on left panel
        var htmlRemoteViewForActivity = "<li class='group' style='" + this.htmlRemoteViewForActivityStyle + "'>";
        htmlRemoteViewForActivity += "<div class='title'><span style='font-size: 14px;" + this.htmlRemoteViewTextStyle + "'>Remote Views</span> <img width='12px' src='" + this.appResources_.remoteViewIcon + "'/></div>";
        htmlRemoteViewForActivity += "<ul>";
        jQuery.each(remoteViewActivityLinksArray, function() {
            htmlRemoteViewForActivity += "<li>";
            if (this[2] == 'mapflipper') {
                htmlRemoteViewForActivity += "<a data-menu='' target='_blank' style='color: #333;' href='" + this[1] + "'>" + this[0] + "</a>";
                htmlRemoteViewForActivity += "<br><label onclick='flip1()' title='Open Cycle Map'><img src='"+ this.appResources_.OCMIcon + "'><script>function flip1(){if(typeof(vv_flipMap)==='undefined'){var s=document.createElement('script');s.src='https://s3.amazonaws.com/s3.veloviewer.com/js/vv.mapFlipper.js?v='+Math.floor(Math.random()*1000);document.getElementsByTagName('head')[0].appendChild(s);s.onload=function(){vv_flipMap('cycle');}}else{vv_flipMap('cycle');}}</script></label>";
                htmlRemoteViewForActivity += "<label onclick='flip2()' title='Open Cycle Map Landscape'><img src='"+ this.appResources_.OCMlsIcon + "'><script>function flip2(){if(typeof(vv_flipMap)==='undefined'){var s=document.createElement('script');s.src='https://s3.amazonaws.com/s3.veloviewer.com/js/vv.mapFlipper.js?v='+Math.floor(Math.random()*1000);document.getElementsByTagName('head')[0].appendChild(s);s.onload=function(){vv_flipMap('landscape');}}else{vv_flipMap('landscape')}}</script></label>";
                htmlRemoteViewForActivity += "<label onclick='flip3()' title='Open Cycle Map Outdoor'><img src='"+ this.appResources_.OCModIcon + "'><script>function flip3(){if(typeof(vv_flipMap)==='undefined'){var s=document.createElement('script');s.src='https://s3.amazonaws.com/s3.veloviewer.com/js/vv.mapFlipper.js?v='+Math.floor(Math.random()*1000);document.getElementsByTagName('head')[0].appendChild(s);s.onload=function(){vv_flipMap('outdoors');}}else{vv_flipMap('outdoors')}}</script></label>";
                htmlRemoteViewForActivity += "<label onclick='flip4()' title='Open Street Map'><img src='"+ this.appResources_.OSMIcon + "'><script>function flip4(){if(typeof(vv_flipMap)==='undefined'){var s=document.createElement('script');s.src='https://s3.amazonaws.com/s3.veloviewer.com/js/vv.mapFlipper.js?v='+Math.floor(Math.random()*1000);document.getElementsByTagName('head')[0].appendChild(s);s.onload=function(){vv_flipMap('street');}}else{vv_flipMap('street')}}</script></label>";
            } else {
                htmlRemoteViewForActivity += "<a data-menu='' target='_blank' style='color: #333;' href='" + this[1] + pageView.activity().id + this[2] + "'>" + this[0] + "</a>";
            } // Map Flipper doesn't need activity ID
        });
        htmlRemoteViewForActivity += "</ul>";
        htmlRemoteViewForActivity += "</li>";
        htmlRemoteViewForActivity = jQuery(htmlRemoteViewForActivity);
        jQuery("#pagenav").append(htmlRemoteViewForActivity);

        // Add tcx export
        if (this.authorOfActivity) {
            var htmlForTCXExport = "<li><a href='" + window.location.pathname + "/export_tcx'>Export TCX</a></li>";
            jQuery(".actions-menu .slide-menu .options").append(htmlForTCXExport);
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
            ["<img width='24px' style='vertical-align:middle' src='" + this.appResources_.veloviewerIcon + "'/> <span>VeloViewer</span>", 'http://veloviewer.com/segment/', '?referrer=stravaPlus'],
            ["<img width='24px' style='vertical-align:middle' src='" + this.appResources_.pollIcon + "'/> <span>Segment Stats</span>", 'http://www.jonathanokeeffe.com/strava/segmentDetails.php?segmentId=', '']
        ];
        var html = "<div class='module' style='padding-bottom: 10px;'>";
        html += "<div class='drop-down-menu' style='width: 100%; background: #fc4c02; color: white;'>";
        html += "<div class='selection' style='" + this.htmlRemoteViewForSegmentStyle + "'><img style='vertical-align:middle' src='" + this.appResources_.remoteViewIcon + "'/> <span>Remote Segment View</span></div>";
        html += "<ul class='options' style='" + this.htmlRemoteViewForActivityStyle + "'>";

        jQuery.each(remoteViewSegmentLinksArray, function() {
            html += "<li><a target='_blank' href='" + this[1] + segmentId + this[2] + "' style='" + this.htmlRemoteViewTextStyle + "'>" + this[0] + "</a></li>";
        });
        html += "</ul>";
        html += "</div>";
        html += "</div>";
        jQuery(html).prependTo('.sidebar.spans5');
    },
};
