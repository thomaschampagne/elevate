import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { YearProgressModel } from "../shared/models/year-progress.model";
import { YearProgressTypeModel } from "../shared/models/year-progress-type.model";
import * as moment from "moment";
import { Moment } from "moment";
import { MatTableDataSource } from "@angular/material";
import { ProgressionAtDayModel } from "../shared/models/progression-at-date.model";
import { YearProgressService } from "../shared/services/year-progress.service";
import { ProgressType } from "../shared/models/progress-type.enum";
import * as _ from "lodash";
import { ProgressionAtDayRow } from "./models/progression-at-day-row.model";
import { DeltaSign } from "./models/delta-sign.enum";

@Component({
	selector: 'app-year-progress-table',
	templateUrl: './year-progress-table.component.html',
	styleUrls: ['./year-progress-table.component.scss']
})
export class YearProgressTableComponent implements OnInit, OnChanges {

	public static readonly COLUMN_DATE: string = "date";
	public static readonly COLUMN_PROGRESS_TYPE_VALUE: string = "progressTypeValue";
	public static readonly COLUMN_DELTA_PREVIOUS_VALUE: string = "deltaPrevious";

	public static readonly DELTA_SIGN_POSITIVE: string = "+";
	public static readonly DELTA_SIGN_NEGATIVE: string = "-";
	public static readonly DELTA_SIGN_UNSIGNED: string = "";

	public readonly displayedColumns: string[] = [
		YearProgressTableComponent.COLUMN_DATE,
		YearProgressTableComponent.COLUMN_PROGRESS_TYPE_VALUE,
		YearProgressTableComponent.COLUMN_DELTA_PREVIOUS_VALUE
	];

	public readonly ProgressType = ProgressType;
	public readonly DeltaSign = DeltaSign;

	@Input("selectedYears")
	public selectedYears: number[];

	@Input("selectedProgressType")
	public selectedProgressType: YearProgressTypeModel;

	@Input("yearProgressModels")
	public yearProgressModels: YearProgressModel[];

	@Input("momentWatched")
	public momentWatched: Moment;

	public dataSource: MatTableDataSource<ProgressionAtDayRow>;

	public initialized: boolean = false;

	constructor(public yearProgressService: YearProgressService) {
	}

	public ngOnInit(): void {

		// By default moment watched is today
		this.dataSource = new MatTableDataSource<ProgressionAtDayRow>();

		this.updateDataSource();

		this.initialized = true;
	}

	public updateDataSource(): void {
		this.dataSource.data = this.rows(this.yearProgressService.findProgressionsAtDay(this.yearProgressModels,
			this.momentWatched,
			this.selectedProgressType.type,
			this.selectedYears));
	}

	public ngOnChanges(changes: SimpleChanges): void {

		if (!this.initialized) {
			return;
		}

		this.updateDataSource();
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
			let deltaSign: DeltaSign;
			let deltaSignSymbol: string;
			if (_.isNull(delta)) {
				deltaSign = DeltaSign.NAN;
				deltaSignSymbol = null;
			} else if (delta === 0) {
				deltaSign = DeltaSign.UNSIGNED;
				deltaSignSymbol = YearProgressTableComponent.DELTA_SIGN_UNSIGNED;
			} else if (delta < 0) {
				deltaSign = DeltaSign.NEGATIVE;
				deltaSignSymbol = YearProgressTableComponent.DELTA_SIGN_NEGATIVE
			} else {
				deltaSign = DeltaSign.POSITIVE;
				deltaSignSymbol = YearProgressTableComponent.DELTA_SIGN_POSITIVE
			}

			const progressionAtDayRow: ProgressionAtDayRow = {
				date: moment(progressionAtDayModel.date).format("MMMM DD, YYYY"),
				previousDate: (previousYearProgressAtDay) ? moment(previousYearProgressAtDay.date).format("MMMM DD, YYYY") : null,
				progressTypeLabel: this.selectedProgressType.label,
				progressTypeUnit: (this.selectedProgressType.shortUnit) ? this.selectedProgressType.shortUnit : "",
				currentValue: currentValue,
				delta: (!_.isNull(delta)) ? Math.abs(delta) : null,
				deltaSign: deltaSign,
				deltaSignSymbol: deltaSignSymbol,
				deltaClass: deltaSign.toString()
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
