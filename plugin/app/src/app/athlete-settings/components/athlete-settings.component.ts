import { Component, OnInit } from "@angular/core";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { UserSettingsModel } from "../../../../../shared/models/user-settings/user-settings.model";
import { Gender } from "../../shared/enums/gender.enum";
import { GenderModel } from "../models/gender.model";
import { AthleteSettingsModel } from "../../../../../shared/models/athlete-settings/athlete-settings.model";
import { AthleteModel } from "../../../../../shared/models/athlete.model";

// TODO Use AthletePeriodSettingsService only in FitnessTrendComponent (no more UserSettingsService). The resolved "PeriodicAthleteSettings" will be handled by AthletePeriodicSettingsManager (including AthletePeriodicSettings revolving along UserSettingsModel.enableAthletePeriodicSettings on/off)
// TODO App athlete settings messages
// TODO Also export local saved AthleteModel (with periodicSettingsModels) in a sync backup?
// TODO Warn user to redo a "activities sync" when changing the periodicSettingsModels.

@Component({
	selector: "app-athlete-settings",
	templateUrl: "./athlete-settings.component.html",
	styleUrls: ["./athlete-settings.component.scss"]
})
export class AthleteSettingsComponent implements OnInit {

	public static readonly SYNCED_ATHLETE_MODEL_SETTING_KEY = "athleteModel";
	public static readonly SYNCED_HAS_PERIODIC_ATHLETE_SETTINGS_KEY = "hasPeriodicAthleteSettings";

	public readonly GENDER_LIST: GenderModel[] = [{
		type: Gender.MEN,
		display: "Male",
	}, {
		type: Gender.WOMEN,
		display: "Female",
	}];

	public athleteModel: AthleteModel;

	public hasPeriodicAthleteSettings: boolean;

	constructor(public userSettingsService: UserSettingsService) {
	}

	public ngOnInit(): void {

		this.userSettingsService.fetch().then((userSettings: UserSettingsModel) => {
			this.hasPeriodicAthleteSettings = userSettings.hasPeriodicAthleteSettings;
			this.athleteModel = userSettings.athleteModel;
		});
	}

	public onAthleteSettingsModelChanged(athleteSettingsModel: AthleteSettingsModel): void {
		this.athleteModel.athleteSettings = athleteSettingsModel;
		this.onAthleteModelChanged();
	}

	public onGenderChanged(): void {
		this.onAthleteModelChanged();
	}

	/**
	 * Clear local storage for athlete settings (periodic included) change
	 */
	public onAthleteModelChanged(): void {
		this.userSettingsService.update(AthleteSettingsComponent.SYNCED_ATHLETE_MODEL_SETTING_KEY, this.athleteModel).then((userSettings: UserSettingsModel) => {
			console.debug("User settings updated to", userSettings);
			this.userSettingsService.markLocalStorageClear();
		}).catch((error) => {
			console.error(error);
		});
	}

	public onHasPeriodicAthleteSettingsChange(): void {
		this.userSettingsService.update(AthleteSettingsComponent.SYNCED_HAS_PERIODIC_ATHLETE_SETTINGS_KEY, this.hasPeriodicAthleteSettings).then((userSettings: UserSettingsModel) => {
			console.debug("User settings updated to", userSettings);
			this.userSettingsService.markLocalStorageClear();
		}).catch((error) => {
			console.error(error);
		});
	}
}
