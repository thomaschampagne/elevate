import * as _ from "lodash";
import { Component, OnInit } from "@angular/core";
import { YearProgressService } from "./shared/services/year-progress.service";
import { ActivityCountByTypeModel } from "./shared/models/activity-count-by-type.model";
import { YearProgressModel } from "./shared/models/year-progress.model";
import { YearProgressTypeModel } from "./shared/models/year-progress-type.model";
import { ProgressType } from "./shared/models/progress-type.enum";
import { ActivatedRoute } from "@angular/router";
import { SyncedActivityModel } from "../../../../common/scripts/models/Sync";
import { YearProgressStyleModel } from "./year-progress-graph/models/year-progress-style.model";
import { Moment } from "moment";
import { YearProgressHelperDialogComponent } from "./year-progress-helper-dialog/year-progress-helper-dialog.component";
import { MatDialog } from "@angular/material";
import { AthleteHistoryState } from "../shared/services/athlete-history/athlete-history-state.enum";
import { UserSettingsModel } from "../../../../common/scripts/models/UserSettings";
import { AthleteHistoryService } from "../shared/services/athlete-history/athlete-history.service";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { ActivityService } from "../shared/services/activity/activity.service";

@Component({
	selector: "app-year-progress",
	templateUrl: "./year-progress.component.html",
	styleUrls: ["./year-progress.component.scss"],
	providers: [YearProgressService]
})
export class YearProgressComponent implements OnInit {

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

	public progressTypes: YearProgressTypeModel[];
	public availableActivityTypes: string[] = [];
	public selectedActivityTypes: string[] = [];
	public availableYears: number[] = [];
	public selectedYears: number[];
	public selectedProgressType: YearProgressTypeModel;
	public includeCommuteRide: boolean;
	public isMetric: boolean;
	public yearProgressModels: YearProgressModel[]; // Progress for each year
	public syncedActivityModels: SyncedActivityModel[]; // Stored synced activities
	public yearProgressStyleModel: YearProgressStyleModel;
	public momentWatched: Moment;
	public hasActivityModels: boolean = null; // Can be null: don't know yet true/false status on load
	public isProgressionInitialized = false;

	constructor(public route: ActivatedRoute,
				public userSettingsService: UserSettingsService,
				public athleteHistoryService: AthleteHistoryService,
				public activityService: ActivityService,
				public yearProgressService: YearProgressService,
				public dialog: MatDialog) {
	}

	/**
	 *
	 */
	public ngOnInit(): void {

		this.athleteHistoryService.getSyncState().then((athleteHistoryState: AthleteHistoryState) => {

			if (athleteHistoryState !== AthleteHistoryState.SYNCED) {
				console.warn("Stopping here! AthleteHistoryState is: " + AthleteHistoryState[athleteHistoryState].toString());
				this.hasActivityModels = false;
				return;
			}

			Promise.all([

				this.userSettingsService.fetch(),
				this.activityService.fetch()

			]).then((results: Object[]) => {

				const userSettingsModel = _.first(results) as UserSettingsModel;
				const syncedActivityModels = _.last(results) as SyncedActivityModel[];
				const isMetric = (userSettingsModel.systemUnit === UserSettingsModel.SYSTEM_UNIT_METRIC_KEY);

				this.hasActivityModels = !_.isEmpty(syncedActivityModels);

				if (this.hasActivityModels) {
					this.setup(
						isMetric,
						syncedActivityModels
					);
				}

				// Use default moment provided by service on init (should be today on first load)
				this.momentWatched = this.yearProgressService.momentWatched;

				// When user mouse moves on graph, listen for moment watched and update title
				this.yearProgressService.momentWatchedChanges.subscribe((momentWatched: Moment) => {
					this.momentWatched = momentWatched;
				});


			}, error => {
				console.error(error);
			});


		});

	}

	/**
	 *
	 * @param {boolean} isMetric
	 * @param {SyncedActivityModel[]} syncedActivityModels
	 */
	public setup(isMetric: boolean, syncedActivityModels: SyncedActivityModel[]): void {

		this.isMetric = isMetric;

		this.syncedActivityModels = syncedActivityModels;

		// Keep commute rides in stats by default
		this.includeCommuteRide = (localStorage.getItem(YearProgressComponent.LS_INCLUDE_COMMUTE_RIDES_KEY) !== "false");

		// Find all unique sport types
		const activityCountByTypeModels = this.yearProgressService.activitiesByTypes(this.syncedActivityModels);
		this.availableActivityTypes = _.map(activityCountByTypeModels, "type");

		// Find any selected ActivityTypes existing in local storage. Else select the sport type most performed by the athlete as default
		const existingSelectedActivityTypes: string[] = this.findExistingSelectedActivityTypes();
		this.selectedActivityTypes = (existingSelectedActivityTypes) ? existingSelectedActivityTypes : [this.findMostPerformedActivityType(activityCountByTypeModels)];

		// Set possible progress type to see: distance, time, ...
		this.progressTypes = [
			new YearProgressTypeModel(ProgressType.DISTANCE, "Distance", (this.isMetric) ? "kilometers" : "miles", (this.isMetric) ? "km" : "mi"),
			new YearProgressTypeModel(ProgressType.TIME, "Time", "hours", "h"),
			new YearProgressTypeModel(ProgressType.ELEVATION, "Elevation", (this.isMetric) ? "meters" : "feet", (this.isMetric) ? "m" : "ft"),
			new YearProgressTypeModel(ProgressType.COUNT, "Count")
		];

		// Find any selected ProgressType existing in local storage. Else set distance progress type as default
		const existingSelectedProgressType: YearProgressTypeModel = this.findExistingSelectedProgressType();
		this.selectedProgressType = (existingSelectedProgressType) ? existingSelectedProgressType : _.find(this.progressTypes, {type: ProgressType.DISTANCE});

		// List years
		this.availableYears = this.yearProgressService.availableYears(this.syncedActivityModels);

		// Seek for selected years saved by the user
		const existingSelectedYears = this.findExistingSelectedYears();
		this.selectedYears = (existingSelectedYears) ? existingSelectedYears : this.availableYears;

		// Compute first progression
		this.progression();

		// Get color style for years
		this.yearProgressStyleModel = this.styleFromPalette(this.yearProgressModels, YearProgressComponent.PALETTE);

		this.isProgressionInitialized = true;
	}

	/**
	 *
	 */
	public progression(): void {
		this.yearProgressModels = this.yearProgressService.progression(this.syncedActivityModels,
			this.selectedActivityTypes,
			null, // All Years
			this.isMetric,
			this.includeCommuteRide);
	}

	/**
	 *
	 * @param {ActivityCountByTypeModel[]} activitiesCountByTypeModels
	 * @returns {string}
	 */
	public findMostPerformedActivityType(activitiesCountByTypeModels: ActivityCountByTypeModel[]): string {
		return _.maxBy(activitiesCountByTypeModels, "count").type;
	}

	/**
	 *
	 */
	public onSelectedActivityTypesChange(): void {

		if (this.selectedActivityTypes.length > 0) {
			this.progression();
			localStorage.setItem(YearProgressComponent.LS_SELECTED_ACTIVITY_TYPES_KEY, JSON.stringify(this.selectedActivityTypes));
		}
	}

	/**
	 *
	 */
	public onSelectedProgressTypeChange(): void {
		localStorage.setItem(YearProgressComponent.LS_SELECTED_PROGRESS_TYPE_KEY, this.selectedProgressType.type.toString());
	}

	/**
	 *
	 */
	public onSelectedYearsChange(): void {
		if (this.selectedYears.length > 0) {
			this.progression();
			localStorage.setItem(YearProgressComponent.LS_SELECTED_YEARS_KEY, JSON.stringify(this.selectedYears));
		}
	}

	/**
	 *
	 */
	public onIncludeCommuteRideToggle(): void {
		this.progression();
		localStorage.setItem(YearProgressComponent.LS_INCLUDE_COMMUTE_RIDES_KEY, JSON.stringify(this.includeCommuteRide));
	}

	/**
	 *
	 */
	public onHelperClick(): void {
		this.dialog.open(YearProgressHelperDialogComponent, {
			minWidth: YearProgressHelperDialogComponent.MIN_WIDTH,
			maxWidth: YearProgressHelperDialogComponent.MAX_WIDTH,
		});
	}

	/**
	 *
	 * @param {YearProgressModel[]} yearProgressModels
	 * @param {string[]} colorPalette
	 * @returns {YearProgressStyleModel}
	 */
	public styleFromPalette(yearProgressModels: YearProgressModel[], colorPalette: string[]): YearProgressStyleModel {

		const yearsColorsMap = new Map<number, string>();
		const colors: string[] = [];

		_.forEach(yearProgressModels, (yearProgressModel: YearProgressModel, index) => {
			const color = colorPalette[index % colorPalette.length];
			yearsColorsMap.set(yearProgressModel.year, color);
			colors.push(color);
		});

		return new YearProgressStyleModel(yearsColorsMap, colors);
	}

	/**
	 *
	 * @returns {number[]}
	 */
	public findExistingSelectedYears(): number[] {
		const existingSelectedYears = localStorage.getItem(YearProgressComponent.LS_SELECTED_YEARS_KEY);
		if (!_.isEmpty(existingSelectedYears)) {
			return JSON.parse(existingSelectedYears);
		}
		return null;
	}

	/**
	 *
	 * @returns {number[]}
	 */
	public findExistingSelectedActivityTypes(): string[] {

		const existingSelectedActivityTypes = localStorage.getItem(YearProgressComponent.LS_SELECTED_ACTIVITY_TYPES_KEY);
		if (!_.isEmpty(existingSelectedActivityTypes)) {
			return JSON.parse(existingSelectedActivityTypes);
		}
		return null;
	}

	/**
	 *
	 * @returns {number[]}
	 */
	public findExistingSelectedProgressType(): YearProgressTypeModel {
		const existingSelectedProgressType = localStorage.getItem(YearProgressComponent.LS_SELECTED_PROGRESS_TYPE_KEY);
		if (!_.isEmpty(existingSelectedProgressType)) {
			return _.find(this.progressTypes, {type: parseInt(existingSelectedProgressType)});
		}
		return null;
	}

}
