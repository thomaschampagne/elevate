import { AfterViewInit, Component, Inject, NgZone, OnDestroy, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { ActivityService } from "../shared/services/activity/activity.service";
import { ActivityStreamsModel, SyncedActivityModel } from "@elevate/shared/models";
import { StreamsService } from "../shared/services/streams/streams.service";
import { LoggerService } from "../shared/services/logging/logger.service";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { Helper } from "../../../../webextension/scripts/helper";
import { OPEN_RESOURCE_RESOLVER, OpenResourceResolver } from "../shared/services/links-opener/open-resource-resolver";

am4core.useTheme(am4themes_animated);

@Component({
    selector: "app-activity-view",
    templateUrl: "./activity-view.component.html",
    styleUrls: ["./activity-view.component.scss"]
})
export class ActivityViewComponent implements OnInit, AfterViewInit, OnDestroy {

    public syncedActivityModel: SyncedActivityModel;
    public activityStreamsModel: ActivityStreamsModel;

    public chart: am4charts.XYChart;

    constructor(@Inject(OPEN_RESOURCE_RESOLVER) private openResourceResolver: OpenResourceResolver,
                private zone: NgZone,
                private activityService: ActivityService,
                private streamsService: StreamsService,
                private route: ActivatedRoute,
                private location: Location,
                private logger: LoggerService) {
        this.syncedActivityModel = null;
        this.activityStreamsModel = null;
    }

    public ngOnInit(): void {

    }

    public ngAfterViewInit(): void {

        const activityId = this.route.snapshot.paramMap.get("id");
        this.activityService.getById(activityId).then(syncedActivityModel => {

            this.syncedActivityModel = syncedActivityModel;
            this.logger.info("syncedActivityModel", syncedActivityModel);

            return this.streamsService.getById(activityId);

        }).then(compressedStreamModel => {
            this.activityStreamsModel = (compressedStreamModel && compressedStreamModel.data) ? ActivityStreamsModel.deflate(compressedStreamModel.data) : null;
            this.logger.info("activityStreamsModel", this.activityStreamsModel);
            this.setupGraphs();
        });
    }

    public setupGraphs(): void {

        if (!this.activityStreamsModel) {
            return;
        }

        this.zone.runOutsideAngular(() => {

            const chart = am4core.create("chartdiv", am4charts.XYChart);

            const hasSpeed = this.activityStreamsModel.velocity_smooth && this.activityStreamsModel.velocity_smooth.length > 0;
            const hasAltitude = this.activityStreamsModel.altitude && this.activityStreamsModel.altitude.length > 0;
            const hasGrade = this.activityStreamsModel.grade_smooth && this.activityStreamsModel.grade_smooth.length > 0;
            const hasHeartrate = this.activityStreamsModel.heartrate && this.activityStreamsModel.heartrate.length > 0;
            const hasWatts = this.activityStreamsModel.watts && this.activityStreamsModel.watts.length > 0;

            const data = this.activityStreamsModel.time.map((time, index) => {

                const sample: any = {
                    date: new Date(this.activityStreamsModel.time[index] * 1000)
                };

                if (hasSpeed) {
                    const speed = this.activityStreamsModel.velocity_smooth[index] * 3.6;
                    sample.speed = speed;
                    sample.pace = Math.floor(Helper.convertSpeedToPace(speed));
                    sample.gap = Math.floor(Helper.convertSpeedToPace(this.activityStreamsModel.grade_adjusted_speed[index] * 3.6));
                }

                if (hasAltitude) {
                    sample.altitude = this.activityStreamsModel.altitude[index];
                }

                if (hasGrade) {
                    sample.grade = this.activityStreamsModel.grade_smooth[index];
                }

                if (hasHeartrate) {
                    sample.heartrate = this.activityStreamsModel.heartrate[index];
                }
                if (hasWatts) {
                    sample.watts = this.activityStreamsModel.watts[index];
                }

                return sample;
            });

            chart.leftAxesContainer.layout = "vertical";

            // debugger
            chart.data = data;

            const durationAxis = chart.xAxes.push(new am4charts.DateAxis());
            durationAxis.groupData = true;
            durationAxis.groupCount = 800;

            // const speedSeries =
            this.createSeriesWithAxe(chart, "speed", "kph", "#0051be");
            // this.createSeriesWithAxe(chart, "pace", "s/km", "#0c45bf");
            // this.createSeriesWithAxe(chart, "gap", "s/km", "#9945bf");
            // this.createSeriesWithAxe(chart, "grade", "%", "#bf8d00", 2);
            this.createSeriesWithAxe(chart, "heartrate", "bpm", "#be0038");
            const altitudeSerie = this.createSeriesWithAxe(chart, "altitude", "m", "#2fbe53", 2);
            this.createSeriesWithAxe(chart, "watts", "w", "#686868");

            const scrollbarX = new am4charts.XYChartScrollbar();
            // scrollbarX.series.push(hrSeries);
            scrollbarX.series.push(altitudeSerie);
            chart.scrollbarX = scrollbarX;

            chart.cursor = new am4charts.XYCursor();

            this.chart = chart;
        });
    }

    public ngOnDestroy() {
        this.zone.runOutsideAngular(() => {
            if (this.chart) {
                this.chart.dispose();
            }
        });
    }

    public onBack(): void {
        this.location.back();
    }

    public openSourceActivity(id: number | string): void {
        this.openResourceResolver.openSourceActivity(id);
    }

    private createSeriesWithAxe(chart: am4charts.XYChart, name: string, units: string, color: string, strokeWidth: number = 1) {
        const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
        valueAxis.title.text = name;
        valueAxis.renderer.opposite = true;
        // valueAxis.tooltip.background.fill = am4core.color(color);
        const series = chart.series.push(new am4charts.LineSeries());
        series.name = name;
        series.stroke = am4core.color(color);
        series.strokeWidth = strokeWidth;
        series.dataFields.valueY = name;
        series.dataFields.dateX = "date";
        series.tooltipText = name + ": {valueY.value} " + units;
        series.yAxis = valueAxis;
        series.tooltip.getFillFromObject = false;
        series.tooltip.background.fill = am4core.color(color);
        return series;
    }
}
