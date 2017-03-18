class HeaderView extends AbstractDataView {

    protected basicInfo: IActivityBasicInfo;

    constructor(basicInfo: any) {
        super(null);
        this.basicInfo = basicInfo;
    }

    render(): void {


        let detail: string;
        if (this.isSegmentEffortView && !_.isEmpty(this.basicInfo.segmentEffort)) { // Segment effort only
            detail = 'SEGMENT EFFORT on <i>&lt;' + this.basicInfo.segmentEffort.name + '&gt;</i> // TIME ' + Helper.secondsToHHMMSS(this.basicInfo.segmentEffort.elapsedTimeSec);
        } else { // Complete activity
            detail = 'ACTIVITY <i>&lt;' + this.basicInfo.activityName + '&gt;</i>';
        }

        this.content += "<div style='width:100%; margin-left: 10px; margin-top: 10px; margin-bottom: 5px;font-size: 14px;'>";
        this.content += "   <div style='display: inline;'><img style='width:30px' src='" + this.appResources.logoNoText + "'/></div>";
        this.content += "   <div style='display: inline;'><img style='width:100px' src='" + this.appResources.logoTextOnly + "'/></div>";
        this.content += "   <div style='display: inline;'>EXTENDED STATS PANEL // " + detail + "</div>";
        this.content += "   <div style='display: inline; margin-right: 10px;'>";
        this.content += "       <a href='" + this.appResources.settingsLink + "#/?showDonation=true' target='_blank' style='font-size: 14px;'> (Do you <img style='width: 14px;' src='" + this.appResources.heartIcon + "'/> this project?)</a>";
        this.content += "   </div>";
        this.content += "</div>";
        this.content += '<hr style="margin: 10px 0;"/>';
    }

    protected insertDataIntoGrid(): void {

    }

    public displayGraph(): void {

    }

}