import * as _ from "lodash";
import * as $ from "jquery";
import { Helper } from "../../helper";
import { ActivityInfoModel, AnalysisDataModel, AthleteSnapshotModel, SpeedUnitDataModel, UserSettingsModel } from "@elevate/shared/models";
import { AppResourcesModel } from "../../models/app-resources.model";
import { ActivityProcessor } from "../../processors/activity-processor";
import { AbstractDataView } from "./views/abstract-data.view";
import { FeaturedDataView } from "./views/featured-data.view";
import { HeaderView } from "./views/header.view";
import { HeartRateDataView } from "./views/heart-rate-data.view";

export abstract class AbstractExtendedDataModifier {

	public static TYPE_ACTIVITY = 0;
	public static TYPE_SEGMENT = 1;

	protected activityProcessor: ActivityProcessor;
	protected activityType: string;
	protected appResources: AppResourcesModel;
	protected userSettings: UserSettingsModel;
	protected athleteSnapshot: AthleteSnapshotModel;
	protected activityInfo: ActivityInfoModel;
	protected speedUnitsData: SpeedUnitDataModel;
	protected type: number;
	protected analysisData: AnalysisDataModel;
	protected summaryGrid: JQuery;
	protected segmentEffortButtonId: number;
	protected content: string;
	protected dataViews: AbstractDataView[] = [];

	protected constructor(activityProcessor: ActivityProcessor, activityInfo: ActivityInfoModel, appResources: AppResourcesModel,
						  userSettings: UserSettingsModel, type: number) {

		this.activityProcessor = activityProcessor;
		this.appResources = appResources;
		this.userSettings = userSettings;
		this.activityInfo = activityInfo;
		this.speedUnitsData = Helper.getSpeedUnitData(window.currentAthlete.get("measurement_preference"));
		this.type = type;
	}

	public apply(): void {

		if (_.isNull(this.type)) {
			console.error("ExtendedDataModifier must be set");
		}

		// Getting data to display at least summary panel. Cache will be normally used next if user click 'Show extended stats' in ACTIVITY mode
		this.getFullAnalysisData().then((result: { athleteSnapshot: AthleteSnapshotModel, analysisData: AnalysisDataModel }) => {

			this.athleteSnapshot = result.athleteSnapshot;
			this.analysisData = result.analysisData;

			if (this.type === AbstractExtendedDataModifier.TYPE_ACTIVITY) {

				this.placeSummaryPanel(() => { // Summary panel has been placed...
					// Add Show extended statistics to page
					this.placeExtendedStatsButton(() => {
						// Extended Button has been placed...
						console.debug("Extended Button for segment has been placed...");
					});
				});

			} else if (this.type === AbstractExtendedDataModifier.TYPE_SEGMENT) {
				// Place button for segment
				this.placeExtendedStatsButtonSegment(() => {
					console.debug("Extended Button for segment has been placed...");
				});
			}
		});
	}

	protected placeSummaryPanel(panelAdded: () => void): void {

		this.insertContentSummaryGridContent();

		$(".inline-stats.section").first().after(this.summaryGrid.html()).each(() => {
			// Grid placed
			if (panelAdded) {
				panelAdded();
			}
		});
	}

	protected makeSummaryGrid(columns: number, rows: number): void {

		let summaryGrid = "";
		summaryGrid += "<div>";
		summaryGrid += "<div class=\"summaryGrid\">";
		summaryGrid += "<table>";

		for (let i = 0; i < rows; i++) {
			summaryGrid += "<tr>";
			for (let j = 0; j < columns; j++) {
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
		let moveRatio = "-";
		if (this.analysisData.moveRatio && this.userSettings.displayActivityRatio) {
			moveRatio = this.printNumber(this.analysisData.moveRatio, 2);
		}
		this.insertContentAtGridPosition(0, 0, moveRatio, "Move Ratio", "", "displayActivityRatio");

		// ...
		let trainingImpulse = "-";
		let hrss = "-";
		let best20minHr = "-";
		let best20minHrUnit = "";
		let activityHeartRateReserve = "-";
		let activityHeartRateReserveUnit = "";

		if (this.analysisData.heartRateData && this.userSettings.displayAdvancedHrData) {
			trainingImpulse = this.printNumber(this.analysisData.heartRateData.TRIMP) + " <span class=\"summarySubGridTitle\">(" + this.printNumber(this.analysisData.heartRateData.TRIMPPerHour, 1) + " / hour)</span>";
			hrss = this.printNumber(this.analysisData.heartRateData.HRSS) + " <span class=\"summarySubGridTitle\">(" + this.printNumber(this.analysisData.heartRateData.HRSSPerHour, 1) + " / hour)</span>";
			activityHeartRateReserve = this.printNumber(this.analysisData.heartRateData.activityHeartRateReserve);
			if (_.isNumber(this.analysisData.heartRateData.best20min)) {
				best20minHr = this.printNumber(this.analysisData.heartRateData.best20min);
				best20minHrUnit = "bpm";
			}
			activityHeartRateReserveUnit = "%  <span class=\"summarySubGridTitle\">(Max: " + this.printNumber(this.analysisData.heartRateData.activityHeartRateReserveMax) + "% @ " + this.analysisData.heartRateData.maxHeartRate + "bpm)</span>";
		}

		this.insertContentAtGridPosition(0, 1, hrss, "Heart Rate Stress Score", "", "displayAdvancedHrData");
		this.insertContentAtGridPosition(1, 1, trainingImpulse, "TRaining IMPulse", "", "displayAdvancedHrData");
		this.insertContentAtGridPosition(0, 2, best20minHr, "Best 20min Heart Rate", best20minHrUnit, "displayAdvancedHrData");
		this.insertContentAtGridPosition(1, 2, activityHeartRateReserve, "Heart Rate Reserve Avg", activityHeartRateReserveUnit, "displayAdvancedHrData");

		// ...
		let climbTime = "-";
		let climbTimeExtra = "";
		if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
			climbTime = Helper.secondsToHHMMSS(this.analysisData.gradeData.upFlatDownInSeconds.up);
			climbTimeExtra = "<span class=\"summarySubGridTitle\">(" + this.printNumber((this.analysisData.gradeData.upFlatDownInSeconds.up / this.analysisData.gradeData.upFlatDownInSeconds.total * 100)) + "% of time)</span>";
		}

		this.insertContentAtGridPosition(0, 3, climbTime, "Time climbing", climbTimeExtra, "displayAdvancedGradeData");

	}

	protected placeExtendedStatsButton(buttonAdded: () => void): void {

		let htmlButton = "<section style=\"text-align: center;\">";
		htmlButton += "<a class=\"button btn-block btn-primary\" id=\"extendedStatsButton\" href=\"#\">";
		htmlButton += "Display elevate extended stats";
		htmlButton += "</a>";
		htmlButton += "</section>";

		$(".inline-stats.section").first().after(htmlButton).each(() => {

			$("#extendedStatsButton").click(() => {

				this.getFullAnalysisData().then((result: { athleteSnapshot: AthleteSnapshotModel, analysisData: AnalysisDataModel }) => {

					if (!this.athleteSnapshot) {
						this.athleteSnapshot = result.athleteSnapshot;
					}

					this.analysisData = result.analysisData;
					this.renderViews();
					this.showResultsAndRefreshGraphs();

				});
			});
			if (buttonAdded) {
				buttonAdded();
			}
		});
	}

	protected getFullAnalysisData(): Promise<{ athleteSnapshot: AthleteSnapshotModel, analysisData: AnalysisDataModel }> {

		return new Promise<{ athleteSnapshot: AthleteSnapshotModel, analysisData: AnalysisDataModel }>(resolve => {
			this.activityProcessor.getAnalysisData(this.activityInfo, null, (athleteSnapshot: AthleteSnapshotModel, analysisData: AnalysisDataModel) => { // Callback when analysis data has been computed
				resolve({athleteSnapshot: athleteSnapshot, analysisData: analysisData});
			});
		});
	}

	protected placeExtendedStatsButtonSegment(buttonAdded: () => void): void {

		$("#" + this.segmentEffortButtonId).on("click", (evt) => {

			this.getSegmentInfos((segmentInfosResponse: any) => {

				// Call Activity Processor with bounds
				if (!_.isNumber(segmentInfosResponse.start_index) || !_.isNumber(segmentInfosResponse.end_index)) {
					return;
				}

				// Update basic Infos
				this.activityInfo.segmentEffort = {
					name: segmentInfosResponse.display_name,
					elapsedTimeSec: segmentInfosResponse.elapsed_time_raw,
				};

				this.activityProcessor.getAnalysisData(
					this.activityInfo,
					[segmentInfosResponse.start_index, segmentInfosResponse.end_index], // Bounds given, full activity requested
					(athleteSnapshot: AthleteSnapshotModel, analysisData: AnalysisDataModel) => { // Callback when analysis data has been computed

						if (!this.athleteSnapshot) {
							this.athleteSnapshot = athleteSnapshot;
						}

						this.analysisData = analysisData;
						this.renderViews();
						this.showResultsAndRefreshGraphs();
					});
			});
			evt.preventDefault();
			evt.stopPropagation();
		});

		if (buttonAdded) {
			buttonAdded();
		}
	}

	protected getSegmentInfos(callback: (segmentInfosResponse: any) => any): void {

		const effortId: string = (window.location.pathname.split("/")[4] || window.location.hash.replace("#", "")) || null;

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
			content: "<div class=\"elevateExtendedData\">" + this.content + "</div>",
		});

		// For each view start making the assossiated graphs
		_.forEach(this.dataViews, (view: AbstractDataView) => {
			view.displayGraph();
		});
	}

	protected setDataViewsNeeded(): void {

		// Clean Data View Before
		this.cleanDataViews();

		const headerView: HeaderView = new HeaderView(this.activityInfo);
		headerView.setAppResources(this.appResources);
		headerView.setAppResources(this.appResources);
		headerView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
		headerView.setActivityType(this.activityType);
		headerView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
		this.dataViews.push(headerView);

		// By default we have... If data exist of course...
		// Featured view
		if (this.analysisData) {
			const featuredDataView: FeaturedDataView = new FeaturedDataView(this.analysisData, this.userSettings, this.activityInfo);
			featuredDataView.setAppResources(this.appResources);
			featuredDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
			featuredDataView.setActivityType(this.activityType);
			featuredDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(featuredDataView);
		}

		// Heart view
		if (this.analysisData.heartRateData && this.userSettings.displayAdvancedHrData) {
			const heartRateDataView: HeartRateDataView = new HeartRateDataView(this.analysisData.heartRateData, "hrr", this.athleteSnapshot);
			heartRateDataView.setAppResources(this.appResources);
			heartRateDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
			heartRateDataView.setActivityType(this.activityType);
			heartRateDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(heartRateDataView);
		}
	}

	protected cleanDataViews(): void {

		if (!_.isEmpty(this.dataViews)) {
			for (let i = 0; i < this.dataViews.length; i++) {
				this.dataViews[i] = null;
				delete this.dataViews[i];
			}
			this.dataViews = [];
		}
	}

	protected insertContentAtGridPosition(columnId: number, rowId: number, data: string, title: string, units: string, userSettingKey: string) {

		let onClickHtmlBehaviour = "";
		if (userSettingKey) {
			onClickHtmlBehaviour = "onclick='javascript:window.open(\"" + this.appResources.settingsLink + "#/globalSettings?viewOptionHelperId=" + userSettingKey + "\",\"_blank\");'";
		}

		if (this.summaryGrid) {
			const content: string = "<span class=\"summaryGridDataContainer\" " + onClickHtmlBehaviour + ">" + data + " <span class=\"summaryGridUnits\">" + units + "</span><br /><span class=\"summaryGridTitle\">" + title + "</span></span>";
			this.summaryGrid.find("[data-column=" + columnId + "][data-row=" + rowId + "]").html(content);
		} else {
			console.error("Grid is not initialized");
		}
	}

	public printNumber(value: number, decimals?: number): string {
		return (_.isNumber(value) && !_.isNaN(value) && _.isFinite(value)) ? value.toFixed((decimals) ? decimals : 0) : "-";
	}
}
