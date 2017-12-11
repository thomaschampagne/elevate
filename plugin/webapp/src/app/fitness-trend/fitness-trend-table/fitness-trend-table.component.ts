import { Component, OnInit } from '@angular/core';
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { FitnessService } from "../shared/service/fitness.service";
import { IUserSettings } from "../../../../../common/scripts/interfaces/IUserSettings";
import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";

@Component({
	selector: 'app-fitness-trend-table',
	templateUrl: './fitness-trend-table.component.html',
	styleUrls: ['./fitness-trend-table.component.scss']
})
export class FitnessTrendTableComponent implements OnInit {

	public readonly isSwimEnabled: boolean = true;
	public readonly isPowerMeterEnabled: boolean = true;

	public fitnessTrend: DayFitnessTrendModel[];
	public cyclingFtp: number = null;
	public swimFtp: number = null;

	constructor(private userSettingsService: UserSettingsService,
				private fitnessService: FitnessService) {
	}

	public ngOnInit(): void {

		console.warn("Run FitnessTrendTable Component ngOnInit");
		this.setup();
	}

	private setup(): void {

		this.userSettingsService.fetch().then((userSettings: IUserSettings) => {

			this.cyclingFtp = userSettings.userFTP;
			this.swimFtp = userSettings.userSwimFTP;

			return this.fitnessService.computeTrend(this.isPowerMeterEnabled, this.cyclingFtp, this.isSwimEnabled, this.swimFtp);

		}).then((fullFitnessTrend: DayFitnessTrendModel[]) => {

			this.fitnessTrend = fullFitnessTrend;

		}, error => {

			this.fitnessTrend = [];
			console.error(error);

		});
	}
}
