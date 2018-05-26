import * as _ from "lodash";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { MatSnackBar } from "@angular/material";
import { SwimFtpHelperComponent } from "./swim-ftp-helper/swim-ftp-helper.component";
import { GenderModel } from "./gender.model";
import { FitnessService } from "../fitness-trend/shared/services/fitness.service";
import { Gender } from "../shared/enums/gender.enum";
import { UserLactateThresholdModel } from "../../../../shared/models/user-settings/user-lactate-threshold.model";
import { UserSettingsModel } from "../../../../shared/models/user-settings/user-settings.model";
import { Helper } from "../../../../core/scripts/Helper";
import { Constant } from "../../../../shared/Constant";

@Component({
	selector: "app-athlete-settings",
	templateUrl: "./athlete-settings.component.html",
	styleUrls: ["./athlete-settings.component.scss"]
})
export class AthleteSettingsComponent implements OnInit {

	public static readonly SETTINGS_KEY_USER_WEIGHT: any = "userWeight";
	public static readonly SETTINGS_KEY_USER_GENDER: string = "userGender";
	public static readonly SETTINGS_KEY_USER_MAX_HR: string = "userMaxHr";
	public static readonly SETTINGS_KEY_USER_REST_HR: string = "userRestHr";
	public static readonly SETTINGS_KEY_USER_LTHR: string = "userLTHR";
	public static readonly SETTINGS_KEY_USER_DEFAULT_LTHR: string = "userLTHR.default";
	public static readonly SETTINGS_KEY_USER_CYCLING_LTHR: string = "userLTHR.cycling";
	public static readonly SETTINGS_KEY_USER_RUNNING_LTHR: string = "userLTHR.running";
	public static readonly SETTINGS_KEY_USER_CYCLING_FTP: string = "userFTP";
	public static readonly SETTINGS_KEY_USER_RUNNING_FTP: string = "userRunningFTP";
	public static readonly SETTINGS_KEY_USER_SWIMMING_FTP: string = "userSwimFTP";

	public readonly GENDER_LIST: GenderModel[] = [{
		type: Gender.MEN,
		display: "Male",
	}, {
		type: Gender.WOMEN,
		display: "Female",
	}];

	public readonly DEFAULT_LTHR_KARVONEN_HRR_FACTOR: number = FitnessService.DEFAULT_LTHR_KARVONEN_HRR_FACTOR;

	@ViewChild("bottom")
	public bottomElement: ElementRef;

	public gender: Gender;
	public weight: number;
	public restHr: number;
	public maxHr: number;
	public defaultLTHR: number;
	public cyclingLTHR: number;
	public runningLTHR: number;
	public cyclingFtp: number;
	public runningFtp: number;
	public swimFtp: number;
	public swimFtp100m: string;

	public isSwimFtpCalculatorEnabled = false;

	constructor(public userSettingsService: UserSettingsService,
				public snackBar: MatSnackBar) {
	}

	public ngOnInit(): void {

		this.userSettingsService.fetch().then((userSettings: UserSettingsModel) => {

			this.gender = _.find(this.GENDER_LIST, {
				type: (userSettings.userGender === Gender.MEN) ? Gender.MEN : Gender.WOMEN
			}).type;

			this.maxHr = userSettings.userMaxHr;
			this.restHr = userSettings.userRestHr;
			this.weight = userSettings.userWeight;
			this.defaultLTHR = userSettings.userLTHR.default;
			this.cyclingLTHR = userSettings.userLTHR.cycling;
			this.runningLTHR = userSettings.userLTHR.running;
			this.cyclingFtp = userSettings.userFTP;
			this.runningFtp = userSettings.userRunningFTP;
			this.swimFtp = userSettings.userSwimFTP;
			this.swimFtp100m = SwimFtpHelperComponent.convertSwimSpeedToPace(this.swimFtp);

		});

	}

	public onGenderChanged() {
		this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_GENDER, this.gender);
	}

	public onWeightChanged() {
		if (_.isNumber(this.weight) && this.weight > 0) {

			this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_WEIGHT, this.weight);

		} else {

			this.getSavedSetting<number>(AthleteSettingsComponent.SETTINGS_KEY_USER_WEIGHT).then(
				saved => this.weight = saved,
				error => this.popError("Error: " + error)
			);

			this.popError();
		}
	}

	public onMaxHrChanged() {

		if (_.isNumber(this.maxHr) && this.maxHr > 0) {

			if (this.maxHr <= this.restHr) { // Compliant HR values ?!

				// No... reset !
				this.popHeartRateError();

				this.getSavedSetting<number>(AthleteSettingsComponent.SETTINGS_KEY_USER_MAX_HR).then(
					saved => this.maxHr = saved,
					error => this.popError("Error: " + error)
				);

			} else {

				// Yes... save !
				this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_MAX_HR, this.maxHr);
			}

		} else {

			this.getSavedSetting<number>(AthleteSettingsComponent.SETTINGS_KEY_USER_MAX_HR).then(
				saved => this.maxHr = saved,
				error => this.popError("Error: " + error)
			);

			this.popError();
		}
	}

	public onRestHrChanged() {
		if (_.isNumber(this.restHr) && this.restHr > 0) {

			if (this.maxHr <= this.restHr) {

				this.popHeartRateError();

				this.getSavedSetting<number>(AthleteSettingsComponent.SETTINGS_KEY_USER_REST_HR).then(
					saved => this.restHr = saved,
					error => this.popError("Error: " + error)
				);

			} else {
				this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_REST_HR, this.restHr);
			}

		} else {
			this.getSavedSetting<number>(AthleteSettingsComponent.SETTINGS_KEY_USER_REST_HR).then(
				saved => this.restHr = saved,
				error => this.popError("Error: " + error)
			);
			this.popError();
		}
	}

	public onLTHRChanged() {
		if (_.isNumber(this.defaultLTHR) && this.defaultLTHR < 0) {

			// Wrong value...
			this.getSavedSetting<UserLactateThresholdModel>(AthleteSettingsComponent.SETTINGS_KEY_USER_LTHR).then(
				saved => this.defaultLTHR = saved.default,
				error => this.popError("Error: " + error)
			);
			this.popError();

		} else {
			// Ok...
			this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_DEFAULT_LTHR, this.defaultLTHR);
		}
	}

	public onCyclingLTHRChanged() {

		if (_.isNumber(this.cyclingLTHR) && this.cyclingLTHR < 0) {

			// Wrong value...
			this.getSavedSetting<UserLactateThresholdModel>(AthleteSettingsComponent.SETTINGS_KEY_USER_LTHR).then(
				saved => this.cyclingLTHR = saved.default,
				error => this.popError("Error: " + error)
			);
			this.popError();

		} else {
			// Ok...
			this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_CYCLING_LTHR, this.cyclingLTHR);
		}
	}

	public onRunningLTHRChanged() {

		if (_.isNumber(this.runningLTHR) && this.runningLTHR < 0) {

			// Wrong value...
			this.getSavedSetting<UserLactateThresholdModel>(AthleteSettingsComponent.SETTINGS_KEY_USER_LTHR).then(
				saved => this.runningLTHR = saved.default,
				error => this.popError("Error: " + error)
			);
			this.popError();

		} else {
			// Ok...
			this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_RUNNING_LTHR, this.runningLTHR);
		}
	}


	public onCyclingFtpChanged() {

		if (_.isNumber(this.cyclingFtp) && this.cyclingFtp < 0) {

			// Wrong value...
			this.getSavedSetting<number>(AthleteSettingsComponent.SETTINGS_KEY_USER_CYCLING_FTP).then(
				saved => this.cyclingFtp = saved,
				error => this.popError("Error: " + error)
			);
			this.popError();

		} else {
			// Ok...
			this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_CYCLING_FTP, this.cyclingFtp);
		}
	}

	public onRunningFtpChanged() {
		if (_.isNumber(this.runningFtp) && this.runningFtp < 0) {

			// Wrong value...
			this.getSavedSetting<number>(AthleteSettingsComponent.SETTINGS_KEY_USER_RUNNING_FTP).then(
				saved => this.runningFtp = saved,
				error => this.popError("Error: " + error)
			);
			this.popError();

		} else {
			// Ok...
			this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_RUNNING_FTP, this.runningFtp);
		}
	}

	public onSwimFtpCalculatorEnabled(): void {

		// Scroll down to bottom element
		setTimeout(() => {
			this.bottomElement.nativeElement.scrollIntoView();
		});

	}

	public onSwimFtpChanged(changeFromPaceField?: boolean) {

		if (_.isUndefined(changeFromPaceField) || !changeFromPaceField) { // If change is not from "hh:mm:ss / 100m" pace field
			this.swimFtp100m = SwimFtpHelperComponent.convertSwimSpeedToPace(this.swimFtp); // Update min/100m field
		}

		if (_.isNumber(this.swimFtp) && this.swimFtp < 0) {

			// Wrong value...
			this.getSavedSetting<number>(AthleteSettingsComponent.SETTINGS_KEY_USER_SWIMMING_FTP).then(
				saved => {
					this.swimFtp = saved;
					this.swimFtp100m = SwimFtpHelperComponent.convertSwimSpeedToPace(saved);
				},
				error => this.popError("Error: " + error)
			);
			this.popError();

		} else {
			// Ok...
			this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_SWIMMING_FTP, this.swimFtp);
		}

	}

	public onSwimFtp100mChanged() {

		let hasErrors = false;

		this.swimFtp100m = this.swimFtp100m.trim();

		if (_.isEmpty(this.swimFtp100m) || this.swimFtp100m === "00:00:00") {

			// Ok...
			this.swimFtp = null;
			this.swimFtp100m = null;
			const changeFromPaceField = true;
			this.onSwimFtpChanged(changeFromPaceField); // Trigger save & swimFtp100m new value

		} else {

			// TODO To be refactored
			if (this.swimFtp100m.match("^[0-9]+:[0-5]{1}[0-9]{1}:[0-5]{1}[0-9]{1}$")) {

				this.swimFtp = SwimFtpHelperComponent.convertPaceToSwimSpeed(this.swimFtp100m);

				if (_.isFinite(this.swimFtp)) {

					const changeFromPaceField = true;
					this.onSwimFtpChanged(changeFromPaceField); // Trigger save & swimFtp100m new value

				} else {
					hasErrors = true;
				}

			} else {
				hasErrors = true;
			}
		}

		if (hasErrors) {
			// Wrong value...
			this.getSavedSetting<number>(AthleteSettingsComponent.SETTINGS_KEY_USER_SWIMMING_FTP).then(
				saved => this.swimFtp100m = SwimFtpHelperComponent.convertSwimSpeedToPace(saved),
				error => this.popError("Error: " + error)
			);
			this.popError();
		}


	}

	public profileChanged() {
		this.userSettingsService.markLocalStorageClear();
	}

	public saveSetting(key: string, value: any): void {

		const isPath: boolean = (key.indexOf(".") !== -1);

		if (isPath) {
			this.userSettingsService.updateNested(key, value).then((userSettingsModel: UserSettingsModel) => {
				console.log(key + " has been updated to " + _.get(userSettingsModel, key));
				this.profileChanged();
			});
		} else {
			this.userSettingsService.update(key, value).then((userSettingsModel: UserSettingsModel) => {
				console.log(key + " has been updated to " + _.get(userSettingsModel, key));
				this.profileChanged();
			});
		}

	}

	public getSavedSetting<T>(key: string): Promise<T> {
		return this.userSettingsService.get<T>(key);
	}

	public popError(customMessage?: string) {

		let message = "Invalid value entered. Reset to previous value.";

		if (customMessage) {
			message = customMessage;
		}

		this.snackBar.open(message, "Close", {
			duration: 2500
		});
	}

	public popHeartRateError(): void {
		this.popError("Invalid value entered: Max HR is lower than Rest HR. Reset to previous value");
	}

	public convertToPace(systemUnit: string): string {

		let speedFactor: number;

		if (systemUnit === "metric") {
			speedFactor = 1;
		} else if (systemUnit === "imperial") {
			speedFactor = Constant.KM_TO_MILE_FACTOR;
		} else {
			throw new Error("System unit unknown");
		}

		return (_.isNumber(this.runningFtp)) ? Helper.secondsToHHMMSS(this.runningFtp * speedFactor) + ((systemUnit === "metric") ? "/km" : "/mi") : null;

	}
}
