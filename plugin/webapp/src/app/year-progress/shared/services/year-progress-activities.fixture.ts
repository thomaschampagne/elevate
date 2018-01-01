import { SyncedActivityModel } from "../../../../../../common/scripts/models/Sync";
import * as moment from "moment";

export class YearProgressActivitiesFixture {

	public static readonly STATES_COUNT = 5;
	public static readonly TYPE_RIDE: number = 0;
	public static readonly TYPE_RUN: number = 1;
	public static readonly TYPE_VIRTUAL_RIDE: number = 2;
	public static readonly TYPE_COMMUTE: number = 3;
	public static readonly TYPE_REST: number = 4;
	public static readonly START_DATE: string = "2015-01-01";
	public static readonly END_DATE: string = "2017-06-01";
	public static readonly DATE_FORMAT: string = "YYYY-MM-DD";

	public static provide(): SyncedActivityModel[] {

		const models: SyncedActivityModel[] = [];

		const currentMoment = moment(YearProgressActivitiesFixture.START_DATE,
			YearProgressActivitiesFixture.DATE_FORMAT).startOf("day");
		const endMoment = moment(YearProgressActivitiesFixture.END_DATE,
			YearProgressActivitiesFixture.DATE_FORMAT).startOf("day");

		while (currentMoment.isSameOrBefore(endMoment)) {

			const dayType = currentMoment.dayOfYear() % YearProgressActivitiesFixture.STATES_COUNT;

			let type = null;
			let distanceRaw = null;
			let time = null;
			let elevationGainRaw = 0;
			let commute = (currentMoment.dayOfYear() % 2 > 0) ? false : null; // Allow "not commute activities" to receive false or null values
			let restDay = false;

			switch (dayType) {

				case YearProgressActivitiesFixture.TYPE_RIDE:
					type = "Ride";
					time = 3600;
					distanceRaw = 40000; // 40 km
					elevationGainRaw = 500; // 500 meters
					break;

				case YearProgressActivitiesFixture.TYPE_RUN:
					type = "Run";
					time = 3600;
					distanceRaw = 10000; // 10 km
					elevationGainRaw = 50;
					break;

				case YearProgressActivitiesFixture.TYPE_VIRTUAL_RIDE:
					type = "VirtualRide";
					time = 1800;
					distanceRaw = 20000; // 20 km
					elevationGainRaw = 400;
					break;

				case YearProgressActivitiesFixture.TYPE_COMMUTE:
					type = "Ride";
					time = 1800;
					commute = true;
					distanceRaw = 15000; // 15 km
					elevationGainRaw = 10;
					break;

				case YearProgressActivitiesFixture.TYPE_REST:
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

		return models;
	}
}
