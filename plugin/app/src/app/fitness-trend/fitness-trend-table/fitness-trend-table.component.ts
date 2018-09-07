import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from "@angular/core";
import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";
import { MatDialog, MatPaginator, MatSort, MatTableDataSource } from "@angular/material";
import * as _ from "lodash";
import { FitnessTrendComponent } from "../fitness-trend.component";
import * as moment from "moment";
import { FitnessTrendColumnModel } from "./fitness-trend-column.model";
import { FitnessTrendColumnType } from "./fitness-trend-column.enum";
import { HeartRateImpulseMode } from "../shared/enums/heart-rate-impulse-mode.enum";
import { FitnessTrendConfigModel } from "../shared/models/fitness-trend-config.model";
import { Parser as Json2CsvParser } from "json2csv";
import { saveAs } from "file-saver";
import { GotItDialogComponent } from "../../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../../shared/dialogs/got-it-dialog/got-it-dialog-data.model";

@Component({
	selector: "app-fitness-trend-table",
	templateUrl: "./fitness-trend-table.component.html",
	styleUrls: ["./fitness-trend-table.component.scss"]
})
export class FitnessTrendTableComponent implements OnInit, OnChanges, AfterViewInit {

	public static readonly COLUMN_DATE: string = "date";
	public static readonly COLUMN_TYPES: string = "types";
	public static readonly COLUMN_ACTIVITIES: string = "activities";
	public static readonly COLUMN_TRAINING_IMPULSE_SCORE: string = "trainingImpulseScore";
	public static readonly COLUMN_HEART_RATE_STRESS_SCORE: string = "heartRateStressScore";
	public static readonly COLUMN_POWER_STRESS_SCORE: string = "powerStressScore";
	public static readonly COLUMN_RUNNING_STRESS_SCORE: string = "runningStressScore";
	public static readonly COLUMN_SWIM_STRESS_SCORE: string = "swimStressScore";
	public static readonly COLUMN_FINAL_STRESS_SCORE: string = "finalStressScore";
	public static readonly COLUMN_CTL: string = "ctl";
	public static readonly COLUMN_ATL: string = "atl";
	public static readonly COLUMN_TSB: string = "tsb";
	public static readonly COLUMN_TRAINING_ZONE: string = "zone";
	public static readonly COLUMN_ATHLETE_SETTINGS: string = "athleteSettings";
	public static readonly COLUMN_STRAVA_LINK: string = "link";

	public static readonly AVAILABLE_COLUMNS: FitnessTrendColumnModel[] = [
		{
			columnDef: FitnessTrendTableComponent.COLUMN_DATE,
			header: "Date",
			type: FitnessTrendColumnType.TEXT,
			printText: (dayFitnessTrend: DayFitnessTrendModel) => `${moment(dayFitnessTrend.date).format("ddd, MMM DD, YYYY")}`
		},
		{
			columnDef: FitnessTrendTableComponent.COLUMN_TYPES,
			header: "Types",
			type: FitnessTrendColumnType.TEXT,
			printText: (dayFitnessTrend: DayFitnessTrendModel) => `${dayFitnessTrend.printTypes("-")}`
		},
		{
			columnDef: FitnessTrendTableComponent.COLUMN_ACTIVITIES,
			header: "Activities",
			type: FitnessTrendColumnType.TEXT,
			printText: (dayFitnessTrend: DayFitnessTrendModel) => `${dayFitnessTrend.printActivities("-")}`
		},
		{
			columnDef: FitnessTrendTableComponent.COLUMN_HEART_RATE_STRESS_SCORE,
			header: "HRSS",
			toolTip: "Heart Rate Stress Score",
			type: FitnessTrendColumnType.TEXT,
			printText: (dayFitnessTrend: DayFitnessTrendModel) => `${dayFitnessTrend.printHeartRateStressScore()}`
		},
		{
			columnDef: FitnessTrendTableComponent.COLUMN_TRAINING_IMPULSE_SCORE,
			header: "TRIMP",
			toolTip: "Training Impulse",
			type: FitnessTrendColumnType.TEXT,
			printText: (dayFitnessTrend: DayFitnessTrendModel) => `${dayFitnessTrend.printTrainingImpulseScore()}`
		},
		{
			columnDef: FitnessTrendTableComponent.COLUMN_POWER_STRESS_SCORE,
			header: "PSS",
			toolTip: "Power Stress Score",
			type: FitnessTrendColumnType.TEXT,
			printText: (dayFitnessTrend: DayFitnessTrendModel) => `${dayFitnessTrend.printPowerStressScore()}`
		},
		{
			columnDef: FitnessTrendTableComponent.COLUMN_RUNNING_STRESS_SCORE,
			header: "RSS",
			toolTip: "Running Stress Score",
			type: FitnessTrendColumnType.TEXT,
			printText: (dayFitnessTrend: DayFitnessTrendModel) => `${dayFitnessTrend.printRunningStressScore()}`
		},
		{
			columnDef: FitnessTrendTableComponent.COLUMN_SWIM_STRESS_SCORE,
			header: "SwimSS",
			toolTip: "Swim Stress Score",
			type: FitnessTrendColumnType.TEXT,
			printText: (dayFitnessTrend: DayFitnessTrendModel) => `${dayFitnessTrend.printSwimStressScore()}`
		},
		{
			columnDef: FitnessTrendTableComponent.COLUMN_FINAL_STRESS_SCORE,
			header: "Final Stress",
			type: FitnessTrendColumnType.TEXT,
			printText: (dayFitnessTrend: DayFitnessTrendModel) => `${dayFitnessTrend.printFinalStressScore()}`
		},
		{
			columnDef: FitnessTrendTableComponent.COLUMN_CTL,
			header: "Fitness",
			type: FitnessTrendColumnType.TEXT,
			printText: (dayFitnessTrend: DayFitnessTrendModel) => `${dayFitnessTrend.printFitness()}`
		},
		{
			columnDef: FitnessTrendTableComponent.COLUMN_ATL,
			header: "Fatigue",
			type: FitnessTrendColumnType.TEXT,
			printText: (dayFitnessTrend: DayFitnessTrendModel) => `${dayFitnessTrend.printFatigue()}`
		},
		{
			columnDef: FitnessTrendTableComponent.COLUMN_TSB,
			header: "Form",
			type: FitnessTrendColumnType.TEXT,
			printText: (dayFitnessTrend: DayFitnessTrendModel) => `${dayFitnessTrend.printForm()}`
		},
		{
			columnDef: FitnessTrendTableComponent.COLUMN_TRAINING_ZONE,
			header: "Training Zone",
			type: FitnessTrendColumnType.TEXT,
			printText: (dayFitnessTrend: DayFitnessTrendModel) => `${dayFitnessTrend.printTrainingZone()}`
		},
		{
			columnDef: FitnessTrendTableComponent.COLUMN_ATHLETE_SETTINGS,
			header: "Settings",
			type: FitnessTrendColumnType.ATHLETE_SETTINGS
		},
		{
			columnDef: FitnessTrendTableComponent.COLUMN_STRAVA_LINK,
			header: "Link",
			type: FitnessTrendColumnType.STRAVA_LINK
		}
	];

	public dataSource: MatTableDataSource<DayFitnessTrendModel>;
	public FitnessTrendColumnType = FitnessTrendColumnType;
	public columns: FitnessTrendColumnModel[];
	public displayedColumns: string [];
	public searchText: string;

	public initialized = false;

	@Input("fitnessTrend")
	public fitnessTrend: DayFitnessTrendModel[];

	@Input("fitnessTrendConfigModel")
	public fitnessTrendConfigModel: FitnessTrendConfigModel;

	@Input("isTrainingZonesEnabled")
	public isTrainingZonesEnabled;

	@Input("isPowerMeterEnabled")
	public isPowerMeterEnabled;

	@Input("isSwimEnabled")
	public isSwimEnabled;

	@ViewChild(MatPaginator)
	public matPaginator: MatPaginator;

	@ViewChild(MatSort)
	public matSort: MatSort;

	constructor(public dialog: MatDialog) {
	}

	public ngOnInit(): void {
		this.setup();
		this.initialized = true;
	}

	public ngOnChanges(changes: SimpleChanges): void {

		if (!this.initialized) {
			return;
		}

		this.columns = _.filter(FitnessTrendTableComponent.AVAILABLE_COLUMNS, (column: FitnessTrendColumnModel) => {
			if ((column.columnDef === FitnessTrendTableComponent.COLUMN_POWER_STRESS_SCORE && !this.isPowerMeterEnabled)
				|| (column.columnDef === FitnessTrendTableComponent.COLUMN_SWIM_STRESS_SCORE && !this.isSwimEnabled)
				|| (column.columnDef === FitnessTrendTableComponent.COLUMN_TRAINING_ZONE && !this.isTrainingZonesEnabled)
				|| (column.columnDef === FitnessTrendTableComponent.COLUMN_RUNNING_STRESS_SCORE && !this.fitnessTrendConfigModel.allowEstimatedRunningStressScore)
				|| (column.columnDef === FitnessTrendTableComponent.COLUMN_HEART_RATE_STRESS_SCORE && this.fitnessTrendConfigModel.heartRateImpulseMode !== HeartRateImpulseMode.HRSS)
				|| (column.columnDef === FitnessTrendTableComponent.COLUMN_RUNNING_STRESS_SCORE && this.fitnessTrendConfigModel.heartRateImpulseMode !== HeartRateImpulseMode.HRSS)
				|| (column.columnDef === FitnessTrendTableComponent.COLUMN_TRAINING_IMPULSE_SCORE && this.fitnessTrendConfigModel.heartRateImpulseMode !== HeartRateImpulseMode.TRIMP)) {
				return false;
			}
			return true;
		});

		this.displayedColumns = this.columns.map(column => column.columnDef);

		if (changes.fitnessTrend && changes.fitnessTrend.currentValue) {
			this.dataSource.data = this.prepareFitnessTrendModels(changes.fitnessTrend.currentValue);
		}

	}

	public setup(): void {

		this.dataSource = new MatTableDataSource<DayFitnessTrendModel>();
		this.dataSource.sortingDataAccessor = (dayFitnessTrendModel: DayFitnessTrendModel, sortHeaderId: string) => {

			switch (sortHeaderId) {

				case FitnessTrendTableComponent.COLUMN_DATE:
					return dayFitnessTrendModel.timestamp;

				case FitnessTrendTableComponent.COLUMN_TYPES:
					return dayFitnessTrendModel.printTypes();

				case FitnessTrendTableComponent.COLUMN_ACTIVITIES:
					return dayFitnessTrendModel.printActivities();

				case FitnessTrendTableComponent.COLUMN_HEART_RATE_STRESS_SCORE:
					return dayFitnessTrendModel.heartRateStressScore;

				case FitnessTrendTableComponent.COLUMN_TRAINING_IMPULSE_SCORE:
					return dayFitnessTrendModel.trainingImpulseScore;

				case FitnessTrendTableComponent.COLUMN_POWER_STRESS_SCORE:
					return dayFitnessTrendModel.powerStressScore;

				case FitnessTrendTableComponent.COLUMN_RUNNING_STRESS_SCORE:
					return dayFitnessTrendModel.runningStressScore;

				case FitnessTrendTableComponent.COLUMN_SWIM_STRESS_SCORE:
					return dayFitnessTrendModel.swimStressScore;

				case FitnessTrendTableComponent.COLUMN_FINAL_STRESS_SCORE:
					return dayFitnessTrendModel.finalStressScore;

				case FitnessTrendTableComponent.COLUMN_CTL:
					return dayFitnessTrendModel.ctl;

				case FitnessTrendTableComponent.COLUMN_ATL:
					return dayFitnessTrendModel.atl;

				case FitnessTrendTableComponent.COLUMN_TSB:
					return dayFitnessTrendModel.tsb;

				case FitnessTrendTableComponent.COLUMN_TRAINING_ZONE:
					return dayFitnessTrendModel.trainingZone;

				case FitnessTrendTableComponent.COLUMN_ATHLETE_SETTINGS:
					return null;

				case FitnessTrendTableComponent.COLUMN_STRAVA_LINK:
					return dayFitnessTrendModel.timestamp;

				default:
					throw new Error("sortHeaderId: " + sortHeaderId + " is not listed");

			}

		};
	}

	public prepareFitnessTrendModels(fitnessTrendModels: DayFitnessTrendModel[]): DayFitnessTrendModel[] {

		// Remove preview days
		fitnessTrendModels = _.filter(fitnessTrendModels, {
			previewDay: false,
		});

		// Sort by date desc
		fitnessTrendModels = _.sortBy(fitnessTrendModels, (dayFitnessTrendModel: DayFitnessTrendModel) => {
			return dayFitnessTrendModel.timestamp * -1;
		});
		return fitnessTrendModels;
	}

	public applyFilter(filterValue: string): void {
		filterValue = filterValue.trim(); // Remove whitespace
		filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
		this.dataSource.filter = filterValue;
	}

	public ngAfterViewInit(): void {
		this.dataSource.paginator = this.matPaginator;
		this.dataSource.sort = this.matSort;
	}

	private generateSpreadSheetExportData(): any[] {

		const exportedFitnessTrend = [];

		_.forEach(this.fitnessTrend, (dayFitnessTrendModel: DayFitnessTrendModel) => {

			const exportedFitnessDay: any = _.clone(dayFitnessTrendModel);

			exportedFitnessDay[FitnessTrendTableComponent.COLUMN_DATE] = dayFitnessTrendModel.dateString;
			exportedFitnessDay[FitnessTrendTableComponent.COLUMN_ACTIVITIES] = dayFitnessTrendModel.printActivities();
			exportedFitnessDay[FitnessTrendTableComponent.COLUMN_TYPES] = dayFitnessTrendModel.printTypes();

			exportedFitnessDay.atl = _.floor(dayFitnessTrendModel.atl, 2);
			exportedFitnessDay.ctl = _.floor(dayFitnessTrendModel.ctl, 2);
			exportedFitnessDay.tsb = _.floor(dayFitnessTrendModel.tsb, 2);
			exportedFitnessDay.zone = dayFitnessTrendModel.printTrainingZone();

			exportedFitnessDay.trainingImpulseScore = (dayFitnessTrendModel.trainingImpulseScore) ? _.floor(dayFitnessTrendModel.trainingImpulseScore, 2) : "";
			exportedFitnessDay.heartRateStressScore = (dayFitnessTrendModel.heartRateStressScore) ? _.floor(dayFitnessTrendModel.heartRateStressScore, 2) : "";
			exportedFitnessDay.runningStressScore = (dayFitnessTrendModel.runningStressScore) ? _.floor(dayFitnessTrendModel.runningStressScore, 2) : "";
			exportedFitnessDay.powerStressScore = (dayFitnessTrendModel.powerStressScore) ? _.floor(dayFitnessTrendModel.powerStressScore, 2) : "";
			exportedFitnessDay.finalStressScore = (dayFitnessTrendModel.finalStressScore) ? _.floor(dayFitnessTrendModel.finalStressScore, 2) : "";

			exportedFitnessDay.athleteSettings = (dayFitnessTrendModel.printAthleteSettings()) ? dayFitnessTrendModel.printAthleteSettings() : "";

			exportedFitnessTrend.push(exportedFitnessDay);
		});

		return exportedFitnessTrend;
	}

	public onOpenActivities(ids: number[]): void {
		FitnessTrendComponent.openActivities(ids);
	}

	public onViewAthleteSettings(dayFitnessTrendModel: DayFitnessTrendModel): void {
		this.dialog.open(GotItDialogComponent, {
			minWidth: GotItDialogComponent.MIN_WIDTH,
			maxWidth: GotItDialogComponent.MAX_WIDTH,
			data: new GotItDialogDataModel("Calculated with athlete settings", dayFitnessTrendModel.printAthleteSettings())
		});
	}

	public onSpreadSheetExport(): void {

		try {
			const exportedFields = _.without(this.displayedColumns, FitnessTrendTableComponent.COLUMN_STRAVA_LINK);
			const parser = new Json2CsvParser({fields: exportedFields});
			const csvData = parser.parse(this.generateSpreadSheetExportData());
			const blob = new Blob([csvData], {type: "application/csv; charset=utf-8"});
			const filename = "fitness_trend_export." + moment().format("Y.M.D-H.mm.ss") + ".csv";
			saveAs(blob, filename);
		} catch (err) {
			console.error(err);
		}

	}
}
