/**
 *   GoogleMapsComeBackModifier is responsible of ...
 */
function GoogleMapsComeBackModifier(activityId, appResources, userSettings) {
    this.activityId = activityId;
    this.appResources = appResources;
    this.userSettings = userSettings;
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

        // Skip modify if analysis section is watched
        if (this.isAnalysisSection()) {
            console.log('[GoogleMapsComeBackModifier] Skipping Analysis Section');
            return;
        }

        // Bind function for be called when Google API loaded
        $(window).bind('gMapsLoaded', this.googleMapsApiLoaded(this.activityId));

        // Next load the Google API from external
        this.getGoogleMapsApi();


        // If segment Item has been clicked then fetch info on segment and display
        /* 
        var self = this;
        $('[data-segment-effort-id]').click(function() {
            var effortIdClicked = $(this).attr('data-segment-effort-id');
            self.fetchSegmentInfoAndDisplayWithGoogleMap(self.pathArray, effortIdClicked);
        });
        */

    },

    googleMapsApiLoaded: function(activityId) {

        // Place the gmaps buttons
        this.placeGoogleMapsButtons(activityId);

        // Handle case when user overview button
        // If user click left overview button then reload gmap buttons placement
        $('[data-menu="overview"]').click(function() {

            // Execute at the end with set timeout
            setTimeout(function() {
                // Place the gmaps buttons
                this.placeGoogleMapsButtons(activityId);

            }.bind(this));

        }.bind(this));

        // If user click left segment button (running ie) then reload gmap buttons placement
        $('[data-menu="segments"]').click(function() {

            // Execute at the end with set timeout
            setTimeout(function() {
                // Place the gmaps buttons
                this.placeGoogleMapsButtons(activityId);

            }.bind(this));

        }.bind(this));

    },

    showWaitLoadingMessage: function() {
        $.fancybox('<div style="width:100px;height:50px">Loading...</div>', {
            'autoScale': true
        });
    },

    placeGoogleMapsButtons: function(activityId) {

        // Place show button over MapBox activity main map
        this.placeMainGoogleMapButton(activityId);

        // PLACE SEGMENT AREA BUTTON 'View in Google Maps'
        this.placeSegmentAreaGoogleMapButton(activityId);
    },

    placeMainGoogleMapButton: function(activityId) {

        // Do not add Main Google Map Button if native strava map not displayed
        if (!$('#map-canvas') || $('#map-canvas').is(':hidden')) {
            return;
        }

        $('#map-canvas').before('<a class="button btn-block btn-primary" id="showInGoogleMap">View in Google Maps</a>').each(function() {

            $('#showInGoogleMap').on('click', function() {

                // Show loading message while loading gmaps and path
                this.showWaitLoadingMessage();

                this.fetchPathFromStream(activityId, function(pathArray) {

                    this.pathArray = pathArray;

                    // Check if effort id is given
                    var effortId = this.getEffortId();

                    if (effortId) {
                        this.fetchSegmentInfoAndDisplayWithGoogleMap(this.pathArray, effortId);
                    } else {
                        this.displayGoogleMapWithPath(this.pathArray);
                    }

                }.bind(this));

            }.bind(this));

        }.bind(this));
    },

    placeSegmentAreaGoogleMapButton: function(activityId) {

        // Listening for Segment Change visualization
        if (!Strava.Labs) return;

        var view = Strava.Labs.Activities.SegmentLeaderboardView;

        if (!view) return;

        var functionRender = view.prototype.render;
        var self = this;

        view.prototype.render = function() {

            var r = functionRender.apply(this, Array.prototype.slice.call(arguments));

            // Button already existing, skiping...
            if ($('#showSegInGoogleMap').length) {
                return;
            }

            var anchor;

            if ($('.effort-map')) { // Try to attach segment button to effort map if cycling activity
                anchor = $('.effort-map');
            } else if ($('#map-canvas')) { // Try to attach segment button to map canvas if running activity
                anchor = $('#map-canvas');
            } else {
                anchor = null;
            }

            if (!anchor) {
                console.error('No anchor found to attach segment google map button');
            }

            anchor.before('<a class="button btn-block btn-primary" id="showSegInGoogleMap">View in Google Maps</a>').each(function() {

                $('#showSegInGoogleMap').on('click', function() {

                    self.showWaitLoadingMessage();

                    self.fetchPathFromStream(activityId, function(pathArray) {

                        self.pathArray = pathArray;

                        // Check if effort id is given
                        var effortId = self.getEffortId();

                        if (effortId) {
                            self.fetchSegmentInfoAndDisplayWithGoogleMap(self.pathArray, effortId);
                        } else {
                            console.error('Cannot display map: effortId not given');
                        }

                    });
                });
            });

            return r;
        };
    },

    getEffortId: function() {
        return (window.location.pathname.split('/')[4] || window.location.hash.replace('#', '')) || false;
    },

    isAnalysisSection: function() {
        return window.location.pathname.match('analysis');
    },

    fetchPathFromStream: function(activityId, callback) {
        var streamPathUrl = "/activities/" + activityId + "/streams?stream_types[]=latlng";
        $.ajax(streamPathUrl).done(function(jsonResponse) {
            callback(jsonResponse.latlng);
        }.bind(this));
    },

    fetchSegmentInfoFromEffortId: function(effortId, callback)  {

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
            callback(segmentInfosResponse);
        });
    },

    fetchSegmentInfoAndDisplayWithGoogleMap: function(pathArray, effortId) {

        // Display GoogleMap With Path And Segment Effort highlighted
        this.fetchSegmentInfoFromEffortId(effortId, function(segmentInfosResponse) {
            // Slice latlong array
            this.displayGoogleMapWithPath(
                pathArray, [segmentInfosResponse.start_index, segmentInfosResponse.end_index]
            );
        }.bind(this));
    },

    displayGoogleMapWithPath: function(mainPathArray, highlightFromTo) {

        var mapSize = [
            window.innerWidth * 0.950,
            window.innerHeight * 0.875
        ];

        var html = '<div style="padding-bottom:10px; text-align:center;"><div style="height:' + mapSize[1] + 'px;width:' + mapSize[0] + 'px;" id="gmaps_canvas"></div><a target="_blank" href="' + this.appResources.settingsLink + '#/commonSettings">Go to extension settings if you want to set specific layer OR disable google maps buttons</a></div>';

        $.fancybox(html, {
            'autoScale': true,
            'transitionIn': 'fade',
            'transitionOut': 'fade'
        });

        // Test if exit then no append before
        if (!$('#gmaps_canvas').length) {

            $('#map-canvas').before(html).each(function() {
                this.applyToMap(mainPathArray, highlightFromTo);
            }.bind(this));
        } else {
            this.applyToMap(mainPathArray, highlightFromTo);
        }

    },

    applyToMap: function(mainPathArray, highlightFromTo) {

        var layerType = google.maps.MapTypeId.TERRAIN; // Use terrain by default

        // If user layer settings value exist into Google Maps Layer Type then use it
        if(_.indexOf(_.values(google.maps.MapTypeId), this.userSettings.reviveGoogleMapsLayerType) != -1) {
            layerType = this.userSettings.reviveGoogleMapsLayerType;
        }

        // if (!this.map) {
        this.map = new google.maps.Map(document.getElementById("gmaps_canvas"), {
            mapTypeId: layerType,
            overviewMapControl: true
        });
        // }

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
    },

    getGoogleMapsApi: function() {
        var script_tag = document.createElement('script');
        script_tag.setAttribute("type", "text/javascript");
        script_tag.setAttribute("src", "https://maps.google.com/maps/api/js?sensor=false&callback=googleMapsApiLoaded");
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
    }
};
