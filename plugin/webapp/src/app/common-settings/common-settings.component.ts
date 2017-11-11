import { Component, OnInit } from '@angular/core';
import { ChromeStorageService } from '../services/chrome-storage.service';
import { IUserSettings } from "../../../../common/scripts/interfaces/IUserSettings";
import { CommonSettingsService, IOption, ISection } from "../services/common-settings.service";
import * as _ from 'lodash';
import { userSettings } from "../../../../common/scripts/UserSettings";
import { GotItDialogComponent, IGotItDialogData } from "../dialogs/noop-dialog/got-it-dialog.component";
import { MatDialog } from "@angular/material";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
	selector: 'app-common-settings',
	templateUrl: './common-settings.component.html',
	styleUrls: ['./common-settings.component.scss']
})

export class CommonSettingsComponent implements OnInit {


	private _sections: ISection[];
	private _searchText;

	constructor(private chromeStorageService: ChromeStorageService,
				private commonSettingsService: CommonSettingsService,
				private domSanitizer: DomSanitizer,
				private dialog: MatDialog) {
	}

	public ngOnInit() {

		this._sections = this.commonSettingsService.sections;

		this.chromeStorageService.fetchUserSettings().then((userSettingsSynced: IUserSettings) => {
			this.renderOptionsForEachSection(userSettingsSynced);
		});
	}

	/**
	 *
	 * @param {IUserSettings} userSettingsSynced
	 */
	private renderOptionsForEachSection(userSettingsSynced: IUserSettings) {

		_.forEach(this.sections, (section: ISection) => {

			_.forEach(section.options, (option: IOption) => {

				if (option.type === CommonSettingsService.TYPE_OPTION_CHECKBOX) {

					option.active = _.propertyOf(userSettingsSynced)(option.key);

					if (option.enableSubOption) {
						_.forEach(option.enableSubOption, (subKey: string) => {
							this.displaySubOption(subKey, _.propertyOf(userSettingsSynced)(option.key));
						});
					}

				} else if (option.type === CommonSettingsService.TYPE_OPTION_LIST) {

					option.active = _.find(option.list, {
						key: _.propertyOf(userSettingsSynced)(option.key),
					});

				} else if (option.type === CommonSettingsService.TYPE_OPTION_NUMBER) {

					option.value = _.propertyOf(userSettingsSynced)(option.key);

				} else {

					console.error("Option type not supported");

				}
			});
		});
	}

	/**
	 *
	 * @param {IOption} option
	 */
	public onOptionChange(option: IOption): void {

		if (option.type == CommonSettingsService.TYPE_OPTION_CHECKBOX) {

			this.chromeStorageService.updateUserSetting(option.key, option.active).then(() => {
				console.log(option.key + " has been updated to " + option.active);
			});

			// Enable/disable sub option if needed
			if (option.enableSubOption) {
				// Replace this to find option object from option.enableSubOption
				_.forEach(option.enableSubOption, (subKey: string) => {
					this.displaySubOption(subKey, option.active);
				});
			}
		} else if (option.type == CommonSettingsService.TYPE_OPTION_LIST) {

			this.chromeStorageService.updateUserSetting(option.key, option.active.key).then(() => {
				console.log(option.key + " has been updated to " + option.active);
			});

		} else if (option.type == CommonSettingsService.TYPE_OPTION_NUMBER) {


			if (_.isNull(option.value) || _.isUndefined(option.value) || !_.isNumber(option.value)) {

				this.resetOptionToDefaultValue(option);

			} else { // Save !

				if (option.value < option.min || option.value > option.max) {
					this.resetOptionToDefaultValue(option);
				}

				this.chromeStorageService.updateUserSetting(option.key, option.value).then(() => {
					console.log(option.key + " has been updated to " + option.value);
				});
			}
		}


	}

	/**
	 *
	 * @param {IOption} option
	 */
	private resetOptionToDefaultValue(option: IOption) {
		const resetValue = _.propertyOf(userSettings)(option.key);
		console.log(option.key + " value not compliant, Reset to  " + resetValue);
		option.value = resetValue;
	}

	/**
	 *
	 * @param {string} subOptionKey
	 * @param {boolean} show
	 */
	public displaySubOption(subOptionKey: string, show: boolean): void {

		_.forEach(this.sections, (section: ISection) => {

			const foundOption: IOption = _.find(section.options, {
				key: subOptionKey,
			});

			if (foundOption) {
				foundOption.hidden = !show;
			}
		});
	};


	public showOptionDialog(optionKeyParam: string): void {

		let option: IOption = null;

		_.forEach(this.sections, (section: ISection) => {

			const foundOption: IOption = _.find(section.options, {
				key: optionKeyParam,
			});

			if (foundOption) {
				option = foundOption;
			}
		});

		if (option) {

			const noopDialogData: IGotItDialogData = {
				title: option.title,
				html: this.domSanitizer.bypassSecurityTrustHtml(option.html)
			};
			const dialogRef = this.dialog.open(GotItDialogComponent, {
				minWidth: GotItDialogComponent.MIN_WIDTH,
				maxWidth: GotItDialogComponent.MAX_WIDTH,
				data: noopDialogData
			});
		}
	};


	get sections(): ISection[] {
		return this._sections;
	}


	get searchText(): string {
		return this._searchText;
	}

	set searchText(value: string) {
		this._searchText = value;
	}
}
