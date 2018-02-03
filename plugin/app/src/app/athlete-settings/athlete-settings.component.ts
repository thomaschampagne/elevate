import * as _ from "lodash";
import { Component, OnInit } from "@angular/core";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { UserSettingsModel } from "../../../../common/scripts/models/UserSettings";
import { MatSnackBar } from "@angular/material";
import { SwimFtpHelperComponent } from "./swim-ftp-helper/swim-ftp-helper.component";
import { GenderModel } from "./gender.model";
import { AthleteHistoryService } from "../shared/services/athlete-history/athlete-history.service";

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
	public static readonly SETTINGS_KEY_USER_CYCLING_FTP: string = "userFTP";
	public static readonly SETTINGS_KEY_USER_SWIMMING_FTP: string = "userSwimFTP";

	public readonly GENDER_LIST: GenderModel[] = [{
		type: "men",
		display: "Male",
	}, {
		type: "women",
		display: "Female",
	}];

	public gender: string;

	public weight: number;

	public swimFtp: number;

	public restHr: number;

	public maxHr: number;

	public ftp: number;

	public swimFtp100m: string;

	public isSwimFtpCalculatorEnabled = false;

	constructor(public athleteHistoryService: AthleteHistoryService,
				public userSettingsService: UserSettingsService,
				public snackBar: MatSnackBar) {
	}

	public ngOnInit(): void {

		this.userSettingsService.fetch().then((userSettings: UserSettingsModel) => {

			this.gender = _.find(this.GENDER_LIST, {
				type: userSettings.userGender,
			}).type;

			this.maxHr = userSettings.userMaxHr;
			this.restHr = userSettings.userRestHr;
			this.weight = userSettings.userWeight;
			this.ftp = userSettings.userFTP;
			this.swimFtp = userSettings.userSwimFTP;
			this.swimFtp100m = SwimFtpHelperComponent.convertSwimSpeedToPace(this.swimFtp);

		});

	}

	/**
	 *
	 * @param {GenderModel} gender
	 */
	public onGenderChanged() {
		this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_GENDER, this.gender);
	}

	public onWeightChanged() {
		if (_.isNumber(this.weight) && this.weight > 0) {

			this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_WEIGHT, this.weight);

		} else {

			this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_WEIGHT).then(
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

				this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_MAX_HR).then(
					saved => this.maxHr = saved,
					error => this.popError("Error: " + error)
				);

			} else {

				// Yes... save !
				this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_MAX_HR, this.maxHr);
			}

		} else {

			this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_MAX_HR).then(
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

				this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_REST_HR).then(
					saved => this.restHr = saved,
					error => this.popError("Error: " + error)
				);

			} else {
				this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_REST_HR, this.restHr);
			}

		} else {
			this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_REST_HR).then(
				saved => this.restHr = saved,
				error => this.popError("Error: " + error)
			);
			this.popError();
		}
	}

	public onCyclingFtpChanged() {

		if (_.isNumber(this.ftp) && this.ftp < 0) {

			// Wrong value...
			this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_CYCLING_FTP).then(
				saved => this.ftp = saved,
				error => this.popError("Error: " + error)
			);
			this.popError();

		} else {
			// Ok...
			this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_CYCLING_FTP, this.ftp);
		}
	}

	/**
	 * Watch value changes from field directly OR from swim FTP calculator
	 */
	public onSwimFtpChanged(changeFromPaceField?: boolean) {

		if (_.isUndefined(changeFromPaceField) || !changeFromPaceField) { // If change is not from "hh:mm:ss / 100m" pace field
			this.swimFtp100m = SwimFtpHelperComponent.convertSwimSpeedToPace(this.swimFtp); // Update min/100m field
		}

		if (_.isNumber(this.swimFtp) && this.swimFtp < 0) {

			// Wrong value...
			this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_SWIMMING_FTP).then(
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
			this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_SWIMMING_FTP).then(
				saved => this.swimFtp100m = SwimFtpHelperComponent.convertSwimSpeedToPace(saved),
				error => this.popError("Error: " + error)
			);
			this.popError();
		}


	}

	/**
	 *
	 * @param {UserSettingsModel} userSettingsModelChanged
	 */
	public profileChanged() {

		this.userSettingsService.markLocalStorageClear();
		this.athleteHistoryService.checkLocalRemoteAthleteProfileSame();
	}

	/**
	 *
	 * @param {string} key
	 * @param value
	 */
	public saveSetting(key: string, value: any): void {
		this.userSettingsService.update(key, value).then((userSettingsModel: UserSettingsModel) => {
			console.log(key + " has been updated to " + value);
			this.profileChanged();
		});

	}

	/**
	 *
	 * @param {string} key
	 * @returns {Promise<any>}
	 */
	public getSavedSetting(key: string): Promise<any> {
		return this.userSettingsService.get(key);
	}

	/**
	 *
	 * @param {string} customMessage
	 */
	public popError(customMessage?: string) {

		let message = "Invalid value entered. Reset to previous value.";

		if (customMessage) {
			message = customMessage;
		}

		this.snackBar.open(message, "Close", {
			duration: 2500
		});
	}

	public popHeartRateError() {
		this.popError("Invalid value entered: Max HR is lower than Rest HR. Reset to previous value");
	}
}
