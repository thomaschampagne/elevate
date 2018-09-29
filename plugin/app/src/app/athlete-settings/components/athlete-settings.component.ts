import { Component, OnInit } from "@angular/core";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { UserSettingsModel } from "../../../../../core/scripts/shared/models/user-settings/user-settings.model";
import { Gender } from "../../shared/models/athlete/gender.enum";
import { GenderModel } from "../models/gender.model";
import { AthleteSettingsModel } from "../../shared/models/athlete/athlete-settings/athlete-settings.model";
import { AthleteModel } from "../../shared/models/athlete/athlete.model";
import { ActivityService } from "../../shared/services/activity/activity.service";

// TODO Give a helper guide to find dated settings (how to?)
// TODO Show athleteModel used on strava activities

@Component({
	selector: "app-athlete-settings",
	templateUrl: "./athlete-settings.component.html",
	styleUrls: ["./athlete-settings.component.scss"]
})
export class AthleteSettingsComponent implements OnInit {

	public static readonly SYNCED_ATHLETE_MODEL_SETTING_KEY = "athleteModel";
	public static readonly SYNCED_HAS_DATED_ATHLETE_SETTINGS_KEY = "hasDatedAthleteSettings";

	public readonly GENDER_LIST: GenderModel[] = [{
		type: Gender.MEN,
		display: "Male",
	}, {
		type: Gender.WOMEN,
		display: "Female",
	}];

	public athleteModel: AthleteModel;

	public hasDatedAthleteSettings: boolean;

	constructor(public userSettingsService: UserSettingsService,
				public activityService: ActivityService) {
	}

	public ngOnInit(): void {
		this.userSettingsService.fetch().then((userSettings: UserSettingsModel) => {
			this.hasDatedAthleteSettings = userSettings.hasDatedAthleteSettings;
			this.athleteModel = userSettings.athleteModel;
		});
	}

	public onAthleteSettingsChanged(): void {
		this.verifyConsistencyWithAthleteSettings();
		this.clearLocalStorageOnNextLoad();
	}

	private verifyConsistencyWithAthleteSettings() {
		this.activityService.verifyConsistencyWithAthleteSettings();
	}

	public onAthleteSettingsModelChanged(athleteSettingsModel: AthleteSettingsModel): void {
		this.athleteModel.athleteSettings = athleteSettingsModel;
		this.onAthleteModelChanged();
	}

	public onGenderChanged(): void {
		this.onAthleteModelChanged();
	}

	public onDatedAthleteSettingsModelsChanged(): void {
		this.onAthleteSettingsChanged();
	}

	public clearLocalStorageOnNextLoad(): void {
		this.userSettingsService.clearLocalStorageOnNextLoad().catch((error) => console.error(error));
	}

	/**
	 * Clear local storage for athlete settings (dated included) change
	 */
	public onAthleteModelChanged(): void {
		this.userSettingsService.update(AthleteSettingsComponent.SYNCED_ATHLETE_MODEL_SETTING_KEY, this.athleteModel).then((userSettings: UserSettingsModel) => {
			console.debug("User settings updated to", userSettings);
			this.onAthleteSettingsChanged();
		}).catch((error) => console.error(error));
	}

	public onHasDatedAthleteSettingsChange(): void {
		this.userSettingsService.update(AthleteSettingsComponent.SYNCED_HAS_DATED_ATHLETE_SETTINGS_KEY, this.hasDatedAthleteSettings).then((userSettings: UserSettingsModel) => {
			console.debug("User settings updated to", userSettings);
			this.onAthleteSettingsChanged();
		}).catch((error) => {
			console.error(error);
		});
	}
}
