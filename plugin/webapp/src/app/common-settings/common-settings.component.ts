import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChromeStorageService } from "../services/chrome-storage.service";
import { IUserSettings } from "../../../../common/scripts/interfaces/IUserSettings";
import { CommonSettingsService, IOption, ISection } from "../services/common-settings.service";
import * as _ from 'lodash';

@Component({
	selector: 'app-common-settings',
	templateUrl: './common-settings.component.html',
	styleUrls: ['./common-settings.component.scss']
})

export class CommonSettingsComponent implements OnInit, OnDestroy {


	private _sections: ISection[];

	constructor(private chromeStorageService: ChromeStorageService,
				private commonSettingsService: CommonSettingsService) {
	}

	public ngOnInit() {

		this._sections = this.commonSettingsService.sections;

		this.chromeStorageService.fetchUserSettings().then((userSettingsSynced: IUserSettings) => {
			this.renderOptionsForEachSection(userSettingsSynced);
		});
	}

	private renderOptionsForEachSection(userSettingsSynced: IUserSettings) {

		_.forEach(this.sections, (section: ISection) => {

			_.forEach(section.content, (option: IOption) => {

				if (option.optionType === CommonSettingsService.TYPE_OPTION_CHECKBOX) {

					option.active = _.propertyOf(userSettingsSynced)(option.optionKey);

					if (option.optionEnableSub) {
						_.forEach(option.optionEnableSub, (subKey: string) => {
							this.displaySubOption(subKey, _.propertyOf(userSettingsSynced)(option.optionKey));
						});
					}

				} else if (option.optionType === CommonSettingsService.TYPE_OPTION_LIST) {

					option.active = _.find(option.optionList, {
						key: _.propertyOf(userSettingsSynced)(option.optionKey),
					});

				} else if (option.optionType === CommonSettingsService.TYPE_OPTION_NUMBER) {

					option.value = _.propertyOf(userSettingsSynced)(option.optionKey);

				} else {

					console.error("Option type not supported");

				}
			});
		});
	}

	public onOptionChange(option: IOption): void {

		console.warn(option);
		// debugger;

		if (option.optionType == CommonSettingsService.TYPE_OPTION_CHECKBOX) {

			this.chromeStorageService.updateUserSetting(option.optionKey, option.active).then(() => {
				console.log(option.optionKey + " has been updated to " + option.active);
			});

			// Enable/disable sub option if needed
			if (option.optionEnableSub) {
				// Replace this to find option object from option.optionEnableSub
				_.forEach(option.optionEnableSub, (subKey: string) => {
					this.displaySubOption(subKey, option.active);
				});
			}
		} else if (option.optionType == CommonSettingsService.TYPE_OPTION_LIST) {

			this.chromeStorageService.updateUserSetting(option.optionKey, option.active.key).then(() => {
				console.log(option.optionKey + " has been updated to " + option.active);
			});

		} else if (option.optionType == CommonSettingsService.TYPE_OPTION_NUMBER) {

			// TODO
		}


	}

	public displaySubOption(subOptionKey: string, show: boolean): void {

		_.forEach(this.sections, (section: ISection) => {

			const optionFound: IOption = _.find(section.content, {
				optionKey: subOptionKey,
			});

			if (optionFound) {
				optionFound.hidden = !show;
			}
		});
	};


	get sections(): ISection[] {
		return this._sections;
	}

	public ngOnDestroy(): void {
	}
}
