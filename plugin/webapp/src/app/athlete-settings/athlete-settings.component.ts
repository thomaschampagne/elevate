import { Component, OnInit } from '@angular/core';
import { ChromeStorageService } from "../services/chrome-storage.service";

@Component({
	selector: 'app-athlete-settings',
	templateUrl: './athlete-settings.component.html',
	styleUrls: ['./athlete-settings.component.scss']
})
export class AthleteSettingsComponent implements OnInit {

	constructor(private chromeStorageService: ChromeStorageService) {
	}

	public ngOnInit() {

		/*this.chromeStorageService.getAllFromLocalStorage().subscribe(

			(data: any) => {

				console.warn(data);

			}, (err: any) => {


			}, () => {

			}
		);*/
	}

}
