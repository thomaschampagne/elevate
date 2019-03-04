import * as _ from "lodash";
import * as moment from "moment";
import { Moment } from "moment";
import { Component, OnInit } from "@angular/core";
import { YearProgressService } from "./shared/services/year-progress.service";
import { ActivityCountByTypeModel } from "./shared/models/activity-count-by-type.model";
import { YearProgressModel } from "./shared/models/year-progress.model";
import { YearProgressTypeModel } from "./shared/models/year-progress-type.model";
import { ProgressType } from "./shared/enums/progress-type.enum";
import { YearProgressStyleModel } from "./year-progress-graph/models/year-progress-style.model";
import { YearProgressHelperDialogComponent } from "./year-progress-helper-dialog/year-progress-helper-dialog.component";
import { MatDialog } from "@angular/material";
import { SyncState } from "../shared/services/sync/sync-state.enum";
import { SyncedActivityModel, SyncResultModel, UserSettingsModel } from "@elevate/shared/models";
import { SyncService } from "../shared/services/sync/sync.service";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { ActivityService } from "../shared/services/activity/activity.service";
import { YearProgressOverviewDialogComponent } from "./year-progress-overview-dialog/year-progress-overview-dialog.component";
import { YearProgressForOverviewModel } from "./shared/models/year-progress-for-overview.model";
import { AppError } from "../shared/models/app-error.model";
import { AddYearProgressPresetDialogComponent } from "./add-year-progress-presets-dialog/add-year-progress-preset-dialog.component";
import { ManageYearProgressPresetsDialogComponent } from "./manage-year-progress-presets-dialog/manage-year-progress-presets-dialog.component";
import { YearToDateProgressPresetModel } from "./shared/models/year-to-date-progress-preset.model";
import { TargetProgressModel } from "./shared/models/target-progress.model";
import { YearProgressPresetsDialogResponse } from "./shared/models/year-progress-presets-dialog-response.model";
import { YearToDateProgressConfigModel } from "./shared/models/year-to-date-progress-config.model";
import { ProgressConfig } from "./shared/interfaces/progress-config";
import { ProgressMode } from "./shared/enums/progress-mode.enum";
import { RollingProgressConfigModel } from "./shared/models/rolling-progress-config.model";
import { ProgressStoragePreferences } from "./shared/interfaces/progress-storage-preferences";
import { MediaObserver } from "@angular/flex-layout";
import { AddYearToDateProgressPresetDialogData } from "./shared/models/add-year-to-date-progress-preset-dialog-data";
import { AddRollingProgressPresetDialogData } from "./shared/models/add-rolling-progress-preset-dialog-data";
import { RollingProgressPresetModel } from "./shared/models/rolling-progress-preset.model";
import { YearProgressWelcomeDialogComponent } from "./year-progress-welcome-dialog/year-progress-welcome-dialog.component";
import { AppEventsService } from "../shared/services/external-updates/app-events-service";
import { LoggerService } from "../shared/services/logging/logger.service";

/* Legacy tasks */
// TODO Style of target line!
// TODO Remove message old feature (code and warning).

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
				public appEventsService: AppEventsService,
				public dialog: MatDialog,
				public mediaObserver: MediaObserver,
				public logger: LoggerService) {

		this.availableYears = [];
		this.availableActivityTypes = [];
		this.hasActivityModels = null; // Can be null: don't know yet true/false status on loadRollingSumPreferences
		this.yearProgressPresetsCount = null;
		this.isProgressionInitialized = false;
		this.rollingPeriods = YearProgressComponent.ROLLING_PERIODS;
		this.progressModes = [
			{
				value: ProgressMode.YEAR_TO_DATE,
				label: "Year to date"
			},
			{
				value: ProgressMode.ROLLING,
				label: "Rolling"
			}
		];
	}

	public static readonly PALETTE: string[] = [
		"#9f8aff",
		"#ea7015",
		"#00b423",
		"#006dff",
		"#e1ab19",
		"#ee135e",
		"#00ffe2"
	];

	public static readonly ROLLING_PERIODS: string[] = ["Days", "Weeks", "Months", "Years"];
	public static readonly DEFAULT_ROLLING_PERIOD: string = YearProgressComponent.ROLLING_PERIODS[2];
	public static readonly DEFAULT_ROLLING_MULTIPLIER: number = 1;
	public static readonly LS_PROGRESS_CONFIG_KEY: string = "yearProgress_config";
	public static readonly LS_SELECTED_YEARS_KEY: string = "yearProgress_selectedYears";
	public static readonly LS_SELECTED_PROGRESS_TYPE_KEY: string = "yearProgress_selectedProgressType";
	public static readonly LS_SELECTED_ROLLING_SELECTED_PERIOD_KEY: string = "yearProgress_selectedRollingPeriod";
	public static readonly LS_SELECTED_ROLLING_PERIOD_MULTIPLIER_KEY: string = "yearProgress_periodRollingMultiplier";
	public static readonly LS_TARGET_VALUE_KEY: string = "yearProgress_targetValue";
	public static readonly LS_EXPANDED_GRAPH_KEY: string = "yearProgress_expandedGraph";

	public readonly debouncedPeriodMultiplierChange = _.debounce(this.applyPeriodMultiplierChange, 1000 /*ms*/);
	public readonly ProgressMode = ProgressMode;
	public readonly progressStorage: ProgressStoragePreferences = {

		config: {
			set(config: ProgressConfig) {
				localStorage.setItem(YearProgressComponent.LS_PROGRESS_CONFIG_KEY, JSON.stringify(config));
			},
			get: () => {
				const savedProgressConfig = localStorage.getItem(YearProgressComponent.LS_PROGRESS_CONFIG_KEY);
				if (_.isEmpty(savedProgressConfig)) {
					return null;
				}
				const progressConfig: ProgressConfig = JSON.parse(savedProgressConfig) as ProgressConfig;
				return (progressConfig.mode === ProgressMode.YEAR_TO_DATE) ? YearToDateProgressConfigModel.instanceFrom(progressConfig)
					: RollingProgressConfigModel.instanceFrom(progressConfig);
			}
		},
		progressType: {
			set(type: ProgressType) {
				localStorage.setItem(YearProgressComponent.LS_SELECTED_PROGRESS_TYPE_KEY, JSON.stringify(type));
			},
			get: () => {
				const progressType = parseInt(localStorage.getItem(YearProgressComponent.LS_SELECTED_PROGRESS_TYPE_KEY));
				return (_.isFinite(progressType)) ? progressType : null;
			}
		},
		selectedYears: {
			get: () => {
				const selectedYears = JSON.parse(localStorage.getItem(YearProgressComponent.LS_SELECTED_YEARS_KEY));
				return (_.isArray(selectedYears)) ? selectedYears as number[] : null;
			},
			set: (selectedYears: number[]) => {
				localStorage.setItem(YearProgressComponent.LS_SELECTED_YEARS_KEY, JSON.stringify(selectedYears));
			}
		},
		targetValue: {
			get: () => {
				const targetValue = parseInt(localStorage.getItem(YearProgressComponent.LS_TARGET_VALUE_KEY));
				return (_.isNaN(targetValue)) ? null : targetValue;
			},
			set: (targetValue: number) => {
				localStorage.setItem(YearProgressComponent.LS_TARGET_VALUE_KEY, JSON.stringify(targetValue));
			},
			rm: () => {
				localStorage.removeItem(YearProgressComponent.LS_TARGET_VALUE_KEY);
			}
		},
		rollingPeriod: {
			get: () => {
				const selectedRollingPeriod = localStorage.getItem(YearProgressComponent.LS_SELECTED_ROLLING_SELECTED_PERIOD_KEY);
				return (selectedRollingPeriod) ? selectedRollingPeriod : null;
			},
			set: (selectedRollingPeriod: string) => {
				localStorage.setItem(YearProgressComponent.LS_SELECTED_ROLLING_SELECTED_PERIOD_KEY, selectedRollingPeriod);
			},
			rm: () => {
				localStorage.removeItem(YearProgressComponent.LS_SELECTED_ROLLING_SELECTED_PERIOD_KEY);
			}
		},
		periodMultiplier: {
			get: () => {
				const periodMultiplier = parseInt(localStorage.getItem(YearProgressComponent.LS_SELECTED_ROLLING_PERIOD_MULTIPLIER_KEY));
				return (_.isNaN(periodMultiplier)) ? null : periodMultiplier;
			},
			set: (periodMultiplier: number) => {
				localStorage.setItem(YearProgressComponent.LS_SELECTED_ROLLING_PERIOD_MULTIPLIER_KEY, JSON.stringify(periodMultiplier));
			},
			rm: () => {
				localStorage.removeItem(YearProgressComponent.LS_SELECTED_ROLLING_PERIOD_MULTIPLIER_KEY);
			}
		},
		isGraphExpanded: {
			get: () => {
				return (localStorage.getItem(YearProgressComponent.LS_EXPANDED_GRAPH_KEY) === "true");
			},
			set: (expanded) => {
				localStorage.setItem(YearProgressComponent.LS_EXPANDED_GRAPH_KEY, JSON.stringify(expanded));
			}
		}
	};

	public isMetric: boolean;
	public progressModes: { value: ProgressMode, label: string }[];
	public rollingPeriods: string[];
	public selectedRollingPeriod: string;
	public periodMultiplier: number;
	public progressTypes: YearProgressTypeModel[];
	public availableActivityTypes: string[];
	public availableYears: number[];
	public selectedProgressType: YearProgressTypeModel;
	public selectedYears: number[];
	public progressConfig: ProgressConfig;
	public targetValue: number;
	public yearProgressions: YearProgressModel[]; // Progress for each year
	public targetProgressModels: TargetProgressModel[]; // Progress of target on current year
	public syncedActivityModels: SyncedActivityModel[]; // Stored synced activities
	public yearProgressStyleModel: YearProgressStyleModel;
	public momentWatched: Moment;
	public hasActivityModels: boolean;
	public yearProgressPresetsCount: number;
	public isProgressionInitialized;
	public isGraphExpanded: boolean;

	/**
	 *
	 * @param {ActivityCountByTypeModel[]} activitiesCountByTypeModels
	 * @returns {string}
	 */
	public static findMostPerformedActivityType(activitiesCountByTypeModels: ActivityCountByTypeModel[]): string {
		return _.maxBy(activitiesCountByTypeModels, "count").type;
	}

	/**
	 * Retrieve rolling days length from  rolling period and multiplier
	 * @param rollingPeriod
	 * @param periodMultiplier
	 */
	public static findRollingDays(rollingPeriod: string, periodMultiplier: number): number {
		return moment.duration(periodMultiplier, <moment.DurationInputArg2>rollingPeriod.toLowerCase()).asDays();
	}

	public ngOnInit(): void {

		this.initialize();

		// Listen for syncFinished update then reload year progressions if necessary.
		this.appEventsService.onSyncDone.subscribe((syncResult: SyncResultModel) => {
			if (syncResult.activitiesChangesModel.added.length > 0
				|| syncResult.activitiesChangesModel.edited.length > 0
				|| syncResult.activitiesChangesModel.deleted.length > 0) {

				this.initialize();
			}
		});

	}

	public initialize(): void {

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

			this.syncedActivityModels = _.last(results) as SyncedActivityModel[];
			this.hasActivityModels = !_.isEmpty(this.syncedActivityModels);

			if (this.hasActivityModels) {
				const userSettingsModel = _.first(results) as UserSettingsModel;
				this.isMetric = (userSettingsModel.systemUnit === UserSettingsModel.SYSTEM_UNIT_METRIC_KEY);
				this.setup();
			}

			// Use default moment provided by service on init (should be today on first loadRollingSumPreferences)
			this.momentWatched = this.yearProgressService.momentWatched;

			// When user mouse moves on graph, listen for moment watched and update title
			this.yearProgressService.momentWatchedChanges.subscribe((momentWatched: Moment) => {
				this.momentWatched = momentWatched;
			});

			this.showYearProgressWelcomeDialog();

		}, (appError: AppError) => {
			this.logger.error(appError.toString());
		});
	}


	/**
	 * Setup prepare year progression and target progression along user saved preferences
	 */
	public setup(): void {

		// Find all unique sport types
		const activityCountByTypeModels = this.yearProgressService.activitiesByTypes(this.syncedActivityModels);
		this.availableActivityTypes = _.map(activityCountByTypeModels, "type");

		// Fetch saved config
		this.progressConfig = this.progressStorage.config.get();

		// If no saved config then create a default "Year to date Sum" config
		if (!this.progressConfig) {
			this.progressConfig = new YearToDateProgressConfigModel(
				[YearProgressComponent.findMostPerformedActivityType(activityCountByTypeModels)], // Select the sport type most performed by the athlete as default
				true,
				true
			);
		}

		// Load rolling period and multiplier from 'local stored' preferences if mode is set to rolling
		if (this.progressConfig.mode === ProgressMode.ROLLING) {
			this.loadRollingSumPreferences();
		}

		// Set possible progress type to see: distance, time, ...
		this.progressTypes = YearProgressService.provideProgressTypes(this.isMetric);

		// Find any selected ProgressType existing in local storage. Else set distance progress type as default
		const existingSelectedProgressType: YearProgressTypeModel = this.findExistingSelectedProgressType();
		this.selectedProgressType = (existingSelectedProgressType) ? existingSelectedProgressType : _.find(this.progressTypes, {type: ProgressType.DISTANCE});

		// List years
		this.availableYears = this.yearProgressService.availableYears(this.syncedActivityModels);

		// Seek for selected years saved by the user
		const existingSelectedYears = this.progressStorage.selectedYears.get();
		this.selectedYears = (existingSelectedYears) ? existingSelectedYears : this.availableYears;

		// Count presets
		this.updateYearProgressPresetsCount();

		// Find target value preference
		this.targetValue = this.progressStorage.targetValue.get();

		// Compute years progression
		this.computeYearProgressions();

		// Compute target progression
		this.targetProgression();

		// Get color style for years
		this.yearProgressStyleModel = this.styleFromPalette(this.yearProgressions, YearProgressComponent.PALETTE);

		// Load graph expanded or not from preferences
		this.isGraphExpanded = this.progressStorage.isGraphExpanded.get();

		this.isProgressionInitialized = true;

		this.logger.info("Setup done");

	}

	/**
	 * Load rolling period and multiplier from 'local stored' preferences if mode is set to rolling
	 */
	public loadRollingSumPreferences(): void {
		const periodMultiplier = this.progressStorage.periodMultiplier.get();
		const selectedRollingPeriod = this.progressStorage.rollingPeriod.get();
		this.periodMultiplier = periodMultiplier ? periodMultiplier : YearProgressComponent.DEFAULT_ROLLING_MULTIPLIER;
		this.selectedRollingPeriod = selectedRollingPeriod ? selectedRollingPeriod : YearProgressComponent.DEFAULT_ROLLING_PERIOD;
	}

	public updateYearProgressPresetsCount() {
		this.yearProgressService.fetchPresets().then((models: YearToDateProgressPresetModel[]) => {
			this.yearProgressPresetsCount = models.length;
		});
	}

	public computeYearProgressions(): void {
		this.yearProgressions = this.yearProgressService.progressions(this.progressConfig, this.isMetric, this.syncedActivityModels);
	}

	public targetProgression(): void {

		if (_.isNumber(this.targetValue)) {
			this.targetProgressModels = (this.progressConfig.mode === ProgressMode.YEAR_TO_DATE) ?
				this.yearProgressService.yearToDateTargetProgression((new Date()).getFullYear(), this.targetValue) :
				this.targetProgressModels = this.yearProgressService.rollingTargetProgression((new Date()).getFullYear(), this.targetValue);

		} else {
			this.targetProgressModels = null;
		}
	}

	public onProgressModeChanged(): void {

		// Update instance of progressConfig member along ProgressMode
		this.progressConfig = (this.progressConfig.mode === ProgressMode.YEAR_TO_DATE) ? YearToDateProgressConfigModel.instanceFrom(this.progressConfig)
			: RollingProgressConfigModel.instanceFrom(this.progressConfig);

		if (this.progressConfig.mode === ProgressMode.YEAR_TO_DATE) {

			if (this.progressStorage.targetValue.get()) {
				this.progressStorage.targetValue.rm();
			}

			this.progressStorage.config.set(this.progressConfig);

			this.setup();

		} else {

			// Load rolling period and multiplier from 'local stored' preferences if mode is set to rolling
			this.loadRollingSumPreferences();

			// Trigger a rolling day change !
			this.onRollingDaysChanged();
		}

	}

	public onRollingDaysChanged(): void {

		const rollingDays = YearProgressComponent.findRollingDays(this.selectedRollingPeriod, this.periodMultiplier);

		// Update progress config
		this.progressConfig = new RollingProgressConfigModel(this.progressConfig.activityTypes, this.progressConfig.includeCommuteRide,
			this.progressConfig.includeIndoorRide, rollingDays);

		if (this.progressStorage.targetValue.get()) {
			this.progressStorage.targetValue.rm();
		}

		// Save config to local storage
		this.progressStorage.config.set(this.progressConfig);

		// Re-compute
		this.setup();
	}

	public onRollingPeriodChanged(): void {
		this.progressStorage.rollingPeriod.set(this.selectedRollingPeriod);
		this.onRollingDaysChanged();
	}

	public onPeriodMultiplierChanged(): void {
		this.debouncedPeriodMultiplierChange();
	}

	public applyPeriodMultiplierChange(): void {
		if (this.periodMultiplier >= 1 && this.periodMultiplier <= 999) {
			this.progressStorage.periodMultiplier.set(this.periodMultiplier);
			this.onRollingDaysChanged();
		} else {
			const existingPeriodMultiplier = this.progressStorage.periodMultiplier.get();
			this.periodMultiplier = (existingPeriodMultiplier > 1) ? existingPeriodMultiplier : YearProgressComponent.DEFAULT_ROLLING_MULTIPLIER;
		}
	}

	public onSelectedProgressTypeChanged(): void {

		this.progressStorage.progressType.set(this.selectedProgressType.type);

		// Remove target if exists and reload
		if (this.progressStorage.targetValue.get()) {
			this.progressStorage.targetValue.rm();
			this.setup();
		}
	}

	public onSelectedActivityTypesChanged(): void {
		if (this.progressConfig.activityTypes.length > 0) {
			this.computeYearProgressions();
			this.progressStorage.config.set(this.progressConfig);
		}
	}

	public onTickAllActivityTypes(): void {
		this.progressConfig.activityTypes = this.availableActivityTypes;
		this.onSelectedActivityTypesChanged();
	}

	public onUnTickAllActivityTypes(): void {
		this.progressConfig.activityTypes = [_.first(this.availableActivityTypes)];
		this.onSelectedActivityTypesChanged();
	}

	public onSelectedYearsChanged(): void {
		if (this.selectedYears.length > 0) {
			this.progressStorage.selectedYears.set(this.selectedYears);
		}
	}

	public onTickAllYears(): void {
		this.selectedYears = this.availableYears;
		this.onSelectedYearsChanged();
	}

	public onUnTickAllYears(): void {
		this.selectedYears = [moment().year()];
		this.onSelectedYearsChanged();
	}

	public onIncludeCommuteRideToggle(): void {
		this.computeYearProgressions();
		this.progressStorage.config.set(this.progressConfig);
	}

	public onIncludeIndoorRideToggle(): void {
		this.computeYearProgressions();
		this.progressStorage.config.set(this.progressConfig);
	}

	public onShowOverview(): void {

		const data: YearProgressForOverviewModel = {
			progressConfig: this.progressConfig,
			momentWatched: this.momentWatched,
			selectedYears: this.selectedYears,
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

	public onExpandGraphClicked(): void {
		this.isGraphExpanded = !this.isGraphExpanded;
		this.progressStorage.isGraphExpanded.set(this.isGraphExpanded);
	}

	public onCreatePreset(): void {

		const presetDialogData = (this.progressConfig.mode === ProgressMode.YEAR_TO_DATE) ?
			new AddYearToDateProgressPresetDialogData(
				this.selectedProgressType,
				this.progressConfig.activityTypes,
				this.progressConfig.includeCommuteRide,
				this.progressConfig.includeIndoorRide,
				this.targetValue) :

			new AddRollingProgressPresetDialogData(
				this.selectedProgressType,
				this.progressConfig.activityTypes,
				this.progressConfig.includeCommuteRide,
				this.progressConfig.includeIndoorRide,
				this.targetValue,
				this.selectedRollingPeriod,
				this.periodMultiplier);

		const dialogRef = this.dialog.open(AddYearProgressPresetDialogComponent, {
			minWidth: AddYearProgressPresetDialogComponent.MIN_WIDTH,
			maxWidth: AddYearProgressPresetDialogComponent.MAX_WIDTH,
			data: presetDialogData
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((yearProgressPresetModel: YearToDateProgressPresetModel) => {

			this.updateYearProgressPresetsCount();

			if (yearProgressPresetModel) {

				if (_.isNumber(yearProgressPresetModel.targetValue)) {
					this.progressStorage.targetValue.set(yearProgressPresetModel.targetValue);
				} else {
					this.progressStorage.targetValue.rm();
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

				if (dialogResponse.loadPreset.mode === ProgressMode.YEAR_TO_DATE) {

					this.progressConfig = new YearToDateProgressConfigModel(dialogResponse.loadPreset.activityTypes,
						dialogResponse.loadPreset.includeCommuteRide, dialogResponse.loadPreset.includeIndoorRide);

					this.progressStorage.rollingPeriod.rm();
					this.progressStorage.periodMultiplier.rm();

				} else {

					const presetToLoad = dialogResponse.loadPreset as RollingProgressPresetModel;
					const rollingDays = YearProgressComponent.findRollingDays(presetToLoad.rollingPeriod, presetToLoad.periodMultiplier);
					this.progressConfig = new RollingProgressConfigModel(presetToLoad.activityTypes, presetToLoad.includeCommuteRide,
						presetToLoad.includeIndoorRide, rollingDays);

					this.progressStorage.rollingPeriod.set(presetToLoad.rollingPeriod);
					this.progressStorage.periodMultiplier.set(presetToLoad.periodMultiplier);
				}

				// Save new config
				this.progressStorage.config.set(this.progressConfig);
				this.progressStorage.progressType.set(dialogResponse.loadPreset.progressType);
				this.progressStorage.targetValue.set(dialogResponse.loadPreset.targetValue);

				loadPresetRequired = true;

			}

			let hideDisplayedTargetLine = false;

			// Check for deleted presets to know if we have to remove the current target line display
			if (dialogResponse.deletedPresets && dialogResponse.deletedPresets.length > 0) {
				_.forEach(dialogResponse.deletedPresets, (deletedPreset: YearToDateProgressPresetModel) => {

					const isYearToDatePresetAttributesDeleted = (deletedPreset.progressType === this.selectedProgressType.type)
						&& (deletedPreset.activityTypes.join("") === this.progressConfig.activityTypes.join(""))
						&& (deletedPreset.includeCommuteRide === this.progressConfig.includeCommuteRide)
						&& (deletedPreset.includeIndoorRide === this.progressConfig.includeIndoorRide)
						&& (deletedPreset.targetValue === this.targetValue);

					if (this.progressConfig.mode === ProgressMode.YEAR_TO_DATE && isYearToDatePresetAttributesDeleted) {

						hideDisplayedTargetLine = true;

					} else { // Rolling

						const isRollingPresetAttributesDeleted = ((deletedPreset as RollingProgressPresetModel).rollingPeriod === this.selectedRollingPeriod)
							&& ((deletedPreset as RollingProgressPresetModel).periodMultiplier === this.periodMultiplier);

						if (isYearToDatePresetAttributesDeleted && isRollingPresetAttributesDeleted) {
							hideDisplayedTargetLine = true;
						}

					}
				});
			}

			if (hideDisplayedTargetLine) {
				this.progressStorage.targetValue.rm();
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

		const existingProgressType: ProgressType = this.progressStorage.progressType.get();

		if (_.isNumber(existingProgressType)) {
			return _.find(this.progressTypes, {type: existingProgressType});
		}

		return null;
	}

	public showYearProgressWelcomeDialog(): void {

		const show: boolean = _.isEmpty(localStorage.getItem(YearProgressWelcomeDialogComponent.LS_HIDE_YEAR_PROGRESS_WELCOME_DIALOG));

		if (show) {
			_.delay(() => this.dialog.open(YearProgressWelcomeDialogComponent, {
				minWidth: YearProgressWelcomeDialogComponent.MIN_WIDTH,
				maxWidth: YearProgressWelcomeDialogComponent.MAX_WIDTH,
			}), 1000);
		}
	}

}
