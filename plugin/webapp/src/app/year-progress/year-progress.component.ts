import * as moment from "moment";
import { Moment } from "moment";
import * as _ from "lodash";
import { Component, OnInit } from '@angular/core';
import { YearProgressService } from "./shared/services/year-progress.service";
import { ActivityCountByTypeModel } from "./shared/models/activity-count-by-type.model";
import { YearProgressModel } from "./shared/models/year-progress.model";
import { YearProgressTypeModel } from "./shared/models/year-progress-type.model";
import { ProgressType } from "./shared/models/progress-type.enum";
import { ActivatedRoute } from "@angular/router";
import { SyncedActivityModel } from "../../../../common/scripts/models/Sync";
import { RequiredYearProgressDataModel } from "./shared/models/required-year-progress-data.model";

// TODO:BUG (Fitness Trend) resize windows from fitness table cause: ERROR TypeError: Cannot read property 'style' of null

// TODO Handle no data UI..

// TODO Unify table format. ex: '0h' '0 km'

// DONE Node years selection behaviour?
// DONE Node act types selection?
// DONE Graph click on date => style: cursor
// TODO Table result
// TODO Setup nice line colors palette
// TODO Legend base: Year and value displayed
// TODO Add Trimp progress EZ !!

// TODO (Delayed) Support Progress last year in graph (https://github.com/thomaschampagne/stravistix/issues/484)
// TODO (Delayed) Year progress Targets line display (by KEYS = activityTypes & ProgressType)
// DONE:BUG MetricsGraphics displays circle color on broken line (when multiple lines)
// DONE:BUG progression to today (2018 not displayed when no activities on that year)
// DONE:BUG Select Walk (only sport) +store,  All Year (store nothing). Reload the page.... Hmm Only 4 years are returned by the progression. Should be more right? (Check service @ L58 first walk activitie start in 2014...)
// Should be: const fromMoment: Moment = moment(_.first(syncedActivityModels).start_time).startOf("year"); // 1st january of first year
// Instead of: const fromMoment: Moment = moment(_.first(yearProgressActivityModels).start_time).startOf("year"); // 1st january of first year
// DONE:BUG stop year progressions graph display after today
// DONE:BUG AlpineSki | Walk (only sport) activity count do not match with legacy feature if "commute rides" is disabled
// DONE:BUG Progression on years selected with no data on sport types
// DONE:BUG Legend do not updates itself when 1 sport (eg Run) and 1 year (eg 2017)
// DONE:BUG Select 1 sport (Run)& select 1 year (2016) => 2017 (last year ?!) is displayed in legend... fail !
// DONE:BUG If 2017 (last year ?!) is not selected, then the legends is not displayed after page reload.
// DONE Persist + Load: "Activity types" checked
// DONE Persist + Load: "Years" checked
// DONE Persist + Load: "Commute rides" checked
// DONE Persist + Load: "Progress type" selected
// DONE Return current year progress until today or end of the year
// Service:
// DONE Return KM instead of meter distance
// DONE Handle metric / imperial here  (distance + elevation)!
// DONE setupComponentSizeChangeHandlers

@Component({
	selector: 'app-year-progress',
	templateUrl: './year-progress.component.html',
	styleUrls: ['./year-progress.component.scss'],
	providers: [YearProgressService]
})
export class YearProgressComponent implements OnInit {

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
	public momentWatched: Moment;
	public allowResetMomentWatched: boolean;

	constructor(public route: ActivatedRoute,
				public yearProgressService: YearProgressService) {
	}

	/**
	 *
	 */
	public ngOnInit(): void {

		this.allowResetMomentWatched = false;

		this.route.data.subscribe((data: { requiredYearProgressDataModel: RequiredYearProgressDataModel }) => {

			this.setup(
				data.requiredYearProgressDataModel.isMetric,
				data.requiredYearProgressDataModel.syncedActivityModels
			);
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

		// Push today marker
		this.momentWatched = this.yearProgressService.getTodayMoment().clone().startOf("day");
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
	 * @param {moment.Moment} momentWatched
	 */
	public onMomentWatchedChangesFromGraph(momentWatched: Moment): void {
		this.momentWatched = momentWatched;
		this.allowResetMomentWatched = (this.momentWatched.dayOfYear() !== moment().dayOfYear());
	}

	/**
	 *
	 */
	public onResetMomentWatched(): void {
		this.momentWatched = this.yearProgressService.getTodayMoment().clone().startOf("day");
		this.allowResetMomentWatched = false;
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
