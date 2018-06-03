import * as _ from "lodash";
import { UserSettingsModel } from "../../../shared/models/user-settings/user-settings.model";
import { CoreEnv } from "../../config/core-env";
import { AppResourcesModel } from "../models/app-resources.model";
import { IComputeActivityThreadMessage } from "../interfaces/IComputeActivityThreadMessage";
import { VacuumProcessor } from "./VacuumProcessor";
import { ActivityStatsMapModel } from "../../../shared/models/activity-data/activity-stats-map.model";
import { ActivityStreamsModel } from "../../../shared/models/activity-data/activity-streams.model";
import { AnalysisDataModel } from "../../../shared/models/activity-data/analysis-data.model";

const ComputeAnalysisWorker = require("worker-loader?inline!./workers/ComputeAnalysis.worker");

export class ActivityProcessor {

	public static cachePrefix = "stravistix_activity_";
	protected appResources: AppResourcesModel;
	protected vacuumProcessor: VacuumProcessor;
	protected zones: any;
	protected activityType: string;
	protected supportsGap: boolean;
	protected isTrainer: boolean;
	protected isActivityAuthor: boolean;
	protected computeAnalysisThread: Worker;
	protected userSettings: UserSettingsModel;

	constructor(appResources: AppResourcesModel, vacuumProcessor: VacuumProcessor, userSettings: UserSettingsModel, isActivityAuthor: boolean) {
		this.appResources = appResources;
		this.vacuumProcessor = vacuumProcessor;
		this.userSettings = userSettings;
		this.zones = this.userSettings.zones;
		this.isActivityAuthor = isActivityAuthor;
	}

	public setActivityType(activityType: string): void {
		this.activityType = activityType;
	}

	public setSupportsGap(supportsGap: boolean): void {
		this.supportsGap = supportsGap;
	}

	public setTrainer(isTrainer: boolean): void {
		if (isTrainer) {
			if (_.isBoolean(isTrainer)) {
				this.isTrainer = isTrainer;
			} else {
				console.error("isTrainer(boolean): required boolean param");
			}
		}
	}

	public getAnalysisData(activityId: number, bounds: number[], callback: (analysisData: AnalysisDataModel) => void): void {

		if (!this.activityType) {
			console.error("No activity type set for ActivityProcessor");
		}

		// We are not using cache when bounds are given
		let useCache = true;
		if (!_.isEmpty(bounds)) {
			useCache = false;
		}

		if (useCache) {
			// Find in cache first is data exist
			const cacheResult: AnalysisDataModel = JSON.parse(localStorage.getItem(ActivityProcessor.cachePrefix + activityId)) as AnalysisDataModel;

			if (!_.isNull(cacheResult) && CoreEnv.useActivityStreamCache) {
				console.log("Using existing activity cache mode");
				callback(cacheResult);
				return;
			}
		}

		// Else no cache... then call VacuumProcessor for getting data, compute them and cache them
		this.vacuumProcessor.getActivityStream((activityStatsMap: ActivityStatsMapModel, activityStream: ActivityStreamsModel, athleteWeight: number, hasPowerMeter: boolean) => { // Get stream on page

			// Compute data in a background thread to avoid UI locking
			this.computeAnalysisThroughDedicatedThread(hasPowerMeter, athleteWeight, activityStatsMap, activityStream, bounds, (resultFromThread: AnalysisDataModel) => {

				callback(resultFromThread);

				// Cache the result from thread to localStorage
				if (useCache) {
					console.log("Creating activity cache");
					try {
						localStorage.setItem(ActivityProcessor.cachePrefix + activityId, JSON.stringify(resultFromThread)); // Cache the result to local storage
					} catch (err) {
						console.warn(err);
						localStorage.clear();
					}
				}

			});

		});
	}

	protected computeAnalysisThroughDedicatedThread(hasPowerMeter: boolean, athleteWeight: number,
													activityStatsMap: ActivityStatsMapModel, activityStream: ActivityStreamsModel, bounds: number[],
													callback: (analysisData: AnalysisDataModel) => void): void {

		// Lets create that worker/thread!
		this.computeAnalysisThread = new ComputeAnalysisWorker();

		// Send user and activity data to the thread
		// He will compute them in the background
		const threadMessage: IComputeActivityThreadMessage = {
			activityType: this.activityType,
			supportsGap: this.supportsGap,
			isTrainer: this.isTrainer,
			appResources: this.appResources,
			userSettings: this.userSettings,
			isActivityAuthor: this.isActivityAuthor,
			athleteWeight,
			hasPowerMeter,
			activityStatsMap,
			activityStream,
			bounds,
			returnZones: true
		};

		this.computeAnalysisThread.postMessage(threadMessage);

		// Listen messages from thread. Thread will send to us the result of computation
		this.computeAnalysisThread.onmessage = (messageFromThread: MessageEvent) => {
			callback(messageFromThread.data);
			// Finish and kill thread
			this.computeAnalysisThread.terminate();
		};
	}
}
