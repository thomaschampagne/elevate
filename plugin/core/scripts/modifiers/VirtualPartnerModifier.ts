import { saveAs } from "file-saver";
import * as _ from "lodash";
import { CourseMaker, ExportTypes, ICourseBounds } from "../../../common/scripts/CourseMarker";
import { ActivityStatsMapModel, StreamsModel } from "../../../common/scripts/models/ActivityData";
import { VacuumProcessor } from "../processors/VacuumProcessor";

export class VirtualPartnerModifier implements IModifier {

    protected vacuumProcessor: VacuumProcessor;
    protected activityId: number;
    protected courseMaker: CourseMaker;

    constructor(activityId: number, vacuumProcessor: VacuumProcessor) {
        this.activityId = activityId;
        this.vacuumProcessor = vacuumProcessor;
        this.courseMaker = new CourseMaker();
    }

    public modify(): void {

        if (!Strava.Labs) {
            return;
        }

        const view: any = Strava.Labs.Activities.SegmentLeaderboardView;

        if (!view) {
            return;
        }

        const functionRender: Function = view.prototype.render;

        const that = this;

		view.prototype.render = function () {

            const r: any = functionRender.apply(this, Array.prototype.slice.call(arguments));

			const exportButtonHtml: string = "<a class=\"btn-block btn-xs button raceshape-btn btn-primary stravistix_exportVpu\" id=\"stravistix_exportVpu\">Export this Segment Effort to your GPS</a>";
            if ($(".stravistix_exportVpu").length < 1) {

                $(".effort-actions").first().after(exportButtonHtml).each(() => {

                    $("#stravistix_exportVpu").click((evt) => {
                        evt.preventDefault();
                        evt.stopPropagation();
                        that.displayDownloadPopup();
                    });
                    return;
                });
            }
            return r;
        };
    }

    // TODO Refactor from AbstractExtendedDataModifier?
    protected getSegmentInfos(effortId: number, callback: (segmentInfosResponse: any) => any): void {

        if (!effortId) {
            console.error("No effort id found");
            return;
        }

        // Get segment effort bounds
        let segmentInfosResponse: any;
        $.when(
            $.ajax({
                url: "/segment_efforts/" + effortId,
                type: "GET",
                beforeSend: (xhr: any) => {
                    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                },
                dataType: "json",
                success: (xhrResponseText: any) => {
                    segmentInfosResponse = xhrResponseText;
                },
                error: (err) => {
                    console.error(err);
                },
            }),
        ).then(() => {
            callback(segmentInfosResponse);
        });
    }

    protected displayDownloadPopup() {

        const effortId: number = parseInt(window.location.pathname.split("/")[4] || window.location.hash.replace("#", ""));

        const exportsType = [
            ExportTypes.GPX,
            ExportTypes.TCX,
        ];

		const message: string = "Note: If you are using a Garmin device put downloaded file into <strong>NewFiles/*</strong> folder.<br/><br/><div id=\"stravistix_download_course_" + effortId + "\"></div>";

		$.fancybox("<div width=\"250px\" id=\"stravistix_popup_download_course_" + effortId + "\">" + message + "</div>", {
            afterShow: () => {
                _.forEach(exportsType, (type: ExportTypes) => {
                    const exportTypeAsString: string = ExportTypes[type];
					const link: JQuery = $("<a class=\"button btn-block btn-primary\" style=\"margin-bottom: 15px;\">Download Course File as " + exportTypeAsString + "</a>").on("click", () => {
                        this.download(effortId, type);
                        $("#stravistix_popup_download_course_" + effortId).html("Your " + exportTypeAsString + " file is (being) dropped in your download folder...");
                    });
                    $("#stravistix_download_course_" + effortId).append(link);
                });
            },
        });
    }

    protected download(effortId: number, exportType: ExportTypes) {

        this.getSegmentInfos(effortId, (segmentData: any) => {

			this.vacuumProcessor.getActivityStream((activityStatsMap: ActivityStatsMapModel, activityStream: StreamsModel) => { // Get stream on page
                if (_.isEmpty(activityStream.latlng)) {
                    alert("No GPS Data found");
                    return;
                }

                const bounds: ICourseBounds = {
                    start: segmentData.start_index,
                    end: segmentData.end_index,
                };

                saveAs(new Blob([this.courseMaker.create(exportType, segmentData.display_name, activityStream, bounds)], {type: "application/xml; charset=utf-8"}),
                    "course_" + effortId + "." + ExportTypes[exportType].toLowerCase()); // Filename

            });
        });
    }

}
