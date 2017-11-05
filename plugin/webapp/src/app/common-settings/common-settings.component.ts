import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChromeStorageService } from "../services/chrome-storage.service";
import { IUserSettings } from "../../../../common/scripts/interfaces/IUserSettings";

@Component({
	selector: 'app-common-settings',
	templateUrl: './common-settings.component.html',
	styleUrls: ['./common-settings.component.scss']
})
export class CommonSettingsComponent implements OnInit, OnDestroy {

	public _DELETE_userSettingsSynced: IUserSettings; // TODO Tobe remove: debug member

	constructor(private chromeStorageService: ChromeStorageService) {
	}

	public ngOnInit() {

		console.debug("CommonSettingsComponent::ngOnInit()");
		this.chromeStorageService.fetchUserSettings().then((debug_userSettingsSynced: IUserSettings) => {
			this._DELETE_userSettingsSynced = debug_userSettingsSynced;
		});
	}

	public ngOnDestroy(): void {
	}
}
