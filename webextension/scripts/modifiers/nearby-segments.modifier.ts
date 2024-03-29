import _ from "lodash";
import { AppResourcesModel } from "../models/app-resources.model";
import { ISegmentInfo } from "../processors/segment-processor";
import { AbstractModifier } from "./abstract.modifier";

export class NearbySegmentsModifier extends AbstractModifier {
  protected appResources: AppResourcesModel;
  protected segments: ISegmentInfo[];

  constructor(jsonSegments: ISegmentInfo[], appResources: AppResourcesModel) {
    super();
    this.segments = jsonSegments;
    this.appResources = appResources;
  }

  public modify(): void {
    let html = "<div class='dropdown'>";
    html += "<div class='drop-down-menu' style='width: 100%;' >";
    html +=
      "<button class='btn btn-default dropdown-toggle'><img style='vertical-align:middle' src='" +
      this.appResources.trackChangesIcon +
      "'/> <span>Nearby Segments</span> <span class='app-icon-wrapper '><span class='app-icon icon-strong-caret-down icon-dark icon-xs'></span></span></button>";
    html += "<ul class='dropdown-menu' style='max-height: 800px;'>";

    let segmentName: string;
    let segmentIconType: string;

    _.forEach(this.segments, (segment: ISegmentInfo) => {
      segmentName =
        segment.name + " <i>@ " + (segment.distance / 1000).toFixed(1) + "k, " + segment.avg_grade.toFixed(1) + "%";

      if (segment.climb_category > 0) {
        segmentName += ", Cat. " + segment.climb_category_desc;
      }

      segmentName += "</i>";

      if (segment.type === "cycling") {
        segmentIconType = "<span class='app-icon icon-ride icon-sm type' style='margin-right: 7px;'/>";
      } else if (segment.type === "running") {
        segmentIconType = "<span class='app-icon icon-run icon-sm type' style='margin-right: 7px;'/>";
      } else {
        segmentIconType = "";
      }

      html +=
        "<li style='max-width: 600px;'><a href='/segments/" +
        segment.id +
        "'>" +
        segmentIconType +
        segmentName +
        "</a></li>";
    });

    html += "</ul>";
    html += "</div>";
    html += "</div>";

    $(html).prependTo(".segment-activity-my-efforts");
  }
}
