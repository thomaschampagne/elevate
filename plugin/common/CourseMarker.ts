import * as _ from 'lodash';
import {IActivityStream} from '../core/scripts/interfaces/IActivityData';

export class CourseMaker {

    public createGpx(courseName: string, activityStream: IActivityStream): string {

        let gpxString: string = '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<gpx creator="StravistiX" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3">\n' +
            '<metadata>\n' +
            '<author>\n' +
            '<name>StravistiX</name>\n' +
            '<link href="http://thomaschampagne.github.io/stravistix/"/>\n' +
            '</author>\n' +
            '</metadata>\n' +
            '<trk>\n' +
            '<name>' + courseName + '</name>\n' +
            '<trkseg>\n';

        for (let i: number = 0; i < activityStream.latlng.length; i++) {

            // Position
            gpxString += '<trkpt lat="' + activityStream.latlng[i][0] + '" lon="' + activityStream.latlng[i][1] + '">\n';

            // Altitude
            if (_.isNumber(activityStream.altitude[i])) {
                gpxString += '<ele>' + activityStream.altitude[i] + '</ele>\n';
            }

            // Time
            gpxString += '<time>' + (new Date(activityStream.time[i] * 1000)).toISOString() + '</time>\n';

            if (activityStream.heartrate || activityStream.cadence) {

                gpxString += '<extensions>\n';

                if (activityStream.watts && _.isNumber(activityStream.watts[i])) {
                    gpxString += '<power>' + activityStream.watts[i] + '</power>\n';
                }

                gpxString += '<gpxtpx:TrackPointExtension>\n';

                if (activityStream.heartrate && _.isNumber(activityStream.heartrate[i])) {
                    gpxString += '<gpxtpx:hr>' + activityStream.heartrate[i] + '</gpxtpx:hr>\n';
                }
                if (activityStream.cadence && _.isNumber(activityStream.cadence[i])) {
                    gpxString += '<gpxtpx:cad>' + activityStream.cadence[i] + '</gpxtpx:cad>\n';
                }

                gpxString += '</gpxtpx:TrackPointExtension>\n';
                gpxString += '</extensions>\n';
            }

            gpxString += '</trkpt>\n';
        }

        gpxString += '</trkseg>\n';
        gpxString += '</trk>\n';
        gpxString += '</gpx>';

        return gpxString;
    }

}
