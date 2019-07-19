import { Component, OnInit, ViewChild } from "@angular/core";
import * as _ from "lodash";
import { DayFitnessTrendModel } from "./shared/models/day-fitness-trend.model";
import { SyncService } from "../shared/services/sync/sync.service";
import { SyncState } from "../shared/services/sync/sync-state.enum";
import { FitnessService } from "./shared/services/fitness.service";
import { PeriodModel } from "./shared/models/period.model";
import * as moment from "moment";
import { LastPeriodModel } from "./shared/models/last-period.model";
import { HeartRateImpulseMode } from "./shared/enums/heart-rate-impulse-mode.enum";
import { AppError } from "../shared/models/app-error.model";
import { MatDialog, MatSnackBar } from "@angular/material";
import { FitnessTrendWelcomeDialogComponent } from "./fitness-trend-welcome-dialog/fitness-trend-welcome-dialog.component";
import { SyncResultModel } from "@elevate/shared/models";
import { FitnessTrendConfigModel } from "./shared/models/fitness-trend-config.model";
import { FitnessTrendInputsComponent } from "./fitness-trend-inputs/fitness-trend-inputs.component";
import { FitnessTrendConfigDialogData } from "./shared/models/fitness-trend-config-dialog-data.model";
import { FitnessTrendConfigDialogComponent } from "./fitness-trend-config-dialog/fitness-trend-config-dialog.component";
import { AppEventsService } from "../shared/services/external-updates/app-events-service";
import { LoggerService } from "../shared/services/logging/logger.service";

@Component({
	selector: "app-fitness-trend",
	templateUrl: "./fitness-trend.component.html",
	styleUrls: ["./fitness-trend.component.scss"]
})
export class FitnessTrendComponent implements OnInit {

	constructor(public syncService: SyncService<any>,
				public fitnessService: FitnessService,
				public appEventsService: AppEventsService,
				public dialog: MatDialog,
				public snackBar: MatSnackBar,
				public logger: LoggerService) {
	}

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

	@ViewChild(FitnessTrendInputsComponent)
	public fitnessTrendInputsComponent: FitnessTrendInputsComponent;

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
	public skipActivityTypes: string[] = [];
	public isSynced: boolean = null; // Can be null: don't know yet true/false status on load
	public areSyncedActivitiesCompliant: boolean = null; // Can be null: don't know yet true/false status on load
	public isReSyncRequired: boolean = null; // Can be null: don't know yet true/false status on load

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

	public static openActivity(id: number) {
		if (_.isNumber(id)) {
			const url = "https://www.strava.com/activities/{activityId}";
			window.open(url.replace("{activityId}", id.toString()), "_blank");
		} else {
			throw new Error("No activity found");
		}
	}

	public static openActivities(ids: number[]) {
		if (ids.length > 0) {
			const url = "https://www.strava.com/activities/{activityId}";
			_.forEach(ids, (id: number) => {
				window.open(url.replace("{activityId}", id.toString()), "_blank");
			});
		} else {
			throw new Error("No activities found");
		}
	}

	public ngOnInit(): void {
		this.initialize().then(() => {
			this.logger.debug("FitnessTrend component initialized");
		});
	}

	public initialize(): Promise<void> {

		return this.syncService.getSyncState().then((syncState: SyncState) => {

			this.isSynced = syncState === SyncState.SYNCED;
			return (this.isSynced) ? Promise.resolve() : Promise.reject(new AppError(AppError.SYNC_NOT_SYNCED,
				"Not synced. SyncState is: " + SyncState[syncState].toString()));

		}).then(() => {

			// Init fitness trend config
			this.fitnessTrendConfigModel = FitnessTrendComponent.DEFAULT_CONFIG;

			const savedFitnessTrendConfig = localStorage.getItem(FitnessTrendComponent.LS_CONFIG_FITNESS_TREND_KEY);
			if (!_.isEmpty(savedFitnessTrendConfig)) {
				this.fitnessTrendConfigModel = JSON.parse(savedFitnessTrendConfig) as FitnessTrendConfigModel;
			}

			// Change toggle state along HRSS/TRIMP heart rate mode
			this.updateTogglesStatesAlongHrMode();

			// Check for activity types to skip (e.g. EBikeRide)
			this.isEBikeRidesEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendComponent.LS_ELECTRICAL_BIKE_RIDES_ENABLED_KEY));
			this.updateSkipActivityTypes(this.isEBikeRidesEnabled);

			// Then compute fitness trend
			return this.fitnessService.computeTrend(this.fitnessTrendConfigModel, this.isPowerMeterEnabled,
				this.isSwimEnabled, this.skipActivityTypes);

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
				this.appEventsService.onSyncDone.subscribe((syncResult: SyncResultModel) => {
					if (syncResult.activitiesChangesModel.added.length > 0
						|| syncResult.activitiesChangesModel.edited.length > 0
						|| syncResult.activitiesChangesModel.deleted.length > 0) {
						this.reloadFitnessTrend();
					}
				});

				this.showFitnessWelcomeDialog();

				return Promise.resolve();
			}

		}, (appError: AppError) => {

			if (appError.code === AppError.SYNC_NOT_SYNCED) {
				// Do nothing: a proper card message should be displayed
			} else if (appError.code === AppError.FT_NO_ACTIVITIES || appError.code === AppError.FT_ALL_ACTIVITIES_FILTERED) {
				this.areSyncedActivitiesCompliant = false;
			} else if (appError.code === AppError.FT_NO_ACTIVITY_ATHLETE_MODEL) {
				this.isReSyncRequired = true;
			} else {
				const message = appError.toString() + ". Press (F12) to see a more detailed error message in browser console.";
				this.snackBar.open(message, "Close");
				this.logger.error(message);
			}

		});
	}

	public onPeriodViewedChange(periodViewed: PeriodModel): void {
		if (periodViewed instanceof LastPeriodModel) {
			localStorage.setItem(FitnessTrendComponent.LS_LAST_PERIOD_VIEWED_KEY, (periodViewed as LastPeriodModel).key);
		}
		this.periodViewed = periodViewed;
	}

	public onTrainingZonesToggleChange(enabled: boolean): void {

		if (enabled) {
			localStorage.setItem(FitnessTrendComponent.LS_TRAINING_ZONES_ENABLED_KEY, "true");
		} else {
			localStorage.removeItem(FitnessTrendComponent.LS_TRAINING_ZONES_ENABLED_KEY);
		}

		this.isTrainingZonesEnabled = enabled;
	}

	public onPowerMeterToggleChange(enabled: boolean): void {

		if (enabled) {
			localStorage.setItem(FitnessTrendComponent.LS_POWER_METER_ENABLED_KEY, "true");
		} else {
			localStorage.removeItem(FitnessTrendComponent.LS_POWER_METER_ENABLED_KEY);
		}

		this.isPowerMeterEnabled = enabled;
		this.reloadFitnessTrend();
	}

	public onSwimToggleChange(enabled: boolean): void {

		if (enabled) {
			localStorage.setItem(FitnessTrendComponent.LS_SWIM_ENABLED_KEY, "true");
		} else {
			localStorage.removeItem(FitnessTrendComponent.LS_SWIM_ENABLED_KEY);
		}

		this.isSwimEnabled = enabled;
		this.reloadFitnessTrend();
	}

	public onEBikeRidesToggleChange(enabled: boolean): void {

		if (enabled) {
			localStorage.setItem(FitnessTrendComponent.LS_ELECTRICAL_BIKE_RIDES_ENABLED_KEY, "true");
		} else {
			localStorage.removeItem(FitnessTrendComponent.LS_ELECTRICAL_BIKE_RIDES_ENABLED_KEY);
		}

		this.isEBikeRidesEnabled = enabled;
		this.updateSkipActivityTypes(this.isEBikeRidesEnabled);
		this.reloadFitnessTrend();
	}

	public onEstimatedPowerStressScoreToggleChange(enabled: boolean): void {
		if (this.fitnessTrendConfigModel.allowEstimatedPowerStressScore !== enabled) {
			this.fitnessTrendConfigModel.allowEstimatedPowerStressScore = enabled;
			this.saveConfigAndReloadFitnessTrend();
		}
	}

	public onEstimatedRunningStressScoreChange(enabled: boolean): void {
		if (this.fitnessTrendConfigModel.allowEstimatedRunningStressScore !== enabled) {
			this.fitnessTrendConfigModel.allowEstimatedRunningStressScore = enabled;
			this.saveConfigAndReloadFitnessTrend();
		}
	}

	public onOpenFitnessTrendConfig(): void {

		const fitnessTrendConfigDialogData: FitnessTrendConfigDialogData = {
			fitnessTrendConfigModel: _.cloneDeep(this.fitnessTrendConfigModel),
			lastFitnessActiveDate: this.lastFitnessActiveDate,
			isPowerMeterEnabled: this.isPowerMeterEnabled
		};

		const dialogRef = this.dialog.open(FitnessTrendConfigDialogComponent, {
			minWidth: FitnessTrendConfigDialogComponent.MIN_WIDTH,
			maxWidth: FitnessTrendConfigDialogComponent.MAX_WIDTH,
			data: fitnessTrendConfigDialogData
		});

		dialogRef.afterClosed().subscribe((fitnessTrendConfigModel: FitnessTrendConfigModel) => {

			if (_.isEmpty(fitnessTrendConfigModel)) {
				return;
			}

			const hasConfigChanged = (this.fitnessTrendConfigModel.heartRateImpulseMode !== Number(fitnessTrendConfigModel.heartRateImpulseMode))
				|| (this.fitnessTrendConfigModel.initializedFitnessTrendModel.ctl !== fitnessTrendConfigModel.initializedFitnessTrendModel.ctl)
				|| (this.fitnessTrendConfigModel.initializedFitnessTrendModel.atl !== fitnessTrendConfigModel.initializedFitnessTrendModel.atl)
				|| (this.fitnessTrendConfigModel.allowEstimatedPowerStressScore !== fitnessTrendConfigModel.allowEstimatedPowerStressScore)
				|| (this.fitnessTrendConfigModel.allowEstimatedRunningStressScore !== fitnessTrendConfigModel.allowEstimatedRunningStressScore)
				|| (this.fitnessTrendConfigModel.ignoreBeforeDate !== fitnessTrendConfigModel.ignoreBeforeDate)
				|| (this.fitnessTrendConfigModel.ignoreActivityNamePatterns !== fitnessTrendConfigModel.ignoreActivityNamePatterns);

			if (hasConfigChanged) {
				this.fitnessTrendConfigModel = fitnessTrendConfigModel;
				this.saveConfigAndReloadFitnessTrend();
			}
		});
	}

	/**
	 * Update TrainingZones, PowerMeter, Swim toggles value along HR mode TRIMP/HRSS
	 */
	public updateTogglesStatesAlongHrMode(): void {

		if (this.fitnessTrendConfigModel.heartRateImpulseMode === HeartRateImpulseMode.TRIMP) {
			this.isTrainingZonesEnabled = false;
			this.isPowerMeterEnabled = false;
			this.isSwimEnabled = false;
		} else { // HeartRateImpulseMode.HRSS
			this.isTrainingZonesEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendComponent.LS_TRAINING_ZONES_ENABLED_KEY));
			this.isPowerMeterEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendComponent.LS_POWER_METER_ENABLED_KEY));
			this.isSwimEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendComponent.LS_SWIM_ENABLED_KEY));
		}
	}

	public reloadFitnessTrend(): void {

		this.fitnessService.computeTrend(this.fitnessTrendConfigModel, this.isPowerMeterEnabled, this.isSwimEnabled,
			this.skipActivityTypes).then((fitnessTrend: DayFitnessTrendModel[]) => {

			this.fitnessTrend = fitnessTrend;
			this.updateDateRangeAndPeriods();

		}, (appError: AppError) => this.logger.error(appError.toString()));
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

	public showFitnessWelcomeDialog(): void {

		const show: boolean = _.isEmpty(localStorage.getItem(FitnessTrendWelcomeDialogComponent.LS_HIDE_FITNESS_WELCOME_DIALOG));

		if (show) {
			_.delay(() => this.dialog.open(FitnessTrendWelcomeDialogComponent, {
				minWidth: FitnessTrendWelcomeDialogComponent.MIN_WIDTH,
				maxWidth: FitnessTrendWelcomeDialogComponent.MAX_WIDTH,
			}), 1000);
		}
	}

	/**
	 * Save current fitness config and reload fitness trend
	 */
	public saveConfigAndReloadFitnessTrend(): void {
		localStorage.setItem(FitnessTrendComponent.LS_CONFIG_FITNESS_TREND_KEY,
			JSON.stringify(this.fitnessTrendConfigModel)); // Save config local
		this.reloadFitnessTrend();
	}
}

