import { Component, OnInit } from "@angular/core";
import * as _ from "lodash";
import { DayFitnessTrendModel } from "./shared/models/day-fitness-trend.model";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { SyncService } from "../shared/services/sync/sync.service";
import { SyncState } from "../shared/services/sync/sync-state.enum";
import { UserSettingsModel } from "../../../../shared/models/user-settings/user-settings.model";
import { FitnessService } from "./shared/services/fitness.service";
import { PeriodModel } from "./shared/models/period.model";
import * as moment from "moment";
import { LastPeriodModel } from "./shared/models/last-period.model";
import { HeartRateImpulseMode } from "./shared/enums/heart-rate-impulse-mode.enum";
import { AppError } from "../shared/models/app-error.model";
import { FitnessUserSettingsModel } from "./shared/models/fitness-user-settings.model";
import { MatDialog } from "@angular/material";
import { FitnessTrendWelcomeDialogComponent } from "./fitness-trend-welcome-dialog/fitness-trend-welcome-dialog.component";
import { ExternalUpdatesService } from "../shared/services/external-updates/external-updates.service";
import { SyncResultModel } from "../../../../shared/models/sync/sync-result.model";
import { FitnessTrendConfigModel } from "./shared/models/fitness-trend-config.model";

// TODO 341: Stress score estimate: disable toggle if FTP and/or required toggle not set + display warning message
// TODO 341: Fitness Config UI and explains
// TODO 341: Take care of unit system when computing RSS

@Component({
	selector: "app-fitness-trend",
	templateUrl: "./fitness-trend.component.html",
	styleUrls: ["./fitness-trend.component.scss"]
})
export class FitnessTrendComponent implements OnInit {

	public static readonly DEFAULT_CONFIG: FitnessTrendConfigModel = {
		heartRateImpulseMode: HeartRateImpulseMode.HRSS,
		initializedFitnessTrendModel: {ctl: null, atl: null},
		allowEstimatedPowerStressScore: false,
		allowEstimatedRunningStressScore: false,
		ignoreBeforeDate: null,
		ignoreActivityNamePatterns: null
	};

	public static readonly DEFAULT_LAST_PERIOD_KEY: string = "3_months";
	public static readonly ELECTRICAL_BIKE_ACTIVITY_TYPE: string = "EBikeRide";
	public static readonly LS_LAST_PERIOD_VIEWED_KEY: string = "fitnessTrend_lastPeriodViewed";
	public static readonly LS_CONFIG_FITNESS_TREND_KEY: string = "fitnessTrend_config";
	public static readonly LS_TRAINING_ZONES_ENABLED_KEY: string = "fitnessTrend_trainingZonesEnabled";
	public static readonly LS_POWER_METER_ENABLED_KEY: string = "fitnessTrend_powerMeterEnabled";
	public static readonly LS_SWIM_ENABLED_KEY: string = "fitnessTrend_swimEnabled";
	public static readonly LS_ELECTRICAL_BIKE_RIDES_ENABLED_KEY: string = "fitnessTrend_EBikeRidesEnabled";

	public static provideLastPeriods(minDate: Date): LastPeriodModel[] {

		const toDate = moment().add(FitnessService.FUTURE_DAYS_PREVIEW, "days").startOf("day").toDate();

		return [{
			from: moment().startOf("day").subtract(7, "days").toDate(),
			to: toDate,
			key: "7_days",
			label: "7 days"
		}, {
			from: moment().startOf("day").subtract(14, "days").toDate(),
			to: toDate,
			key: "14_days",
			label: "14 days"
		}, {
			from: moment().startOf("day").subtract(1, "months").toDate(),
			to: toDate,
			key: "month",
			label: "30 days"
		}, {
			from: moment().startOf("day").subtract(6, "weeks").toDate(),
			to: toDate,
			key: "6_weeks",
			label: "6 weeks"
		}, {
			from: moment().startOf("day").subtract(2, "months").toDate(),
			to: toDate,
			key: "2_months",
			label: "2 months"
		}, {
			from: moment().startOf("day").subtract(3, "months").toDate(),
			to: toDate,
			key: "3_months",
			label: "3 months"
		}, {
			from: moment().startOf("day").subtract(4, "months").toDate(),
			to: toDate,
			key: "4_months",
			label: "4 months"
		}, {
			from: moment().startOf("day").subtract(5, "months").toDate(),
			to: toDate,
			key: "5_months",
			label: "5 months"
		}, {
			from: moment().startOf("day").subtract(6, "months").toDate(),
			to: toDate,
			key: "6_months",
			label: "6 months"
		}, {
			from: moment().startOf("day").subtract(7, "months").toDate(),
			to: toDate,
			key: "7_months",
			label: "7 months"
		}, {
			from: moment().startOf("day").subtract(8, "months").toDate(),
			to: toDate,
			key: "8_months",
			label: "8 months"
		}, {
			from: moment().startOf("day").subtract(9, "months").toDate(),
			to: toDate,
			key: "9_months",
			label: "9 months"
		}, {
			from: moment().startOf("day").subtract(1, "years").toDate(),
			to: toDate,
			key: "12_months",
			label: "12 months"
		}, {
			from: moment().startOf("day").subtract(18, "months").toDate(),
			to: toDate,
			key: "18_months",
			label: "18 months"
		}, {
			from: moment().startOf("day").subtract(2, "years").toDate(),
			to: toDate,
			key: "24_months",
			label: "24 months"
		}, {
			from: minDate,
			to: toDate,
			key: "beginning",
			label: "Since beginning"
		}];
	}

	public fitnessTrend: DayFitnessTrendModel[];
	public lastPeriods: LastPeriodModel[];
	public periodViewed: PeriodModel;
	public lastPeriodViewed: PeriodModel;
	public dateMin: Date;
	public dateMax: Date;
	public lastFitnessActiveDate: Date;
	public fitnessTrendConfigModel: FitnessTrendConfigModel;
	public isTrainingZonesEnabled: boolean;
	public isPowerMeterEnabled: boolean;
	public isSwimEnabled: boolean;
	public isEBikeRidesEnabled: boolean;
	public fitnessUserSettingsModel: FitnessUserSettingsModel;
	public hasCyclingFtp: boolean;
	public hasRunningFtp: boolean;
	public skipActivityTypes: string[] = [];
	public isSynced: boolean = null; // Can be null: don't know yet true/false status on load
	public areSyncedActivitiesCompliant: boolean = null; // Can be null: don't know yet true/false status on load

	constructor(public syncService: SyncService,
				public userSettingsService: UserSettingsService,
				public fitnessService: FitnessService,
				public externalUpdatesService: ExternalUpdatesService,
				public dialog: MatDialog) {
	}

	public ngOnInit(): void {

		this.syncService.getSyncState().then((syncState: SyncState) => {

			if (syncState === SyncState.SYNCED) {
				this.isSynced = true;
				return this.userSettingsService.fetch() as PromiseLike<UserSettingsModel>;
			} else {
				this.isSynced = false;
				return Promise.reject("Stopping here! SyncState is: " + SyncState[syncState].toString()) as PromiseLike<UserSettingsModel>;
			}

		}).then((userSettings: UserSettingsModel) => {

			// Init fitness trend user settings
			this.fitnessUserSettingsModel = FitnessUserSettingsModel.createFrom(userSettings);

			this.hasCyclingFtp = _.isNumber(this.fitnessUserSettingsModel.cyclingFtp);
			this.hasRunningFtp = _.isNumber(this.fitnessUserSettingsModel.runningFtp);

			// Init fitness trend config
			this.fitnessTrendConfigModel = FitnessTrendComponent.DEFAULT_CONFIG;

			const savedConfig = localStorage.getItem(FitnessTrendComponent.LS_CONFIG_FITNESS_TREND_KEY);
			if (!_.isEmpty(savedConfig)) {
				this.fitnessTrendConfigModel = JSON.parse(savedConfig) as FitnessTrendConfigModel;
			}

			this.verifyTogglesStatesAlongHrMode();

			// Check for activity types to skip (e.g. EBikeRide)
			this.isEBikeRidesEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendComponent.LS_ELECTRICAL_BIKE_RIDES_ENABLED_KEY));
			this.updateSkipActivityTypes(this.isEBikeRidesEnabled);

			// Then compute fitness trend
			return this.fitnessService.computeTrend(this.fitnessUserSettingsModel, this.fitnessTrendConfigModel, this.isPowerMeterEnabled, this.isSwimEnabled, this.skipActivityTypes);

		}).then((fitnessTrend: DayFitnessTrendModel[]) => {

			this.fitnessTrend = fitnessTrend;
			this.areSyncedActivitiesCompliant = !_.isEmpty(this.fitnessTrend);

			if (this.areSyncedActivitiesCompliant) {

				this.updateDateRangeAndPeriods();

				const lastDayFitnessTrendModel = _.findLast(this.fitnessTrend, (dayFitnessTrendModel: DayFitnessTrendModel) => {
					return dayFitnessTrendModel.hasActivities();
				});

				this.lastFitnessActiveDate = (lastDayFitnessTrendModel && lastDayFitnessTrendModel.date) ? lastDayFitnessTrendModel.date : null;

				// Listen for syncFinished update then reload graph if necessary.
				this.externalUpdatesService.onSyncDone.subscribe((syncResult: SyncResultModel) => {
					if (syncResult.activitiesChangesModel.added.length > 0
						|| syncResult.activitiesChangesModel.edited.length > 0
						|| syncResult.activitiesChangesModel.deleted.length > 0) {
						this.reloadFitnessTrend();
					}
				});

				this.showFitnessWelcomeDialog();
			}

		}, (error: AppError) => {

			if (error.code === AppError.FT_NO_MINIMUM_REQUIRED_ACTIVITIES) {
				this.areSyncedActivitiesCompliant = false;
			} else if (error.code === AppError.FT_PSS_USED_WITH_TRIMP_CALC_METHOD || error.code === AppError.FT_SSS_USED_WITH_TRIMP_CALC_METHOD) {
				console.warn(error);
				this.resetUserPreferences();
			} else {
				console.error(error);
			}
		});
	}

	public onPeriodViewedChange(periodViewed: PeriodModel): void {
		this.periodViewed = periodViewed;
	}

	public onFitnessTrendConfigChange(configModel: FitnessTrendConfigModel): void {
		this.fitnessTrendConfigModel = configModel;
		this.verifyTogglesStatesAlongHrMode();
		this.reloadFitnessTrend();
	}

	public onTrainingZonesToggleChange(enabled: boolean): void {
		this.isTrainingZonesEnabled = enabled;
		this.verifyTogglesStatesAlongHrMode();
	}

	public onPowerMeterToggleChange(enabled: boolean): void {
		this.isPowerMeterEnabled = enabled;
		this.verifyTogglesStatesAlongHrMode();
		this.reloadFitnessTrend();
	}

	public onSwimToggleChange(enabled: boolean): void {
		this.isSwimEnabled = enabled;
		this.verifyTogglesStatesAlongHrMode();
		this.reloadFitnessTrend();
	}

	public onEBikeRidesToggleChange(enabled: boolean): void {
		this.isEBikeRidesEnabled = enabled;
		this.updateSkipActivityTypes(this.isEBikeRidesEnabled);
		this.reloadFitnessTrend();
	}

	public verifyTogglesStatesAlongHrMode(): void {

		if (this.fitnessTrendConfigModel.heartRateImpulseMode === HeartRateImpulseMode.TRIMP) {
			this.isTrainingZonesEnabled = false;
			this.isPowerMeterEnabled = false;
			this.isSwimEnabled = false;
		} else { // HeartRateImpulseMode.HRSS
			this.isTrainingZonesEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendComponent.LS_TRAINING_ZONES_ENABLED_KEY));
			this.isPowerMeterEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendComponent.LS_POWER_METER_ENABLED_KEY)) && _.isNumber(this.fitnessUserSettingsModel.cyclingFtp);
			this.isSwimEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendComponent.LS_SWIM_ENABLED_KEY)) && _.isNumber(this.fitnessUserSettingsModel.swimFtp);
		}
	}

	public reloadFitnessTrend(): void {

		this.fitnessService.computeTrend(this.fitnessUserSettingsModel, this.fitnessTrendConfigModel, this.isPowerMeterEnabled,
			this.isSwimEnabled, this.skipActivityTypes).then((fitnessTrend: DayFitnessTrendModel[]) => {

			this.fitnessTrend = fitnessTrend;
			this.updateDateRangeAndPeriods();

		}, (error: AppError) => {

			if (error.code === AppError.FT_PSS_USED_WITH_TRIMP_CALC_METHOD || error.code === AppError.FT_SSS_USED_WITH_TRIMP_CALC_METHOD) {
				console.warn(error);
				this.resetUserPreferences();
			} else {
				console.error(error);
			}
		});
	}

	public updateSkipActivityTypes(isEBikeRidesEnabled: boolean): void {
		if (!isEBikeRidesEnabled) {
			this.skipActivityTypes = [FitnessTrendComponent.ELECTRICAL_BIKE_ACTIVITY_TYPE];
		} else {
			this.skipActivityTypes = [];
		}
	}

	public updateDateRangeAndPeriods(): void {

		// Provide min and max date to input component
		this.dateMin = moment(_.first(this.fitnessTrend).date).startOf("day").toDate();
		this.dateMax = moment(_.last(this.fitnessTrend).date).startOf("day").toDate();

		// Find default period viewed
		const lastPeriodViewedSaved = localStorage.getItem(FitnessTrendComponent.LS_LAST_PERIOD_VIEWED_KEY);
		this.lastPeriods = FitnessTrendComponent.provideLastPeriods(this.dateMin);
		this.periodViewed = _.find(this.lastPeriods, {
			key: (!_.isEmpty(lastPeriodViewedSaved) ? lastPeriodViewedSaved : FitnessTrendComponent.DEFAULT_LAST_PERIOD_KEY)
		});
		this.lastPeriodViewed = this.periodViewed;
	}

	public static openActivities(ids: number[]) {
		if (ids.length > 0) {
			const url = "https://www.strava.com/activities/{activityId}";
			_.forEach(ids, (id: number) => {
				window.open(url.replace("{activityId}", id.toString()), "_blank");
			});
		} else {
			console.warn("No activities found");
		}
	}

	public resetUserPreferences(): void {
		alert("Whoops! We got a little problem while computing your fitness trend. Your graph inputs preferences will be reset.");
		localStorage.removeItem(FitnessTrendComponent.LS_LAST_PERIOD_VIEWED_KEY);
		localStorage.removeItem(FitnessTrendComponent.LS_CONFIG_FITNESS_TREND_KEY);
		localStorage.removeItem(FitnessTrendComponent.LS_TRAINING_ZONES_ENABLED_KEY);
		localStorage.removeItem(FitnessTrendComponent.LS_POWER_METER_ENABLED_KEY);
		localStorage.removeItem(FitnessTrendComponent.LS_SWIM_ENABLED_KEY);
		localStorage.removeItem(FitnessTrendComponent.LS_ELECTRICAL_BIKE_RIDES_ENABLED_KEY);
		console.warn("User stored fitness prefs have been cleared");
		window.location.reload();
	}

	public showFitnessWelcomeDialog(): void {

		const show: boolean = _.isEmpty(localStorage.getItem(FitnessTrendWelcomeDialogComponent.LS_HIDE_FITNESS_WELCOME_DIALOG));

		if (show) {
			setTimeout(() => {
				this.dialog.open(FitnessTrendWelcomeDialogComponent, {
					minWidth: FitnessTrendWelcomeDialogComponent.MIN_WIDTH,
					maxWidth: FitnessTrendWelcomeDialogComponent.MAX_WIDTH,
				});
			}, 1000);

		}
	}

}

