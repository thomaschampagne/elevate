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
            ["<img width='16px' src='" + this.appResources_.labIcon + "'/> FlyBy", 'http://labs.strava.com/flyby/viewer/#', ''],
            ["<img width='16px' src='" + this.appResources_.raceshapeIcon + "'/> Surface", 'http://strava-tools.raceshape.com/erea/?url=', ''],
            ["HeatMap", "<img width='16px' src='" + this.appResources_.heatmapIcon + "'/>", 'heatmap', 'Strava Global Heatmap'],
            ["<img  src='" + this.appResources_.multimapIcon + "'/> MultiMap", 'http://www.jonathanokeeffe.com/strava/map.php', 'various', "Jonathan o\'Keeffe\'s Multiple Ride Mapper"],
            ["<img width='16px' src='" + this.appResources_.AnnualSummIcon + "'/> AnnualSumm", 'http://www.jonathanokeeffe.com/strava/annualSummary.php', 'various', "Jonathan o\'Keeffe\'s Annual Summary"],
            ["<img src='" + this.appResources_.mesmerideIcon + "'/>", 'http://www.mesmeride.com/', 'various', "Create beautiful elevation profiles in style of Tour or Giro"],
            ["<img width='16px' src='" + this.appResources_.veloviewerIcon + "'/> VeloViewer", 'http://veloviewer.com/activities/', '?referrer=stravistiX'],
            ["MapFlipper", 'http://veloviewer.com/mapFlipper', 'mapflipper',  " width='24px' src='" + this.appResources_.OCMIcon + "'/>", " width='24px' src='" + this.appResources_.OCMlsIcon + "'/>", " width='24px' src='" + this.appResources_.OCModIcon + "'/>", " width='24px' src='" + this.appResources_.OSMIcon + "'/>"]
];


        // Activity page
        // Adding remote view links on left panel
        var htmlRemoteViewForActivity = "<li class='group' style='" + this.htmlRemoteViewForActivityStyle + "'>";
        htmlRemoteViewForActivity += "<div class='title'><span style='font-size: 14px;" + this.htmlRemoteViewTextStyle + "'>Remote Views</span> <img width='12px' src='" + this.appResources_.remoteViewIcon + "'/></div>";
        htmlRemoteViewForActivity += "<ul>";
        $.each(remoteViewActivityLinksArray, function() {
            htmlRemoteViewForActivity += "<li>";
            if (this[2] == 'mapflipper') {
                htmlRemoteViewForActivity += "<a title='Select Satellite Map and/or zoom in/out to enable MapFlipper!' data-menu='' target='_blank' style='color: #333; padding-bottom: 0px' href='" + this[1] + "'>" + this[0] + "</a>";
                htmlRemoteViewForActivity += "<span style='color: #333; padding-left: 30px'>";
                htmlRemoteViewForActivity += "<img onclick='flip1()' title='Open Cycle Map'" + this[3] + "<script>function flip1(){if(typeof(vv_flipMap)==='undefined'){var s=document.createElement('script');s.src='https://s3.amazonaws.com/s3.veloviewer.com/js/vv.mapFlipper.js?v='+Math.floor(Math.random()*1000);document.getElementsByTagName('head')[0].appendChild(s);s.onload=function(){vv_flipMap('cycle');}}else{vv_flipMap('cycle');}}</script>";
                htmlRemoteViewForActivity += "<img onclick='flip2()' title='Open Cycle Map Landscape'" + this[4] + "<script>function flip2(){if(typeof(vv_flipMap)==='undefined'){var s=document.createElement('script');s.src='https://s3.amazonaws.com/s3.veloviewer.com/js/vv.mapFlipper.js?v='+Math.floor(Math.random()*1000);document.getElementsByTagName('head')[0].appendChild(s);s.onload=function(){vv_flipMap('landscape');}}else{vv_flipMap('landscape')}}</script>";
                htmlRemoteViewForActivity += "<img onclick='flip3()' title='Open Cycle Map Outdoor'" + this[5] + "<script>function flip3(){if(typeof(vv_flipMap)==='undefined'){var s=document.createElement('script');s.src='https://s3.amazonaws.com/s3.veloviewer.com/js/vv.mapFlipper.js?v='+Math.floor(Math.random()*1000);document.getElementsByTagName('head')[0].appendChild(s);s.onload=function(){vv_flipMap('outdoors');}}else{vv_flipMap('outdoors')}}</script>";
                htmlRemoteViewForActivity += "<img onclick='flip4()' title='Open Street Map'" + this[6] + "<script>function flip4(){if(typeof(vv_flipMap)==='undefined'){var s=document.createElement('script');s.src='https://s3.amazonaws.com/s3.veloviewer.com/js/vv.mapFlipper.js?v='+Math.floor(Math.random()*1000);document.getElementsByTagName('head')[0].appendChild(s);s.onload=function(){vv_flipMap('street');}}else{vv_flipMap('street')}}</script>";
                htmlRemoteViewForActivity += "</span></li>";
            } else if (this[2] == 'various') {
                htmlRemoteViewForActivity += '<a title="'+this[3]+'" data-menu="" target="_blank" style="color: #333;" href="' + this[1] + '">' + this[0] + '</a>';
            } else if (this[2] == 'heatmap') {
				// TODO Move geolocation permission ask out ?
				//
				// can't find out, why this concept works in MenuModifier.js, but not here :/
				//
               	var heatmap="http://labs.strava.com/heatmap/#5/4/46/yellow/bike";
        		if (navigator.geolocation) {
            		navigator.geolocation.getCurrentPosition(
                		function(position) {
                    		var heatmap = "href='http://labs.strava.com/heatmap/#12/" + position.coords.longitude + "/" + position.coords.latitude + "/yellow/both";
                		},
                		function(error) {
                    		if (error != null) {
	                    	   	var heatmap="\" onclick='alert(\"Some StravistiX functions will not work without your location position. Please make sure you have allowed location tracking on this site. Click on the location icon placed on the right inside the chrome web address bar => Clear tracking setting => Refresh page > Allow tracking.\")";
     	         	      	}
        	        	}
            		);
        		}
				//stravaMenuHtml += "<li><a href='http://labs.strava.com/achievement-map/' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.komMapIcon + "'/> <span>KOM/CR Map</span></a></li>";
				//stravaMenuHtml += "<li id='splus_menu_heatmap'><a href='#' target='_blank'><img style='vertical-align:middle' src='" + this.appResources_.heatmapIcon + "'/> <span>Heat Map</span></a></li>";
                htmlRemoteViewForActivity += '<a title="'+this[3]+'" data-menu=""  target="_blank" style="color: #333;" href="' + heatmap + '">' + this[1] + this[0]+'</a>';
            //
            // everything else
            } else {
                htmlRemoteViewForActivity += "<a data-menu='' target='_blank' style='color: #333;' href='" + this[1] + pageView.activity().id + this[2] + "'>" + this[0] + "</a>";                
            };
		    htmlRemoteViewForActivity += "</li>";
        });
        htmlRemoteViewForActivity += "</ul>";
        htmlRemoteViewForActivity += "</li>";

        htmlRemoteViewForActivity = $(htmlRemoteViewForActivity);
        $("#pagenav").append(htmlRemoteViewForActivity);

        // Add tcx export
        if (this.authorOfActivity) {
            var htmlForTCXExport = "<li><a href='" + window.location.pathname + "/export_tcx'>Export TCX</a></li>";
            $(".actions-menu .slide-menu .options").append(htmlForTCXExport);
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
