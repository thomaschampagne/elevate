import {
	ActivityInfoModel,
	ActivitySourceDataModel,
	ActivityStreamsModel,
	AnalysisDataModel,
	AthleteSnapshotModel,
	Gender,
	UserSettingsModel
} from "@elevate/shared/models";
import { AppResourcesModel } from "../models/app-resources.model";
import { ComputeActivityThreadMessageModel } from "../models/compute-activity-thread-message.model";
import { VacuumProcessor } from "./vacuum-processor";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers";

const ComputeAnalysisWorker = require("worker-loader?inline!./workers/compute-analysis.worker");

export class ActivityProcessor {

	public static cachePrefix = "elevate_activity_";
	protected appResources: AppResourcesModel;
	protected vacuumProcessor: VacuumProcessor;
	protected athleteModelResolver: AthleteSnapshotResolver;
	protected zones: any;
	protected activityInfo: ActivityInfoModel;
	protected computeAnalysisThread: Worker;
	protected userSettings: UserSettingsModel;

	constructor(vacuumProcessor: VacuumProcessor,
				athleteModelResolver: AthleteSnapshotResolver,
				appResources: AppResourcesModel,
				userSettings: UserSettingsModel,
				activityInfo: ActivityInfoModel) {

		this.vacuumProcessor = vacuumProcessor;
		this.athleteModelResolver = athleteModelResolver;
		this.appResources = appResources;
		this.userSettings = userSettings;
		this.activityInfo = activityInfo;
		this.zones = this.userSettings.zones;
	}

	public getAnalysisData(activityInfo: ActivityInfoModel, bounds: number[], callback: (athleteSnapshot: AthleteSnapshotModel, analysisData: AnalysisDataModel) => void): void {

		if (!this.activityInfo.type) {
			console.error("No activity type set for ActivityProcessor");
		}

		setTimeout(() => {

			// Call VacuumProcessor for getting data, compute them and cache them
			this.vacuumProcessor.getActivityStream(this.activityInfo, (activitySourceData: ActivitySourceDataModel, activityStream: ActivityStreamsModel, athleteWeight: number, athleteGender: Gender, hasPowerMeter: boolean) => { // Get stream on page

				const onDate = (this.activityInfo.startTime) ? this.activityInfo.startTime : new Date();
				const athleteSnapshot: AthleteSnapshotModel = this.athleteModelResolver.resolve(onDate);

				// Use as many properties of the author if user 'isOwner'
				if (!this.activityInfo.isOwner) {
					athleteSnapshot.athleteSettings.weight = athleteWeight;
					athleteSnapshot.gender = athleteGender;
				}

				console.log("Compute with AthleteSnapshotModel", JSON.stringify(athleteSnapshot));

				// Compute data in a background thread to avoid UI locking
				this.computeAnalysisThroughDedicatedThread(hasPowerMeter, athleteSnapshot, activitySourceData, activityStream, bounds, (resultFromThread: AnalysisDataModel) => {
					callback(athleteSnapshot, resultFromThread);
				});
			});
		});

	}

	private computeAnalysisThroughDedicatedThread(hasPowerMeter: boolean, athleteSnapshot: AthleteSnapshotModel,
												  activitySourceData: ActivitySourceDataModel, activityStream: ActivityStreamsModel,
												  bounds: number[], callback: (analysisData: AnalysisDataModel) => void): void {

		// Lets create that worker/thread!
		this.computeAnalysisThread = new ComputeAnalysisWorker();

		// Send user and activity data to the thread
		// He will compute them in the background
		const threadMessage: ComputeActivityThreadMessageModel = {
			activityType: this.activityInfo.type,
			supportsGap: this.activityInfo.supportsGap,
			isTrainer: this.activityInfo.isTrainer,
			appResources: this.appResources,
			userSettings: this.userSettings,
			isOwner: this.activityInfo.isOwner,
			athleteSnapshot: athleteSnapshot,
			hasPowerMeter: hasPowerMeter,
			activitySourceData: activitySourceData,
			activityStream: activityStream,
			bounds: bounds,
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
