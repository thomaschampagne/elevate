import { BaseConnector } from "../base.connector";
import { Subject } from "rxjs";
import { ActivityComputer, ActivitySyncEvent, ConnectorType, ErrorSyncEvent, StravaApiCredentials, SyncEvent } from "@elevate/shared/sync";
import { ActivityStreamsModel, AthleteModel, BareActivityModel, SyncedActivityModel, UserSettings } from "@elevate/shared/models";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import logger from "electron-log";
import { Service } from "../../service";
import * as _ from "lodash";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers";
import { Gzip } from "@elevate/shared/tools";
import { HttpClient } from "../../http-client";
import UserSettingsModel = UserSettings.UserSettingsModel;

type StravaApiStreamType = {
	type: "time" | "distance" | "latlng" | "altitude" | "velocity_smooth" | "heartrate" | "cadence" | "watts" | "watts_calc" | "grade_smooth" | "grade_adjusted_speed";
	data: number[];
	series_type: string;
	original_size: number;
	resolution: string
};

export class StravaConnector extends BaseConnector {

	public static readonly ENABLED: boolean = true;
	public static readonly ACTIVITIES_PER_PAGES: number = 20;
	public static readonly STRAVA_OMIT_FIELDS: string[] = ["resource_state", "athlete", "external_id", "upload_id", "distance", "timezone",
		"utc_offset", "location_city", "location_state", "location_country", "start_latitude", "start_longitude", "achievement_count",
		"kudos_count", "comment_count", "athlete_count", "photo_count", "private", "visibility", "flagged", "gear_id", "from_accepted_tag",
		"elapsed_time", "moving_time", "start_date", "average_heartrate", "max_heartrate", "heartrate_opt_out", "display_hide_heartrate_option",
		"average_speed", "max_speed", "average_cadence", "average_watts", "pr_count", "elev_high", "elev_low", "has_kudoed", "total_elevation_gain", "map"];
	public static readonly STRAVA_ERROR_NO_RESOURCE: string = "Resource Not Found";

	public stravaApiCredentials: StravaApiCredentials;
	public clientSecret: string;
	public accessToken: string;
	public updateSyncedActivitiesNameAndType: boolean;
	public athleteSnapshotResolver: AthleteSnapshotResolver;

	public syncEvents: Subject<SyncEvent>;

	constructor(priority: number, athleteModel: AthleteModel, userSettingsModel: UserSettingsModel, stravaApiCredentials: StravaApiCredentials, updateSyncedActivitiesNameAndType: boolean) {
		super(ConnectorType.STRAVA, athleteModel, userSettingsModel, priority, StravaConnector.ENABLED);
		this.stravaApiCredentials = stravaApiCredentials;
		this.updateSyncedActivitiesNameAndType = updateSyncedActivitiesNameAndType;
		this.athleteSnapshotResolver = new AthleteSnapshotResolver(this.athleteModel);
	}

	/**
	 *
	 */
	public sync(): Subject<SyncEvent> {

		this.syncEvents = new Subject<SyncEvent>();

		this.syncPages(this.syncEvents).then(() => {
			// TODO Sync is done!
			this.syncEvents.complete();

		}).catch(error => {
			logger.error(error);
			throw error; // TODO WHats do we do here?!
		});

		return this.syncEvents;
	}

	/**
	 *
	 * @param syncEvents
	 * @param stravaPageId
	 * @param perPage
	 */
	public syncPages(syncEvents: Subject<SyncEvent>, stravaPageId?: number, perPage?: number): Promise<void> {

		if (stravaPageId === undefined) {
			stravaPageId = 1;
		}
		if (perPage === undefined) {
			perPage = StravaConnector.ACTIVITIES_PER_PAGES;
		}

		return new Promise((resolve, reject) => {

			this.getStravaBareActivityModels(stravaPageId, perPage).then((bareActivities: BareActivityModel[]) => {

				logger.debug("#DEBUG_0001", "bareActivities length", "stravaPageId=" + stravaPageId, "perPage=" + perPage, bareActivities.length);

				if (bareActivities.length > 0) {

					this.processBareActivities(syncEvents, bareActivities).then(() => {

						// Increment page and handle next page
						stravaPageId = stravaPageId + 1;
						resolve(this.syncPages(syncEvents, stravaPageId, perPage));

					}).catch(error => {
						reject(error);
					});

				} else {
					resolve();
				}

			}, error => {
				reject(error);
			});
		});

	}

	public processBareActivities(syncEvents: Subject<SyncEvent>, bareActivities: BareActivityModel[]): Promise<void> {

		return bareActivities.reduce((previousPromise: Promise<void>, bareActivity: BareActivityModel) => {

			return previousPromise.then(() => {

				bareActivity = this.prepareBareActivity(bareActivity);

				// Does bare activity has been already synced before?
				return this.findSyncedActivityModels(bareActivity.start_time, bareActivity.elapsed_time_raw).then((syncedActivityModels: SyncedActivityModel[]) => {

					if (_.isEmpty(syncedActivityModels)) {

						// Fetch stream of the activity
						this.getStravaActivityStreams(bareActivity.id).then((activityStreamsModel: ActivityStreamsModel) => {

							// Assign stream
							const syncedActivityModel: Partial<SyncedActivityModel> = bareActivity;
							syncedActivityModel.streams = activityStreamsModel;

							// Resolve athlete snapshot for current activity date
							syncedActivityModel.athleteSnapshot = this.athleteSnapshotResolver.resolve(syncedActivityModel.start_time);

							// Compute activity
							syncedActivityModel.extendedStats = (new ActivityComputer(syncedActivityModel.type, syncedActivityModel.trainer,
								this.userSettingsModel, syncedActivityModel.athleteSnapshot, true, syncedActivityModel.hasPowerMeter,
								{
									distance: syncedActivityModel.distance_raw,
									elevation: syncedActivityModel.elevation_gain_raw,
									movingTime: syncedActivityModel.moving_time_raw,
								},
								syncedActivityModel.streams, null, false)).compute();

							// Gunzip stream as base64
							syncedActivityModel.streams = Gzip.toBase64(syncedActivityModel.streams);

							// Track connector type
							syncedActivityModel.sourceConnectorType = ConnectorType.STRAVA;

							// Notify the new SyncedActivityModel
							syncEvents.next(new ActivitySyncEvent(ConnectorType.STRAVA, null, <SyncedActivityModel> syncedActivityModel, true));

						}, error => {
							// TODO Missing test here!
							console.error(error);
							return Promise.reject(error); // TODO What happen if we are unable to get a single stream?
						});

					} else {  // Activities exists

						if (_.isArray(syncedActivityModels) && syncedActivityModels.length === 1) { // One activity found
							if (this.updateSyncedActivitiesNameAndType) {
								const syncedActivityModel = syncedActivityModels[0];
								syncedActivityModel.name = bareActivity.name;
								syncedActivityModel.type = bareActivity.type;
								syncEvents.next(new ActivitySyncEvent(ConnectorType.STRAVA, null, syncedActivityModel, false));
							}

						} else {

							const activitiesFound = [];
							_.forEach(syncedActivityModels, (activityModel: SyncedActivityModel) => {
								activitiesFound.push(activityModel.name + " (" + new Date(activityModel.start_time).toString() + ")");
							});

							const error = new Error(syncedActivityModels.length + " local activities found while processing the remote " +
								"strava activity \"" + bareActivity.id + "\": " + activitiesFound.join("; "));
							syncEvents.error(new ErrorSyncEvent(ConnectorType.STRAVA, "Multiple existing activities found", error));
						}
					}

				});

			});

		}, Promise.resolve());
	}

	public prepareBareActivity(bareActivity: BareActivityModel): BareActivityModel {

		// Fields re-mapping
		// TODO Strava dont give "calories" from "getStravaBareActivityModels" bare activities. Only "kilojoules"! We have to get calories...

		bareActivity.elapsed_time_raw = (<any> bareActivity).elapsed_time;
		bareActivity.moving_time_raw = (<any> bareActivity).moving_time;
		bareActivity.distance_raw = (<any> bareActivity).distance;
		bareActivity.elevation_gain_raw = (<any> bareActivity).total_elevation_gain;
		bareActivity.hasPowerMeter = (<any> bareActivity).device_watts;
		bareActivity.map_summary_polyline = (((<any> bareActivity).map) && (<any> bareActivity).map.summary_polyline)
			? (<any> bareActivity).map.summary_polyline : null;

		// Start/End time formatting
		bareActivity.start_time = new Date((<any> bareActivity).start_date).toISOString();
		const endDate = new Date(bareActivity.start_time);
		endDate.setSeconds(endDate.getSeconds() + bareActivity.elapsed_time_raw);
		bareActivity.end_time = endDate.toISOString();

		// Bare activity cleaning
		return <BareActivityModel> _.omit(bareActivity, StravaConnector.STRAVA_OMIT_FIELDS);
	}

	public getStravaBareActivityModels(page: number, perPage: number): Promise<BareActivityModel[]> {

		return new Promise<BareActivityModel[]>((resolve, reject) => {
			const url: string = `https://www.strava.com/api/v3/athlete/activities?before&after&page=${page}&per_page=${perPage}`; // TODO static
			this.getFromStravaApi<BareActivityModel[]>(url).then((result: BareActivityModel[]) => {
				resolve(result);
			}, error => {
				logger.error(error);
				reject(reject);
			});
		});
	}

	/**
	 *
	 * @param url
	 */
	public getFromStravaApi<T>(url: string): Promise<T> {
		return HttpClient.get<T>(url, Service.instance().httpProxy, {
			"Authorization": `Bearer ${this.stravaApiCredentials.accessToken}`,
			"Content-Type": "application/json"
		});
	}

	/**
	 *
	 * @param activityStartDate
	 * @param activityDurationSeconds
	 */
	public findSyncedActivityModels(activityStartDate: string, activityDurationSeconds: number): Promise<SyncedActivityModel[]> {
		const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.FIND_ACTIVITY, activityStartDate, activityDurationSeconds);
		return Service.instance().ipcMainMessages.send<SyncedActivityModel[]>(flaggedIpcMessage);
	}

	/**
	 *
	 * @param activityId
	 */
	public getStravaActivityStreams(activityId: number): Promise<ActivityStreamsModel> {

		return new Promise<ActivityStreamsModel>((resolve, reject) => {

			this.fetchRemoteStravaActivityStreams(activityId).then((stravaApiStreamTypes: StravaApiStreamType[]) => {

				const activityStreamsModel: Partial<ActivityStreamsModel> = {};
				_.forEach(stravaApiStreamTypes, (stravaApiStreamType: StravaApiStreamType) => {
					activityStreamsModel[stravaApiStreamType.type] = stravaApiStreamType.data;
				});

				resolve(<ActivityStreamsModel> activityStreamsModel);

			}, error => {

				if (error) {
					if (error.message && error.message === StravaConnector.STRAVA_ERROR_NO_RESOURCE) {
						logger.warn(`No streams found for activity "${activityId}". Strava streams Api replied with:`, error);
						resolve(null);
					} else {
						logger.error(`Error while getting streams for activity "${activityId}". Strava streams Api replied with:`, error);
						reject(error);
					}
				}

			});
		});
	}

	public fetchRemoteStravaActivityStreams(activityId: number): Promise<StravaApiStreamType[]> {
		return new Promise<StravaApiStreamType[]>((resolve, reject) => {
			const url: string = `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=time,distance,latlng,altitude,velocity_smooth,heartrate,cadence,watts,watts_calc,grade_smooth,grade_adjusted_speed`; // TODO static
			this.getFromStravaApi<StravaApiStreamType[]>(url).then((result: StravaApiStreamType[]) => {
				resolve(result);
			}, error => {
				logger.error(error);
				reject(reject);
			});
		});
	}
}
