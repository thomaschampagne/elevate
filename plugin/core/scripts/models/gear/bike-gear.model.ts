import { GearModel } from "./gear.model";
import { GearType } from "./gear-type.enum";

export class BikeGearModel extends GearModel {

	constructor(id: number, total_distance: number, isActive: boolean, isDefault: boolean, description: string, display_name: string, units: string) {
		super(id, total_distance, isActive, isDefault, description, display_name, units);
		this.type = GearType.BIKE;
	}
}
