import { YearToDateProgressPresetModel } from "./year-to-date-progress-preset.model";

export class YearProgressPresetsDialogResponse {

	public deletedPresets: YearToDateProgressPresetModel[];
	public loadPreset: YearToDateProgressPresetModel;

	constructor(deletedPresets: YearToDateProgressPresetModel[], loadPreset: YearToDateProgressPresetModel) {
		this.deletedPresets = deletedPresets;
		this.loadPreset = loadPreset;
	}
}
