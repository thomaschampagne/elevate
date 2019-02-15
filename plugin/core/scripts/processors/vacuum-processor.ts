import * as _ from "lodash";
import { CoreEnv } from "../../config/core-env";
import { ActivityInfoModel, ActivitySourceDataModel, ActivityStreamsModel, Gender } from "@elevate/shared/models";

export class VacuumProcessor {

	public static cachePrefix = "elevate_stream_";

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
	/**
	 *
	 * @param activityInfo
	 * @param callback
	 */
	public getActivityStream(activityInfo: ActivityInfoModel, callback: (activityCommonStats: ActivitySourceDataModel, activityStream: ActivityStreamsModel, // TODO Improve with Promise of Structure
																		 athleteWeight: number, athleteGender: Gender, hasPowerMeter: boolean) => void): void {

		if (_.isNumber(activityInfo.id)) {

			let cache: any = localStorage.getItem(VacuumProcessor.cachePrefix + activityInfo.id);

			if (cache) {
				cache = JSON.parse(cache);
				callback(cache.activityCommonStats, cache.stream, cache.athleteWeight, cache.athleteGender, cache.hasPowerMeter);
				console.log("Using stream cache for activity '" + activityInfo.name + "' (id:" + activityInfo.id + ")");
				return;
			}
		}

		let hasPowerMeter = true;

		let activityStream: ActivityStreamsModel;

		const hasLocalStreamData = window.pageView
			&& window.pageView.streamsRequest
			&& window.pageView.streamsRequest.streams
			&& window.pageView.streamsRequest.streams.streamData
			&& window.pageView.streamsRequest.streams.streamData.data;

		const localStreamData: ActivityStreamsModel = (hasLocalStreamData) ? window.pageView.streamsRequest.streams.streamData.data : {};

		let streamUrl: string = "/activities/" + this.getActivityId() + "/streams?";
		let missingStream = false;

		if (_.isEmpty(localStreamData.time)) {
			streamUrl += "stream_types[]=time&";
			missingStream = true;
		}

		if (_.isEmpty(localStreamData.distance)) {
			streamUrl += "stream_types[]=distance&";
			missingStream = true;
		}

		if (_.isEmpty(localStreamData.velocity_smooth)) {
			streamUrl += "stream_types[]=velocity_smooth&";
			missingStream = true;
		}

		if (_.isEmpty(localStreamData.altitude)) {
			streamUrl += "stream_types[]=altitude&";
			missingStream = true;
		}

		if (_.isEmpty(localStreamData.cadence)) {
			streamUrl += "stream_types[]=cadence&";
			missingStream = true;
		}

		if (_.isEmpty(localStreamData.heartrate)) {
			streamUrl += "stream_types[]=heartrate&";
			missingStream = true;
		}

		if (_.isEmpty(localStreamData.watts)) {

			streamUrl += "stream_types[]=watts&";
			missingStream = true;

			if (_.isEmpty(localStreamData.watts_calc)) {
				streamUrl += "stream_types[]=watts_calc&";
				missingStream = true;
			}
		}

		if (_.isEmpty(localStreamData.latlng) && activityInfo && !activityInfo.isTrainer) {
			streamUrl += "stream_types[]=latlng&";
			missingStream = true;
		}

		if (_.isEmpty(localStreamData.grade_smooth)) {
			streamUrl += "stream_types[]=grade_smooth&";
			missingStream = true;
		}

		if (_.isEmpty(localStreamData.grade_adjusted_speed) && activityInfo && (activityInfo.type === "Run" || activityInfo.type === "VirtualRun")) {
			streamUrl += "stream_types[]=grade_adjusted_speed&";
			missingStream = true;
		}

		let activityStreamPromise: Promise<ActivityStreamsModel>;

		if (missingStream) {
			activityStreamPromise = new Promise(resolve => {
				$.ajax(streamUrl).done((activityStream: ActivityStreamsModel) => {
					resolve(activityStream);
				});
			});

		} else {
			activityStreamPromise = Promise.resolve(localStreamData);
		}

		// We have a complete stream for all sensors
		activityStreamPromise.then((completeStream: ActivityStreamsModel) => {

			activityStream = new ActivityStreamsModel(
				(localStreamData.time) ? localStreamData.time : completeStream.time,
				(localStreamData.distance) ? localStreamData.distance : completeStream.distance,
				(localStreamData.velocity_smooth) ? localStreamData.velocity_smooth : completeStream.velocity_smooth,
				(localStreamData.altitude) ? localStreamData.altitude : completeStream.altitude,
				(localStreamData.cadence) ? localStreamData.cadence : completeStream.cadence,
				(localStreamData.heartrate) ? localStreamData.heartrate : completeStream.heartrate,
				(localStreamData.watts) ? localStreamData.watts : completeStream.watts,
				(localStreamData.watts_calc) ? localStreamData.watts_calc : completeStream.watts_calc,
				(localStreamData.latlng) ? localStreamData.latlng : completeStream.latlng,
				(localStreamData.grade_smooth) ? localStreamData.grade_smooth : completeStream.grade_smooth,
				(localStreamData.grade_adjusted_speed) ? localStreamData.grade_adjusted_speed : completeStream.grade_adjusted_speed);

			if (_.isEmpty(activityStream.watts)) {
				activityStream.watts = activityStream.watts_calc;
				hasPowerMeter = false;
			}

			// Save result to cache
			try {
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
		}, error => {
			console.error(error);
			callback(this.getActivityStatsMap(), new ActivityStreamsModel(), this.getAthleteWeight(), this.getActivityAthleteGender(), hasPowerMeter);
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

	public getActivityName(): string {
		const activityName: string = $(".activity-summary-container").find(".marginless.activity-name").text().trim();
		return (activityName) ? activityName : null;
	}
}
