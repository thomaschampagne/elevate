import { saveAs } from "file-saver";
import _ from "lodash";
import $ from "jquery";
import { CourseMaker, ExportTypes, ICourseBounds } from "../processors/course-marker";
import { VacuumProcessor } from "../processors/vacuum-processor";
import { AbstractModifier } from "./abstract.modifier";
import { ActivityInfoModel } from "@elevate/shared/models/activity-data/activity-info.model";
import { ActivityEssentials } from "@elevate/shared/models/activity-data/activity-essentials.model";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";

export class VirtualPartnerModifier extends AbstractModifier {
  protected vacuumProcessor: VacuumProcessor;
  protected activityId: number;
  protected courseMaker: CourseMaker;

  constructor(activityId: number, vacuumProcessor: VacuumProcessor) {
    super();
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

      const exportButtonHtml =
        '<div class="analysis-link-js btn-block button btn-primary elevate_exportVpu" id="elevate_exportVpu">' +
        "Export GPS segment effort" +
        "</div>";
      if ($(".elevate_exportVpu").length < 1) {
        $(".effort-actions")
          .first()
          .append(exportButtonHtml)
          .each(() => {
            $("#elevate_exportVpu").on("click", evt => {
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
  protected getSegmentInfos(effortId: string, callback: (segmentInfosResponse: any) => any): void {
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
        error: err => {
          console.error(err);
        }
      })
    ).then(() => {
      callback(segmentInfosResponse);
    });
  }

  protected displayDownloadPopup() {
    const effortId: string = _.last(window.location.href.match(/(\d+)$/g));

    const exportsType = [ExportTypes.GPX, ExportTypes.TCX];

    const message: string =
      "Note: If you are using a Garmin device put downloaded file into " +
      '<strong>NewFiles/*</strong> folder.<br/><br/><div id="elevate_download_course_' +
      effortId +
      '"></div>';

    window.$.fancybox('<div width="250px" id="elevate_popup_download_course_' + effortId + '">' + message + "</div>", {
      afterShow: () => {
        _.forEach(exportsType, (type: ExportTypes) => {
          const exportTypeAsString: string = ExportTypes[type];
          const link: JQuery = $(
            '<a class="button btn-block btn-primary" style="margin-bottom: 15px;">Download Course File as ' +
              exportTypeAsString +
              "</a>"
          ).on("click", () => {
            this.download(effortId, type);
            $("#elevate_popup_download_course_" + effortId).html(
              "Your " + exportTypeAsString + " file is (being) dropped in your download folder..."
            );
          });
          $("#elevate_download_course_" + effortId).append(link);
        });
      }
    });
  }

  protected download(effortId: string, exportType: ExportTypes) {
    this.getSegmentInfos(effortId, (segmentData: any) => {
      const activityInfo: ActivityInfoModel = {
        id: this.activityId
      } as ActivityInfoModel;

      this.vacuumProcessor.getActivityStream(
        activityInfo,
        (activityEssentials: ActivityEssentials, streams: Streams) => {
          // Get stream on page
          if (_.isEmpty(streams.latlng)) {
            alert("No GPS Data found");
            return;
          }

          const bounds: ICourseBounds = {
            start: segmentData.start_index,
            end: segmentData.end_index
          };

          saveAs(
            new Blob([this.courseMaker.create(exportType, segmentData.display_name, streams, bounds)], {
              type: "application/xml; charset=utf-8"
            }),
            "course_" + effortId + "." + ExportTypes[exportType].toLowerCase()
          ); // Filename
        }
      );
    });
  }
}
