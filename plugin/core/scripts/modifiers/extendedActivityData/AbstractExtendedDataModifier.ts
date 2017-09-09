import * as _ from "lodash";
import {Helper} from "../../../../common/scripts/Helper";
import {IActivityBasicInfo, IAnalysisData, ISpeedUnitData} from "../../../../common/scripts/interfaces/IActivityData";
import {IUserSettings} from "../../../../common/scripts/interfaces/IUserSettings";
import {StorageManager} from "../../../../common/scripts/modules/StorageManager";
import {IAppResources} from "../../interfaces/IAppResources";
import {ActivityProcessor} from "../../processors/ActivityProcessor";
import {AbstractDataView} from "./views/AbstractDataView";
import {FeaturedDataView} from "./views/FeaturedDataView";
import {HeaderView} from "./views/HeaderView";
import {HeartRateDataView} from "./views/HeartRateDataView";

export abstract class AbstractExtendedDataModifier {

    public static TYPE_ACTIVITY: number = 0;
    public static TYPE_SEGMENT: number = 1;

    protected activityProcessor: ActivityProcessor;
    protected activityId: number;
    protected activityType: string;
    protected appResources: IAppResources;
    protected userSettings: IUserSettings;
    protected basicInfo: IActivityBasicInfo;
    protected isAuthorOfViewedActivity: boolean;
    protected speedUnitsData: ISpeedUnitData;
    protected type: number;
    protected analysisData: IAnalysisData;
    protected summaryGrid: JQuery;
    protected segmentEffortButtonId: number;
    protected content: string;
    protected dataViews: AbstractDataView[] = [];

    constructor(activityProcessor: ActivityProcessor, activityId: number, activityType: string, appResources: IAppResources,
                userSettings: IUserSettings, isAuthorOfViewedActivity: boolean, basicInfo: any, type: number) {

        this.activityProcessor = activityProcessor;
        this.activityId = activityId;
        this.activityType = activityType;
        this.appResources = appResources;
        this.userSettings = userSettings;
        this.basicInfo = basicInfo;
        this.isAuthorOfViewedActivity = isAuthorOfViewedActivity;
        this.speedUnitsData = Helper.getSpeedUnitData();
        this.type = type;

        if (_.isNull(this.type)) {
            console.error("ExtendedDataModifier must be set");
        }

        this.activityProcessor.setActivityType(activityType);

        // Getting data to display at least summary panel. Cache will be normally used next if user click 'Show extended stats' in ACTIVITY mode
        this.activityProcessor.getAnalysisData(
            this.activityId,
            null, // No bounds given, full activity requested
            (analysisData: IAnalysisData) => { // Callback when analysis data has been computed

                this.analysisData = analysisData;

                if (this.type === AbstractExtendedDataModifier.TYPE_ACTIVITY) {

                    this.placeSummaryPanel(() => { // Summary panel has been placed...

                        // Add Show extended statistics to page
                        this.placeExtendedStatsButton(() => {

                            // Extended Button has been placed...
                            // Check is owner of activity
                            if (this.isAuthorOfViewedActivity) {
                                // Check if profileConfigured locally. Ask user to double check is athlete settings
                                Helper.getFromStorage(this.appResources.extensionId, StorageManager.storageLocalType, "profileConfigured")
                                    .then((profileConfigured: any) => {
                                        if (!profileConfigured || !profileConfigured.data) {
                                            $("#extendedStatsButton").after("<a target='_blank' href='" + this.appResources.settingsLink + "#!/athleteSettings'>Did you check your athlete settings before?</a>");
                                        }
                                    });
                            }
                        });
                    });

                } else if (this.type === AbstractExtendedDataModifier.TYPE_SEGMENT) {
                    // Place button for segment
                    this.placeExtendedStatsButtonSegment(() => {
                        // Extended Button for segment has been placed...
                    });
                }
            },
        );
    }

    protected placeSummaryPanel(panelAdded: () => void): void {

        this.insertContentSummaryGridContent();

        $(".inline-stats.section").first().after(this.summaryGrid.html()).each(() => {
            // Grid placed
            if (panelAdded) panelAdded();
        });
    }

    protected makeSummaryGrid(columns: number, rows: number): void {

        let summaryGrid: string = "";
        summaryGrid += "<div>";
        summaryGrid += "<div class=\"summaryGrid\">";
        summaryGrid += "<table>";

        for (let i: number = 0; i < rows; i++) {
            summaryGrid += "<tr>";
            for (let j: number = 0; j < columns; j++) {
                summaryGrid += "<td data-column=\"" + j + "\" data-row=\"" + i + "\">";
                summaryGrid += "</td>";
            }
            summaryGrid += "</tr>";
        }
        summaryGrid += "</table>";
        summaryGrid += "</div>";
        summaryGrid += "</div>";
        this.summaryGrid = $(summaryGrid);
    }

    protected insertContentSummaryGridContent(): void {

        // Insert summary data
        let moveRatio: string = "-";
        if (this.analysisData.moveRatio && this.userSettings.displayActivityRatio) {
            moveRatio = this.analysisData.moveRatio.toFixed(2);
        }
        this.insertContentAtGridPosition(0, 0, moveRatio, "Move Ratio", "", "displayActivityRatio");

        // ...
        let trainingImpulse: string = "-";
        let activityHeartRateReserve: string = "-";
        let activityHeartRateReserveUnit: string = "%";
        if (this.analysisData.heartRateData && this.userSettings.displayAdvancedHrData) {
            trainingImpulse = this.analysisData.heartRateData.TRIMP.toFixed(0) + " <span class=\"summarySubGridTitle\">(" + this.analysisData.heartRateData.TRIMPPerHour.toFixed(1) + " / hour)</span>";
            activityHeartRateReserve = this.analysisData.heartRateData.activityHeartRateReserve.toFixed(0);
            activityHeartRateReserveUnit = "%  <span class=\"summarySubGridTitle\">(Max: " + this.analysisData.heartRateData.activityHeartRateReserveMax.toFixed(0) + "% @ " + this.analysisData.heartRateData.maxHeartRate + "bpm)</span>";
        }
        this.insertContentAtGridPosition(0, 1, trainingImpulse, "TRaining IMPulse", "", "displayAdvancedHrData");
        this.insertContentAtGridPosition(1, 1, activityHeartRateReserve, "Heart Rate Reserve Avg", activityHeartRateReserveUnit, "displayAdvancedHrData");

        // ...
        let climbTime: string = "-";
        let climbTimeExtra: string = "";
        if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
            climbTime = Helper.secondsToHHMMSS(this.analysisData.gradeData.upFlatDownInSeconds.up);
            climbTimeExtra = "<span class=\"summarySubGridTitle\">(" + (this.analysisData.gradeData.upFlatDownInSeconds.up / this.analysisData.gradeData.upFlatDownInSeconds.total * 100).toFixed(0) + "% of time)</span>";
        }

        this.insertContentAtGridPosition(0, 2, climbTime, "Time climbing", climbTimeExtra, "displayAdvancedGradeData");

    }

    protected placeExtendedStatsButton(buttonAdded: () => void): void {

        let htmlButton: string = "<section style=\"text-align: center;\">";
        htmlButton += "<a class=\"button btn-block btn-primary\" id=\"extendedStatsButton\" href=\"#\">";
        htmlButton += "Show extended statistics";
        htmlButton += "</a>";
        htmlButton += "</section>";

        $(".inline-stats.section").first().after(htmlButton).each(() => {

            $("#extendedStatsButton").click(() => {

                this.activityProcessor.setActivityType(this.activityType);

                this.activityProcessor.getAnalysisData(
                    this.activityId,
                    null, // No bounds given, full activity requested
                    (analysisData: any) => { // Callback when analysis data has been computed
                        this.analysisData = analysisData;
                        this.renderViews();
                        this.showResultsAndRefreshGraphs();
                    },
                );
            });
            if (buttonAdded) buttonAdded();
        });
    }

    protected placeExtendedStatsButtonSegment(buttonAdded: () => void): void {

        $("#" + this.segmentEffortButtonId).click(() => {

            this.getSegmentInfos((segmentInfosResponse: any) => {

                // Call Activity Processor with bounds
                if (!segmentInfosResponse.start_index && segmentInfosResponse.end_index) {
                    return;
                }

                // Update basic Infos
                this.basicInfo.segmentEffort = {
                    name: segmentInfosResponse.display_name,
                    elapsedTimeSec: segmentInfosResponse.elapsed_time_raw,
                };

                this.activityProcessor.getAnalysisData(
                    this.activityId,
                    [segmentInfosResponse.start_index, segmentInfosResponse.end_index], // Bounds given, full activity requested
                    (analysisData: any) => { // Callback when analysis data has been computed
                        this.analysisData = analysisData;
                        this.renderViews();
                        this.showResultsAndRefreshGraphs();
                    });
            });

        });

        if (buttonAdded) buttonAdded();
    }

    protected getSegmentInfos(callback: (segmentInfosResponse: any) => any): void {

        const effortId: number = parseInt(window.location.pathname.split("/")[4] || window.location.hash.replace("#", "")) || null;

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

    protected renderViews(): void {

        this.content = "";

        this.setDataViewsNeeded();

        _.forEach(this.dataViews, (view) => {

            if (!view) {
                console.warn(view);
            }
            // Append result of view.render() to this.content
            view.render();
            this.content += view.getContent();
        });

    }

    protected showResultsAndRefreshGraphs(): void {
        $.fancybox({
            padding: 0,
            margin: 15,
            width: "100%",
            height: "100%",
            autoScale: true,
            transitionIn: "none",
            transitionOut: "none",
            closeBtn: false,
            type: "iframe",
            content: "<div class=\"stravistiXExtendedData\">" + this.content + "</div>",
        });

        // For each view start making the assossiated graphs
        _.forEach(this.dataViews, (view: AbstractDataView) => {
            view.displayGraph();
        });
    }

    protected setDataViewsNeeded(): void {

        // Clean Data View Before
        this.cleanDataViews();

        const headerView: HeaderView = new HeaderView(this.basicInfo);
        headerView.setAppResources(this.appResources);
        headerView.setAppResources(this.appResources);
        headerView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
        headerView.setActivityType(this.activityType);
        headerView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
        this.dataViews.push(headerView);

        // By default we have... If data exist of course...
        // Featured view
        if (this.analysisData) {
            const featuredDataView: FeaturedDataView = new FeaturedDataView(this.analysisData, this.userSettings, this.basicInfo);
            featuredDataView.setAppResources(this.appResources);
            featuredDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
            featuredDataView.setActivityType(this.activityType);
            featuredDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(featuredDataView);
        }

        // Heart view
        if (this.analysisData.heartRateData && this.userSettings.displayAdvancedHrData) {
            const heartRateDataView: HeartRateDataView = new HeartRateDataView(this.analysisData.heartRateData, "hrr", this.userSettings);
            heartRateDataView.setAppResources(this.appResources);
            heartRateDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
            heartRateDataView.setActivityType(this.activityType);
            heartRateDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(heartRateDataView);
        }
    }

    protected cleanDataViews(): void {

        if (!_.isEmpty(this.dataViews)) {
            for (let i: number = 0; i < this.dataViews.length; i++) {
                this.dataViews[i] = null;
                delete this.dataViews[i];
            }
            this.dataViews = [];
        }
    }

    protected insertContentAtGridPosition(columnId: number, rowId: number, data: string, title: string, units: string, userSettingKey: string) {
        const onClickHtmlBehaviour: string = "onclick='javascript:window.open(\"" + this.appResources.settingsLink + "#!/commonSettings?viewOptionHelperId=" + userSettingKey + "\",\"_blank\");'";

        if (this.summaryGrid) {
            const content: string = "<span class=\"summaryGridDataContainer\" " + onClickHtmlBehaviour + ">" + data + " <span class=\"summaryGridUnits\">" + units + "</span><br /><span class=\"summaryGridTitle\">" + title + "</span></span>";
            this.summaryGrid.find("[data-column=" + columnId + "][data-row=" + rowId + "]").html(content);
        } else {
            console.error("Grid is not initialized");
        }
    }

    /**
     * @param speed in kph
     * @return pace in seconds/km, if NaN/Infinite then return -1
     */
    protected convertSpeedToPace(speed: number): number {
        if (_.isNaN(speed)) {
            return -1;
        }
        return (speed === 0) ? -1 : 1 / speed * 60 * 60;
    }
}
