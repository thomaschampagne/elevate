import { Component, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { YearProgressModel } from "../shared/models/year-progress.model";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import * as moment from "moment";
import { Moment } from "moment";
import { ProgressAtDayModel } from "../shared/models/progress-at-date.model";
import { YearProgressService } from "../shared/services/year-progress.service";
import { ProgressType } from "../shared/enums/progress-type.enum";
import * as _ from "lodash";
import { ProgressionAtDayRow } from "./models/progression-at-day-row.model";
import { YearProgressStyleModel } from "../year-progress-graph/models/year-progress-style.model";
import { DeltaType } from "./models/delta-type.enum";
import { MatTableDataSource } from "@angular/material";
import { Delta } from "./models/delta.model";
import { TargetProgressModel } from "../shared/models/target-progress.model";

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
	public static readonly COLUMN_DELTA_CURRENT_TARGET: string = "deltaTarget";

	public static readonly DELTA_SIGN_POSITIVE: string = "+";
	public static readonly DELTA_SIGN_NEGATIVE: string = "-";
	public static readonly DELTA_SIGN_UNSIGNED: string = "";

	public displayedColumns: string[] = [
		YearProgressTableComponent.COLUMN_YEAR,
		YearProgressTableComponent.COLUMN_PROGRESS_TYPE_VALUE,
		YearProgressTableComponent.COLUMN_DELTA_PREVIOUS_VALUE,
		YearProgressTableComponent.COLUMN_DELTA_CURRENT_VALUE,
		YearProgressTableComponent.COLUMN_DELTA_CURRENT_TARGET
	];

	public readonly ProgressType = ProgressType;
	public readonly DeltaType = DeltaType;

	public todayMoment: Moment;
	public momentWatched: Moment;
	public currentYear: number;
	public currentYearProgressAtDayModel: ProgressAtDayModel;
	public dataSource: MatTableDataSource<ProgressionAtDayRow>;
	public initialized = false;

	@Input("hideYearsColumn")
	public hideYearsColumn: boolean;

	@Input("selectedYears")
	public selectedYears: number[];

	@Input("selectedProgressType")
	public selectedProgressType: YearProgressTypeModel;

	@Input("yearProgressions")
	public yearProgressions: YearProgressModel[];

	@Input("targetProgressModels")
	public targetProgressModels: TargetProgressModel[];

	@Input("yearProgressStyleModel")
	public yearProgressStyleModel: YearProgressStyleModel;


	constructor(public yearProgressService: YearProgressService) {
	}

	public ngOnInit(): void {

		this.todayMoment = moment();

		this.currentYear = this.todayMoment.year();

		// Use default moment provided by service on init (should be today on first load)
		this.momentWatched = this.yearProgressService.momentWatched;

		if (this.hideYearsColumn) {
			this.displayedColumns = _.remove(this.displayedColumns, (column: string) => {
				return (column !== YearProgressTableComponent.COLUMN_YEAR);
			});
		}

		// Fist data update
		this.updateData();

		this.initialized = true;

		// When user mouse moves on graph, listen for moment watched and update table rows
		this.yearProgressService.momentWatchedChanges.subscribe((momentWatched: Moment) => {

			if (this.momentWatched.isSame(momentWatched)) {
				return;
			}

			this.momentWatched = momentWatched;
			this.updateData();
		});
	}

	public ngOnChanges(changes: SimpleChanges): void {

		if (this.targetProgressModels) { // Has target given?

			// Add delta target column if not in current columns
			const hasDeltaTargetColumn = _.indexOf(this.displayedColumns, YearProgressTableComponent.COLUMN_DELTA_CURRENT_TARGET) !== -1;
			if (!hasDeltaTargetColumn) {
				this.displayedColumns.push(YearProgressTableComponent.COLUMN_DELTA_CURRENT_TARGET);
			}

		} else {
			// Remove delta target column
			this.displayedColumns = _.remove(this.displayedColumns, (column: string) => {
				return (column !== YearProgressTableComponent.COLUMN_DELTA_CURRENT_TARGET);
			});
		}

		if (!this.initialized) {
			return;
		}

		this.updateData();
	}

	public updateData(): void {

		// Find progressions for moment watched on current year
		this.currentYearProgressAtDayModel = _.first(this.yearProgressService.findProgressionsAtDay(this.yearProgressions,
			this.momentWatched,
			this.selectedProgressType.type,
			[this.currentYear],
			this.yearProgressStyleModel.yearsColorsMap));


		// Find progressions for moment watched on selected years
		const progressAtDayModels: ProgressAtDayModel[] = this.yearProgressService.findProgressionsAtDay(this.yearProgressions,
			this.momentWatched,
			this.selectedProgressType.type,
			this.selectedYears,
			this.yearProgressStyleModel.yearsColorsMap);

		// If target progression given, seek for target model of watched day.
		// It includes the value that athlete should reach at that day to respect target
		const targetProgressModel = (this.targetProgressModels) ? _.find(this.targetProgressModels, {
			dayOfYear: this.momentWatched.dayOfYear()
		}) : null;

		this.dataSource = new MatTableDataSource<ProgressionAtDayRow>(); // Force table to refresh with new instantiation.
		this.dataSource.data = this.rows(progressAtDayModels, targetProgressModel);
	}

	public rows(progressAtDayModels: ProgressAtDayModel[], targetProgressModel: TargetProgressModel): ProgressionAtDayRow[] {

		const progressionAtDayRows: ProgressionAtDayRow[] = [];

		_.forEach(progressAtDayModels, (progressAtDayModel: ProgressAtDayModel, index: number) => {

			// Calculate values and deltas
			const previousYearProgressAtDay: ProgressAtDayModel = progressAtDayModels[index + 1];
			const deltaPreviousYear: Delta = this.getDeltaValueBetween(progressAtDayModel, previousYearProgressAtDay);
			const deltaCurrentYear: Delta = this.getDeltaValueBetween(progressAtDayModel, this.currentYearProgressAtDayModel);
			const deltaTarget: Delta = (targetProgressModel) ? this.getDeltaFromTarget(progressAtDayModel, targetProgressModel) : null;

			const progressionAtDayRow: ProgressionAtDayRow = {
				year: progressAtDayModel.year,
				color: progressAtDayModel.color,
				progressTypeLabel: this.selectedProgressType.label,
				progressTypeUnit: (this.selectedProgressType.shortUnit) ? this.selectedProgressType.shortUnit : "",
				currentValue: progressAtDayModel.value,
				deltaPreviousYear: deltaPreviousYear,
				deltaCurrentYear: deltaCurrentYear,
				deltaTarget: deltaTarget
			};

			progressionAtDayRows.push(progressionAtDayRow);

		});

		return progressionAtDayRows;
	}

	public getDeltaFromTarget(progressAtDayModel: ProgressAtDayModel, targetProgressModel: TargetProgressModel): Delta {

		const deltaValue: number = (_.isNumber(targetProgressModel.value)) ? Math.floor(progressAtDayModel.value - targetProgressModel.value) : null;

		let deltaType: DeltaType;
		let deltaSignSymbol: string;
		if (_.isNull(deltaValue)) {
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
			date: (progressAtDayModel) ? moment(progressAtDayModel.date).format("MMMM DD, YYYY") : null,
			value: (!_.isNull(deltaValue)) ? Math.abs(deltaValue) : null,
			signSymbol: deltaSignSymbol,
			class: (progressAtDayModel.year === this.currentYear && this.momentWatched.dayOfYear() > this.todayMoment.dayOfYear()) ? DeltaType.NAN : deltaType.toString()
		};

	}

	public getDeltaValueBetween(progressAtDayModel_A: ProgressAtDayModel, progressAtDayModel_B: ProgressAtDayModel): Delta {

		const isSameYearComparison = (progressAtDayModel_A && progressAtDayModel_B && progressAtDayModel_A.year === progressAtDayModel_B.year);
		const B_value: number = (progressAtDayModel_B && _.isNumber(progressAtDayModel_B.value)) ? progressAtDayModel_B.value : null;
		const deltaValue: number = (_.isNumber(B_value)) ? (progressAtDayModel_A.value - B_value) : null;

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
			date: (progressAtDayModel_B) ? moment(progressAtDayModel_B.date).format("MMMM DD, YYYY") : null,
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
