/**
 *   GoogleMapsComeBackModifier is responsible of ...
 */
function GoogleMapsComeBackModifier(activityId) {
    this.activityId = activityId;
}

/**
 * Define prototype
 */

// Setup callback in window object when gmaps ready
window.googleMapsApiLoaded = function() {
    $(window).trigger('gMapsLoaded');
}

GoogleMapsComeBackModifier.prototype = {

    modify: function modify() {

        $(window).bind('gMapsLoaded', this.fetchPathFromStream(this.activityId));
        this.getGoogleMapsApi();

/*
        $('[data-segment-effort-id]').click(function () {
            console.log(''toot'');
            console.log(this);
        });
*/
    },

    fetchPathFromStream: function(activityId) {

        var streamPathUrl = "/activities/" + activityId + "/streams?stream_types[]=latlng";

        $.ajax(streamPathUrl).done(function(jsonResponse) {

            var effortId = (window.location.pathname.split('/')[4] || window.location.hash.replace('#', '')) || false;

            if (effortId) {

                // Get effortId bounds
                var segmentInfosResponse;
                $.ajax({
                    url: '/segment_efforts/' + effortId,
                    type: 'GET',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                    },
                    dataType: 'json',
                    success: function(xhrResponseText) {
                        segmentInfosResponse = xhrResponseText;
                    },
                    error: function(err) {
                        console.error(err);
                    }
                }).then(function() {

                    // Call Activity Processor with bounds
                    if (!segmentInfosResponse.start_index && segmentInfosResponse.end_index) {
                        console.error('No start_index end_index found for');
                    }

                    // Slice latlong array
                    this.displayGoogleMapWithPath(
                        jsonResponse.latlng, [segmentInfosResponse.start_index, segmentInfosResponse.end_index]
                    );

                }.bind(this));


            } else {
                this.displayGoogleMapWithPath(jsonResponse.latlng);
            }

        }.bind(this));

    },

    displayGoogleMapWithPath: function(mainPathArray, highlightFromTo) {

        var html = '<div style="padding-bottom:10px;"><div style="height:350px;width:100%;" id="gmaps_canvas"></div></div>';

        $('#map-canvas').before(html).each(function() {

            this.map = new google.maps.Map(document.getElementById("gmaps_canvas"), {
                mapTypeId: google.maps.MapTypeId.TERRAIN
            });

            var points = [];
            var bounds = new google.maps.LatLngBounds();

            _.each(mainPathArray, function(position) {
                var p = new google.maps.LatLng(position[0], position[1]);
                points.push(p);
                bounds.extend(p);
            });

            var mainPathPoly = new google.maps.Polyline({
                // use your own style here
                path: points,
                strokeColor: "#FF0000",
                strokeOpacity: .7,
                strokeWeight: 4
            });

            // Set path to map
            mainPathPoly.setMap(this.map);

            // fit bounds to track
            this.map.fitBounds(bounds);

            if (highlightFromTo) {

                var secondPathPoly = new google.maps.Polyline({
                    path: points.slice(highlightFromTo[0], highlightFromTo[1]),
                    strokeColor: "#105cb6",
                    strokeOpacity: 1,
                    strokeWeight: 4
                });

                // Erase bounds and computed new ones with highlighted path
                bounds = new google.maps.LatLngBounds();
                _.each(mainPathArray.slice(highlightFromTo[0], highlightFromTo[1]), function(position) {
                    var p = new google.maps.LatLng(position[0], position[1]);
                    bounds.extend(p);
                });

                // Update with new bounds from highlighted path
                this.map.fitBounds(bounds);

                // Apply new poly line
                secondPathPoly.setMap(this.map);
            }

        }.bind(this));

    },

    getGoogleMapsApi: function() {
        var script_tag = document.createElement('script');
        script_tag.setAttribute("type", "text/javascript");
        script_tag.setAttribute("src", "https://maps.google.com/maps/api/js?sensor=false&callback=googleMapsApiLoaded");
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
    }
};
