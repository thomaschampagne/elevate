import { GearType } from "./gear-type.enum";

export abstract class GearModel {
	public id: number;
	public type: GearType;
	public total_distance: number;
	public isActive: boolean;
	public isDefault: boolean;
	public description: string;
	public display_name: string;
	public units: string;

	protected constructor(id: number, total_distance: number, isActive: boolean, isDefault: boolean, description: string,
						  display_name: string, units: string) {
		this.id = id;
		this.total_distance = total_distance;
		this.isActive = isActive;
		this.isDefault = isDefault;
		this.description = description;
		this.display_name = display_name;
		this.units = units;
	}
}
