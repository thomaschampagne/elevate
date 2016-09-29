interface ISegmentInfo {
    id: number;
    name: string;
    climb_category: number;
    climb_category_desc: number;
    avg_grade: number;
    start_latlng: Array<number>;
    end_latlng: Array<number>;
    elev_difference: number;
    distance: number;
    type: string;
}

class SegmentProcessor {

    public static cachePrefix: string = 'stravistix_nearbySegments_';

    protected vacuumProcessor: VacuumProcessor;
    protected segmentId: number;

    constructor(vacuumProcessor: VacuumProcessor, segmentId: number) {
        this.vacuumProcessor = vacuumProcessor;
        this.segmentId = segmentId;
    }

    getNearbySegmentsAround(callback: (segmentsInBounds: Array<ISegmentInfo>) => void): void {

        // NearbySegmentsAround cached?
        let cacheResult: any = JSON.parse(localStorage.getItem(SegmentProcessor.cachePrefix + this.segmentId));

        if (!_.isNull(cacheResult) && !env.debugMode) {
            if (env.debugMode) console.log("Using existing nearbySegments cache in non debug mode: " + JSON.stringify(cacheResult));
            callback(cacheResult);
            return;
        }


        // Find search point of segment first
        this.getSegmentAroundSearchPoint((searchPoint: LatLon) => {

            // Prepare Bounding box 2 km around search point
            let boundingBox: Array<number> = this.getBoundingBox(searchPoint, 2000);

            // Find segments in bounding box
            this.getSegmentsInBoundingBox(boundingBox, (segmentsInBounds: Array<ISegmentInfo>) => {

                if (env.debugMode) console.log("Creating nearbySegments cache: " + JSON.stringify(segmentsInBounds));
                try {
                    localStorage.setItem(SegmentProcessor.cachePrefix + this.segmentId, JSON.stringify(segmentsInBounds)); // Cache the result to local storage
                } catch (err) {
                    console.warn(err);
                    localStorage.clear();
                }
                callback(segmentsInBounds);
            });
        });
    }

    getBoundingBox(point: LatLon, distance: number): Array<number> {

        return [
            point.destinationPoint(distance, 180).lat,
            point.destinationPoint(distance, -90).lon,
            point.destinationPoint(distance, 0).lat,
            point.destinationPoint(distance, 90).lon,
        ];
    }

    getSegmentsInBoundingBox(boundingBox: Array<number>, callback: (segmentsData: Array<ISegmentInfo>) => void): void {

        this.vacuumProcessor.getSegmentsFromBounds(
            boundingBox[0] + ',' + boundingBox[1],
            boundingBox[2] + ',' + boundingBox[3],
            (segmentsData: any) => {

                // Flag cycling/running
                _.each(segmentsData.cycling.segments, (segment: any) => {
                    segment.type = 'cycling';
                });

                _.each(segmentsData.running.segments, (segment: any) => {
                    segment.type = 'running';
                });

                // Merge cycling/running arrays into one entry array
                segmentsData = _.union(segmentsData.cycling.segments, segmentsData.running.segments);

                // Remove watched segment
                segmentsData = _.filter(segmentsData, (segment: any) => {
                    return (segment.id !== this.segmentId);
                });

                callback(segmentsData);
            }
        );
    }

    getSegmentAroundSearchPoint(callback: (latLon: LatLon) => void) {

        this.vacuumProcessor.getSegmentStream(this.segmentId, (stream: any) => {

            let startPoint: Array<number> = stream.latlng[0];
            let midPoint: Array<number> = stream.latlng[(stream.latlng.length / 2).toFixed(0)];
            let endPoint: Array<number> = stream.latlng[stream.latlng.length - 1];

            let approximateSearchPoint: Array<number> = [null, null];

            // Add start + end vector
            approximateSearchPoint[0] = (startPoint[0] + endPoint[0]) / 2;
            approximateSearchPoint[1] = (startPoint[1] + endPoint[1]) / 2;

            // Add midPoint
            approximateSearchPoint[0] = ( approximateSearchPoint[0] + midPoint[0]) / 2;
            approximateSearchPoint[1] = ( approximateSearchPoint[1] + midPoint[1]) / 2;

            callback(new LatLon(approximateSearchPoint[0], approximateSearchPoint[1]));
        });
    }
}


