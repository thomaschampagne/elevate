/**
 *   SegmentProcessor is responsible of ...
 */
function SegmentProcessor(vacuumProcessor, segmentId) {
    this.vacuumProcessor_ = vacuumProcessor;
    this.segmentId_ = segmentId;
}

SegmentProcessor.cachePrefix = 'stravaplus_nearbySegments_';

/**
 * Define prototype
 */
SegmentProcessor.prototype = {


    getNearbySegmentsAround: function getNearbySegmentsAround(callback) {


        // NearbySegmentsAround cached?
        var cacheResult = JSON.parse(localStorage.getItem(SegmentProcessor.cachePrefix + this.segmentId_));

        if (!_.isNull(cacheResult) && !env.debugMode) {
            if (env.debugMode) console.log("Using existing nearbySegments cache in non debug mode: " + JSON.stringify(cacheResult));
            callback(cacheResult);
            return;
        }

        // Find search point of segment first
        this.getSegmentAroundSearchPoint(function(searchPoint) {

            // Prepare Bounding box 2 km around search point
            var boundingBox = searchPoint.boundingBox(2.0);

            // Find segments in bounding box
            this.getSegmentsInBoundingBox(boundingBox, function(segmentsInBounds) {

                if (env.debugMode) console.log("Creating nearbySegments cache: " + JSON.stringify(segmentsInBounds));
                localStorage.setItem(SegmentProcessor.cachePrefix + this.segmentId_, JSON.stringify(segmentsInBounds)); // Cache the result to local storage
                callback(segmentsInBounds);

            }.bind(this));

        }.bind(this));

    },

    getSegmentsInBoundingBox: function getSegmentsInBoundingBox(boundingBox, callback) {

        this.vacuumProcessor_.getSegmentsFromBounds(

            boundingBox[0] + ',' + boundingBox[1],
            boundingBox[2] + ',' + boundingBox[3],

            function(segmentsData) {

                // Flag cycling/running
                _.each(segmentsData.cycling.segments, function(segment) {
                    segment.type = 'cycling';
                });
                
                _.each(segmentsData.running.segments, function(segment) {
                    segment.type = 'running';
                });

                // Merge cycling/running arrays into one entry array
                segmentsData = _.union(segmentsData.cycling.segments, segmentsData.running.segments);

                // Remove watched segment
                segmentsData = _.filter(segmentsData, function(segment) {
                    return (segment.id !== this.segmentId_);
                }, this);

                callback(segmentsData);

            }.bind(this)
        );

    },

    getSegmentAroundSearchPoint: function getSegmentAroundSearchPoint(callback) {

        this.vacuumProcessor_.getSegmentStream(this.segmentId_, function(stream) {

            var startPoint = stream.latlng[0];
            var midPoint = stream.latlng[(stream.latlng.length / 2).toFixed(0)];
            var endPoint = stream.latlng[stream.latlng.length - 1];

            var approximativeSearchPoint = [];

            // Add start + end vector
            approximativeSearchPoint[0] = (startPoint[0] + endPoint[0]) / 2;
            approximativeSearchPoint[1] = (startPoint[1] + endPoint[1]) / 2;

            // Add middPoint
            approximativeSearchPoint[0] = (approximativeSearchPoint[0] + midPoint[0]) / 2;
            approximativeSearchPoint[1] = (approximativeSearchPoint[1] + midPoint[1]) / 2;

            callback(new LatLon(approximativeSearchPoint[0], approximativeSearchPoint[1]));
        });
    },
};
