import { Component, OnInit } from "@angular/core";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { AthleteModel, Gender } from "@elevate/shared/models";
import { GenderModel } from "../models/gender.model";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { AthleteService } from "../../shared/services/athlete/athlete.service";

// TODO Give a helper guide to find dated settings (how to?)
// TODO Show athleteSnapshot used on strava activities

@Component({
	selector: "app-athlete-settings",
	templateUrl: "./athlete-settings.component.html",
	styleUrls: ["./athlete-settings.component.scss"]
})
export class AthleteSettingsComponent implements OnInit {

	public static readonly SYNCED_ATHLETE_MODEL_SETTING_GENDER_KEY = "gender";

	public readonly GENDER_LIST: GenderModel[] = [{
		type: Gender.MEN,
		display: "Male",
	}, {
		type: Gender.WOMEN,
		display: "Female",
	}];

	public athleteModel: AthleteModel;

	constructor(public userSettingsService: UserSettingsService,
				public athleteService: AthleteService,
				public activityService: ActivityService,
				public logger: LoggerService) {
	}

	public ngOnInit(): void {
		this.athleteService.fetch().then((athleteModel: AthleteModel) => {
			this.athleteModel = athleteModel;
		});
	}

	public onAthleteSettingsChanged(): void {
		this.verifyConsistencyWithAthleteSettings();
		this.clearLocalStorageOnNextLoad();
	}

	private verifyConsistencyWithAthleteSettings() {
		this.activityService.verifyConsistencyWithAthleteSettings();
	}

	public onGenderChanged(): void {
		this.athleteService.saveProperty(AthleteSettingsComponent.SYNCED_ATHLETE_MODEL_SETTING_GENDER_KEY, this.athleteModel.gender)
			.then(() => this.onAthleteSettingsChanged());
	}

	public onDatedAthleteSettingsModelsChanged(): void {
		this.onAthleteSettingsChanged();
	}

	public clearLocalStorageOnNextLoad(): void {
		this.userSettingsService.clearLocalStorageOnNextLoad().catch((error) => this.logger.error(error));
	}
}
