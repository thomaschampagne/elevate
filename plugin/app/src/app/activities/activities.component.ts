import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivityService } from "../shared/services/activity/activity.service";
import { MatDialog, MatPaginator, MatSnackBar, MatSort, MatTableDataSource } from "@angular/material";
import { SyncedActivityModel, SyncResultModel, UserSettingsModel } from "@elevate/shared/models";
import * as _ from "lodash";
import { ActivityColumns } from "./activity-columns.namespace";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { GotItDialogComponent } from "../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { Parser as Json2CsvParser } from "json2csv";
import * as moment from "moment";
import { AppEventsService } from "../shared/services/external-updates/app-events-service";
import { LoggerService } from "../shared/services/logging/logger.service";
import { SyncService } from "../shared/services/sync/sync.service";
import { SyncState } from "../shared/services/sync/sync-state.enum";
import { AppError } from "../shared/models/app-error.model";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { Subject, timer } from "rxjs";
import { debounce } from "rxjs/operators";
import NumberColumn = ActivityColumns.NumberColumn;

@Component({
	selector: "app-activities",
	templateUrl: "./activities.component.html",
	styleUrls: ["./activities.component.scss"]
})
export class ActivitiesComponent implements OnInit {

	constructor(public syncService: SyncService,
				public activityService: ActivityService,
				public userSettingsService: UserSettingsService,
				public appEventsService: AppEventsService,
				public snackBar: MatSnackBar,
				public dialog: MatDialog,
				public logger: LoggerService) {
		this.hasActivities = null; // Can be null: don't know yet true/false status
		this.initialized = false;
		this.searchText$ = new Subject();
	}

	public static readonly LS_SELECTED_COLUMNS: string = "activities_selectedColumns";
	public static readonly LS_PAGE_SIZE_PREFERENCE: string = "activities_pageSize";

	public readonly ColumnType = ActivityColumns.ColumnType;

	@ViewChild(MatPaginator, {static: false})
	public matPaginator: MatPaginator;

	@ViewChild(MatSort, {static: false})
	public matSort: MatSort;

	public dataSource: MatTableDataSource<SyncedActivityModel>;
	public columns: ActivityColumns.Column<SyncedActivityModel>[];
	public selectedColumns: ActivityColumns.Column<SyncedActivityModel>[];
	public columnsCategories: ActivityColumns.Category[];
	public displayedColumns: string[];
	public isImperial: boolean;
	public searchText: string;
	public searchText$: Subject<string>;

	public hasActivities: boolean;
	public isSynced: boolean = null; // Can be null: don't know yet true/false status on load
	public initialized: boolean;

	public static printAthleteSettings(activity: SyncedActivityModel, isImperial: boolean): string {

		if (!activity.athleteSnapshot) {
			return null;
		}

		let inlineSettings = "";

		if (activity.extendedStats && activity.extendedStats.heartRateData && (_.isNumber(activity.extendedStats.heartRateData.HRSS)
			|| _.isNumber(activity.extendedStats.heartRateData.TRIMP))) {

			inlineSettings += "MaxHr " + activity.athleteSnapshot.athleteSettings.maxHr + "bpm. ";
			inlineSettings += "RestHr " + activity.athleteSnapshot.athleteSettings.restHr + "bpm. ";

			if (activity.athleteSnapshot.athleteSettings.lthr.default
				|| activity.athleteSnapshot.athleteSettings.lthr.cycling
				|| activity.athleteSnapshot.athleteSettings.lthr.running) {

				let lthrStr = "Lthr ";

				lthrStr += (activity.athleteSnapshot.athleteSettings.lthr.default) ? "D:" +
					activity.athleteSnapshot.athleteSettings.lthr.default + "bpm, " : "";
				lthrStr += (activity.athleteSnapshot.athleteSettings.lthr.cycling) ? "C:" +
					activity.athleteSnapshot.athleteSettings.lthr.cycling + "bpm, " : "";
				lthrStr += (activity.athleteSnapshot.athleteSettings.lthr.running) ? "R:" +
					activity.athleteSnapshot.athleteSettings.lthr.running + "bpm, " : "";
				lthrStr = lthrStr.slice(0, -2);

				inlineSettings += lthrStr + ". ";
			}

		}

		if (activity.extendedStats && activity.extendedStats.powerData && (_.isNumber(activity.extendedStats.powerData.powerStressScore)
			&& activity.athleteSnapshot.athleteSettings.cyclingFtp)) {
			inlineSettings += "Cycling Ftp " + activity.athleteSnapshot.athleteSettings.cyclingFtp + "w. ";
		}

		if (activity.extendedStats && activity.extendedStats.paceData && (_.isNumber(activity.extendedStats.paceData.runningStressScore)
			&& activity.athleteSnapshot.athleteSettings.runningFtp)) {
			inlineSettings += "Run Ftp " + activity.athleteSnapshot.athleteSettings.runningFtp + "s/" + ((isImperial) ? "mi" : "km") + ".";
		}

		if (activity.type === "Swim" && activity.athleteSnapshot.athleteSettings.swimFtp) {
			inlineSettings += "Swim Ftp " + activity.athleteSnapshot.athleteSettings.swimFtp + "m/min. ";
		}

		inlineSettings += "Weight " + activity.athleteSnapshot.athleteSettings.weight + "kg.";

		return inlineSettings;

	}

	public ngOnInit(): void {

		this.syncService.getSyncState().then((syncState: SyncState) => {

			this.isSynced = syncState === SyncState.SYNCED;

			if (!this.isSynced) {
				this.initialized = true;
			}

			return (this.isSynced) ? this.userSettingsService.fetch() : Promise.reject(new AppError(AppError.SYNC_NOT_SYNCED,
				"Not synced. SyncState is: " + SyncState[syncState].toString()));

		}).then((userSettings: UserSettingsModel) => {

			this.isImperial = (userSettings.systemUnit === UserSettingsModel.SYSTEM_UNIT_IMPERIAL_KEY);

		}).then(() => {

			// Filter displayed columns
			this.columnsSetup();

			// Data source setup
			this.dataSourceSetup();

			// Get and apply data
			this.fetchApplyData();

		}).catch(error => {
			if (error instanceof AppError && error.code === AppError.SYNC_NOT_SYNCED) {
				// Do nothing
			} else {
				throw error;
			}
		});

		// Listen for syncFinished update then table if necessary.
		this.appEventsService.onSyncDone.subscribe((syncResult: SyncResultModel) => {
			if (syncResult.activitiesChangesModel.added.length > 0
				|| syncResult.activitiesChangesModel.edited.length > 0
				|| syncResult.activitiesChangesModel.deleted.length > 0) {
				this.initialized = false;
				this.fetchApplyData();
			}
		});
	}

	public columnsSetup(): void {

		const existingSelectedColumns = this.getSelectedColumns();

		this.selectedColumns = (existingSelectedColumns) ? existingSelectedColumns : this.getDefaultsColumns();

		// Filter column along selection
		this.filterDisplayedColumns();

		// Creates category of columns
		this.columnsCategories = this.createColumnsCategories(ActivityColumns.Definition.ALL);

	}

	public dataSourceSetup(): void {

		this.dataSource = new MatTableDataSource<SyncedActivityModel>();
		this.dataSource.paginator = this.matPaginator;

		const pageSizePreference = parseInt(localStorage.getItem(ActivitiesComponent.LS_PAGE_SIZE_PREFERENCE), 10);
		if (!_.isNaN(pageSizePreference)) {
			this.dataSource.paginator.pageSize = pageSizePreference;
		}

		this.dataSource.sort = this.matSort;

		this.dataSource.sortingDataAccessor = (activity: SyncedActivityModel, sortHeaderId: string) => {

			const column = _.find(ActivityColumns.Definition.ALL, {id: sortHeaderId});

			if (column && column.id) {

				const valueAtPath = _.at(activity as any, column.id)[0];
				return (valueAtPath) ? valueAtPath : 0;

			} else {
				this.logger.warn("Column path missing", JSON.stringify(column));
				return 0;
			}
		};

	}

	public fetchApplyData(): void {

		this.activityService.fetch().then((syncedActivityModels: SyncedActivityModel[]) => {

			this.hasActivities = syncedActivityModels.length > 0;

			this.dataSource.data = _.sortBy(syncedActivityModels, (dayFitnessTrendModel: SyncedActivityModel) => {
				return dayFitnessTrendModel.id * -1;
			});

			this.searchText$.pipe(
				debounce(() => timer(350))
			).subscribe(filterValue => {
				filterValue = filterValue.trim(); // Remove whitespace
				filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
				this.dataSource.filter = filterValue;
			});

		}).catch(error => {
			const message = error.toString() + ". Press (F12) to see a more detailed error message in browser console.";
			this.snackBar.open(message, "Close");
			this.logger.error(message);

		}).finally(() => {
			this.initialized = true;
		});
	}

	public filterDisplayedColumns(): void {
		this.columns = _.filter(ActivityColumns.Definition.ALL, (column: ActivityColumns.Column<SyncedActivityModel>) => {
			return !_.isEmpty(_.find(this.selectedColumns, {id: column.id}));
		});

		this.displayedColumns = this.columns.map(column => column.id);
	}

	public onSelectedColumns(): void {
		this.filterDisplayedColumns();
		this.saveSelectedColumns();
	}

	public getSelectedColumns(): ActivityColumns.Column<SyncedActivityModel>[] {

		const savedColumns: string[] = JSON.parse(localStorage.getItem(ActivitiesComponent.LS_SELECTED_COLUMNS));

		let selectedColumns: ActivityColumns.Column<SyncedActivityModel>[] = null;

		if (savedColumns) {
			selectedColumns = _.filter(ActivityColumns.Definition.ALL, (column: ActivityColumns.Column<SyncedActivityModel>) => {
				return (_.indexOf(savedColumns, column.id) !== -1);
			});
		}

		return selectedColumns;
	}

	public getDefaultsColumns(): ActivityColumns.Column<SyncedActivityModel>[] {
		return _.filter(ActivityColumns.Definition.ALL, (column: ActivityColumns.Column<SyncedActivityModel>) => {
			return column.isDefault;
		});
	}

	public saveSelectedColumns(): void {
		const columnsToBeSaved: string[] = _.map(this.selectedColumns, (column: ActivityColumns.Column<SyncedActivityModel>) => {
			return column.id;
		});
		localStorage.setItem(ActivitiesComponent.LS_SELECTED_COLUMNS, JSON.stringify(columnsToBeSaved));
	}

	public createColumnsCategories(columns: ActivityColumns.Column<SyncedActivityModel>[]): ActivityColumns.Category[] {
		return _.map(_.groupBy(columns, "category"),
			(columnsGroup: ActivityColumns.Column<SyncedActivityModel>[], categoryLabel: string) => {
				return new ActivityColumns.Category(categoryLabel, columnsGroup);
			});
	}

	public requestFilterFor(filterValue: string): void {
		if (filterValue && filterValue.length <= 2) {
			return;
		}
		this.searchText$.next(filterValue);
	}

	public onViewAthleteSettings(activity: SyncedActivityModel): void {
		this.dialog.open(GotItDialogComponent, {
			minWidth: GotItDialogComponent.MIN_WIDTH,
			maxWidth: GotItDialogComponent.MAX_WIDTH,
			data: new GotItDialogDataModel("Calculated with athlete settings", ActivitiesComponent.printAthleteSettings(activity, this.isImperial))
		});
	}

	public onDeleteActivity(activity: SyncedActivityModel): void {

		const data: ConfirmDialogDataModel = {
			title: "Deleting activity \"" + activity.name + "\"",
			content: "Are you sure to perform this action? You will be able to fetch back this activity with a \"Sync all activities\".",
			confirmText: "Delete"
		};

		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			minWidth: ConfirmDialogComponent.MIN_WIDTH,
			maxWidth: ConfirmDialogComponent.MAX_WIDTH,
			data: data
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {

			if (confirm) {
				this.activityService.removeByIds([activity.id]).then(() => {
					this.fetchApplyData();
				}, error => {
					this.snackBar.open(error, "Close");
				});
			}
			afterClosedSubscription.unsubscribe();
		});

	}

	public tickAll(): void {
		this.selectedColumns = _.clone(ActivityColumns.Definition.ALL);
		this.onSelectedColumns();
	}

	public reset(): void {
		this.selectedColumns = this.getDefaultsColumns();
		this.onSelectedColumns();
	}

	public unTickAll(): void {
		this.selectedColumns = [
			_.find(ActivityColumns.Definition.ALL, {id: "start_time"}),
			_.find(ActivityColumns.Definition.ALL, {id: "name"}),
		];

		this.onSelectedColumns();
	}

	public onPageSizeChanged(): void {
		localStorage.setItem(ActivitiesComponent.LS_PAGE_SIZE_PREFERENCE, this.dataSource.paginator.pageSize.toString());
	}

	public onSpreadSheetExport(): void {

		try {

			const fields = _.map(this.selectedColumns, (column: ActivityColumns.Column<SyncedActivityModel>) => {

				let columnLabel = column.header;

				if (ActivityColumns.ColumnType.NUMBER) {

					const numberColumn = (column as NumberColumn<SyncedActivityModel>);

					if (numberColumn.units) {

						let unitsColumn = numberColumn.units;

						if (unitsColumn instanceof ActivityColumns.SystemUnits) {
							unitsColumn = this.isImperial ? unitsColumn.imperial : unitsColumn.metric;
						}

						if (unitsColumn instanceof ActivityColumns.CadenceUnits) {
							unitsColumn = unitsColumn.cycling + " or " + unitsColumn.running;
						}

						columnLabel += (unitsColumn) ? " (" + unitsColumn + ")" : "";
					}

				}

				return {
					label: columnLabel,
					default: "",
					value: (activity: SyncedActivityModel) => {

						let cellValue;

						switch (column.type) {

							case ActivityColumns.ColumnType.DATE:
								cellValue = moment(activity.start_time).format();
								break;

							case ActivityColumns.ColumnType.TEXT:
								cellValue = column.print(activity, column.id);
								break;

							case ActivityColumns.ColumnType.ACTIVITY_LINK:
								cellValue = column.print(activity, column.id);
								break;

							case ActivityColumns.ColumnType.NUMBER:
								const numberColumn = (column as NumberColumn<SyncedActivityModel>);
								cellValue = numberColumn.print(activity, null, numberColumn.precision, numberColumn.factor,
									this.isImperial, numberColumn.imperialFactor, numberColumn.id);
								break;

							case ActivityColumns.ColumnType.ATHLETE_SETTINGS:
								cellValue = ActivitiesComponent.printAthleteSettings(activity, this.isImperial);
								break;

							default:
								cellValue = "";
								break;
						}

						return cellValue;

					}
				};

			});

			const parser = new Json2CsvParser({fields: fields});
			const csvData = parser.parse(this.dataSource.filteredData);
			const blob = new Blob([csvData], {type: "application/csv; charset=utf-16"});
			const filename = "elevate_activities_export." + moment().format("Y.M.D-H.mm.ss") + ".csv";
			saveAs(blob, filename);

		} catch (err) {
			this.logger.error(err);
		}

	}

}
