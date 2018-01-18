import { Component, OnDestroy, OnInit } from "@angular/core";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { UserSettingsModel } from "../../../../common/scripts/models/UserSettings";
import { CommonSettingsService } from "./services/common-settings.service";
import * as _ from "lodash";
import { userSettings } from "../../../../common/scripts/UserSettings";
import { MatDialog } from "@angular/material";
import { ActivatedRoute } from "@angular/router";
import { OptionHelperDialogComponent } from "./option-helper-dialog/option-helper-dialog.component";
import { OptionHelperReaderService } from "./services/option-helper-reader.service";
import { PlatformLocation } from "@angular/common";
import { SectionModel } from "./models/section.model";
import { OptionModel } from "./models/option.model";
import { OptionHelperDataModel } from "./option-helper-dialog/option-helper-data.model";
import { Subscription } from "rxjs/Subscription";

@Component({
	selector: "app-common-settings",
	templateUrl: "./common-settings.component.html",
	styleUrls: ["./common-settings.component.scss"],

})
export class CommonSettingsComponent implements OnInit, OnDestroy {

	public sections: SectionModel[];
	public searchText = null;

	public routeQueryParamsSubscription: Subscription;

	public static getOptionHelperDir(pathname: string): string {

		if (_.isEmpty(pathname)) {
			return null;
		}

		const pathNames = pathname.split("/");
		pathNames.pop();
		return pathNames.join("/") + "/assets/option-helpers/";
	}

	constructor(private platformLocation: PlatformLocation,
				private userSettingsService: UserSettingsService,
				private commonSettingsService: CommonSettingsService,
				private optionHelperReaderService: OptionHelperReaderService,
				private route: ActivatedRoute,
				private dialog: MatDialog) {
	}

	public ngOnInit(): void {

		this.sections = this.commonSettingsService.sections;

		this.userSettingsService.fetch().then((userSettingsSynced: UserSettingsModel) => {
			this.renderOptionsForEachSection(userSettingsSynced);
		});

		// Watch query params to filter options from URL
		// OR open option dialog from external
		this.routeQueryParamsSubscription = this.route.queryParams.subscribe(params => {

			// Check query param: ?searchText=value and apply value to searchText data binding
			if (!_.isEmpty(params.searchText)) {
				this.searchText = params.searchText;
			}

			if (!_.isEmpty(params.viewOptionHelperId)) {
				// FIXME should be called without timeout. maybe in ngAfterContentInit?
				setTimeout(() => this.showOptionHelperDialog(params.viewOptionHelperId));
			}
		});
	}


	/**
	 *
	 * @param {UserSettingsModel} userSettingsSynced
	 */
	private renderOptionsForEachSection(userSettingsSynced: UserSettingsModel): void {

		_.forEach(this.sections, (section: SectionModel) => {

			_.forEach(section.options, (option: OptionModel) => {

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
	 * @param {OptionModel} option
	 */
	public onOptionChange(option: OptionModel): void {

		if (option.type === CommonSettingsService.TYPE_OPTION_CHECKBOX) {

			this.userSettingsService.update(option.key, option.active).then(() => {
				console.log(option.key + " has been updated to ", option.active);
			});

			// Enable/disable sub option if needed
			if (option.enableSubOption) {
				// Replace this to find option object from option.enableSubOption
				_.forEach(option.enableSubOption, (subKey: string) => {
					this.displaySubOption(subKey, option.active);
				});
			}
		} else if (option.type === CommonSettingsService.TYPE_OPTION_LIST) {

			this.userSettingsService.update(option.key, option.active.key).then(() => {
				console.log(option.key + " has been updated to ", option.active);
			});

		} else if (option.type === CommonSettingsService.TYPE_OPTION_NUMBER) {


			if (_.isNull(option.value) || _.isUndefined(option.value) || !_.isNumber(option.value)) {

				this.resetOptionToDefaultValue(option);

			} else { // Save !

				if (option.value < option.min || option.value > option.max) {
					this.resetOptionToDefaultValue(option);
				}

				this.userSettingsService.update(option.key, option.value).then(() => {
					console.log(option.key + " has been updated to " + option.value);
				});
			}
		}


	}

	/**
	 *
	 * @param {OptionModel} option
	 */
	private resetOptionToDefaultValue(option: OptionModel): void {
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

		_.forEach(this.sections, (section: SectionModel) => {

			const foundOption: OptionModel = _.find(section.options, {
				key: subOptionKey,
			});

			if (foundOption) {
				foundOption.hidden = !show;
			}
		});
	}


	/**
	 *
	 * @param {string} optionKeyParam
	 */
	public showOptionHelperDialog(optionKeyParam: string): void {

		let option: OptionModel = null;

		_.forEach(this.sections, (section: SectionModel) => {

			const foundOption: OptionModel = _.find(section.options, {
				key: optionKeyParam,
			});

			if (foundOption) {
				option = foundOption;
			}
		});

		if (option) {

			// Construct markdown template URI from asset option helper dir & option key
			const pathName: string = this.platformLocation["location"].pathname;
			const markdownTemplateUri = CommonSettingsComponent.getOptionHelperDir(pathName) + option.key + ".md";

			this.optionHelperReaderService.get(markdownTemplateUri).then(markdownData => {

				const optionHelperData: OptionHelperDataModel = {
					title: option.title,
					markdownData: markdownData
				};

				this.dialog.open(OptionHelperDialogComponent, {
					minWidth: OptionHelperDialogComponent.MIN_WIDTH,
					maxWidth: OptionHelperDialogComponent.MAX_WIDTH,
					data: optionHelperData
				});
			});
		}
	}

	public ngOnDestroy(): void {
		this.routeQueryParamsSubscription.unsubscribe();
	}
}
