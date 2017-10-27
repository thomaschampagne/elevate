import * as _ from "lodash";
import {IActivityStream} from "./interfaces/IActivityData";

export interface ICourseBounds {
    start: number;
    end: number;
}

export enum ExportTypes {
    GPX,
    TCX,
}

export class CourseMaker {

    public create(exportType: ExportTypes, courseName: string, activityStream: IActivityStream, bounds?: ICourseBounds): string {

        let courseData: string = null;

        switch (exportType) {

            case ExportTypes.GPX:
                courseData = this.createGpx(courseName, activityStream, bounds);
                break;

            case ExportTypes.TCX:
                courseData = this.createTcx(courseName, activityStream, bounds);
                break;

            default:
                throw new Error("Export type do not exist");
        }

        return courseData;
    }

    private createGpx(courseName: string, activityStream: IActivityStream, bounds?: ICourseBounds): string {

        if (bounds) {
            activityStream = this.cutStreamsAlongBounds(activityStream, bounds);
        }

        let gpxString: string = '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<gpx creator="StravistiX" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3">\n' +
            "<metadata>\n" +
            "<author>\n" +
            "<name>StravistiX</name>\n" +
            '<link href="http://thomaschampagne.github.io/stravistix/"/>\n' +
            "</author>\n" +
            "</metadata>\n" +
            "<trk>\n" +
            "<name>" + courseName + "</name>\n" +
            "<trkseg>\n";

        for (let i: number = 0; i < activityStream.latlng.length; i++) {

            // Position
            gpxString += '<trkpt lat="' + activityStream.latlng[i][0] + '" lon="' + activityStream.latlng[i][1] + '">\n';

            // Altitude
            if (activityStream.altitude && _.isNumber(activityStream.altitude[i])) {
                gpxString += "<ele>" + activityStream.altitude[i] + "</ele>\n";
            }

            // Time
            gpxString += "<time>" + (new Date(activityStream.time[i] * 1000)).toISOString() + "</time>\n";

            if (activityStream.heartrate || activityStream.cadence) {

                gpxString += "<extensions>\n";

                if (activityStream.watts && _.isNumber(activityStream.watts[i])) {
                    gpxString += "<power>" + activityStream.watts[i] + "</power>\n";
                }

                gpxString += "<gpxtpx:TrackPointExtension>\n";

                if (activityStream.heartrate && _.isNumber(activityStream.heartrate[i])) {
                    gpxString += "<gpxtpx:hr>" + activityStream.heartrate[i] + "</gpxtpx:hr>\n";
                }
                if (activityStream.cadence && _.isNumber(activityStream.cadence[i])) {
                    gpxString += "<gpxtpx:cad>" + activityStream.cadence[i] + "</gpxtpx:cad>\n";
                }

                gpxString += "</gpxtpx:TrackPointExtension>\n";
                gpxString += "</extensions>\n";
            }

            gpxString += "</trkpt>\n";
        }

        gpxString += "</trkseg>\n";
        gpxString += "</trk>\n";
        gpxString += "</gpx>";

        return gpxString;
    }

    private createTcx(courseName: string, activityStream: IActivityStream, bounds?: ICourseBounds): string {

        if (bounds) {
            activityStream = this.cutStreamsAlongBounds(activityStream, bounds);
        }

        const startTime: number = activityStream.time[0];
        const startDistance: number = activityStream.distance[0];

        let TotalTimeSeconds = 0;
        let DistanceMeters = 0;
        if (activityStream.latlng.length > 0) {
            TotalTimeSeconds += activityStream.time[activityStream.latlng.length - 1] - startTime;
            DistanceMeters += activityStream.distance[activityStream.latlng.length - 1] - startDistance;
        }

        // Keep Name field to 15 characters or fewer
        if (courseName.length > 15) {
            courseName = courseName.slice(0, 15);
        }

        let tcxString: string = '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<TrainingCenterDatabase xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd" xmlns:ns5="http://www.garmin.com/xmlschemas/ActivityGoals/v1" xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2" xmlns:ns2="http://www.garmin.com/xmlschemas/UserProfile/v2" xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n' +
            "<Courses>\n" +
            "<Course>\n" +
            "<Name>" + courseName + "</Name>\n" +
            "<Lap>\n" +
            "<TotalTimeSeconds>" + TotalTimeSeconds + "</TotalTimeSeconds>\n" +
            "<DistanceMeters>" + DistanceMeters + "</DistanceMeters>\n" +
            "<Intensity>Active</Intensity>\n";

        tcxString += "</Lap>\n";
        tcxString += "<Track>\n";

        for (let i: number = 0; i < activityStream.latlng.length; i++) {

            tcxString += "<Trackpoint>\n";
            tcxString += "<Time>" + (new Date((activityStream.time[i] - startTime) * 1000)).toISOString() + "</Time>\n";
            tcxString += "<Position>\n";
            tcxString += "<LatitudeDegrees>" + activityStream.latlng[i][0] + "</LatitudeDegrees>\n";
            tcxString += "<LongitudeDegrees>" + activityStream.latlng[i][1] + "</LongitudeDegrees>\n";
            tcxString += "</Position>\n";
            if (activityStream.altitude && _.isNumber(activityStream.altitude[i])) {
                tcxString += "<AltitudeMeters>" + activityStream.altitude[i] + "</AltitudeMeters>\n";
            }
            tcxString += "<DistanceMeters>" + (activityStream.distance[i] - startDistance) + "</DistanceMeters>\n";

            if (activityStream.heartrate && _.isNumber(activityStream.heartrate[i])) {
                tcxString += "<HeartRateBpm><Value>" + activityStream.heartrate[i] + "</Value></HeartRateBpm>\n";
            }

            if (activityStream.cadence && _.isNumber(activityStream.cadence[i])) {
                tcxString += "<Cadence>" + activityStream.cadence[i] + "</Cadence>\n";
            }

            tcxString += "</Trackpoint>\n";
        }

        tcxString += "</Track>\n";
        tcxString += "</Course>\n";
        tcxString += "</Courses>\n";
        tcxString += "</TrainingCenterDatabase>";

        return tcxString;
    }

    protected cutStreamsAlongBounds(activityStream: IActivityStream, bounds: ICourseBounds): IActivityStream {

        if (!_.isEmpty(activityStream.velocity_smooth)) {
            activityStream.velocity_smooth = activityStream.velocity_smooth.slice(bounds.start, bounds.end);
        }

        if (!_.isEmpty(activityStream.time)) {
            activityStream.time = activityStream.time.slice(bounds.start, bounds.end);
        }

        if (!_.isEmpty(activityStream.latlng)) {
            activityStream.latlng = activityStream.latlng.slice(bounds.start, bounds.end);
        }

        if (!_.isEmpty(activityStream.heartrate)) {
            activityStream.heartrate = activityStream.heartrate.slice(bounds.start, bounds.end);
        }

        if (!_.isEmpty(activityStream.watts)) {
            activityStream.watts = activityStream.watts.slice(bounds.start, bounds.end);
        }

        if (!_.isEmpty(activityStream.watts_calc)) {
            activityStream.watts_calc = activityStream.watts_calc.slice(bounds.start, bounds.end);
        }

        if (!_.isEmpty(activityStream.cadence)) {
            activityStream.cadence = activityStream.cadence.slice(bounds.start, bounds.end);
        }

        if (!_.isEmpty(activityStream.grade_smooth)) {
            activityStream.grade_smooth = activityStream.grade_smooth.slice(bounds.start, bounds.end);
        }

        if (!_.isEmpty(activityStream.altitude)) {
            activityStream.altitude = activityStream.altitude.slice(bounds.start, bounds.end);
        }

        if (!_.isEmpty(activityStream.distance)) {
            activityStream.distance = activityStream.distance.slice(bounds.start, bounds.end);
        }

        if (!_.isEmpty(activityStream.altitude_smooth)) {
            activityStream.altitude_smooth = activityStream.altitude_smooth.slice(bounds.start, bounds.end);
        }

        if (!_.isEmpty(activityStream.grade_adjusted_distance)) {
            activityStream.grade_adjusted_distance = activityStream.grade_adjusted_distance.slice(bounds.start, bounds.end);
        }

        return activityStream;
    }

}
