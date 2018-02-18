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

@Component({
	selector: "app-year-progress-table",
	templateUrl: "./year-progress-table.component.html",
	styleUrls: ["./year-progress-table.component.scss"]
})
export class YearProgressTableComponent implements OnInit, OnChanges {

	public static readonly COLUMN_YEAR: string = "year";
	public static readonly COLUMN_PROGRESS_TYPE_VALUE: string = "progressTypeValue";
	public static readonly COLUMN_DELTA_PREVIOUS_VALUE: string = "deltaPrevious";

	public static readonly DELTA_SIGN_POSITIVE: string = "+";
	public static readonly DELTA_SIGN_NEGATIVE: string = "-";
	public static readonly DELTA_SIGN_UNSIGNED: string = "";

	public readonly displayedColumns: string[] = [
		YearProgressTableComponent.COLUMN_YEAR,
		YearProgressTableComponent.COLUMN_PROGRESS_TYPE_VALUE,
		YearProgressTableComponent.COLUMN_DELTA_PREVIOUS_VALUE
	];

	public readonly ProgressType = ProgressType;

	public readonly DeltaType = DeltaType;

	@Input("selectedYears")
	public selectedYears: number[];

	@Input("selectedProgressType")
	public selectedProgressType: YearProgressTypeModel;

	@Input("yearProgressModels")
	public yearProgressModels: YearProgressModel[];

	@Input("yearProgressStyleModel")
	public yearProgressStyleModel: YearProgressStyleModel;

	public momentWatched: Moment;

	public dataSource: MatTableDataSource<ProgressionAtDayRow>;

	public initialized = false;

	constructor(public yearProgressService: YearProgressService) {
	}

	public ngOnInit(): void {

		// Use default moment provided by service on init (should be today on first load)
		this.momentWatched = this.yearProgressService.momentWatched;

		// By default moment watched is today
		this.dataSource = new MatTableDataSource<ProgressionAtDayRow>();

		this.updateRows();

		this.initialized = true;

		// When user mouse moves on graph, listen for moment watched and update table rows
		this.yearProgressService.momentWatchedChanges.subscribe((momentWatched: Moment) => {
			this.momentWatched = momentWatched;
			this.updateRows();
		});
	}

	public ngOnChanges(changes: SimpleChanges): void {

		if (!this.initialized) {
			return;
		}

		this.updateRows();
	}

	public updateRows(): void {

		this.dataSource.data = this.rows(this.yearProgressService.findProgressionsAtDay(this.yearProgressModels,
			this.momentWatched,
			this.selectedProgressType.type,
			this.selectedYears,
			this.yearProgressStyleModel.yearsColorsMap));
	}

	public rows(progressionAtDayModels: ProgressionAtDayModel[]): ProgressionAtDayRow[] {

		const progressionAtDayRows: ProgressionAtDayRow[] = [];

		_.forEach(progressionAtDayModels, (progressionAtDayModel: ProgressionAtDayModel, index: number) => {

			// Calculate values and deltas
			const currentValue: number = progressionAtDayModel.value;
			const previousYearProgressAtDay = progressionAtDayModels[index + 1];
			const previousValue: number = (previousYearProgressAtDay && _.isNumber(previousYearProgressAtDay.value)) ?
				previousYearProgressAtDay.value : null;
			const delta: number = (_.isNumber(previousValue)) ? (currentValue - previousValue) : null;

			// Sign of delta
			let deltaType: DeltaType;
			let deltaSignSymbol: string;
			if (_.isNull(delta)) {
				deltaType = DeltaType.NAN;
				deltaSignSymbol = null;
			} else if (delta === 0) {
				deltaType = DeltaType.UNSIGNED;
				deltaSignSymbol = YearProgressTableComponent.DELTA_SIGN_UNSIGNED;
			} else if (delta < 0) {
				deltaType = DeltaType.NEGATIVE;
				deltaSignSymbol = YearProgressTableComponent.DELTA_SIGN_NEGATIVE;
			} else {
				deltaType = DeltaType.POSITIVE;
				deltaSignSymbol = YearProgressTableComponent.DELTA_SIGN_POSITIVE;
			}

			const progressionAtDayRow: ProgressionAtDayRow = {
				year: progressionAtDayModel.year,
				color: progressionAtDayModel.color,
				previousDate: (previousYearProgressAtDay) ? moment(previousYearProgressAtDay.date).format("MMMM DD, YYYY") : null,
				progressTypeLabel: this.selectedProgressType.label,
				progressTypeUnit: (this.selectedProgressType.shortUnit) ? this.selectedProgressType.shortUnit : "",
				currentValue: currentValue,
				delta: (!_.isNull(delta)) ? Math.abs(delta) : null,
				deltaType: deltaType,
				deltaSignSymbol: deltaSignSymbol,
				deltaClass: deltaType.toString()
			};

			progressionAtDayRows.push(progressionAtDayRow);

		});

		return progressionAtDayRows;
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
