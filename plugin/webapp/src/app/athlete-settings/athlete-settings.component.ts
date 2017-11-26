import * as _ from 'lodash';
import { Component, OnInit } from '@angular/core';
import { UserSettingsService } from "../services/user-settings/user-settings.service";
import { IUserSettings } from "../../../../common/scripts/interfaces/IUserSettings";
import { MatSnackBar } from "@angular/material";
import { SwimFtpHelperComponent } from "./swim-ftp-helper/swim-ftp-helper.component";

interface IGender {
	type: string;
	display: string;
}

@Component({
	selector: 'app-athlete-settings',
	templateUrl: './athlete-settings.component.html',
	styleUrls: ['./athlete-settings.component.scss']
})
export class AthleteSettingsComponent implements OnInit {

	public static SETTINGS_KEY_CLEAR_LOCAL_STORAGE: string = "localStorageMustBeCleared";
	public static SETTINGS_KEY_USER_WEIGHT: any = "userWeight";
	public static SETTINGS_KEY_USER_GENDER: string = "userGender";
	public static SETTINGS_KEY_USER_MAX_HR: string = "userMaxHr";
	public static SETTINGS_KEY_USER_REST_HR: string = "userRestHr";
	public static SETTINGS_KEY_USER_CYCLING_FTP: string = "userFTP";
	public static SETTINGS_KEY_USER_SWIMMING_FTP: string = "userSwimFTP";

	private _GENDER_LIST: IGender[] = [{
		type: "men",
		display: "Male",
	}, {
		type: "women",
		display: "Female",
	}];

	private _gender: string;

	private _weight: number;

	private _swimFtp: number;

	private _restHr: number;

	private _maxHr: number;

	private _ftp: number;

	private _swimFtp100m: string;

	private _isSwimFtpCalculatorEnabled: boolean = false;

	constructor(private userSettingsService: UserSettingsService,
				private snackBar: MatSnackBar) {
	}

	public ngOnInit(): void {

		this.userSettingsService.fetchUserSettings().then((userSettings: IUserSettings) => {

			this._gender = _.find(this._GENDER_LIST, {
				type: userSettings.userGender,
			}).type;

			this._maxHr = userSettings.userMaxHr;
			this._restHr = userSettings.userRestHr;
			this._weight = userSettings.userWeight;
			this._ftp = userSettings.userFTP;
			this._swimFtp = userSettings.userSwimFTP;
			this._swimFtp100m = SwimFtpHelperComponent.convertSwimSpeedToPace(this._swimFtp);

		});

	}

	/**
	 *
	 * @param {IGender} gender
	 */
	public onGenderChanged() {
		this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_GENDER, this.gender);
	}

	/**
	 *
	 */
	public onWeightChanged() {
		if (_.isNumber(this.weight) && this.weight > 0) {

			this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_WEIGHT, this.weight);

		} else {

			this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_WEIGHT).then(
				saved => this.weight = saved,
				error => this.snackBar.open("Error: " + error)
			);

			this.popError();
		}
	}

	/**
	 *
	 */
	public onMaxHrChanged() {

		if (_.isNumber(this.maxHr) && this.maxHr > 0) {

			if (this.maxHr <= this.restHr) { // Compliant HR values ?!

				// No... reset !
				this.popHeartRateError();

				this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_MAX_HR).then(
					saved => this.maxHr = saved,
					error => this.snackBar.open("Error: " + error)
				);

			} else {

				// Yes... save !
				this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_MAX_HR, this.maxHr);
			}

		} else {

			this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_MAX_HR).then(
				saved => this.maxHr = saved,
				error => this.snackBar.open("Error: " + error)
			);

			this.popError();
		}
	}


	/**
	 *
	 */
	public onRestHrChanged() {
		if (_.isNumber(this.restHr) && this.restHr > 0) {

			if (this.maxHr <= this.restHr) {

				this.popHeartRateError();

				this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_REST_HR).then(
					saved => this.restHr = saved,
					error => this.snackBar.open("Error: " + error)
				);

			} else {
				this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_REST_HR, this.restHr);
			}

		} else {
			this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_REST_HR).then(
				saved => this.restHr = saved,
				error => this.snackBar.open("Error: " + error)
			);
			this.popError();
		}
	}

	/**
	 *
	 */
	public onCyclingFtpChanged() {

		if (_.isNumber(this.ftp) && this.ftp < 0) {

			// Wrong value...
			this.popError();
			this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_CYCLING_FTP).then(
				saved => this.ftp = saved,
				error => this.snackBar.open("Error: " + error)
			);

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
			this.popError();
			this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_SWIMMING_FTP).then(
				saved => {
					this.swimFtp = saved;
					this.swimFtp100m = SwimFtpHelperComponent.convertSwimSpeedToPace(saved);
				},
				error => this.snackBar.open("Error: " + error)
			);

		} else {
			// Ok...
			this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_SWIMMING_FTP, this.swimFtp);
		}

	}

	/**
	 *
	 */
	public onSwimFtp100mChanged() {

		let hasErrors: boolean = false;

		this.swimFtp100m = this.swimFtp100m.trim();

		if (_.isEmpty(this.swimFtp100m) || this.swimFtp100m == "00:00:00") {

			// Ok...
			this.swimFtp = null;
			this.swimFtp100m = null;
			const changeFromPaceField = true;
			this.onSwimFtpChanged(changeFromPaceField); // Trigger save & swimFtp100m new value

		} else {

			if (this.swimFtp100m.match("^[0-9]+:[0-5]{1}[0-9]{1}:[0-5]{1}[0-9]{1}$")) {

				// Ok...
				const split = this.swimFtp100m.split(":");
				const hours = parseInt(split[0]);
				const minutes = parseInt(split[1]);
				const seconds = parseInt(split[2]);
				const totalSeconds = hours * 3600 + minutes * 60 + seconds;
				this.swimFtp = parseFloat((60 * 100 / totalSeconds).toFixed(3));

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
			this.popError();
			this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_SWIMMING_FTP).then(
				saved => this.swimFtp100m = SwimFtpHelperComponent.convertSwimSpeedToPace(saved),
				error => this.snackBar.open("Error: " + error)
			);
		}


	}

	/**
	 *
	 */
	private localStorageMustBeCleared() {
		this.userSettingsService.updateUserSetting(AthleteSettingsComponent.SETTINGS_KEY_CLEAR_LOCAL_STORAGE, true).then(() => {
			console.log(AthleteSettingsComponent.SETTINGS_KEY_CLEAR_LOCAL_STORAGE + " has been updated to " + true);
		});
	}

	private profileChanged() {

		this.localStorageMustBeCleared();

		// TODO.. profileChanged not yet implemented
		console.warn("profileChanged not yet implemented")

		/*userSettingsService.getProfileConfigured().then((configured: boolean) => {
			if (!configured) {
				userSettingsService.setProfileConfigured(true).then(() => {
					console.log("Profile configured");
				});
			}
		});

		$rootScope.$broadcast(AthleteSettingsController.changedAthleteProfileMessage);*/

	}

	private saveSetting(key: string, value: any): void {
		this.userSettingsService.updateUserSetting(key, value).then(() => {
			console.log(key + " has been updated to " + value);
			this.profileChanged();
		});

	}

	private getSavedSetting(key: string): Promise<any> {
		return this.userSettingsService.getUserSetting(key);
	}

	private popError(customMessage?: string) {

		let message: string = "Invalid value entered. Reset to previous value.";

		if (customMessage) {
			message = customMessage;
		}

		this.snackBar.open(message, 'Close', {
			duration: 2500
		});
	}

	private popHeartRateError() {
		this.snackBar.open("Invalid value entered: Max HR is lower than Rest HR. Reset to previous value",
			'Close', {
			duration: 2500
		});
	}

	get GENDER_LIST(): IGender[] {
		return this._GENDER_LIST;
	}

	get gender(): string {
		return this._gender;
	}

	set gender(value: string) {
		this._gender = value;
	}

	get weight(): number {
		return this._weight;
	}

	set weight(value: number) {
		this._weight = value;
	}

	get swimFtp(): number {
		return this._swimFtp;
	}

	set swimFtp(value: number) {
		this._swimFtp = value;
	}

	get restHr(): number {
		return this._restHr;
	}

	set restHr(value: number) {
		this._restHr = value;
	}

	get maxHr(): number {
		return this._maxHr;
	}

	set maxHr(value: number) {
		this._maxHr = value;
	}

	get ftp(): number {
		return this._ftp;
	}

	set ftp(value: number) {
		this._ftp = value;
	}


	get swimFtp100m(): string {
		return this._swimFtp100m;
	}

	set swimFtp100m(value: string) {
		this._swimFtp100m = value;
	}

	get isSwimFtpCalculatorEnabled(): boolean {
		return this._isSwimFtpCalculatorEnabled;
	}

	set isSwimFtpCalculatorEnabled(value: boolean) {
		this._isSwimFtpCalculatorEnabled = value;
	}
}
