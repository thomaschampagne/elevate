import * as _ from 'lodash';
import { Component, OnInit } from '@angular/core';
import { ChromeStorageService } from "../services/chrome-storage.service";
import { IUserSettings } from "../../../../common/scripts/interfaces/IUserSettings";
import { MatSnackBar } from "@angular/material";

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


	constructor(private chromeStorageService: ChromeStorageService,
				private snackBar: MatSnackBar) {
	}

	public ngOnInit() {

		this.chromeStorageService.fetchUserSettings().then((userSettings: IUserSettings) => {

			this._gender = _.find(this._GENDER_LIST, {
				type: userSettings.userGender,
			}).type;

			this._maxHr = userSettings.userMaxHr;
			this._restHr = userSettings.userRestHr;
			this._weight = userSettings.userWeight;
			this._ftp = userSettings.userFTP;
			this._swimFtp = userSettings.userSwimFTP;

			// this.swimFTP100m = SwimFTPCalculator.convertMPerMinToTimePer100m(this.userSwimFTP); // TODO

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

			this.popInvalidInputs();
		}
	}

	/**
	 *
	 */
	public onMaxHrChanged() {

		if (_.isNumber(this.maxHr) && this.maxHr > 0) {

			if (this.maxHr <= this.restHr) { // Compliant HR values ?!

				// No... reset !
				this.popInvalidHeartRateInputs();

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

			this.popInvalidInputs();
		}
	}


	/**
	 *
	 */
	public onRestHrChanged() {
		if (_.isNumber(this.restHr) && this.restHr > 0) {

			if (this.maxHr <= this.restHr) {

				this.popInvalidHeartRateInputs();

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
			this.popInvalidInputs();
		}
	}

	/**
	 *
	 */
	public onCyclingFtpChanged() {

		if (_.isNumber(this.ftp) && this.ftp < 0) {

			this.popInvalidInputs();
			this.getSavedSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_CYCLING_FTP).then(
				saved => this.ftp = saved,
				error => this.snackBar.open("Error: " + error)
			);

		} else {
			this.saveSetting(AthleteSettingsComponent.SETTINGS_KEY_USER_CYCLING_FTP, this.ftp);
		}
	}

	/**
	 *
	 */
	private localStorageMustBeCleared() {
		this.chromeStorageService.updateUserSetting(AthleteSettingsComponent.SETTINGS_KEY_CLEAR_LOCAL_STORAGE, true).then(() => {
			console.log(AthleteSettingsComponent.SETTINGS_KEY_CLEAR_LOCAL_STORAGE + " has been updated to " + true);
		});
	}

	private profileChanged() {

		this.localStorageMustBeCleared();

		console.warn("profileChanged not yet implemented")
		// TODO..
		/*chromeStorageService.getProfileConfigured().then((configured: boolean) => {
			if (!configured) {
				chromeStorageService.setProfileConfigured(true).then(() => {
					console.log("Profile configured");
				});
			}
		});

		$rootScope.$broadcast(AthleteSettingsController.changedAthleteProfileMessage);*/

	}

	private saveSetting(key: string, value: any): void {
		this.chromeStorageService.updateUserSetting(key, value).then(() => {
			console.log(key + " has been updated to " + value);
			this.profileChanged();
		});

	}

	private getSavedSetting(key: string): Promise<any> {
		return this.chromeStorageService.getUserSetting(key);
	}

	private popInvalidInputs() {
		this.snackBar.open("Invalid value entered. Reset to default", 'Close', {
			duration: 2500
		});
	}

	private popInvalidHeartRateInputs() {
		this.snackBar.open("Invalid value entered: Max HR is lower than Rest HR. Reset to default", 'Close', {
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
}
