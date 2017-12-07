import { ZoneCustomDisplay } from "./zone-custom-display.model";

export class ZoneDefinition {
	public name: string;
	public value: string;
	public units: string;
	public step: number;
	public min: number;
	public max: number;
	public customDisplay: ZoneCustomDisplay;
}
