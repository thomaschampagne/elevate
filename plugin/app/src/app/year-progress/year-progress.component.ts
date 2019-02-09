import * as _ from "lodash";
import { Component, OnInit } from "@angular/core";
import { YearProgressService } from "./shared/services/year-progress.service";
import { ActivityCountByTypeModel } from "./shared/models/activity-count-by-type.model";
import { YearProgressModel } from "./shared/models/year-progress.model";
import { YearProgressTypeModel } from "./shared/models/year-progress-type.model";
import { ProgressType } from "./shared/enums/progress-type.enum";
import { YearProgressStyleModel } from "./year-progress-graph/models/year-progress-style.model";
import { Moment } from "moment";
import { YearProgressHelperDialogComponent } from "./year-progress-helper-dialog/year-progress-helper-dialog.component";
import { MatDialog } from "@angular/material";
import { SyncState } from "../shared/services/sync/sync-state.enum";
import { SyncedActivityModel, UserSettingsModel } from "@elevate/shared/models";
import { SyncService } from "../shared/services/sync/sync.service";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { ActivityService } from "../shared/services/activity/activity.service";
import { YearProgressOverviewDialogComponent } from "./year-progress-overview-dialog/year-progress-overview-dialog.component";
import { YearProgressForOverviewModel } from "./shared/models/year-progress-for-overview.model";
import { AppError } from "../shared/models/app-error.model";
import { AddYearProgressPresetsDialogComponent } from "./add-year-progress-presets-dialog/add-year-progress-presets-dialog.component";
import { AddYearProgressPresetsDialogData } from "./shared/models/add-year-progress-presets-dialog-data";
import { ManageYearProgressPresetsDialogComponent } from "./manage-year-progress-presets-dialog/manage-year-progress-presets-dialog.component";
import { YearProgressPresetModel } from "./shared/models/year-progress-preset.model";
import { TargetProgressModel } from "./shared/models/target-progress.model";
import { YearProgressPresetsDialogResponse } from "./shared/models/year-progress-presets-dialog-response.model";
import { StandardProgressConfigModel } from "./shared/models/standard-progress-config.model";

/* Legacy tasks */
// TODO Style of target line !
// TODO Refresh on external update event!

/* Rolling Streak Mode Tasks */

// TODO Provide 2 modes : "Standard Cumulative Mode" & "Rolling Cumulative Mode"
// TODO (Rolling Cumulative Mode) Rolling value in days >= 1. (days, months, years) and a number
// TODO (Rolling Cumulative Mode) User input => Select (days, months, years) + Number input for Rolling length

@Component({
	selector: "app-year-progress",
	templateUrl: "./year-progress.component.html",
	styleUrls: ["./year-progress.component.scss"]
})
export class YearProgressComponent implements OnInit {

	constructor(public userSettingsService: UserSettingsService,
				public syncService: SyncService,
				public activityService: ActivityService,
				public yearProgressService: YearProgressService,
				public dialog: MatDialog) {
	}

	public static readonly PALETTE: string[] = [
		"#9f8aff",
		"#ea7015",
		"#00b423",
		"#001161",
		"#e1ab19",
		"#ee135e",
		"#1fd6d6"
	];

	public static readonly LS_SELECTED_YEARS_KEY: string = "yearProgress_selectedYears";
	public static readonly LS_SELECTED_ACTIVITY_TYPES_KEY: string = "yearProgress_selectedActivityTypes";
	public static readonly LS_SELECTED_PROGRESS_TYPE_KEY: string = "yearProgress_selectedProgressType";
	public static readonly LS_INCLUDE_COMMUTE_RIDES_KEY: string = "yearProgress_includeCommuteRide";
	public static readonly LS_INCLUDE_INDOOR_RIDES_KEY: string = "yearProgress_includeIndoorRide";
	public static readonly LS_TARGET_VALUE_KEY: string = "yearProgress_targetValue";

	public progressTypes: YearProgressTypeModel[];
	public availableActivityTypes: string[] = [];
	public selectedActivityTypes: string[] = [];
	public availableYears: number[] = [];
	public selectedYears: number[];
	public selectedProgressType: YearProgressTypeModel;
	public includeCommuteRide: boolean;
	public includeIndoorRide: boolean;
	public targetValue: number;
	public isMetric: boolean;
	public yearProgressions: YearProgressModel[]; // Progress for each year
	public targetProgressModels: TargetProgressModel[]; // Progress of target on current year
	public syncedActivityModels: SyncedActivityModel[]; // Stored synced activities
	public yearProgressStyleModel: YearProgressStyleModel;
	public momentWatched: Moment;
	public hasActivityModels: boolean = null; // Can be null: don't know yet true/false status on load
	public yearProgressPresetsCount: number = null;
	public isProgressionInitialized = false;

	public static findExistingSelectedYears(): number[] {
		const existingSelectedYears = localStorage.getItem(YearProgressComponent.LS_SELECTED_YEARS_KEY);
		if (!_.isEmpty(existingSelectedYears)) {
			return JSON.parse(existingSelectedYears);
		}
		return null;
	}

	public static findExistingSelectedActivityTypes(): string[] {

		const existingSelectedActivityTypes = localStorage.getItem(YearProgressComponent.LS_SELECTED_ACTIVITY_TYPES_KEY);
		if (!_.isEmpty(existingSelectedActivityTypes)) {
			return JSON.parse(existingSelectedActivityTypes);
		}
		return null;
	}

	public ngOnInit(): void {

		this.syncService.getSyncState().then((syncState: SyncState) => {

			if (syncState !== SyncState.SYNCED) {
				this.hasActivityModels = false;
				return Promise.reject(new AppError(AppError.SYNC_NOT_SYNCED, "Not synced. SyncState is: " + SyncState[syncState].toString()));
			}

			return Promise.all([
				this.userSettingsService.fetch(),
				this.activityService.fetch()
			]);

		}).then((results: Object[]) => {

			const userSettingsModel = _.first(results) as UserSettingsModel;
			this.syncedActivityModels = _.last(results) as SyncedActivityModel[];
			this.isMetric = (userSettingsModel.systemUnit === UserSettingsModel.SYSTEM_UNIT_METRIC_KEY);
			this.hasActivityModels = !_.isEmpty(this.syncedActivityModels);

			if (this.hasActivityModels) {
				this.setup();
			}

			// Use default moment provided by service on init (should be today on first load)
			this.momentWatched = this.yearProgressService.momentWatched;

			// When user mouse moves on graph, listen for moment watched and update title
			this.yearProgressService.momentWatchedChanges.subscribe((momentWatched: Moment) => {
				this.momentWatched = momentWatched;
			});


		}, (appError: AppError) => {
			console.error(appError.toString());
		});

	}

	/**
	 * Setup prepare year progression and target progression along user saved preferences
	 */
	public setup(): void {

		// Keep commute rides in stats by default
		this.includeCommuteRide = this.getCommuteRidesPref();

		// Keep indoor rides in stats by default
		this.includeIndoorRide = this.getIncludeIndoorPref();

		// Find all unique sport types
		const activityCountByTypeModels = this.yearProgressService.activitiesByTypes(this.syncedActivityModels);
		this.availableActivityTypes = _.map(activityCountByTypeModels, "type");

		// Find any selected ActivityTypes existing in local storage. Else select the sport type most performed by the athlete as default
		const existingSelectedActivityTypes: string[] = YearProgressComponent.findExistingSelectedActivityTypes();
		this.selectedActivityTypes = (existingSelectedActivityTypes) ? existingSelectedActivityTypes : [this.findMostPerformedActivityType(activityCountByTypeModels)];

		// Set possible progress type to see: distance, time, ...
		this.progressTypes = YearProgressService.provideProgressTypes(this.isMetric);

		// Find any selected ProgressType existing in local storage. Else set distance progress type as default
		const existingSelectedProgressType: YearProgressTypeModel = this.findExistingSelectedProgressType();
		this.selectedProgressType = (existingSelectedProgressType) ? existingSelectedProgressType : _.find(this.progressTypes, {type: ProgressType.DISTANCE});

		// List years
		this.availableYears = this.yearProgressService.availableYears(this.syncedActivityModels);

		// Seek for selected years saved by the user
		const existingSelectedYears = YearProgressComponent.findExistingSelectedYears();
		this.selectedYears = (existingSelectedYears) ? existingSelectedYears : this.availableYears;

		// Count presets
		this.updateYearProgressPresetsCount();

		// Find target value preference
		this.targetValue = this.getTargetValuePref();

		// Compute years progression
		this.computeYearProgressions();

		// Compute target progression
		this.targetProgression();

		// Get color style for years
		this.yearProgressStyleModel = this.styleFromPalette(this.yearProgressions, YearProgressComponent.PALETTE);

		this.isProgressionInitialized = true;

		console.log("Setup done");

	}

	public updateYearProgressPresetsCount() {
		this.yearProgressService.fetchPresets().then((models: YearProgressPresetModel[]) => {
			this.yearProgressPresetsCount = models.length;
		});
	}

	public computeYearProgressions(): void {

		const progressConfig = new StandardProgressConfigModel(this.selectedActivityTypes, [], this.isMetric,
			this.includeCommuteRide, this.includeIndoorRide);

		// const progressConfig = new RollingProgressConfigModel(this.selectedActivityTypes, [], this.isMetric,
		// 	this.includeCommuteRide, this.includeIndoorRide, 30);

		this.yearProgressions = this.yearProgressService.progressions(progressConfig, this.syncedActivityModels);

	}

	public targetProgression(): void {
		if (_.isNumber(this.targetValue)) {
			this.targetProgressModels = this.yearProgressService.targetProgression((new Date()).getFullYear(), this.targetValue);
		} else {
			this.targetProgressModels = null;
		}
	}

	/**
	 *
	 * @param {ActivityCountByTypeModel[]} activitiesCountByTypeModels
	 * @returns {string}
	 */
	public findMostPerformedActivityType(activitiesCountByTypeModels: ActivityCountByTypeModel[]): string {
		return _.maxBy(activitiesCountByTypeModels, "count").type;
	}

	public onSelectedProgressTypeChange(): void {

		this.persistProgressTypePref(this.selectedProgressType.type);

		// Remove target if exists and reload
		if (this.getTargetValuePref()) {
			this.removeTargetValuePref();
			this.setup();
		}
	}

	public onSelectedActivityTypesChange(): void {
		if (this.selectedActivityTypes.length > 0) {
			this.computeYearProgressions();
			this.persistActivityTypesPref(this.selectedActivityTypes);
		}
	}

	public onSelectedYearsChange(): void {
		if (this.selectedYears.length > 0) {
			this.computeYearProgressions();
			localStorage.setItem(YearProgressComponent.LS_SELECTED_YEARS_KEY, JSON.stringify(this.selectedYears));
		}
	}

	public onIncludeCommuteRideToggle(): void {
		this.computeYearProgressions();
		this.persistCommuteRidesPref(this.includeCommuteRide);
	}

	public onIncludeIndoorRideToggle(): void {
		this.computeYearProgressions();
		this.persistIndoorRidesPref(this.includeIndoorRide);
	}

	public onShowOverview(): void {

		const data: YearProgressForOverviewModel = {
			momentWatched: this.momentWatched,
			selectedYears: this.selectedYears,
			selectedActivityTypes: this.selectedActivityTypes,
			progressTypes: this.progressTypes,
			yearProgressions: this.yearProgressions,
			yearProgressStyleModel: this.yearProgressStyleModel
		};

		const dialogRef = this.dialog.open(YearProgressOverviewDialogComponent, {
			minWidth: YearProgressOverviewDialogComponent.WIDTH,
			maxWidth: YearProgressOverviewDialogComponent.WIDTH,
			width: YearProgressOverviewDialogComponent.WIDTH,
			data: data
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe(() => afterClosedSubscription.unsubscribe());
	}

	public onHelperClick(): void {
		const dialogRef = this.dialog.open(YearProgressHelperDialogComponent, {
			minWidth: YearProgressHelperDialogComponent.MIN_WIDTH,
			maxWidth: YearProgressHelperDialogComponent.MAX_WIDTH,
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe(() => afterClosedSubscription.unsubscribe());
	}

	public onCreatePreset(): void {

		const addYearProgressPresetsDialogData: AddYearProgressPresetsDialogData = {
			activityTypes: this.selectedActivityTypes,
			yearProgressTypeModel: this.selectedProgressType,
			includeCommuteRide: this.includeCommuteRide,
			includeIndoorRide: this.includeIndoorRide,
			targetValue: this.targetValue
		};

		const dialogRef = this.dialog.open(AddYearProgressPresetsDialogComponent, {
			minWidth: AddYearProgressPresetsDialogComponent.MIN_WIDTH,
			maxWidth: AddYearProgressPresetsDialogComponent.MAX_WIDTH,
			data: addYearProgressPresetsDialogData
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((yearProgressPresetModel: YearProgressPresetModel) => {

			this.updateYearProgressPresetsCount();

			if (yearProgressPresetModel) {

				if (_.isNumber(yearProgressPresetModel.targetValue)) {
					this.persistTargetValuePref(yearProgressPresetModel.targetValue);
				} else {
					this.removeTargetValuePref();
				}

				this.setup();
			}

			afterClosedSubscription.unsubscribe();
		});
	}

	public onManagePresets(): void {

		const dialogRef = this.dialog.open(ManageYearProgressPresetsDialogComponent, {
			minWidth: ManageYearProgressPresetsDialogComponent.MIN_WIDTH,
			maxWidth: ManageYearProgressPresetsDialogComponent.MAX_WIDTH,
			data: this.progressTypes,
			disableClose: true
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((dialogResponse: YearProgressPresetsDialogResponse) => {

			let loadPresetRequired = false;

			if (dialogResponse.loadPreset) {

				const yearProgressPresetModel = dialogResponse.loadPreset;
				this.persistProgressTypePref(yearProgressPresetModel.progressType);
				this.persistActivityTypesPref(yearProgressPresetModel.activityTypes);
				this.persistCommuteRidesPref(yearProgressPresetModel.includeCommuteRide);
				this.persistIndoorRidesPref(yearProgressPresetModel.includeIndoorRide);
				this.persistTargetValuePref(yearProgressPresetModel.targetValue);
				loadPresetRequired = true;

			}

			let hideDisplayedTargetLine = false;

			// Check for deleted presets to know if we have to remove the current target line display
			if (dialogResponse.deletedPresets && dialogResponse.deletedPresets.length > 0) {
				_.forEach(dialogResponse.deletedPresets, (deletedPreset: YearProgressPresetModel) => {
					if ((deletedPreset.progressType === this.selectedProgressType.type)
						&& (deletedPreset.activityTypes.join("") === this.selectedActivityTypes.join(""))
						&& (deletedPreset.includeCommuteRide === this.includeCommuteRide)
						&& (deletedPreset.includeIndoorRide === this.includeIndoorRide)
						&& (deletedPreset.targetValue === this.targetValue)) {
						hideDisplayedTargetLine = true;
					}
				});
			}

			if (hideDisplayedTargetLine) {
				this.removeTargetValuePref();
			}

			if (loadPresetRequired || hideDisplayedTargetLine) {
				this.setup();
			}

			this.updateYearProgressPresetsCount();

			afterClosedSubscription.unsubscribe();
		});
	}

	/**
	 *
	 * @param {YearProgressModel[]} yearProgressions
	 * @param {string[]} colorPalette
	 * @returns {YearProgressStyleModel}
	 */
	public styleFromPalette(yearProgressions: YearProgressModel[], colorPalette: string[]): YearProgressStyleModel {

		const yearsColorsMap = new Map<number, string>();
		const colors: string[] = [];

		_.forEach(yearProgressions, (yearProgressModel: YearProgressModel, index) => {
			const color = colorPalette[index % colorPalette.length];
			yearsColorsMap.set(yearProgressModel.year, color);
			colors.push(color);
		});

		return new YearProgressStyleModel(yearsColorsMap, colors);
	}

	public findExistingSelectedProgressType(): YearProgressTypeModel {

		const existingProgressType: ProgressType = parseInt(localStorage.getItem(YearProgressComponent.LS_SELECTED_PROGRESS_TYPE_KEY)) as ProgressType;

		if (_.isNumber(existingProgressType)) {
			return _.find(this.progressTypes, {type: existingProgressType});
		}

		return null;
	}

	public getCommuteRidesPref(): boolean {
		return (localStorage.getItem(YearProgressComponent.LS_INCLUDE_COMMUTE_RIDES_KEY) !== "false");
	}

	public getIncludeIndoorPref(): boolean {
		return (localStorage.getItem(YearProgressComponent.LS_INCLUDE_INDOOR_RIDES_KEY) !== "false");
	}

	public getTargetValuePref(): number {
		const targetValue = parseInt(localStorage.getItem(YearProgressComponent.LS_TARGET_VALUE_KEY));
		return (_.isNaN(targetValue)) ? null : targetValue;
	}

	public persistProgressTypePref(type: ProgressType) {
		localStorage.setItem(YearProgressComponent.LS_SELECTED_PROGRESS_TYPE_KEY, JSON.stringify(type));
	}

	public persistActivityTypesPref(selectedActivityTypes: string[]) {
		localStorage.setItem(YearProgressComponent.LS_SELECTED_ACTIVITY_TYPES_KEY, JSON.stringify(selectedActivityTypes));
	}

	public persistCommuteRidesPref(includeCommuteRide: boolean) {
		localStorage.setItem(YearProgressComponent.LS_INCLUDE_COMMUTE_RIDES_KEY, JSON.stringify(includeCommuteRide));
	}

	public persistIndoorRidesPref(includeIndoorRide: boolean) {
		localStorage.setItem(YearProgressComponent.LS_INCLUDE_INDOOR_RIDES_KEY, JSON.stringify(includeIndoorRide));
	}

	public persistTargetValuePref(targetValue: number) {
		localStorage.setItem(YearProgressComponent.LS_TARGET_VALUE_KEY, JSON.stringify(targetValue));
	}

	public removeTargetValuePref(): void {
		localStorage.removeItem(YearProgressComponent.LS_TARGET_VALUE_KEY);
	}

}
