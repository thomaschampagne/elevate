import * as _ from "lodash";
import { Helper } from "../../../../../common/scripts/Helper";
import { ActivityBasicInfoModel } from "../../../../../common/scripts/models/ActivityData";
import { AbstractDataView } from "./AbstractDataView";

export class HeaderView extends AbstractDataView {

	protected basicInfo: ActivityBasicInfoModel;

    constructor(basicInfo: any) {
        super(null);
        this.basicInfo = basicInfo;
    }

    public render(): void {

        let detail: string;
        if (this.isSegmentEffortView && !_.isEmpty(this.basicInfo.segmentEffort)) { // Segment effort only
            detail = "SEGMENT EFFORT on <i>&lt;" + this.basicInfo.segmentEffort.name + "&gt;</i> // TIME " + Helper.secondsToHHMMSS(this.basicInfo.segmentEffort.elapsedTimeSec);
        } else { // Complete activity
            detail = "ACTIVITY <i>&lt;" + this.basicInfo.activityName + "&gt;</i>";
        }

        this.content += "<div style='width:100%; margin-left: 10px; margin-top: 10px; margin-bottom: 5px;font-size: 14px;'>";
        this.content += "   <div style='display: inline;'><img style='width:30px' src='" + this.appResources.logoNoText + "'/></div>";
        this.content += "   <div style='display: inline;'><img style='width:100px' src='" + this.appResources.logoTextOnly + "'/></div>";
        this.content += "   <div style='display: inline;'>EXTENDED STATS PANEL // " + detail + "</div>";
        this.content += "   <div style='display: inline; margin-right: 10px;'>";
		this.content += "       <a href='" + this.appResources.settingsLink + "#/donate' target='_blank' class=\"btn btn-sm btn-primary\" '>Do you like this stuff?</a>";
        this.content += "   </div>";
        this.content += "</div>";
		this.content += "<hr style=\"margin: 10px 0;\"/>";
    }

    protected insertDataIntoGrid(): void {

    }

    public displayGraph(): void {

    }

}
