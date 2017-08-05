import * as _ from 'lodash';
import {IActivityStream} from '../../plugin/core/scripts/interfaces/IActivityData';
import {CourseMaker} from '../../plugin/common/CourseMarker';
import {clone} from '../tools/SpecsTools';

fdescribe('CourseMaker', () => {

    let courseMaker = new CourseMaker();
    let xmlParser = new DOMParser();

    it('should export GPX stream when activityStream exists', () => {

        // Given
        let courseName: string = 'MyCourse';
        let activityStream: IActivityStream = clone(window.__fixtures__['fixtures/activities/829770999/stream']);

        // When
        let gpxStream: string = courseMaker.createGpx(courseName, activityStream);

        // Then
        expect(gpxStream).not.toBeNull();
        expect(_.isEmpty(gpxStream)).toBeFalsy();

    });

    it('should export GPX stream with consistency data', () => {

        // Given
        let courseName: string = 'MyCourse';
        let activityStream: IActivityStream = clone(window.__fixtures__['fixtures/activities/829770999/stream']);

        // When
        let gpxStream: string = courseMaker.createGpx(courseName, activityStream);
        let xmlStream = xmlParser.parseFromString(gpxStream, 'text/xml');

        // Then ...
        expect(xmlStream).not.toBeNull();
        expect(_.isEmpty(xmlStream)).toBeFalsy();

        // ... Check author name
        expect(xmlStream.getElementsByTagName('metadata')[0]
            .getElementsByTagName('name')[0]
            .childNodes[0]
            .nodeValue
        ).toBe('StravistiX');

        // ... Check course name
        const trkNode = xmlStream.getElementsByTagName('trk')[0];
        expect(trkNode
            .getElementsByTagName('name')[0]
            .childNodes[0]
            .nodeValue
        ).toBe(courseName);

        // ... Check point length
        const trackPointsLength = xmlStream.getElementsByTagName('trkpt').length;
        expect(trackPointsLength).toBe(activityStream.time.length);

        // ... Check first sample point data
        const firstTrackPointsLength = xmlStream.getElementsByTagName('trkpt')[0]
        expect(firstTrackPointsLength.getAttribute('lat')).toMatch(/^51.509485/);
        expect(firstTrackPointsLength.getAttribute('lon')).toMatch(/^-0.080033/);

        expect(firstTrackPointsLength.getElementsByTagName('ele')[0].childNodes[0].nodeValue).toMatch(/^20.2/);
        expect(firstTrackPointsLength.getElementsByTagName('time')[0].childNodes[0].nodeValue).toBe((new Date(0)).toISOString());

        const extensions = firstTrackPointsLength.getElementsByTagName('extensions')[0];
        expect(extensions.getElementsByTagName('power')[0].childNodes[0].nodeValue).toMatch(/^62/);

        const trackPointNamespaceURI = "http://www.garmin.com/xmlschemas/TrackPointExtension/v1";
        const trackPointExtension = extensions.getElementsByTagNameNS(trackPointNamespaceURI, 'TrackPointExtension')[0];
        expect(trackPointExtension.getElementsByTagNameNS(trackPointNamespaceURI, "hr")[0].childNodes[0].nodeValue).toMatch(/^104/);
        expect(trackPointExtension.getElementsByTagNameNS(trackPointNamespaceURI, "cad")[0].childNodes[0].nodeValue).toMatch(/^69/);
    });

    it('should export TCX stream with consistency data', () => {

    });

    // let stream: string = courseMaker.createTcx(courseName, activityStream); // TODO
    // let stream: string = courseMaker.createGpx(courseName, bounds, activityStream); // TODO w/ bounds
});