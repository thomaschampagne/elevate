/**
 *   RemoteLinksModifier is responsible of ...
 */
function RemoteLinksModifier(highLightStravaPlusFeature, appResources) {
    this.appResources_ = appResources;
    this.highLightStravaPlusFeature_ = highLightStravaPlusFeature;
    this.htmlRemoteViewForActivityStyle = '';
    this.htmlRemoteViewForSegmentStyle = '';
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
        // please check if this works in this way:
            ["<img width='16px' src='" + this.appResources_.veloviewerIcon + "'/> Map Flipper OCM Cycle", "javascript:(function(){if(typeof(vv_flipMap)==='undefined'){var s=document.createElement('script');s.src='https://s3.amazonaws.com/s3.veloviewer.com/js/vv.mapFlipper.js?v='+Math.floor(Math.random()*1000);document.getElementsByTagName('head')[0].appendChild(s);s.onload=function(){vv_flipMap('cycle');}}else{vv_flipMap('cycle')}})();", ''],
            ["<img width='16px' src='" + this.appResources_.veloviewerIcon + "'/> Map Flipper OCM Landscape", "javascript:(function(){if(typeof(vv_flipMap)==='undefined'){var s=document.createElement('script');s.src='https://s3.amazonaws.com/s3.veloviewer.com/js/vv.mapFlipper.js?v='+Math.floor(Math.random()*1000);document.getElementsByTagName('head')[0].appendChild(s);s.onload=function(){vv_flipMap('landscape');}}else{vv_flipMap('landscape')}})();", ''],
            ["<img width='16px' src='" + this.appResources_.veloviewerIcon + "'/> Map Flipper OCM Outdoors", "javascript:(function(){if(typeof(vv_flipMap)==='undefined'){var s=document.createElement('script');s.src='https://s3.amazonaws.com/s3.veloviewer.com/js/vv.mapFlipper.js?v='+Math.floor(Math.random()*1000);document.getElementsByTagName('head')[0].appendChild(s);s.onload=function(){vv_flipMap('outdoors');}}else{vv_flipMap('outdoors')}})();", ''],
            ["<img width='16px' src='" + this.appResources_.veloviewerIcon + "'/> Map Flipper OSM Open Street Map", "javascript:(function(){if(typeof(vv_flipMap)==='undefined'){var s=document.createElement('script');s.src='https://s3.amazonaws.com/s3.veloviewer.com/js/vv.mapFlipper.js?v='+Math.floor(Math.random()*1000);document.getElementsByTagName('head')[0].appendChild(s);s.onload=function(){vv_flipMap('street');}}else{vv_flipMap('street')}})();", '']
        // it works if you copy the "javascript:..." string into a bookmark and click on it, but doesn't seem work if you copy the string into browsers url field ?!?
        // check http://veloviewer.com/mapFlipper
        // and https://s3.amazonaws.com/s3.veloviewer.com/js/vv.mapFlipper.js
];

        
        // Activity page
        // Adding remote view links on left panel
        var htmlRemoteViewForActivity = "<li class='group' style='" + this.htmlRemoteViewForActivityStyle + "'>";
        htmlRemoteViewForActivity += "<div class='title'><span style='font-size: 14px;" + this.htmlRemoteViewTextStyle + "'>Remote Views</span> <img width='12px' src='" + this.appResources_.remoteViewIcon + "'/></div>";
        htmlRemoteViewForActivity += "<ul>";
        jQuery.each(remoteViewActivityLinksArray, function() {
            htmlRemoteViewForActivity += "<li>";
            if (this[2] == '') {
                htmlRemoteViewForActivity += "<a data-menu='' target='_blank' style='color: #333;' href='" + this[1] "'>" + this[0] + "</a>";
            } else {
                htmlRemoteViewForActivity += "<a data-menu='' target='_blank' style='color: #333;' href='" + this[1] + pageView.activity().id + this[2] + "'>" + this[0] + "</a>";
            } // Map Flipper doesn't need activity ID
        });
        htmlRemoteViewForActivity += "</ul>";
        htmlRemoteViewForActivity += "</li>";
        htmlRemoteViewForActivity = jQuery(htmlRemoteViewForActivity);
        jQuery("#pagenav").append(htmlRemoteViewForActivity);
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
