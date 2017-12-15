import { SyncedActivityModel } from "../../../../common/scripts/models/Sync";
import * as moment from "moment";

const STATES_COUNT = 5;

const TYPE_RIDE: number = 0;
const TYPE_RUN: number = 1;
const TYPE_VIRTUAL_RIDE: number = 2;
const TYPE_COMMUTE: number = 3;
const TYPE_REST: number = 4;

const models = [];
const currentMoment = moment("2015-01-01", "YYYY-MM-DD").startOf("day");
const endMoment = moment("2017-06-01", "YYYY-MM-DD").startOf("day");

while (currentMoment.isSameOrBefore(endMoment)) {

	const dayType = currentMoment.dayOfYear() % STATES_COUNT;

	let type = null;
	let distanceRaw = null;
	let time = null;
	let elevationGainRaw = 0;
	let commute = false;
	let restDay = false;

	switch (dayType) {

		case TYPE_RIDE:
			type = "Ride";
			time = 3600;
			distanceRaw = 40000; // 40 km
			elevationGainRaw = 500; // 500 meters
			break;

		case TYPE_RUN:
			type = "Run";
			time = 3600;
			distanceRaw = 10000; // 10 km
			elevationGainRaw = 50;
			break;

		case TYPE_VIRTUAL_RIDE:
			type = "VirtualRide";
			time = 1800;
			distanceRaw = 20000; // 20 km
			elevationGainRaw = 400;
			break;

		case TYPE_COMMUTE:
			type = "Ride";
			time = 1800;
			commute = true;
			distanceRaw = 15000; // 15 km
			elevationGainRaw = 10;
			break;

		case TYPE_REST:
			restDay = true;
			break;

	}

	if (!restDay) {

		const syncedActivityModel = new SyncedActivityModel();
		syncedActivityModel.id = parseInt(currentMoment.year() + "" + currentMoment.dayOfYear());
		syncedActivityModel.name = type + " activity" + ((commute) ? " (commute)" : "");
		syncedActivityModel.type = type;
		syncedActivityModel.display_type = type;
		syncedActivityModel.start_time = currentMoment.toISOString();
		syncedActivityModel.distance_raw = distanceRaw;
		syncedActivityModel.moving_time_raw = time;
		syncedActivityModel.elapsed_time_raw = time;
		syncedActivityModel.commute = commute;
		syncedActivityModel.elevation_gain_raw = elevationGainRaw;

		models.push(syncedActivityModel);
	}

	currentMoment.add(1, "days");

}

export const TEST_YEAR_PROGRESS_ACTIVITIES: SyncedActivityModel[] = models;
