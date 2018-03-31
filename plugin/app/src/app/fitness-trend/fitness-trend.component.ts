import { Component, OnInit } from "@angular/core";
import * as _ from "lodash";
import { DayFitnessTrendModel } from "./shared/models/day-fitness-trend.model";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { AthleteHistoryService } from "../shared/services/athlete-history/athlete-history.service";
import { AthleteHistoryState } from "../shared/services/athlete-history/athlete-history-state.enum";
import { UserSettingsModel } from "../../../../common/scripts/models/UserSettings";
import { FitnessService } from "./shared/services/fitness.service";
import { PeriodModel } from "./shared/models/period.model";
import * as moment from "moment";
import { LastPeriodModel } from "./shared/models/last-period.model";
import { HeartRateImpulseMode } from "./shared/enums/heart-rate-impulse-mode.enum";
import { AppError } from "../shared/models/app-error.model";
import { FitnessUserSettingsModel } from "./shared/models/fitness-user-settings.model";
import { MatDialog } from "@angular/material";
import { FitnessTrendWelcomeDialogComponent } from "./fitness-trend-welcome-dialog/fitness-trend-welcome-dialog.component";

@Component({
	selector: "app-fitness-trend",
	templateUrl: "./fitness-trend.component.html",
	styleUrls: ["./fitness-trend.component.scss"]
})
export class FitnessTrendComponent implements OnInit {

	public static readonly DEFAULT_HEART_RATE_IMPULSE_MODE: HeartRateImpulseMode = HeartRateImpulseMode.HRSS;

	public static readonly DEFAULT_LAST_PERIOD_KEY: string = "3_months";
	public static readonly ELECTRICAL_BIKE_ACTIVITY_TYPE: string = "EBikeRide";
	public static readonly LS_LAST_PERIOD_VIEWED_KEY: string = "fitnessTrend_lastPeriodViewed";
	public static readonly LS_HEART_RATE_IMPULSE_MODE_KEY: string = "fitnessTrend_heartRateImpulseMode";
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
	public heartRateImpulseMode: HeartRateImpulseMode;
	public isTrainingZonesEnabled: boolean;
	public isPowerMeterEnabled: boolean;
	public isSwimEnabled: boolean;
	public isEBikeRidesEnabled: boolean;
	public fitnessUserSettingsModel: FitnessUserSettingsModel;
	public skipActivityTypes: string[] = [];
	public isSynced: boolean = null; // Can be null: don't know yet true/false status on load
	public isHistoryCompliant: boolean = null; // Can be null: don't know yet true/false status on load

	constructor(public athleteHistoryService: AthleteHistoryService,
				public userSettingsService: UserSettingsService,
				public fitnessService: FitnessService,
				public dialog: MatDialog) {
	}

	public ngOnInit(): void {

		this.showFitnessWelcomeDialog();

		this.athleteHistoryService.getSyncState().then((athleteHistoryState: AthleteHistoryState) => {

			if (athleteHistoryState === AthleteHistoryState.SYNCED) {
				this.isSynced = true;
				return this.userSettingsService.fetch() as PromiseLike<UserSettingsModel>;
			} else {
				this.isSynced = false;
				return Promise.reject("Stopping here! AthleteHistoryState is: " + AthleteHistoryState[athleteHistoryState].toString()) as PromiseLike<UserSettingsModel>;
			}

		}).then((userSettings: UserSettingsModel) => {

			this.fitnessUserSettingsModel = FitnessUserSettingsModel.createFrom(userSettings);

			this.heartRateImpulseMode = FitnessTrendComponent.DEFAULT_HEART_RATE_IMPULSE_MODE;
			if (HeartRateImpulseMode.TRIMP === Number(localStorage.getItem(FitnessTrendComponent.LS_HEART_RATE_IMPULSE_MODE_KEY))) {
				this.heartRateImpulseMode = HeartRateImpulseMode.TRIMP;
			}
			this.verifyTogglesStatesAlongHrMode();

			this.isEBikeRidesEnabled = !_.isEmpty(localStorage.getItem(FitnessTrendComponent.LS_ELECTRICAL_BIKE_RIDES_ENABLED_KEY));
			this.updateSkipActivityTypes(this.isEBikeRidesEnabled);

			return this.fitnessService.computeTrend(this.fitnessUserSettingsModel, this.heartRateImpulseMode, this.isPowerMeterEnabled, this.isSwimEnabled, this.skipActivityTypes);

		}).then((fitnessTrend: DayFitnessTrendModel[]) => {

			this.fitnessTrend = fitnessTrend;
			this.isHistoryCompliant = !_.isEmpty(this.fitnessTrend);

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

		}, (error: AppError) => {

			if (error.code === AppError.FT_NO_MINIMUM_REQUIRED_ACTIVITIES) {
				this.isHistoryCompliant = false;
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

	public onHeartRateImpulseModeChange(heartRateImpulseMode: HeartRateImpulseMode): void {
		this.heartRateImpulseMode = heartRateImpulseMode;
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

		if (this.heartRateImpulseMode === HeartRateImpulseMode.TRIMP) {
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
		this.fitnessService.computeTrend(this.fitnessUserSettingsModel, this.heartRateImpulseMode, this.isPowerMeterEnabled,

			this.isSwimEnabled, this.skipActivityTypes).then((fitnessTrend: DayFitnessTrendModel[]) => {
			this.fitnessTrend = fitnessTrend;

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
		localStorage.removeItem(FitnessTrendComponent.LS_HEART_RATE_IMPULSE_MODE_KEY);
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
			});

		}
	}

}

