import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChromeStorageService } from "../services/chrome-storage.service";
import { IUserSettings } from "../../../../common/scripts/interfaces/IUserSettings";
import { CommonSettingsService, ISection, ISectionContent } from "../services/common-settings.service";
import * as _ from 'lodash';

@Component({
	selector: 'app-common-settings',
	templateUrl: './common-settings.component.html',
	styleUrls: ['./common-settings.component.scss']
})

export class CommonSettingsComponent implements OnInit, OnDestroy {

	private _sections: ISection[];

	constructor(private chromeStorageService: ChromeStorageService, private commonSettingsService: CommonSettingsService) {
	}

	public ngOnInit() {

		console.debug("CommonSettingsComponent::ngOnInit()");

		this._sections = this.commonSettingsService.sections;

		this.chromeStorageService.fetchUserSettings().then((userSettingsSynced: IUserSettings) => {
			this.renderOptionsForEachSection(userSettingsSynced);
		});
	}

	private renderOptionsForEachSection(userSettingsSynced: IUserSettings) {

		_.forEach(this.sections, (section: ISection) => {

			_.forEach(section.content, (option: ISectionContent) => {

				if (option.optionType === "checkbox") {

					option.active = _.propertyOf(userSettingsSynced)(option.optionKey);

					if (option.optionEnableSub) {
						_.forEach(option.optionEnableSub, (subKey: string) => {
							this.displaySubOption(subKey, _.propertyOf(userSettingsSynced)(option.optionKey));
						});
					}

				} else if (option.optionType === "list") {
					option.active = _.find(option.optionList, {
						key: _.propertyOf(userSettingsSynced)(option.optionKey),
					});
				} else if (option.optionType === "number") {
					option.value = _.propertyOf(userSettingsSynced)(option.optionKey);
				} else {
					console.error("Option type not supported");
				}
			});
		});
	}

	private displaySubOption(subOptionKey: string, show: any) {

/*
TODO
$scope.displaySubOption = (subOptionKey: string, show: boolean) => {
			_.forEach($scope.sections, (section: ISection) => {
				const optionFound: ISectionContent = _.find(section.content, {
					optionKey: subOptionKey,
				});
				if (optionFound) {
					optionFound.hidden = !show;
				}
			});
		};*/

	}

	get sections(): ISection[] {
		return this._sections;
	}

	public ngOnDestroy(): void {
	}
}
