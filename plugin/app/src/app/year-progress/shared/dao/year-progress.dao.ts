import { Injectable } from "@angular/core";
import { YearProgressPresetModel } from "../models/year-progress-preset.model";
import * as _ from "lodash";

@Injectable()
export class YearProgressDao {

	public static readonly YEAR_PROGRESS_PRESET_KEY: string = "yearProgressPresets";

	constructor() {
	}

	public fetchPresets(): Promise<YearProgressPresetModel[]> {

		return new Promise<YearProgressPresetModel[]>((resolve: Function, reject: Function) => {

			this.browserStorageLocal().get(YearProgressDao.YEAR_PROGRESS_PRESET_KEY, (result: { yearProgressPresets: YearProgressPresetModel[] }) => {
				const error = this.getChromeError();
				if (error) {
					reject(error.message);
				} else {
					resolve((_.isEmpty(result.yearProgressPresets)) ? [] : result.yearProgressPresets);
				}
			});

		});
	}

	public savePresets(yearProgressPresetModels: YearProgressPresetModel[]): Promise<YearProgressPresetModel[]> {

		return new Promise<YearProgressPresetModel[]>((resolve: Function, reject: Function) => {

			const yearProgressPresetData = {};
			yearProgressPresetData[YearProgressDao.YEAR_PROGRESS_PRESET_KEY] = yearProgressPresetModels;

			this.browserStorageLocal().set(yearProgressPresetData, () => {
				const error = this.getChromeError();
				if (error) {
					reject(error.message);
				} else {
					this.fetchPresets().then((models: YearProgressPresetModel[]) => {
						resolve(models);
					});
				}
			});
		});
	}

	/**
	 *
	 * @returns {chrome.storage.SyncStorageArea}
	 */
	public browserStorageLocal(): chrome.storage.LocalStorageArea {
		return chrome.storage.local;
	}

	/**
	 *
	 * @returns {chrome.runtime.LastError}
	 */
	public getChromeError(): chrome.runtime.LastError {
		return chrome.runtime.lastError;
	}
}
