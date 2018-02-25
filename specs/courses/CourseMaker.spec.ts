import * as _ from "lodash";
import { StreamsModel } from "../../plugin/common/scripts/models/ActivityData";
import { CourseMaker, ExportTypes, ICourseBounds } from "../../plugin/common/scripts/CourseMarker";

describe("CourseMaker", () => {

	const courseMaker: CourseMaker = new CourseMaker();
	const xmlParser: DOMParser = new DOMParser();
	let activityStream: StreamsModel;

    beforeEach(() => {
        activityStream = _.cloneDeep(window.__fixtures__["fixtures/activities/829770999/stream"]);
    });

	it("should export GPX stream with consistency data", (done: Function) => {

        // Given
		const courseName = "MyCourse";

        // When
		const gpxStream: string = courseMaker.create(ExportTypes.GPX, courseName, activityStream);
		const xmlStream = xmlParser.parseFromString(gpxStream, "text/xml");

        // Then ...
        expect(xmlStream).not.toBeNull();
        expect(_.isEmpty(xmlStream)).toBeFalsy();

        // ... Check author name
        expect(xmlStream.getElementsByTagName("metadata")[0]
            .getElementsByTagName("name")[0]
            .childNodes[0]
            .nodeValue
        ).toBe("StravistiX");

        // ... Check course name
        const trkNode = xmlStream.getElementsByTagName("trk")[0];
        expect(trkNode
            .getElementsByTagName("name")[0]
            .childNodes[0]
            .nodeValue
        ).toBe(courseName);

        // ... Check points length
        const trackPointsLength = xmlStream.getElementsByTagName("trkpt").length;
        expect(trackPointsLength).toBe(activityStream.time.length);

        // ... Check first sample point data
        const firstTrackPointsLength = xmlStream.getElementsByTagName("trkpt")[0];
        expect(firstTrackPointsLength.getAttribute("lat")).toMatch(/^51.509485/);
        expect(firstTrackPointsLength.getAttribute("lon")).toMatch(/^-0.080033/);

        expect(firstTrackPointsLength.getElementsByTagName("ele")[0].childNodes[0].nodeValue).toMatch(/^20.2/);
        expect(firstTrackPointsLength.getElementsByTagName("time")[0].childNodes[0].nodeValue).toBe((new Date(0)).toISOString());

        const extensions = firstTrackPointsLength.getElementsByTagName("extensions")[0];
        expect(extensions.getElementsByTagName("power")[0].childNodes[0].nodeValue).toMatch(/^62/);

        const trackPointNamespaceURI = "http://www.garmin.com/xmlschemas/TrackPointExtension/v1";
        const trackPointExtension = extensions.getElementsByTagNameNS(trackPointNamespaceURI, "TrackPointExtension")[0];
        expect(trackPointExtension.getElementsByTagNameNS(trackPointNamespaceURI, "hr")[0].childNodes[0].nodeValue).toMatch(/^104/);
        expect(trackPointExtension.getElementsByTagNameNS(trackPointNamespaceURI, "cad")[0].childNodes[0].nodeValue).toMatch(/^69/);
		done();
    });

	it("should export GPX with no HRM, Cadence, altimeter & Power sensor", (done: Function) => {

        // Given
		const courseName = "MyCourse";
		activityStream = <StreamsModel> _.omit(activityStream, ["heartrate", "cadence", "watts", "watts_calc", "altitude"]);
        let errorCatched = null;

        // When
        try {
            courseMaker.create(ExportTypes.GPX, courseName, activityStream);
        } catch (err) {
            errorCatched = err;
        }

        // Then ...
        expect(errorCatched).toBeNull();

		done();

    });

	it("should export TCX stream with consistency data", (done: Function) => {

        // Given
		const courseName = "MyCourse";

        // When
		const tcxStream: string = courseMaker.create(ExportTypes.TCX, courseName, activityStream);
		const xmlStream = xmlParser.parseFromString(tcxStream, "text/xml");

        // Then
        expect(xmlStream).not.toBeNull();
        expect(_.isEmpty(xmlStream)).toBeFalsy();

        // ... Common
        const CourseNode = xmlStream.getElementsByTagName("TrainingCenterDatabase")[0]
            .getElementsByTagName("Courses")[0]
            .getElementsByTagName("Course")[0];

        expect(CourseNode.getElementsByTagName("Name")[0].childNodes[0].nodeValue).toBe(courseName);

        const LapNode = CourseNode.getElementsByTagName("Lap")[0];

        expect(LapNode.getElementsByTagName("TotalTimeSeconds")[0].childNodes[0].nodeValue).toMatch(/^2283$/);
        expect(LapNode.getElementsByTagName("DistanceMeters")[0].childNodes[0].nodeValue).toMatch(/^15723/);

        // ... Check points length
        const trackPointsLength = CourseNode.getElementsByTagName("Track")[0].getElementsByTagName("Trackpoint").length;
        expect(trackPointsLength).toBe(activityStream.time.length);

        // ... First track point
        const firstTrackPoint = CourseNode.getElementsByTagName("Track")[0].getElementsByTagName("Trackpoint")[0];

        expect(firstTrackPoint.getElementsByTagName("Time")[0].childNodes[0].nodeValue).toBe((new Date(0)).toISOString());

        expect(firstTrackPoint.getElementsByTagName("Position")[0]
            .getElementsByTagName("LatitudeDegrees")[0].childNodes[0].nodeValue).toMatch(/^51.509485/);

        expect(firstTrackPoint.getElementsByTagName("Position")[0]
            .getElementsByTagName("LongitudeDegrees")[0].childNodes[0].nodeValue).toMatch(/^-0.080033/);

        expect(firstTrackPoint.getElementsByTagName("AltitudeMeters")[0].childNodes[0].nodeValue).toMatch(/^20.2$/);

        expect(firstTrackPoint.getElementsByTagName("Cadence")[0].childNodes[0].nodeValue).toMatch(/^69$/);

        expect(firstTrackPoint.getElementsByTagName("HeartRateBpm")[0]
            .getElementsByTagName("Value")[0].childNodes[0].nodeValue).toMatch(/^104$/);

		done();
    });

	it("should export TCX with no HRM, Cadence, altimeter & Power sensor", (done: Function) => {

        // Given
		const courseName = "MyCourse";
		activityStream = <StreamsModel> _.omit(activityStream, ["heartrate", "cadence", "watts", "watts_calc", "altitude"]);
        let errorCatched = null;

        // When
        try {
            courseMaker.create(ExportTypes.TCX, courseName, activityStream);
        } catch (err) {
            errorCatched = err;
        }

        // Then ...
        expect(errorCatched).toBeNull();
		done();
    });

	it("should export GPX with bounds", (done: Function) => {

        // Given
		const courseName = "MyCourse";
        const bounds: ICourseBounds = {start: 200, end: 300};

        // When
		const gpxStream: string = courseMaker.create(ExportTypes.GPX, courseName, activityStream, bounds);
		const xmlStream = xmlParser.parseFromString(gpxStream, "text/xml");

        // Then
        const trackPointsLength = xmlStream.getElementsByTagName("trkpt").length;
        expect(trackPointsLength).toBe(100);
		done();
    });

	it("should export TCX with bounds", (done: Function) => {

        // Given
		const courseName = "MyCourse";
        const bounds: ICourseBounds = {start: 300, end: 400};

        // When
		const tcxStream: string = courseMaker.create(ExportTypes.TCX, courseName, activityStream, bounds);
		const xmlStream = xmlParser.parseFromString(tcxStream, "text/xml");

        // Then
        const trackPointsLength = xmlStream.getElementsByTagName("TrainingCenterDatabase")[0]
            .getElementsByTagName("Courses")[0]
            .getElementsByTagName("Course")[0]
            .getElementsByTagName("Track")[0]
            .getElementsByTagName("Trackpoint").length;

        expect(trackPointsLength).toBe(100);
		done();
    });

	it("should failed", (done: Function) => {

        // Given
		const courseName = "MyCourse";

        expect(() => {
            courseMaker.create(-1, courseName, activityStream); // When
        }).toThrowError("Export type do not exist"); // Then

		done();
    });
});
