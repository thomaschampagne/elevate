import * as _ from "lodash";
import { CoreEnv } from "../../config/core-env";
import { ActivitySourceDataModel, ActivityStreamsModel, Gender } from "@elevate/shared/models";

export class VacuumProcessor {

	public static cachePrefix = "elevate_activityStream_";

	/**
	 *  Get the strava athlete id connected
	 *  @returns the strava athlete id
	 */
	public getAthleteId(): number {

		let athleteId: number = null;
		try {
			if (!_.isUndefined(window.currentAthlete) && !_.isUndefined(window.currentAthlete.id)) {
				athleteId = window.currentAthlete.id;
			}
		} catch (err) {
			if (CoreEnv.debugMode) {
				console.warn(err);
			}
		}

		return athleteId;
	}

	/**
	 *  Get the strava athlete name connected
	 *  @returns the strava athlete id
	 */
	public getAthleteName(): string {
		let athleteName: string = null;
		try {
			if (!_.isUndefined(window.currentAthlete) && !_.isUndefined(window.currentAthlete.get("display_name"))) {
				athleteName = window.currentAthlete.get("display_name");
			}
		} catch (err) {
			if (CoreEnv.debugMode) {
				console.warn(err);
			}
		}
		return athleteName;
	}

	/**
	 *  Get the strava athlete id connected
	 *  @returns the strava athlete id
	 */
	public getActivityAthleteId(): number {

		if (_.isUndefined(window.pageView)) {
			return null;
		}

		if (!window.pageView.activityAthlete()) {
			return null;
		}

		if (_.isUndefined(window.pageView.activityAthlete().get("id"))) {
			return null;
		}

		return window.pageView.activityAthlete().get("id");
	}

	/**
	 *  Get the strava athlete premium status
	 *  @returns premium status
	 */

	public getPremiumStatus(): boolean {
		let premiumStatus: boolean = null;
		try {
			if (!_.isUndefined(window.currentAthlete)) {
				premiumStatus = window.currentAthlete.attributes.premium;
			}
		} catch (err) {
			if (CoreEnv.debugMode) {
				console.warn(err);
			}
		}

		return premiumStatus;
	}

	public getCurrentAthlete() {
		return window.currentAthlete;
	}

	/**
	 *  Get the strava athlete pro status
	 *  @returns the strava pro athlete id
	 */
	public getProStatus(): boolean {

		let proStatus = false;
		const currentAthlete: any = this.getCurrentAthlete();

		try {
			if (currentAthlete && currentAthlete.attributes && currentAthlete.attributes.pro) {
				proStatus = currentAthlete.attributes.pro;
			}

		} catch (err) {
			if (CoreEnv.debugMode) {
				console.warn(err);
			}
		}

		return proStatus;
	}

	/**
	 *  ...
	 *  @returns ...
	 */
	public getActivityId(): number {
		return (_.isUndefined(window.pageView)) ? null : window.pageView.activity().id;
	}

	/**
	 *  ...
	 *  @returns ...
	 */

	protected getAthleteWeight(): number {
		return (_.isUndefined(window.pageView)) ? null : window.pageView.activityAthleteWeight();
	}

	/**
	 * @returns Common activity stats given by Strava throught right panel
	 */
	protected getActivityStatsMap(): ActivitySourceDataModel {

		// Create activityData Map
		const movingTime = window.pageView.activity().get("moving_time");
		const elevGain = window.pageView.activity().get("elev_gain");
		const distance = window.pageView.activity().get("distance");

		return {
			movingTime: (movingTime) ? movingTime : null,
			elevation: (elevGain) ? elevGain : null,
			distance: (distance) ? distance : null
		};
	}

	/**
	 * @returns activity stream in callback
	 */
	public getActivityStream(callback: (activityCommonStats: ActivitySourceDataModel, activityStream: ActivityStreamsModel, // TODO Improve with Promise of Structure
										athleteWeight: number, athleteGender: Gender, hasPowerMeter: boolean) => void): void {

		let cache: any = localStorage.getItem(VacuumProcessor.cachePrefix + this.getActivityId());

		if (cache) {
			cache = JSON.parse(cache);
			callback(cache.activityCommonStats, cache.stream, cache.athleteWeight, cache.athleteGender, cache.hasPowerMeter);
			return;
		}

		const url: string = "/activities/" + this.getActivityId() + "/streams?stream_types[]=watts_calc&stream_types[]=watts&stream_types[]=velocity_smooth&stream_types[]=time&stream_types[]=distance&stream_types[]=cadence&stream_types[]=heartrate&stream_types[]=grade_smooth&stream_types[]=altitude&stream_types[]=latlng&stream_types[]=grade_adjusted_speed";

		$.ajax(url).done((activityStream: ActivityStreamsModel) => {

			let hasPowerMeter = true;

			if (_.isEmpty(activityStream.watts)) {
				activityStream.watts = activityStream.watts_calc;
				hasPowerMeter = false;
			}

			try {
				// Save result to cache
				localStorage.setItem(VacuumProcessor.cachePrefix + this.getActivityId(), JSON.stringify({
					activityCommonStats: this.getActivityStatsMap(),
					stream: activityStream,
					athleteWeight: this.getAthleteWeight(),
					hasPowerMeter,
				}));
			} catch (err) {
				console.warn(err);
				localStorage.clear();
			}

			callback(this.getActivityStatsMap(), activityStream, this.getAthleteWeight(), this.getActivityAthleteGender(), hasPowerMeter);
		});
	}

	/**
	 * @returns
	 */
	public getSegmentsFromBounds(vectorA: string, vectorB: string, callback: (segmentsUnify: any) => void): void {

		const segmentsUnify: any = {
			cycling: null,
			running: null,
		};

		$.when(
			$.ajax({
				url: "/api/v3/segments/search",
				data: {
					bounds: vectorA + "," + vectorB,
					min_cat: "0",
					max_cat: "5",
					activity_type: "cycling",
				},
				type: "GET",
				crossDomain: true, // enable this
				dataType: "jsonp",
				success: (xhrResponseText: any) => {
					segmentsUnify.cycling = xhrResponseText;
				},
				error: (err: any) => {
					console.error(err);
				},
			}),

			$.ajax({
				url: "/api/v3/segments/search",
				data: {
					bounds: vectorA + "," + vectorB,
					min_cat: "0",
					max_cat: "5",
					activity_type: "running",
				},
				type: "GET",
				crossDomain: true, // enable this
				dataType: "jsonp",
				success: (xhrResponseText: any) => {
					segmentsUnify.running = xhrResponseText;
				},
				error: (err: any) => {
					console.error(err);
				},
			}),
		).then(() => {
			callback(segmentsUnify);
		});

	}

	/**
	 * @returns
	 */
	public getSegmentStream(segmentId: number, callback: Function): void {

		$.ajax({
			url: "/stream/segments/" + segmentId,
			dataType: "json",
			type: "GET",
			success: (xhrResponseText: any) => {
				callback(xhrResponseText);
			},
			error: (err: any) => {
				console.error(err);
			},
		});
	}

	/**
	 * @returns Array of bikes/odo
	 */
	public getBikeOdoOfAthlete(athleteId: number, callback: (bikeOdoArray: any) => void): void {

		if (_.isUndefined(window.pageView)) {
			callback(null);
			return;
		}

		if (window.pageView.activity().attributes.type != "Ride") {
			callback(null);
			return;
		}

		const url: string = location.protocol + "//www.strava.com/athletes/" + athleteId;

		$.ajax({
			url,
			dataType: "json",
		}).always((data: any) => {

			const bikeOdoArray: any = {};

			_.forEach($(data.responseText).find("div.gear>table>tbody>tr"), (element: Element) => {

				const bikeName: string = $(element).find("td").first().text().trim();
				const bikeOdo: string = $(element).find("td").last().text().trim();

				bikeOdoArray[btoa(window.unescape(encodeURIComponent(bikeName)))] = bikeOdo;
			});

			callback(bikeOdoArray);
		});
	}

	public getActivityStartDate(): Date {

		if (window.pageView && window.pageView.activity) {
			const startTime = window.pageView.activity().get("startDateLocal");
			if (_.isNumber(startTime)) {
				return new Date(startTime * 1000);
			}
		}

		if (window.pageView
			&& window.pageView.activity
			&& _.isNumber(window.pageView.activity().get("id"))
			&& window.pageView.similarActivities && window.pageView.similarActivities()
			&& window.pageView.similarActivities().efforts
			&& window.pageView.similarActivities().efforts.byActivityId
		) {
			const activity = window.pageView.similarActivities().efforts.byActivityId[window.pageView.activity().get("id")];
			if (activity && _.isNumber(activity.get("start_date"))) {
				return new Date(activity.get("start_date") * 1000);
			}
		}

		return null;
	}

	public getActivityAthleteGender(): Gender {
		if (window.pageView
			&& window.pageView.activityAthlete
			&& window.pageView.activityAthlete().get("gender")
		) {
			return (window.pageView.activityAthlete().get("gender") === "M") ? Gender.MEN : Gender.WOMEN;
		}
		return null;
	}


	public getActivityTime(): string {
		const activityTime: string = $(".activity-summary-container").find("time").text().trim();
		return (activityTime) ? activityTime : null;
	}

	public getActivityName(): string {
		const activityName: string = $(".activity-summary-container").find(".marginless.activity-name").text().trim();
		return (activityName) ? activityName : null;
	}
}
