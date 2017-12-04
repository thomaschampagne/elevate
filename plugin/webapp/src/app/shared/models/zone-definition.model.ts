import { ZoneCustomDisplay } from "./zone-custom-display.model";

export class ZoneDefinition {
	name: string;
	value: string;
	units: string;
	step: number;
	min: number;
	max: number;
	customDisplay: ZoneCustomDisplay
}
