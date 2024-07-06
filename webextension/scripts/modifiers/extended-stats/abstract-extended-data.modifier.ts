import _ from "lodash";
import $ from "jquery";
import { Helper } from "../../helper";
import { AppResourcesModel } from "../../models/app-resources.model";
import { ActivityProcessor } from "../../processors/activity-processor";
import { AbstractDataView } from "./views/abstract-data.view";
import { FeaturedDataView } from "./views/featured-data.view";
import { HeaderView } from "./views/header.view";
import { HeartRateDataView } from "./views/heart-rate-data.view";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { SpeedUnitDataModel } from "@elevate/shared/models/activity-data/speed-unit-data.model";
import { Time } from "@elevate/shared/tools/time";
import { ActivityInfoModel } from "@elevate/shared/models/activity-data/activity-info.model";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

export abstract class AbstractExtendedDataModifier {
  public static readonly TYPE_ACTIVITY = 0;
  public static readonly TYPE_SEGMENT = 1;

  protected activityProcessor: ActivityProcessor;
  protected activityType: string;
  protected appResources: AppResourcesModel;
  protected userSettings: ExtensionUserSettings;
  protected athleteSnapshot: AthleteSnapshot;
  protected activityInfo: ActivityInfoModel;
  protected speedUnitsData: SpeedUnitDataModel;
  protected type: number;
  protected stats: ActivityStats;
  protected hasPowerMeter: boolean;
  protected summaryGrid: JQuery;
  protected segmentEffortButtonId: number;
  protected content: string;
  protected dataViews: AbstractDataView[] = [];

  protected constructor(
    activityProcessor: ActivityProcessor,
    activityInfo: ActivityInfoModel,
    appResources: AppResourcesModel,
    userSettings: ExtensionUserSettings,
    type: number
  ) {
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
    this.getFullAnalysisData().then(
      (result: { athleteSnapshot: AthleteSnapshot; stats: ActivityStats; hasPowerMeter: boolean }) => {
        this.athleteSnapshot = result.athleteSnapshot;
        this.stats = result.stats;
        this.hasPowerMeter = result.hasPowerMeter;

        if (this.type === AbstractExtendedDataModifier.TYPE_ACTIVITY) {
          this.placeSummaryPanel(() => {
            // Summary panel has been placed...
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
      }
    );
  }

  public printNumber(value: number, decimals?: number): string {
    return _.isNumber(value) && !_.isNaN(value) && _.isFinite(value) ? value.toFixed(decimals ? decimals : 0) : "-";
  }

  protected placeSummaryPanel(panelAdded: () => void): void {
    this.insertContentSummaryGridContent();

    $(".inline-stats.section")
      .first()
      .after(this.summaryGrid.html())
      .each(() => {
        // Grid placed
        if (panelAdded) {
          panelAdded();
        }
      });
  }

  protected makeSummaryGrid(columns: number, rows: number): void {
    let summaryGrid = "";
    summaryGrid += "<div>";
    summaryGrid += '<div class="summaryGrid">';
    summaryGrid += "<table>";

    for (let i = 0; i < rows; i++) {
      summaryGrid += "<tr>";
      for (let j = 0; j < columns; j++) {
        summaryGrid += '<td data-column="' + j + '" data-row="' + i + '">';
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
    if (this.stats.moveRatio && this.userSettings.displayActivityRatio) {
      moveRatio = this.printNumber(this.stats.moveRatio, 2);
    }
    this.insertContentAtGridPosition(0, 0, moveRatio, "Move Ratio", "", "displayActivityRatio");

    // ...
    let trainingImpulse = "-";
    let hrss = "-";
    let best20minHr = "-";
    let best20minHrUnit = "";
    let activityHeartRateReserve = "-";
    let activityHeartRateReserveUnit = "";

    if (this.stats.heartRate && this.userSettings.displayAdvancedHrData) {
      if (this.stats.scores?.stress?.trimp) {
        trainingImpulse =
          this.printNumber(this.stats.scores.stress.trimp) +
          ' <span class="summarySubGridTitle">(' +
          this.printNumber(this.stats.scores.stress.trimpPerHour, 1) +
          " / hour)</span>";
      }

      if (this.stats.scores?.stress?.hrss) {
        hrss =
          this.printNumber(this.stats.scores.stress.hrss) +
          ' <span class="summarySubGridTitle">(' +
          this.printNumber(this.stats.scores.stress.hrssPerHour, 1) +
          " / hour)</span>";
      }

      activityHeartRateReserve = this.printNumber(this.stats.heartRate.avgReserve);
      if (_.isNumber(this.stats.heartRate.best20min)) {
        best20minHr = this.printNumber(this.stats.heartRate.best20min);
        best20minHrUnit = "bpm";
      }
      activityHeartRateReserveUnit =
        '%  <span class="summarySubGridTitle">(Max: ' +
        this.printNumber(this.stats.heartRate.maxReserve) +
        "% @ " +
        this.stats.heartRate.max +
        "bpm)</span>";
    }

    this.insertContentAtGridPosition(0, 1, hrss, "Heart Rate Stress Score", "", "displayAdvancedHrData");
    this.insertContentAtGridPosition(1, 1, trainingImpulse, "TRaining IMPulse", "", "displayAdvancedHrData");
    this.insertContentAtGridPosition(
      0,
      2,
      best20minHr,
      "Best 20min Heart Rate",
      best20minHrUnit,
      "displayAdvancedHrData"
    );
    this.insertContentAtGridPosition(
      1,
      2,
      activityHeartRateReserve,
      "Heart Rate Reserve Avg",
      activityHeartRateReserveUnit,
      "displayAdvancedHrData"
    );

    // ...
    let climbTime = "-";
    let climbTimeExtra = "";
    if (this.stats.grade && this.userSettings.displayAdvancedGradeData) {
      climbTime = Time.secToMilitary(this.stats.grade.slopeTime.up);
      climbTimeExtra =
        '<span class="summarySubGridTitle">(' +
        this.printNumber((this.stats.grade.slopeTime.up / this.stats.grade.slopeTime.total) * 100) +
        "% of time)</span>";
    }

    this.insertContentAtGridPosition(0, 3, climbTime, "Time climbing", climbTimeExtra, "displayAdvancedGradeData");
  }

  protected placeExtendedStatsButton(buttonAdded: () => void): void {
    let htmlButton = '<section style="text-align: center;">';
    htmlButton += '<a class="button btn-block btn-primary" id="extendedStatsButton" href="#">';
    htmlButton += "Display elevate extended stats";
    htmlButton += "</a>";
    htmlButton += "</section>";

    $(".inline-stats.section")
      .first()
      .after(htmlButton)
      .each(() => {
        $("#extendedStatsButton").click(() => {
          this.getFullAnalysisData().then(
            (result: { athleteSnapshot: AthleteSnapshot; stats: ActivityStats; hasPowerMeter: boolean }) => {
              if (!this.athleteSnapshot) {
                this.athleteSnapshot = result.athleteSnapshot;
              }

              this.stats = result.stats;
              this.renderViews();
              this.showResultsAndRefreshGraphs();
            }
          );
        });
        if (buttonAdded) {
          buttonAdded();
        }
      });
  }

  protected getFullAnalysisData(): Promise<{
    athleteSnapshot: AthleteSnapshot;
    stats: ActivityStats;
  }> {
    return new Promise<{ athleteSnapshot: AthleteSnapshot; stats: ActivityStats; hasPowerMeter: boolean }>(resolve => {
      this.activityProcessor.getAnalysisData(
        this.activityInfo,
        null,
        (athleteSnapshot: AthleteSnapshot, stats: ActivityStats, hasPowerMeter: boolean) => {
          // Callback when analysis data has been computed
          resolve({ athleteSnapshot: athleteSnapshot, stats: stats, hasPowerMeter: hasPowerMeter });
        }
      );
    });
  }

  protected placeExtendedStatsButtonSegment(buttonAdded: () => void): void {
    $("#" + this.segmentEffortButtonId).on("click", evt => {
      this.getSegmentInfos((segmentInfosResponse: any) => {
        // Call Activity Processor with bounds
        if (!_.isNumber(segmentInfosResponse.start_index) || !_.isNumber(segmentInfosResponse.end_index)) {
          return;
        }

        // Update basic Infos
        this.activityInfo.segmentEffort = {
          name: segmentInfosResponse.display_name,
          elapsedTimeSec: segmentInfosResponse.elapsed_time_raw
        };

        this.activityProcessor.getAnalysisData(
          this.activityInfo,
          [segmentInfosResponse.start_index, segmentInfosResponse.end_index], // Bounds given, full activity requested
          (athleteSnapshot: AthleteSnapshot, stats: ActivityStats) => {
            // Callback when analysis data has been computed

            if (!this.athleteSnapshot) {
              this.athleteSnapshot = athleteSnapshot;
            }

            this.stats = stats;
            this.renderViews();
            this.showResultsAndRefreshGraphs();
          }
        );
      });
      evt.preventDefault();
      evt.stopPropagation();
    });

    if (buttonAdded) {
      buttonAdded();
    }
  }

  protected getSegmentInfos(callback: (segmentInfosResponse: any) => any): void {
    const effortId: string = _.last(window.location.href.match(/(\d+)$/g));

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

  protected renderViews(): void {
    this.content = "";

    this.setDataViewsNeeded();

    _.forEach(this.dataViews, view => {
      if (!view) {
        console.warn(view);
      }
      // Append result of view.render() to this.content
      view.render();
      this.content += view.getContent();
    });
  }

  protected showResultsAndRefreshGraphs(): void {
    window.$.fancybox({
      padding: 0,
      margin: 15,
      width: "100%",
      height: "100%",
      autoScale: true,
      transitionIn: "none",
      transitionOut: "none",
      closeBtn: false,
      type: "iframe",
      content: '<div class="elevateExtendedData">' + this.content + "</div>"
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
    if (this.stats) {
      const featuredDataView: FeaturedDataView = new FeaturedDataView(
        this.stats,
        this.activityInfo,
        this.userSettings,
        this.hasPowerMeter
      );
      featuredDataView.setAppResources(this.appResources);
      featuredDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
      featuredDataView.setActivityType(this.activityType);
      featuredDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
      this.dataViews.push(featuredDataView);
    }

    // Heart view
    if (this.stats.heartRate && this.userSettings.displayAdvancedHrData) {
      const heartRateDataView: HeartRateDataView = new HeartRateDataView(
        this.stats.heartRate,
        this.stats.scores.stress,
        "hrr",
        this.athleteSnapshot
      );
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

  protected insertContentAtGridPosition(
    columnId: number,
    rowId: number,
    data: string,
    title: string,
    units: string,
    userSettingKey: string
  ) {
    let onClickHtmlBehaviour = "";
    if (userSettingKey) {
      onClickHtmlBehaviour =
        "onclick='javascript:window.open(\"" +
        this.appResources.settingsLink +
        "#/globalSettings?viewOptionHelperId=" +
        userSettingKey +
        '","_blank");\'';
    }

    if (this.summaryGrid) {
      const content: string =
        '<span class="summaryGridDataContainer" ' +
        onClickHtmlBehaviour +
        ">" +
        data +
        ' <span class="summaryGridUnits">' +
        units +
        '</span><br /><span class="summaryGridTitle">' +
        title +
        "</span></span>";
      this.summaryGrid.find("[data-column=" + columnId + "][data-row=" + rowId + "]").html(content);
    } else {
      console.error("Grid is not initialized");
    }
  }
}
