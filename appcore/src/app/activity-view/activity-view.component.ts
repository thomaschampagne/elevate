import { AfterViewInit, Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { ActivityService } from "../shared/services/activity/activity.service";
import { ActivityStreamsModel, SyncedActivityModel } from "@elevate/shared/models";
import { StreamsService } from "../shared/services/streams/streams.service";
import { LoggerService } from "../shared/services/logging/logger.service";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

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

	constructor(private zone: NgZone,
				public activityService: ActivityService,
				public streamsService: StreamsService,
				public route: ActivatedRoute,
				public location: Location,
				public logger: LoggerService) {
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

		this.zone.runOutsideAngular(() => {

			const chart = am4core.create("chartdiv", am4charts.XYChart);

			const data = this.activityStreamsModel.time.map((time, index) => {
				return {
					speed: this.activityStreamsModel.velocity_smooth[index] * 3.6,
					// heartrate: this.activityStreamsModel.heartrate[index],
					gradeAdjustedSpeed: this.activityStreamsModel.grade_adjusted_speed[index] * 3.6,
					altitude: this.activityStreamsModel.altitude[index],
					date: new Date(this.activityStreamsModel.time[index] * 1000)
				};
			});

			chart.leftAxesContainer.layout = "vertical";

			// debugger
			chart.data = data;

			const durationAxis = chart.xAxes.push(new am4charts.DateAxis());
			durationAxis.groupData = true;
			durationAxis.groupCount = 800;

			const speedSeries = this.createSeriesWithAxe(chart, "speed", "kph", "#0051be");
			this.createSeriesWithAxe(chart, "gradeAdjustedSpeed", "kph", "#bf6900");
			// this.createSeriesWithAxe(chart, "heartrate", "bpm", "#be0038");
			this.createSeriesWithAxe(chart, "altitude", "m", "#2fbe53");

			const scrollbarX = new am4charts.XYChartScrollbar();
			// scrollbarX.series.push(hrSeries);
			scrollbarX.series.push(speedSeries);
			chart.scrollbarX = scrollbarX;

			chart.cursor = new am4charts.XYCursor();

			this.chart = chart;
		});
	}

	private createSeriesWithAxe(chart: am4charts.XYChart, name: string, units: string, color: string) {
		const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
		valueAxis.title.text = name;
		valueAxis.renderer.opposite = true;
		// valueAxis.tooltip.background.fill = am4core.color(color);
		const series = chart.series.push(new am4charts.LineSeries());
		series.name = name;
		series.stroke = am4core.color(color);
		series.strokeWidth = 1;
		series.dataFields.valueY = name;
		series.dataFields.dateX = "date";
		series.tooltipText = name + ": {valueY.value} " + units;
		series.yAxis = valueAxis;
		series.tooltip.getFillFromObject = false;
		series.tooltip.background.fill = am4core.color(color);
		return series;
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

}
