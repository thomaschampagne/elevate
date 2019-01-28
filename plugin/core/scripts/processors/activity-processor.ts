import * as _ from "lodash";
import {
	ActivityStatsMapModel,
	ActivityStreamsModel,
	AnalysisDataModel,
	AthleteModel,
	Gender,
	UserSettingsModel
} from "@elevate/shared/models";
import { CoreEnv } from "../../config/core-env";
import { AppResourcesModel } from "../models/app-resources.model";
import { ComputeActivityThreadMessageModel } from "../models/compute-activity-thread-message.model";
import { VacuumProcessor } from "./vacuum-processor";
import { AthleteModelResolver } from "@elevate/shared/resolvers";

const ComputeAnalysisWorker = require("worker-loader?inline!./workers/compute-analysis.worker");

interface IAnalysisDataCache {
	athleteModel: AthleteModel;
	analysisDataModel: AnalysisDataModel;
}

export class ActivityProcessor {

	public static cachePrefix = "elevate_activity_";
	protected appResources: AppResourcesModel;
	protected vacuumProcessor: VacuumProcessor;
	protected athleteModelResolver: AthleteModelResolver;
	protected zones: any;
	protected activityId: number;
	protected activityType: string;
	protected activityStartDate: Date;
	protected supportsGap: boolean;
	protected isTrainer: boolean;
	protected isActivityAuthor: boolean;
	protected computeAnalysisThread: Worker;
	protected userSettings: UserSettingsModel;

	constructor(vacuumProcessor: VacuumProcessor,
				athleteModelResolver: AthleteModelResolver,
				appResources: AppResourcesModel,
				userSettings: UserSettingsModel,
				activityId: number,
				activityType: string,
				activityStartDate: Date,
				isTrainer: boolean,
				supportsGap: boolean,
				isActivityAuthor: boolean) {

		this.vacuumProcessor = vacuumProcessor;
		this.athleteModelResolver = athleteModelResolver;
		this.appResources = appResources;
		this.userSettings = userSettings;
		this.activityId = activityId;
		this.activityType = activityType;
		this.activityStartDate = activityStartDate;
		this.isTrainer = isTrainer;
		this.supportsGap = supportsGap;
		this.zones = this.userSettings.zones;
		this.isActivityAuthor = isActivityAuthor;
	}

	public getAnalysisData(activityId: number, bounds: number[], callback: (athleteModel: AthleteModel, analysisData: AnalysisDataModel) => void): void {

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
			const cacheResult: IAnalysisDataCache = JSON.parse(localStorage.getItem(ActivityProcessor.cachePrefix + activityId)) as IAnalysisDataCache;

			if (!_.isNull(cacheResult) && CoreEnv.useActivityStreamCache) {
				console.log("Using existing activity cache mode");
				callback(cacheResult.athleteModel, cacheResult.analysisDataModel);
				return;
			}
		}

		// Else no cache... then call VacuumProcessor for getting data, compute them and cache them
		this.vacuumProcessor.getActivityStream((activityStatsMap: ActivityStatsMapModel, activityStream: ActivityStreamsModel, athleteWeight: number, athleteGender: Gender, hasPowerMeter: boolean) => { // Get stream on page

			const onDate = (this.activityStartDate) ? this.activityStartDate : new Date();
			const athleteModel: AthleteModel = this.athleteModelResolver.resolve(onDate);

			// Use as many properties of the author if user 'isActivityAuthor'
			if (!this.isActivityAuthor) {
				athleteModel.athleteSettings.weight = athleteWeight;
				athleteModel.gender = athleteGender;
			}

			console.log("Compute with AthleteModel", JSON.stringify(athleteModel));

			// Compute data in a background thread to avoid UI locking
			this.computeAnalysisThroughDedicatedThread(hasPowerMeter, athleteModel, activityStatsMap, activityStream, bounds, (resultFromThread: AnalysisDataModel) => {

				callback(athleteModel, resultFromThread);

				// Cache the result from thread to localStorage
				if (useCache) {
					console.log("Creating activity cache");
					try {

						const analysisDataCache: IAnalysisDataCache = {
							analysisDataModel: resultFromThread,
							athleteModel: athleteModel
						};

						localStorage.setItem(ActivityProcessor.cachePrefix + activityId, JSON.stringify(analysisDataCache)); // Cache the result to local storage
					} catch (err) {
						console.warn(err);
						localStorage.clear();
					}
				}

			});

		});
	}

	private computeAnalysisThroughDedicatedThread(hasPowerMeter: boolean, athleteModel: AthleteModel,
												  activityStatsMap: ActivityStatsMapModel, activityStream: ActivityStreamsModel,
												  bounds: number[], callback: (analysisData: AnalysisDataModel) => void): void {

		// Lets create that worker/thread!
		this.computeAnalysisThread = new ComputeAnalysisWorker();

		// Send user and activity data to the thread
		// He will compute them in the background
		const threadMessage: ComputeActivityThreadMessageModel = {
			activityType: this.activityType,
			supportsGap: this.supportsGap,
			isTrainer: this.isTrainer,
			appResources: this.appResources,
			userSettings: this.userSettings,
			isActivityAuthor: this.isActivityAuthor,
			athleteModel: athleteModel,
			hasPowerMeter: hasPowerMeter,
			activityStatsMap: activityStatsMap,
			activityStream: activityStream,
			bounds: bounds,
			returnZones: true,
			elapsedTime: null,
			averageSpeed: null
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
