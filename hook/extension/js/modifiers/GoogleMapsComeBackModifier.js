/**
 *   GoogleMapsComeBackModifier is responsible of ...
 */
function GoogleMapsComeBackModifier() {}

/**
 * Define prototype
 */

// Setup callback in window object when gmaps ready
window.gMapsCallback = function() {
    $(window).trigger('gMapsLoaded');
    console.log('gMapsLoaded');
}

GoogleMapsComeBackModifier.prototype = {

    modify: function modify() {

        console.log('GoogleMapsComeBackModifier::modify');

        $(window).bind('gMapsLoaded', this.doStuff);

        this.getScript();

        // // Get bike name on Activity Page
        // var bikeDisplayedOnActivityPage = $('.gear-name').text().trim();

        // // Get odo from map
        // var activityBikeOdo = 'No bike declared';
        // try {
        //     activityBikeOdo = this.bikeOdoArray_[btoa(bikeDisplayedOnActivityPage)];
        // } catch (err) {
        //     console.warn('Unable to find bike odo for this Activity');
        // }

        // var newBikeDisplayHTML = bikeDisplayedOnActivityPage + '<strong> / ' + activityBikeOdo + '</strong>';

        // var forceRefreshActionHTML = '<a href="#" style="cursor: pointer;" title="Force odo refresh for this athlete\'s bike. Usually it refresh every 2 hours..." id="bikeOdoForceRefresh">Force refresh odo</a>';

        // // Edit Activity Page
        // $('.gear-name').html(newBikeDisplayHTML + '<br />' + forceRefreshActionHTML).each(function() {

        //     $('#bikeOdoForceRefresh').on('click', function() {
        //         this.handleUserBikeOdoForceRefresh_();
        //     }.bind(this));

        // }.bind(this));
    },

    doStuff: function() {

        console.log('GoogleMapsComeBackModifier::doStuff');


        var html = 'Maps:<div style="height:400px;width:100%;" id="gmaps_canvas"></div>Maps:';

        $('.achievements.row').before(html).each(function() {

            // $('#bikeOdoForceRefresh').on('click', function() {
            //     this.handleUserBikeOdoForceRefresh_();
            // }.bind(this));


            var map = new google.maps.Map(document.getElementById("gmaps_canvas"), {
                mapTypeId: google.maps.MapTypeId.TERRAIN
            });

            var points = [];
            var bounds = new google.maps.LatLngBounds();

            var p = new google.maps.LatLng(0, 0);
            points.push(p);
            bounds.extend(p);

            var poly = new google.maps.Polyline({
                // use your own style here
                path: points,
                strokeColor: "#FF00AA",
                strokeOpacity: .7,
                strokeWeight: 4
            });

            poly.setMap(map);

            // fit bounds to track
            map.fitBounds(bounds);


        }.bind(this));



        // var mapOptions = {
        //     zoom: 8,
        //     center: new google.maps.LatLng(47.3239, 5.0428),
        //     mapTypeId: google.maps.MapTypeId.ROADMAP
        // };
        // map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
    },

    getScript: function() {
        var script_tag = document.createElement('script');
        script_tag.setAttribute("type", "text/javascript");
        script_tag.setAttribute("src", "https://maps.google.com/maps/api/js?sensor=false&callback=gMapsCallback");
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
    }

    // handleUserBikeOdoForceRefresh_: function handleUserBikeOdoForceRefresh_() {
    //     localStorage.removeItem(this.cacheKey);
    //     window.location.reload();
    // },
};
