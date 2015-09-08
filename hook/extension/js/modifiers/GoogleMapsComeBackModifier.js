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
    },

    fetchPathFromStream: function(activityId) {

        var url = "/activities/" + activityId + "/streams?stream_types[]=latlng";

        $.ajax(url).done(function(jsonResponse) {

            this.displayGoogleMapWithPath(jsonResponse.latlng);

        }.bind(this));

    },

    displayGoogleMapWithPath: function(pathArray) {

        var html = '<div style="padding-bottom:10px;"><div style="height:350px;width:100%;" id="gmaps_canvas"></div></div>';

        $('#map-canvas').before(html).each(function() {

            var map = new google.maps.Map(document.getElementById("gmaps_canvas"), {
                mapTypeId: google.maps.MapTypeId.TERRAIN
            });

            var points = [];
            var bounds = new google.maps.LatLngBounds();

            _.each(pathArray, function(position) {
                var p = new google.maps.LatLng(position[0], position[1]);
                points.push(p);
                bounds.extend(p);
            });

            var poly = new google.maps.Polyline({
                // use your own style here
                path: points,
                strokeColor: "#FF0000",
                strokeOpacity: .7,
                strokeWeight: 4
            });

            poly.setMap(map);

            // fit bounds to track
            map.fitBounds(bounds);

        }.bind(this));

    },

    getGoogleMapsApi: function() {
        var script_tag = document.createElement('script');
        script_tag.setAttribute("type", "text/javascript");
        script_tag.setAttribute("src", "https://maps.google.com/maps/api/js?sensor=false&callback=googleMapsApiLoaded");
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
    }
};
