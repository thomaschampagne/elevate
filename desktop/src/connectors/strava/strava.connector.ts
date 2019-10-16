import { BaseConnector } from "../base.connector";
import { ReplaySubject, Subject } from "rxjs";
import {
	ActivityComputer,
	ActivitySyncEvent,
	ConnectorType,
	ErrorSyncEvent,
	StartedSyncEvent,
	StoppedSyncEvent,
	StravaApiCredentials,
	StravaCredentialsUpdateSyncEvent,
	SyncEvent,
	SyncEventType
} from "@elevate/shared/sync";
import {
	ActivityStreamsModel,
	AnalysisDataModel,
	AthleteModel,
	BareActivityModel,
	ConnectorSyncDateTime,
	SyncedActivityModel,
	UserSettings
} from "@elevate/shared/models";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import logger from "electron-log";
import { Service } from "../../service";
import * as _ from "lodash";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers";
import { Gzip } from "@elevate/shared/tools";
import { filter } from "rxjs/operators";
import { StravaAuthenticator } from "../../strava-authenticator";
import { IHttpClientResponse } from "typed-rest-client/Interfaces";
import { HttpCodes } from "typed-rest-client/HttpClient";
import * as http from "http";
import { IncomingHttpHeaders } from "http";
import UserSettingsModel = UserSettings.UserSettingsModel;

export type StravaApiStreamType = {
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
	public static readonly STRAVA_RATELIMIT_LIMIT_HEADER: string = "x-ratelimit-limit";
	public static readonly STRAVA_RATELIMIT_USAGE_HEADER: string = "x-ratelimit-usage";
	public static readonly QUARTER_HOUR_TIME_INTERVAL: number = 15 * 60;

	public static create(athleteModel: AthleteModel, userSettingsModel: UserSettings.UserSettingsModel, connectorSyncDateTime: ConnectorSyncDateTime,
						 stravaApiCredentials: StravaApiCredentials, updateSyncedActivitiesNameAndType: boolean) {
		return new StravaConnector(null, athleteModel, userSettingsModel, connectorSyncDateTime, stravaApiCredentials, updateSyncedActivitiesNameAndType);
	}

	public static generateFetchStreamsEndpoint(activityId: number): string {
		return `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=time,distance,latlng,altitude,velocity_smooth,heartrate,cadence,watts,watts_calc,grade_smooth,grade_adjusted_speed`;
	}

	public static generateFetchBareActivitiesPageEndpoint(page: number, perPage: number, afterTimestamp: number): string {
		const after = (_.isNumber(afterTimestamp)) ? "after=" + afterTimestamp : "";
		return `https://www.strava.com/api/v3/athlete/activities?before&${after}&page=${page}&per_page=${perPage}`;
	}

	public static computeNextCallWaitTime(currentCallsCount: number, thresholdCount: number, timeIntervalSeconds: number): number {

		const notNumbers = !_.isNumber(currentCallsCount) || !_.isNumber(thresholdCount) || !_.isNumber(timeIntervalSeconds);
		const notPositives = currentCallsCount < 0 || thresholdCount < 0 || timeIntervalSeconds < 0;
		if (notNumbers || notPositives) {
			throw new Error("Params must be numbers and positive while computing strava next call wait time");
		}
		return ((2 * timeIntervalSeconds) / thresholdCount ** 2) * currentCallsCount;
	}

	public static parseRateLimits(headers: IncomingHttpHeaders): { instant: { usage: number; limit: number; }, daily: { usage: number; limit: number; } } {

		const rateLimits = {
			instant: {
				usage: null,
				limit: null,
			},

			daily: {
				usage: null,
				limit: null,
			}

		};

		const limits = (<string> headers[StravaConnector.STRAVA_RATELIMIT_LIMIT_HEADER]).split(",");
		const usages = (<string> headers[StravaConnector.STRAVA_RATELIMIT_USAGE_HEADER]).split(",");

		rateLimits.instant.limit = parseInt(limits[0].trim());
		rateLimits.instant.usage = parseInt(usages[0].trim());

		rateLimits.daily.limit = parseInt(limits[1].trim());
		rateLimits.daily.usage = parseInt(usages[1].trim());

		return rateLimits;

	}

	public stravaApiCredentials: StravaApiCredentials;
	public updateSyncedActivitiesNameAndType: boolean;
	public athleteSnapshotResolver: AthleteSnapshotResolver;
	public stravaAuthenticator: StravaAuthenticator;
	public stopRequested: boolean;
	public nextCallWaitTime: number;

	public syncEvents$: ReplaySubject<SyncEvent>;

	constructor(priority: number, athleteModel: AthleteModel, userSettingsModel: UserSettingsModel, connectorSyncDateTime: ConnectorSyncDateTime,
				stravaApiCredentials: StravaApiCredentials, updateSyncedActivitiesNameAndType: boolean) {
		super(ConnectorType.STRAVA, athleteModel, userSettingsModel, connectorSyncDateTime, priority, StravaConnector.ENABLED);
		this.stravaApiCredentials = stravaApiCredentials;
		this.updateSyncedActivitiesNameAndType = updateSyncedActivitiesNameAndType;
		this.athleteSnapshotResolver = new AthleteSnapshotResolver(this.athleteModel);
		this.stravaAuthenticator = new StravaAuthenticator();
		this.stopRequested = false;
		this.nextCallWaitTime = 0;
	}

	/**
	 *
	 */
	public sync(): Subject<SyncEvent> {

		if (this.isSyncing) {

			this.syncEvents$.next(ErrorSyncEvent.SYNC_ALREADY_STARTED.create(ConnectorType.STRAVA));

		} else {

			// Start a new sync
			this.syncEvents$ = new ReplaySubject<SyncEvent>();

			this.syncEvents$.next(new StartedSyncEvent(ConnectorType.STRAVA));

			this.isSyncing = true;

			this.syncPages(this.syncEvents$).then(() => {
				this.isSyncing = false;
				this.syncEvents$.complete();
			}, (syncEvent: SyncEvent) => {

				this.isSyncing = false;

				const isCancelEvent = syncEvent.type === SyncEventType.STOPPED;

				if (isCancelEvent) {
					this.syncEvents$.next(syncEvent);
				} else {
					this.syncEvents$.error(syncEvent);
				}

			});
		}

		return this.syncEvents$;
	}

	public stop(): Promise<void> {

		this.stopRequested = true;

		return new Promise((resolve, reject) => {

			if (this.isSyncing) {
				const stopSubscription = this.syncEvents$.pipe(
					filter(syncEvent => syncEvent.type === SyncEventType.STOPPED)
				).subscribe(() => {
					stopSubscription.unsubscribe();
					this.stopRequested = false;
					resolve();
				});
			} else {
				setTimeout(() => {
					this.stopRequested = false;
					reject("Strava connector is not syncing currently.");
				});
			}
		});
	}

	/**
	 *
	 * @param syncEvents$
	 * @param stravaPageId
	 * @param perPage
	 */
	public syncPages(syncEvents$: Subject<SyncEvent>, stravaPageId: number = 1, perPage: number = StravaConnector.ACTIVITIES_PER_PAGES): Promise<void> {

		// Check for stop request and stop sync
		if (this.stopRequested) {
			return Promise.reject(new StoppedSyncEvent(ConnectorType.STRAVA));
		}

		return new Promise((resolve, reject) => {

			this.getStravaBareActivityModels(stravaPageId, perPage, this.syncDateTime).then((bareActivities: BareActivityModel[]) => {

				if (bareActivities.length > 0) {

					this.processBareActivities(syncEvents$, bareActivities).then(() => {

						// Increment page and handle next page
						stravaPageId = stravaPageId + 1;
						resolve(this.syncPages(syncEvents$, stravaPageId, perPage));

					}, error => {
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

	public processBareActivities(syncEvents$: Subject<SyncEvent>, bareActivities: BareActivityModel[]): Promise<void> {

		return bareActivities.reduce((previousPromise: Promise<void>, bareActivity: BareActivityModel) => {

			return previousPromise.then(() => {

				// Check for stop request and stop sync
				if (this.stopRequested) {
					return Promise.reject(new StoppedSyncEvent(ConnectorType.STRAVA));
				}

				bareActivity = this.prepareBareActivity(bareActivity);

				// Does bare activity has been already synced before?
				return this.findSyncedActivityModels(bareActivity.start_time, bareActivity.elapsed_time_raw).then((syncedActivityModels: SyncedActivityModel[]) => {

					if (_.isEmpty(syncedActivityModels)) {

						// Fetch stream of the activity
						return this.getStravaActivityStreams(bareActivity.id).then((activityStreamsModel: ActivityStreamsModel) => {

							// Assign stream
							const syncedActivityModel: Partial<SyncedActivityModel> = bareActivity;
							syncedActivityModel.streams = activityStreamsModel;

							// Resolve athlete snapshot for current activity date
							syncedActivityModel.athleteSnapshot = this.athleteSnapshotResolver.resolve(syncedActivityModel.start_time);

							// Compute activity
							try {
								syncedActivityModel.extendedStats = this.computeExtendedStats(syncedActivityModel);
							} catch (error) {

								const errorSyncEvent = (error instanceof Error) ? ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(ConnectorType.STRAVA, error.message, error.stack)
									: ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(ConnectorType.STRAVA, error.toString());

								syncEvents$.next(errorSyncEvent); // Notify error

								return Promise.resolve(); // Continue to next activity
							}

							// Gunzip stream as base64
							syncedActivityModel.streams = (syncedActivityModel.streams) ? Gzip.toBase64(syncedActivityModel.streams) : null;

							// Track connector type
							syncedActivityModel.sourceConnectorType = ConnectorType.STRAVA;

							// Notify the new SyncedActivityModel
							syncEvents$.next(new ActivitySyncEvent(ConnectorType.STRAVA, null, <SyncedActivityModel> syncedActivityModel, true));

							return Promise.resolve();

						}, (errorSyncEvent: ErrorSyncEvent) => {
							return Promise.reject(errorSyncEvent); // Every error here will stop the sync
						});

					} else {  // Activities exists

						if (_.isArray(syncedActivityModels) && syncedActivityModels.length === 1) { // One activity found
							if (this.updateSyncedActivitiesNameAndType) {
								const syncedActivityModel = syncedActivityModels[0];
								syncedActivityModel.name = bareActivity.name;
								syncedActivityModel.type = bareActivity.type;
								syncEvents$.next(new ActivitySyncEvent(ConnectorType.STRAVA, null, syncedActivityModel, false));
							}

						} else { // More than 1 activity found, trigger ErrorSyncEvent...

							const activitiesFound = [];
							_.forEach(syncedActivityModels, (activityModel: SyncedActivityModel) => {
								activitiesFound.push(activityModel.name + " (" + new Date(activityModel.start_time).toString() + ")");
							});

							const errorSyncEvent = new ErrorSyncEvent(ConnectorType.STRAVA,
								ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.create(ConnectorType.STRAVA, bareActivity.name,
									new Date(bareActivity.start_time), activitiesFound));

							syncEvents$.next(errorSyncEvent);
						}

						return Promise.resolve(); // Continue to next activity
					}

				});

			});

		}, Promise.resolve());
	}

	public computeExtendedStats(syncedActivityModel: Partial<SyncedActivityModel>): AnalysisDataModel {
		return (new ActivityComputer(syncedActivityModel.type, syncedActivityModel.trainer,
			this.userSettingsModel, syncedActivityModel.athleteSnapshot, true, syncedActivityModel.hasPowerMeter,
			{
				distance: syncedActivityModel.distance_raw,
				elevation: syncedActivityModel.elevation_gain_raw,
				movingTime: syncedActivityModel.moving_time_raw,
			}, <ActivityStreamsModel> syncedActivityModel.streams, null, false)).compute();
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

	public getStravaBareActivityModels(page: number, perPage: number, after: number): Promise<BareActivityModel[]> {
		return this.fetchRemoteStravaBareActivityModels(page, perPage, after);
	}


	/**
	 * @return Promise<T> or reject an ErrorSyncEvent
	 * @param syncEvents$
	 * @param url
	 */
	public stravaApiCall<T>(syncEvents$: Subject<SyncEvent>, url: string): Promise<T> {

		if (!_.isNumber(this.stravaApiCredentials.clientId) || _.isEmpty(this.stravaApiCredentials.clientSecret)) {
			return Promise.reject(ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create());
		}

		return this.stravaTokensUpdater(syncEvents$, this.stravaApiCredentials).then(() => {

			logger.debug(`Waiting ${this.nextCallWaitTime} seconds before calling strava api`);

			// Wait during next call wait time
			return new Promise(resolve => setTimeout(resolve, this.nextCallWaitTime)).then(() => {
				return Service.instance().httpClient.get(url, {
					"Authorization": `Bearer ${this.stravaApiCredentials.accessToken}`,
					"Content-Type": "application/json"
				});
			});

		}).then((response: IHttpClientResponse) => {

			// Update time to wait for the next call to avoid the rate limit threshold
			const rateLimits = StravaConnector.parseRateLimits(response.message.headers);

			this.nextCallWaitTime = StravaConnector.computeNextCallWaitTime(rateLimits.instant.usage, rateLimits.instant.limit,
				StravaConnector.QUARTER_HOUR_TIME_INTERVAL);

			return (response.message.statusCode === HttpCodes.OK) ? response.readBody() : Promise.reject(response.message);

		}).then((body: string) => {

			return Promise.resolve(JSON.parse(body));

		}).catch((error: http.IncomingMessage) => {

			switch (error.statusCode) {

				case HttpCodes.Unauthorized:
					return Promise.reject(ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create());

				case HttpCodes.Forbidden:

					let forbiddenPromise;
					const parseRateLimits = StravaConnector.parseRateLimits(error.headers);
					if (parseRateLimits.instant.usage > parseRateLimits.instant.limit) {
						forbiddenPromise = Promise.reject(ErrorSyncEvent.STRAVA_INSTANT_QUOTA_REACHED.create(parseRateLimits.instant.usage, parseRateLimits.instant.limit));
					} else if (parseRateLimits.daily.usage > parseRateLimits.daily.limit) {
						forbiddenPromise = Promise.reject(ErrorSyncEvent.STRAVA_DAILY_QUOTA_REACHED.create(parseRateLimits.daily.usage, parseRateLimits.daily.limit));
					} else {
						forbiddenPromise = Promise.reject(ErrorSyncEvent.STRAVA_API_FORBIDDEN.create());
					}
					return forbiddenPromise;

				case HttpCodes.NotFound:
					return Promise.reject(ErrorSyncEvent.STRAVA_API_RESOURCE_NOT_FOUND.create(url));
				case HttpCodes.RequestTimeout:
					return Promise.reject(ErrorSyncEvent.STRAVA_API_TIMEOUT.create(url));
				default:
					return Promise.reject(ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(ConnectorType.STRAVA, `UNHANDLED HTTP GET ERROR on '${url}'. Response code: ${error.statusCode} ${error.statusMessage}`));

			}
		});
	}

	/**
	 * Ensure proper connection to Strava API:
	 * - Authenticate to Strava API if no "access token" is stored
	 * - Authenticate to Strava API if no "refresh token" is stored
	 * - Notify new StravaApiCredentials updated with proper accessToken & refreshToken using StravaCredentialsUpdateSyncEvent
	 * @param syncEvents$
	 * @param stravaApiCredentials
	 */
	public stravaTokensUpdater(syncEvents$: Subject<SyncEvent>, stravaApiCredentials: StravaApiCredentials): Promise<void> {

		let authPromise: Promise<{ accessToken: string, refreshToken: string, expiresAt: number }> = null;

		const isAccessTokenValid = (stravaApiCredentials.accessToken && stravaApiCredentials.expiresAt > this.getCurrentTime());

		if (!stravaApiCredentials.accessToken || !stravaApiCredentials.refreshToken) {
			authPromise = this.stravaAuthenticator.authorize(stravaApiCredentials.clientId, stravaApiCredentials.clientSecret);
			logger.info("No accessToken or refreshToken found. Now authenticating to strava");
		} else if (!isAccessTokenValid && stravaApiCredentials.refreshToken) {
			authPromise = this.stravaAuthenticator.refresh(stravaApiCredentials.clientId, stravaApiCredentials.clientSecret, stravaApiCredentials.refreshToken);
			logger.info("Access token is expired, Refreshing token");
		} else if (isAccessTokenValid) {
			logger.debug("Access token is still valid, we keep current access token, no authorize and no refresh token");
			return Promise.resolve();
		} else {
			return Promise.reject("Case not supported in StravaConnector::stravaTokensUpdater(). stravaApiCredentials: " + JSON.stringify(stravaApiCredentials));
		}

		return authPromise.then((result: { accessToken: string, refreshToken: string, expiresAt: number }) => {

			// Update credentials
			stravaApiCredentials.accessToken = result.accessToken;
			stravaApiCredentials.refreshToken = result.refreshToken;
			stravaApiCredentials.expiresAt = result.expiresAt;

			// Notify
			syncEvents$.next(new StravaCredentialsUpdateSyncEvent(stravaApiCredentials));

			return Promise.resolve();
		}, error => {
			return Promise.reject(error);
		});
	}

	public getCurrentTime(): number {
		return (new Date()).getTime();
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
					(<number[]> activityStreamsModel[stravaApiStreamType.type]) = stravaApiStreamType.data;
				});

				resolve(<ActivityStreamsModel> activityStreamsModel);

			}, (errorSyncEvent: ErrorSyncEvent) => {

				if (errorSyncEvent) {

					if (errorSyncEvent.code === ErrorSyncEvent.STRAVA_API_RESOURCE_NOT_FOUND.code) {
						logger.warn(`No streams found for activity "${activityId}". ${errorSyncEvent.description}`);
						resolve(null);
					} else {
						reject(errorSyncEvent);
					}
				}
			});
		});
	}

	/**
	 * @param activityId
	 * @return Reject ErrorSyncEvent if error
	 */
	public fetchRemoteStravaActivityStreams(activityId: number): Promise<StravaApiStreamType[]> { // TODO inject syncEvents$ instead of this.syncEvents$ use
		return this.stravaApiCall<StravaApiStreamType[]>(this.syncEvents$, StravaConnector.generateFetchStreamsEndpoint(activityId));
	}

	/**
	 * @param page
	 * @param perPage
	 * @param after
	 * @return Reject ErrorSyncEvent if error
	 */
	public fetchRemoteStravaBareActivityModels(page: number, perPage: number, after: number): Promise<BareActivityModel[]> {
		return this.stravaApiCall<BareActivityModel[]>(this.syncEvents$, StravaConnector.generateFetchBareActivitiesPageEndpoint(page, perPage, after));
	}

}
