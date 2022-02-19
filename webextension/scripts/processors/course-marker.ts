import _ from "lodash";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { AppPackage } from "@elevate/shared/tools/app-package";

export interface ICourseBounds {
  start: number;
  end: number;
}

export enum ExportTypes {
  GPX,
  TCX
}

export class CourseMaker {
  public create(exportType: ExportTypes, courseName: string, streams: Streams, bounds?: ICourseBounds): string {
    let courseData: string = null;

    switch (exportType) {
      case ExportTypes.GPX:
        courseData = this.createGpx(courseName, streams, bounds);
        break;

      case ExportTypes.TCX:
        courseData = this.createTcx(courseName, streams, bounds);
        break;

      default:
        throw new Error("Export type do not exist");
    }

    return courseData;
  }

  protected cutStreamsAlongBounds(streams: Streams, bounds: ICourseBounds): Streams {
    if (!_.isEmpty(streams.velocity_smooth)) {
      streams.velocity_smooth = streams.velocity_smooth.slice(bounds.start, bounds.end);
    }

    if (!_.isEmpty(streams.time)) {
      streams.time = streams.time.slice(bounds.start, bounds.end);
    }

    if (!_.isEmpty(streams.latlng)) {
      streams.latlng = streams.latlng.slice(bounds.start, bounds.end);
    }

    if (!_.isEmpty(streams.heartrate)) {
      streams.heartrate = streams.heartrate.slice(bounds.start, bounds.end);
    }

    if (!_.isEmpty(streams.watts)) {
      streams.watts = streams.watts.slice(bounds.start, bounds.end);
    }

    if (!_.isEmpty(streams.watts_calc)) {
      streams.watts_calc = streams.watts_calc.slice(bounds.start, bounds.end);
    }

    if (!_.isEmpty(streams.cadence)) {
      streams.cadence = streams.cadence.slice(bounds.start, bounds.end);
    }

    if (!_.isEmpty(streams.grade_smooth)) {
      streams.grade_smooth = streams.grade_smooth.slice(bounds.start, bounds.end);
    }

    if (!_.isEmpty(streams.altitude)) {
      streams.altitude = streams.altitude.slice(bounds.start, bounds.end);
    }

    if (!_.isEmpty(streams.distance)) {
      streams.distance = streams.distance.slice(bounds.start, bounds.end);
    }

    if (!_.isEmpty(streams.grade_adjusted_speed)) {
      streams.grade_adjusted_speed = streams.grade_adjusted_speed.slice(bounds.start, bounds.end);
    }

    return streams;
  }

  private createGpx(courseName: string, streams: Streams, bounds?: ICourseBounds): string {
    if (bounds) {
      streams = this.cutStreamsAlongBounds(streams, bounds);
    }

    let gpxString: string =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<gpx creator="Elevate" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3">\n' +
      "<metadata>\n" +
      "<author>\n" +
      "<name>Elevate</name>\n" +
      '<link href="' +
      AppPackage.getElevateWebSite() +
      '"/>\n' +
      "</author>\n" +
      "</metadata>\n" +
      "<trk>\n" +
      "<name>" +
      courseName +
      "</name>\n" +
      "<trkseg>\n";

    for (let i = 0; i < streams.latlng.length; i++) {
      // Position
      gpxString += '<trkpt lat="' + streams.latlng[i][0] + '" lon="' + streams.latlng[i][1] + '">\n';

      // Altitude
      if (streams.altitude && _.isNumber(streams.altitude[i])) {
        gpxString += "<ele>" + streams.altitude[i] + "</ele>\n";
      }

      // Time
      gpxString += "<time>" + new Date(streams.time[i] * 1000).toISOString() + "</time>\n";

      if (streams.heartrate || streams.cadence) {
        gpxString += "<extensions>\n";

        if (streams.watts && _.isNumber(streams.watts[i])) {
          gpxString += "<power>" + streams.watts[i] + "</power>\n";
        }

        gpxString += "<gpxtpx:TrackPointExtension>\n";

        if (streams.heartrate && _.isNumber(streams.heartrate[i])) {
          gpxString += "<gpxtpx:hr>" + streams.heartrate[i] + "</gpxtpx:hr>\n";
        }
        if (streams.cadence && _.isNumber(streams.cadence[i])) {
          gpxString += "<gpxtpx:cad>" + streams.cadence[i] + "</gpxtpx:cad>\n";
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

  private createTcx(courseName: string, streams: Streams, bounds?: ICourseBounds): string {
    if (bounds) {
      streams = this.cutStreamsAlongBounds(streams, bounds);
    }

    const startTime: number = streams.time[0];
    const startDistance: number = streams.distance[0];

    let TotalTimeSeconds = 0;
    let DistanceMeters = 0;
    if (streams.latlng.length > 0) {
      TotalTimeSeconds += streams.time[streams.latlng.length - 1] - startTime;
      DistanceMeters += streams.distance[streams.latlng.length - 1] - startDistance;
    }

    // Keep Name field to 15 characters or fewer
    if (courseName.length > 15) {
      courseName = courseName.slice(0, 15);
    }

    let tcxString: string =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<TrainingCenterDatabase xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd" xmlns:ns5="http://www.garmin.com/xmlschemas/ActivityGoals/v1" xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2" xmlns:ns2="http://www.garmin.com/xmlschemas/UserProfile/v2" xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n' +
      "<Courses>\n" +
      "<Course>\n" +
      "<Name>" +
      courseName +
      "</Name>\n" +
      "<Lap>\n" +
      "<TotalTimeSeconds>" +
      TotalTimeSeconds +
      "</TotalTimeSeconds>\n" +
      "<DistanceMeters>" +
      DistanceMeters +
      "</DistanceMeters>\n" +
      "<Intensity>Active</Intensity>\n";

    tcxString += "</Lap>\n";
    tcxString += "<Track>\n";

    for (let i = 0; i < streams.latlng.length; i++) {
      tcxString += "<Trackpoint>\n";
      tcxString += "<Time>" + new Date((streams.time[i] - startTime) * 1000).toISOString() + "</Time>\n";
      tcxString += "<Position>\n";
      tcxString += "<LatitudeDegrees>" + streams.latlng[i][0] + "</LatitudeDegrees>\n";
      tcxString += "<LongitudeDegrees>" + streams.latlng[i][1] + "</LongitudeDegrees>\n";
      tcxString += "</Position>\n";
      if (streams.altitude && _.isNumber(streams.altitude[i])) {
        tcxString += "<AltitudeMeters>" + streams.altitude[i] + "</AltitudeMeters>\n";
      }
      tcxString += "<DistanceMeters>" + (streams.distance[i] - startDistance) + "</DistanceMeters>\n";

      if (streams.heartrate && _.isNumber(streams.heartrate[i])) {
        tcxString += "<HeartRateBpm><Value>" + streams.heartrate[i] + "</Value></HeartRateBpm>\n";
      }

      if (streams.cadence && _.isNumber(streams.cadence[i])) {
        tcxString += "<Cadence>" + streams.cadence[i] + "</Cadence>\n";
      }

      tcxString += "</Trackpoint>\n";
    }

    tcxString += "</Track>\n";
    tcxString += "</Course>\n";
    tcxString += "</Courses>\n";
    tcxString += "</TrainingCenterDatabase>";

    return tcxString;
  }
}
