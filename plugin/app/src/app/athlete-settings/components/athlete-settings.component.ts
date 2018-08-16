import { Component, OnInit } from "@angular/core";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { UserSettingsModel } from "../../../../../shared/models/user-settings/user-settings.model";
import { Gender } from "../../shared/enums/gender.enum";
import { GenderModel } from "../models/gender.model";
import { AthleteSettingsModel } from "../../../../../shared/models/athlete-settings/athlete-settings.model";
import { AthleteModel } from "../../../../../shared/models/athlete.model";

// To be defined:
// DONE append and use athleteModel on SyncedActivityModel from FitnessService. This mean to not compute PSS and HRSS from fitness service and use athleteModel provided
// SKIP append athleteModel on SyncedActivityModel in migration script?
// TODO Detect athleteModels mismatchs between local synced activities and athleteModels resolved on fly by AthleteModelResolverService?
// SKIP computeSwimStressScore from AcitvityComputer and not from FitnessService to keep coherencie with pSS, RSS, HRSS?

// To be done:
// DONE Highlight periodic settings toggle
// TODO Give a helper guide to find periodic settings (how to?)
// DONE Mark localstorage to be cleared when switch classic/periodic athlete settings
// DONE Mark localstorage to be cleared when single or periodic athlete settings have changed
// TODO Warn user to redo a "activities sync" when single or periodic athlete settings have changed
// TODO Use AthletePeriodSettingsService only in FitnessTrendComponent (no more UserSettingsService). The resolved "PeriodicAthleteSettings" will be handled by AthletePeriodicSettingsManager (including AthletePeriodicSettings revolving along UserSettingsModel.enableAthletePeriodicSettings on/off)
// TODO Export periodicAthleteSettings inside backups sync.
// TODO DO NOT CLEAN periodicAthleteSettings when sync clean.
// TODO Show athleteModel used on strava activities
// DONE Show athleteModel used in fitness trend tooltips + FT table
// DONE What happen in fitness trend if user has no PSS and HRSS scores in his Synced History? Case of history build before "HRSS" user story
// TODO Move FitnessService "compute stress scores" specs to ActivityComputer core specs
// TODO create a "fix mismatch" between "activities athlete models" and "athlete settings config": flag activities (or remove them local?) and recompute on full sync.

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

	public onPeriodicAthleteSettingsModelsChanged(): void {
		this.clearLocalStorageOnNextLoad();
	}

	public clearLocalStorageOnNextLoad(): void {
		this.userSettingsService.clearLocalStorageOnNextLoad().catch((error) => console.error(error));
	}

	/**
	 * Clear local storage for athlete settings (periodic included) change
	 */
	public onAthleteModelChanged(): void {
		this.userSettingsService.update(AthleteSettingsComponent.SYNCED_ATHLETE_MODEL_SETTING_KEY, this.athleteModel).then((userSettings: UserSettingsModel) => {
			console.debug("User settings updated to", userSettings);
			this.clearLocalStorageOnNextLoad();
		}).catch((error) => console.error(error));
	}

	public onHasPeriodicAthleteSettingsChange(): void {
		this.userSettingsService.update(AthleteSettingsComponent.SYNCED_HAS_PERIODIC_ATHLETE_SETTINGS_KEY, this.hasPeriodicAthleteSettings).then((userSettings: UserSettingsModel) => {
			console.debug("User settings updated to", userSettings);
			this.clearLocalStorageOnNextLoad();
		}).catch((error) => {
			console.error(error);
		});
	}
}
