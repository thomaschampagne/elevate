import { SyncEventType } from "./sync-event-type";
import { ConnectorType } from "../connectors";
import { SyncEvent } from "./sync.event";
import { BareActivityModel, SyncedActivityModel } from "../../models/sync";

export class ErrorSyncEvent extends SyncEvent {

	public static UNHANDLED_ERROR_SYNC = {
		code: "UNHANDLED_ERROR_SYNC",
		create: (fromConnectorType: ConnectorType, description: string): ErrorSyncEvent => {
			return new ErrorSyncEvent(fromConnectorType, {
				code: ErrorSyncEvent.UNHANDLED_ERROR_SYNC.code,
				description: description,
				stacktrace: null
			});
		},
	};

	public static MULTIPLE_ACTIVITIES_FOUND = {
		code: "MULTIPLE_ACTIVITIES_FOUND",
		create: (fromConnectorType: ConnectorType, activityName: string, onDate: Date, existingActivities: string[]): ErrorSyncEvent => {
			return new ErrorSyncEvent(fromConnectorType, {
				code: ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.code,
				description: `Unable to save the new activity "${activityName}" on date "${onDate.toString()}" because multiple activities are already saved in database for same date: ${existingActivities.join("; ")}`,
				stacktrace: null
			});
		},
	};

	public static SYNC_ERROR_COMPUTE = {
		code: "SYNC_ERROR_COMPUTE",
		create: (fromConnectorType: ConnectorType, description: string, stacktrace: string = null): ErrorSyncEvent => {
			return new ErrorSyncEvent(fromConnectorType, {
				code: ErrorSyncEvent.SYNC_ERROR_COMPUTE.code,
				description: description,
				stacktrace: stacktrace
			});
		},
	};

	public static SYNC_ALREADY_STARTED = {
		code: "SYNC_ALREADY_STARTED",
		create: (fromConnectorType: ConnectorType, description: string = null, stacktrace: string = null): ErrorSyncEvent => {
			return new ErrorSyncEvent(fromConnectorType, {
				code: ErrorSyncEvent.SYNC_ALREADY_STARTED.code,
				description: description,
				stacktrace: stacktrace
			});
		},
	};

	public static SYNC_ERROR_UPSERT_ACTIVITY_DATABASE = {
		code: "SYNC_ERROR_UPSERT_ACTIVITY_DATABASE",
		create: (fromConnectorType: ConnectorType, activity: SyncedActivityModel, stacktrace: string = null): ErrorSyncEvent => {
			const errorSyncEvent = new ErrorSyncEvent(fromConnectorType, {
				code: ErrorSyncEvent.SYNC_ERROR_UPSERT_ACTIVITY_DATABASE.code,
				description: `Unable to save the new activity "${activity.name}" on date "${activity.start_time}" into database.`,
				stacktrace: stacktrace
			});
			errorSyncEvent.activity = activity;
			return errorSyncEvent;
		},
	};

	public static STRAVA_API_UNAUTHORIZED = {
		code: "STRAVA_API_UNAUTHORIZED",
		create: (): ErrorSyncEvent => {
			return new ErrorSyncEvent(ConnectorType.STRAVA, {
				code: ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.code,
				description: `Unauthorized call to Strava api`,
				stacktrace: null
			});
		}
	};

	public static STRAVA_API_FORBIDDEN = {
		code: "STRAVA_API_FORBIDDEN",
		create: (): ErrorSyncEvent => {
			return new ErrorSyncEvent(ConnectorType.STRAVA, {
				code: ErrorSyncEvent.STRAVA_API_FORBIDDEN.code,
				description: `Unauthorized call to Strava api`,
				stacktrace: null
			});
		}
	};

	public static STRAVA_INSTANT_QUOTA_REACHED = {
		code: "STRAVA_INSTANT_QUOTA_REACHED",
		create: (usage: number, limit: number): ErrorSyncEvent => {
			return new ErrorSyncEvent(ConnectorType.STRAVA, {
				code: ErrorSyncEvent.STRAVA_INSTANT_QUOTA_REACHED.code,
				description: `The instant strava api calls have been reached: ${usage} calls performed for a limit of ${limit} each 15 minutes. Wait 20 minutes and retry.`,
				stacktrace: null
			});
		}
	};

	public static STRAVA_DAILY_QUOTA_REACHED = {
		code: "STRAVA_DAILY_QUOTA_REACHED",
		create: (usage: number, limit: number): ErrorSyncEvent => {
			return new ErrorSyncEvent(ConnectorType.STRAVA, {
				code: ErrorSyncEvent.STRAVA_DAILY_QUOTA_REACHED.code,
				description: `The instant strava api calls have been reached for today: ${usage} calls performed for a limit of ${limit} per day. Please retry tomorrow.`,
				stacktrace: null
			});
		}
	};

	public static STRAVA_API_RESOURCE_NOT_FOUND = {
		code: "STRAVA_API_RESOURCE_NOT_FOUND",
		create: (url: string): ErrorSyncEvent => {
			return new ErrorSyncEvent(ConnectorType.STRAVA, {
				code: ErrorSyncEvent.STRAVA_API_RESOURCE_NOT_FOUND.code,
				description: `Resource not found at url: '${url}'`,
				stacktrace: null
			});
		}
	};

	public static STRAVA_API_TIMEOUT = {
		code: "STRAVA_API_TIMEOUT",
		create: (url: string): ErrorSyncEvent => {
			return new ErrorSyncEvent(ConnectorType.STRAVA, {
				code: ErrorSyncEvent.STRAVA_API_TIMEOUT.code,
				description: `Request Timeout at url: '${url}'`,
				stacktrace: null
			});
		}
	};

	public code: string;
	public stacktrace: string;
	public activity?: BareActivityModel;

	constructor(fromConnectorType: ConnectorType, errorDetails: { code: string; description: string; stacktrace: string; },
				activity?: BareActivityModel) {
		super(SyncEventType.ERROR, fromConnectorType, errorDetails.description);
		this.code = (errorDetails.code) ? errorDetails.code : null;
		this.stacktrace = (errorDetails.stacktrace) ? errorDetails.stacktrace : null;
		this.activity = (activity) ? activity : null;
	}
}
