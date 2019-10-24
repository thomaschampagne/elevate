import { ZoneCustomDisplayModel } from "./zone-custom-display.model";

export class ZoneDefinitionModel {
	public name: string;
	public value: string;
	public units: string;
	public step: number;
	public min: number;
	public max: number;
	public customDisplay: ZoneCustomDisplayModel;
}
