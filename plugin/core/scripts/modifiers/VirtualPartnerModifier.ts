class VirtualPartnerModifier implements IModifier {

    protected vacuumProcessor: VacuumProcessor;
    protected activityId: number;

    constructor(activityId: number, vacuumProcessor: VacuumProcessor) {
        this.activityId = activityId;
        this.vacuumProcessor = vacuumProcessor;
    }

    modify(): void {

        if (!Strava.Labs) {
            return;
        }

        let view: any = Strava.Labs.Activities.SegmentLeaderboardView;

        if (!view) {
            return;
        }

        let functionRender: Function = view.prototype.render;

        let that = this;

        view.prototype.render = function () {

            let r: any = functionRender.apply(this, Array.prototype.slice.call(arguments));

            if ($('.stravistix_exportVpu').length < 1) {

                let exportButtonHtml: string = '<a class="btn-block btn-xs button raceshape-btn btn-primary stravistix_exportVpu" id="stravistix_exportVpu">Export effort as Virtual Partner</a>';

                $('.raceshape-btn').first().after(exportButtonHtml).each(() => {

                    $('#stravistix_exportVpu').click((evt) => {
                        evt.preventDefault();
                        evt.stopPropagation();
                        that.displayDownloadPopup();
                    });
                    return;
                });
            }
            /*
             // TODO Support Running VPU
             else {
             // Running export
             let exportButtonHtml = '<div class="spans8"><a href="/segments/6330649?filter=my_results">View My Efforts</a></div>';
             $('.bottomless.inset').after(exportButtonHtml);
             }*/
            return r;
        };
    }

    // TODO Refactor from AbstractExtendedDataModifier?
    protected getSegmentInfos(effortId: number, callback: (segmentInfosResponse: any) => any): void {

        if (!effortId) {
            console.error('No effort id found');
            return;
        }

        // Get segment effort bounds
        let segmentInfosResponse: any;
        $.when(
            $.ajax({
                url: '/segment_efforts/' + effortId,
                type: 'GET',
                beforeSend: (xhr: any) => {
                    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                },
                dataType: 'json',
                success: (xhrResponseText: any) => {
                    segmentInfosResponse = xhrResponseText;
                },
                error: (err) => {
                    console.error(err);
                }
            })
        ).then(() => {
            callback(segmentInfosResponse);
        });
    }

    protected displayDownloadPopup() {

        let effortId: number = parseInt(window.location.pathname.split('/')[4] || window.location.hash.replace('#', ''));

        let dlButton: string = '<a class="button btn-block btn-primary" style="margin-bottom: 15px;">Download Course File (GPX)</a>';
        let title: string = 'Export effort as Virtual Partner';
        let message: string = 'Note: If you are using a Garmin device put downloaded file into <strong>NewFiles/*</strong> folder.<br/><br/><div id="stravistix_download_course_' + effortId + '"></div>';

        $.fancybox('<h3>' + title + '</h3><h4>' + message + '</h4>', {
            afterShow: () => {
                $('#stravistix_download_course_' + effortId).html(dlButton).each(() => {
                    $('#stravistix_download_course_' + effortId).on('click', () => {
                        this.downloadGpx(effortId);
                    });
                });
            }
        });
    }

    protected downloadGpx(effortId: number) {
        this.getSegmentInfos(effortId, (segmentInfosResponse: any) => {
            this.vacuumProcessor.getActivityStream((activityStatsMap: IActivityStatsMap, activityStream: IActivityStream) => { // Get stream on page
                if (_.isEmpty(activityStream.latlng)) {
                    alert('No GPS Data found');
                    return;
                }
                activityStream = this.cutStreamsAlongSegmentBounds(activityStream, segmentInfosResponse); // Cutting streams from start to endpoint of segment
                this.createGpxAndSave(segmentInfosResponse.display_name, effortId, activityStream);
            });
        });
    }

    protected createGpxAndSave(courseName: string, effortId: number, activityStream: IActivityStream) {
        let blob = new Blob([this.genGpxData(courseName, activityStream)], {type: "application/xml; charset=utf-8"});
        saveAs(blob, "course_" + effortId + ".gpx");
    }

    protected genGpxData(courseName: string, activityStream: IActivityStream): string {

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

            if (_.isNumber(activityStream.heartrate[i]) || _.isNumber(activityStream.cadence[i])) {

                gpxString += '<extensions>\n';
                gpxString += '<gpxtpx:TrackPointExtension>\n';

                if (_.isNumber(activityStream.heartrate[i])) {
                    gpxString += '<gpxtpx:hr>' + activityStream.heartrate[i] + '</gpxtpx:hr>';
                }
                if (_.isNumber(activityStream.cadence[i])) {
                    gpxString += '<gpxtpx:cad>' + activityStream.cadence[i] + '</gpxtpx:cad>';
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

    protected cutStreamsAlongSegmentBounds(activityStream: IActivityStream, segmentInfosResponse: any): IActivityStream {

        if (!_.isEmpty(activityStream.velocity_smooth)) {
            activityStream.velocity_smooth = activityStream.velocity_smooth.slice(segmentInfosResponse.start_index, segmentInfosResponse.end_index);
        }

        if (!_.isEmpty(activityStream.time)) {
            activityStream.time = activityStream.time.slice(segmentInfosResponse.start_index, segmentInfosResponse.end_index);
        }

        if (!_.isEmpty(activityStream.latlng)) {
            activityStream.latlng = activityStream.latlng.slice(segmentInfosResponse.start_index, segmentInfosResponse.end_index);
        }

        if (!_.isEmpty(activityStream.heartrate)) {
            activityStream.heartrate = activityStream.heartrate.slice(segmentInfosResponse.start_index, segmentInfosResponse.end_index);
        }

        if (!_.isEmpty(activityStream.watts)) {
            activityStream.watts = activityStream.watts.slice(segmentInfosResponse.start_index, segmentInfosResponse.end_index);
        }

        if (!_.isEmpty(activityStream.watts_calc)) {
            activityStream.watts_calc = activityStream.watts_calc.slice(segmentInfosResponse.start_index, segmentInfosResponse.end_index);
        }

        if (!_.isEmpty(activityStream.cadence)) {
            activityStream.cadence = activityStream.cadence.slice(segmentInfosResponse.start_index, segmentInfosResponse.end_index);
        }

        if (!_.isEmpty(activityStream.grade_smooth)) {
            activityStream.grade_smooth = activityStream.grade_smooth.slice(segmentInfosResponse.start_index, segmentInfosResponse.end_index);
        }

        if (!_.isEmpty(activityStream.altitude)) {
            activityStream.altitude = activityStream.altitude.slice(segmentInfosResponse.start_index, segmentInfosResponse.end_index);
        }

        if (!_.isEmpty(activityStream.distance)) {
            activityStream.distance = activityStream.distance.slice(segmentInfosResponse.start_index, segmentInfosResponse.end_index);
        }

        if (!_.isEmpty(activityStream.altitude_smooth)) {
            activityStream.altitude_smooth = activityStream.altitude_smooth.slice(segmentInfosResponse.start_index, segmentInfosResponse.end_index);
        }

        return activityStream;
    }
}
