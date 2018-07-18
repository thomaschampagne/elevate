import { Component, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { YearProgressModel } from "../shared/models/year-progress.model";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import * as moment from "moment";
import { Moment } from "moment";
import { ProgressionAtDayModel } from "../shared/models/progression-at-date.model";
import { YearProgressService } from "../shared/services/year-progress.service";
import { ProgressType } from "../shared/models/progress-type.enum";
import * as _ from "lodash";
import { ProgressionAtDayRow } from "./models/progression-at-day-row.model";
import { YearProgressStyleModel } from "../year-progress-graph/models/year-progress-style.model";
import { DeltaType } from "./models/delta-type.enum";
import { MatTableDataSource } from "@angular/material";
import { Delta } from "./models/delta.model";

@Component({
	selector: "app-year-progress-table",
	templateUrl: "./year-progress-table.component.html",
	styleUrls: ["./year-progress-table.component.scss"]
})
export class YearProgressTableComponent implements OnInit, OnChanges {

	public static readonly COLUMN_YEAR: string = "year";
	public static readonly COLUMN_PROGRESS_TYPE_VALUE: string = "progressTypeValue";
	public static readonly COLUMN_DELTA_PREVIOUS_VALUE: string = "deltaPrevious";
	public static readonly COLUMN_DELTA_CURRENT_VALUE: string = "deltaCurrent";

	public static readonly DELTA_SIGN_POSITIVE: string = "+";
	public static readonly DELTA_SIGN_NEGATIVE: string = "-";
	public static readonly DELTA_SIGN_UNSIGNED: string = "";

	public displayedColumns: string[] = [
		YearProgressTableComponent.COLUMN_YEAR,
		YearProgressTableComponent.COLUMN_PROGRESS_TYPE_VALUE,
		YearProgressTableComponent.COLUMN_DELTA_PREVIOUS_VALUE,
		YearProgressTableComponent.COLUMN_DELTA_CURRENT_VALUE
	];

	public readonly ProgressType = ProgressType;
	public readonly DeltaType = DeltaType;

	public momentWatched: Moment;

	public currentYear: number;

	public currentYearProgressionAtDayModel: ProgressionAtDayModel;

	public dataSource: MatTableDataSource<ProgressionAtDayRow>;

	public initialized = false;

	@Input("hideYearsColumn")
	public hideYearsColumn: boolean;

	@Input("selectedYears")
	public selectedYears: number[];

	@Input("selectedProgressType")
	public selectedProgressType: YearProgressTypeModel;

	@Input("yearProgressModels")
	public yearProgressModels: YearProgressModel[];

	@Input("yearProgressStyleModel")
	public yearProgressStyleModel: YearProgressStyleModel;


	constructor(public yearProgressService: YearProgressService) {
	}

	public ngOnInit(): void {

		this.currentYear = moment().year();

		// Use default moment provided by service on init (should be today on first load)
		this.momentWatched = this.yearProgressService.momentWatched;

		// By default moment watched is today
		this.dataSource = new MatTableDataSource<ProgressionAtDayRow>();

		this.update();

		if (this.hideYearsColumn) {
			this.displayedColumns = _.remove(this.displayedColumns, (column: string) => {
				return (column !== YearProgressTableComponent.COLUMN_YEAR);
			});
		}

		this.initialized = true;

		// When user mouse moves on graph, listen for moment watched and update table rows
		this.yearProgressService.momentWatchedChanges.subscribe((momentWatched: Moment) => {
			this.momentWatched = momentWatched;
			this.update();
		});
	}

	public ngOnChanges(changes: SimpleChanges): void {

		if (!this.initialized) {
			return;
		}

		this.update();
	}

	public update(): void {

		// Find progressions for moment watched on current year
		this.currentYearProgressionAtDayModel = _.first(this.yearProgressService.findProgressionsAtDay(this.yearProgressModels,
			this.momentWatched,
			this.selectedProgressType.type,
			[this.currentYear],
			this.yearProgressStyleModel.yearsColorsMap));


		// Find progressions for moment watched on selected years
		const progressionAtDayModels: ProgressionAtDayModel[] = this.yearProgressService.findProgressionsAtDay(this.yearProgressModels,
			this.momentWatched,
			this.selectedProgressType.type,
			this.selectedYears,
			this.yearProgressStyleModel.yearsColorsMap);

		this.dataSource.data = this.rows(progressionAtDayModels);
	}

	public rows(progressionAtDayModels: ProgressionAtDayModel[]): ProgressionAtDayRow[] {


		const progressionAtDayRows: ProgressionAtDayRow[] = [];

		_.forEach(progressionAtDayModels, (progressionAtDayModel: ProgressionAtDayModel, index: number) => {

			// Calculate values and deltas
			const previousYearProgressAtDay: ProgressionAtDayModel = progressionAtDayModels[index + 1];
			const deltaPreviousYear: Delta = this.getDeltaValueBetween(progressionAtDayModel, previousYearProgressAtDay);
			const deltaCurrentYear: Delta = this.getDeltaValueBetween(progressionAtDayModel, this.currentYearProgressionAtDayModel);

			const progressionAtDayRow: ProgressionAtDayRow = {
				year: progressionAtDayModel.year,
				color: progressionAtDayModel.color,
				progressTypeLabel: this.selectedProgressType.label,
				progressTypeUnit: (this.selectedProgressType.shortUnit) ? this.selectedProgressType.shortUnit : "",
				currentValue: progressionAtDayModel.value,
				deltaPreviousYear: deltaPreviousYear,
				deltaCurrentYear: deltaCurrentYear
			};

			progressionAtDayRows.push(progressionAtDayRow);

		});

		return progressionAtDayRows;
	}

	public getDeltaValueBetween(progressionAtDayModel_A: ProgressionAtDayModel, progressionAtDayModel_B: ProgressionAtDayModel): Delta {

		const isSameYearComparison = (progressionAtDayModel_A && progressionAtDayModel_B && progressionAtDayModel_A.year === progressionAtDayModel_B.year);
		const B_value: number = (progressionAtDayModel_B && _.isNumber(progressionAtDayModel_B.value)) ? progressionAtDayModel_B.value : null;
		const deltaValue: number = (_.isNumber(B_value)) ? (progressionAtDayModel_A.value - B_value) : null;

		// Sign of delta
		let deltaType: DeltaType;
		let deltaSignSymbol: string;
		if (_.isNull(deltaValue) || isSameYearComparison) {
			deltaType = DeltaType.NAN;
			deltaSignSymbol = null;
		} else if (deltaValue === 0) {
			deltaType = DeltaType.UNSIGNED;
			deltaSignSymbol = YearProgressTableComponent.DELTA_SIGN_UNSIGNED;
		} else if (deltaValue < 0) {
			deltaType = DeltaType.NEGATIVE;
			deltaSignSymbol = YearProgressTableComponent.DELTA_SIGN_NEGATIVE;
		} else {
			deltaType = DeltaType.POSITIVE;
			deltaSignSymbol = YearProgressTableComponent.DELTA_SIGN_POSITIVE;
		}


		return {
			type: deltaType,
			date: (progressionAtDayModel_B) ? moment(progressionAtDayModel_B.date).format("MMMM DD, YYYY") : null,
			value: (!_.isNull(deltaValue)) ? Math.abs(deltaValue) : null,
			signSymbol: deltaSignSymbol,
			class: deltaType.toString(),
		};

	}


	/**
	 *
	 * @param {number} hours
	 * @returns {string}
	 */
	public readableTimeProgress(hours: number): string {
		return this.yearProgressService.readableTimeProgress(hours);
	}

}
