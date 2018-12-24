import { YearProgressPresetModel } from "./year-progress-preset.model";

export class YearProgressPresetsDialogResponse {

	public deletedPresets: YearProgressPresetModel[];
	public loadPreset: YearProgressPresetModel;

	constructor(deletedPresets: YearProgressPresetModel[], loadPreset: YearProgressPresetModel) {
		this.deletedPresets = deletedPresets;
		this.loadPreset = loadPreset;
	}
}
