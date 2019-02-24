import { AbstractModifier } from "./abstract.modifier";
import * as _ from "lodash";
import { GearType } from "../models/gear/gear-type.enum";
import { BikeGearModel } from "../models/gear/bike-gear.model";
import { VacuumProcessor } from "../processors/vacuum-processor";

export class ActivityBikeOdoModifier extends AbstractModifier {

	public vacuumProcessor: VacuumProcessor;
	public athleteId: number;

	constructor(vacuumProcessor: VacuumProcessor, athleteId: number) {
		super();
		this.vacuumProcessor = vacuumProcessor;
		this.athleteId = athleteId;
	}

	public modify(): void {

		// Get bike name on Activity Page
		const activityBike: string = $(".gear-name").text().trim();

		// Get odo from map
		this.vacuumProcessor.getAthleteGear(this.athleteId, GearType.BIKE).then((bikes: BikeGearModel[]) => {

			const bikeFound = _.find(bikes, {display_name: activityBike});
			if (bikeFound) {
				$(".gear-name").html(activityBike + "<strong> / Odo: " + bikeFound.total_distance + " " + bikeFound.units + "</strong>");
			}

		}, err => {
			console.error(err);
		});

	}

}
