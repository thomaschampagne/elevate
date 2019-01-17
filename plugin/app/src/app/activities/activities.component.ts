import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivityService } from "../shared/services/activity/activity.service";
import { ExternalUpdatesService } from "../shared/services/external-updates/external-updates.service";
import { MatPaginator, MatSnackBar, MatSort, MatTableDataSource } from "@angular/material";
import { SyncedActivityModel, SyncResultModel, UserSettingsModel } from "@elevate/shared/models";
import * as _ from "lodash";
import { ActivityColumns } from "./activity-columns.namespace";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { NotImplementedException } from "@elevate/shared/exceptions";

@Component({
	selector: "app-activities",
	templateUrl: "./activities.component.html",
	styleUrls: ["./activities.component.scss"]
})
export class ActivitiesComponent implements OnInit {

	// TODO Handle show athlete settings
	// TODO Spreadsheet export.

	public static readonly LS_SELECTED_COLUMNS: string = "activitiesTable_selectedColumns";
	public static readonly LS_PAGE_SIZE_PREFERENCE: string = "activitiesTable_pageSize";

	public readonly ColumnType = ActivityColumns.ColumnType;

	@ViewChild(MatPaginator)
	public matPaginator: MatPaginator;

	@ViewChild(MatSort)
	public matSort: MatSort;

	public dataSource: MatTableDataSource<SyncedActivityModel>;
	public columns: ActivityColumns.Column<SyncedActivityModel>[];
	public selectedColumns: ActivityColumns.Column<SyncedActivityModel>[];
	public columnsCategories: ActivityColumns.Category[];
	public displayedColumns: string[];
	public isImperial: boolean;
	public initialized: boolean;
	public searchText: string;

	constructor(public activityService: ActivityService,
				public userSettingsService: UserSettingsService,
				public externalUpdatesService: ExternalUpdatesService,
				public snackBar: MatSnackBar) {
		this.initialized = false;
	}

	public ngOnInit(): void {

		this.userSettingsService.fetch().then((userSettings: UserSettingsModel) => {

			this.isImperial = (userSettings.systemUnit === UserSettingsModel.SYSTEM_UNIT_IMPERIAL_KEY);

		}).then(() => {

			// Filter displayed columns
			this.columnsSetup();

			// Data source setup
			this.dataSourceSetup();

			// Get and apply data
			this.fetchApplyData();
		});

		// Listen for syncFinished update then table if necessary.
		this.externalUpdatesService.onSyncDone.subscribe((syncResult: SyncResultModel) => {
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
		this.selectedColumns = (existingSelectedColumns) ? existingSelectedColumns : _.clone(ActivityColumns.Definition.ALL);

		// Filter column along selection
		this.filterDisplayedColumns();

		// Creates category of columns
		this.columnsCategories = this.createColumnsCategories(ActivityColumns.Definition.ALL);

	}

	public dataSourceSetup(): void {

		this.dataSource = new MatTableDataSource<SyncedActivityModel>();
		this.dataSource.paginator = this.matPaginator;

		const pageSizePreference = parseInt(localStorage.getItem(ActivitiesComponent.LS_PAGE_SIZE_PREFERENCE));
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
				console.warn("Column path missing", JSON.stringify(column));
				return 0;
			}
		};

	}

	public fetchApplyData(): void {

		this.activityService.fetch().then((syncedActivityModels: SyncedActivityModel[]) => {
			this.dataSource.data = _.sortBy(syncedActivityModels, (dayFitnessTrendModel: SyncedActivityModel) => {
				return dayFitnessTrendModel.id * -1;
			});

			this.initialized = true;

		}).catch(error => {
			this.initialized = true;
			const message = error.toString() + ". Press (F12) to see a more detailed error message in browser console.";
			this.snackBar.open(message, "Close");
			console.error(message);
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

	public saveSelectedColumns(): void {
		const columnsToBeSaved: string[] = _.map(this.selectedColumns, (column: ActivityColumns.Column<SyncedActivityModel>) => {
			return column.id;
		});
		localStorage.setItem(ActivitiesComponent.LS_SELECTED_COLUMNS, JSON.stringify(columnsToBeSaved));
	}

	public createColumnsCategories(columns: ActivityColumns.Column<SyncedActivityModel>[]): ActivityColumns.Category[] {
		return _.map(_.groupBy(columns, "category"),
			(columns: ActivityColumns.Column<SyncedActivityModel>[], categoryLabel: string) => {
				return new ActivityColumns.Category(categoryLabel, columns);
			});
	}

	public applyFilter(filterValue: string): void {
		filterValue = filterValue.trim(); // Remove whitespace
		filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
		this.dataSource.filter = filterValue;
	}

	public onViewAthleteSettings(): void {
		throw new NotImplementedException();
	}

	public tickAll(): void {
		this.selectedColumns = _.clone(ActivityColumns.Definition.ALL);
		this.onSelectedColumns();
	}

	public unTickAll(): void {
		this.selectedColumns = [ActivityColumns.Definition.ALL[0], ActivityColumns.Definition.ALL[1]];
		this.filterDisplayedColumns();
		localStorage.removeItem(ActivitiesComponent.LS_SELECTED_COLUMNS);
	}

	public onPageSizeChanged(): void {
		localStorage.setItem(ActivitiesComponent.LS_PAGE_SIZE_PREFERENCE, this.dataSource.paginator.pageSize.toString());
	}
}
