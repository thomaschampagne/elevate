import { Inject, Injectable, OnDestroy } from "@angular/core";
import { SyncService } from "../sync.service";
import { VERSIONS_PROVIDER, VersionsProvider } from "../../versions/versions-provider.interface";
import { AthleteService } from "../../athlete/athlete.service";
import { UserSettingsService } from "../../user-settings/user-settings.service";
import { LoggerService } from "../../logging/logger.service";
import { Subject, Subscription } from "rxjs";
import {
	ActivitySyncEvent,
	CompleteSyncEvent,
	ConnectorType,
	ErrorSyncEvent,
	FileSystemConnectorInfo,
	StravaConnectorInfo,
	SyncEvent,
	SyncEventType
} from "@elevate/shared/sync";
import { IpcMessagesReceiver } from "../../../../desktop/ipc-messages/ipc-messages-receiver.service";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { StravaConnectorInfoService } from "../../strava-connector-info/strava-connector-info.service";
import { AthleteModel, CompressedStreamModel, SyncedActivityModel, UserSettings } from "@elevate/shared/models";
import { ActivityService } from "../../activity/activity.service";
import { ElevateException, SyncException } from "@elevate/shared/exceptions";
import * as _ from "lodash";
import { SyncState } from "../sync-state.enum";
import { DesktopDataStore } from "../../../data-store/impl/desktop-data-store.service";
import { DataStore } from "../../../data-store/data-store";
import * as moment from "moment";
import { ConnectorSyncDateTime } from "@elevate/shared/models/sync";
import { ConnectorSyncDateTimeDao } from "../../../dao/sync/connector-sync-date-time.dao";
import { DesktopDumpModel } from "../../../models/dumps/desktop-dump.model";
import { AppEventsService } from "../../external-updates/app-events-service";
import { StreamsService } from "../../streams/streams.service";
import { FileSystemConnectorInfoService } from "../../file-system-connector-info/file-system-connector-info.service";
import { IpcMessagesSender } from "../../../../desktop/ipc-messages/ipc-messages-sender.service";
import UserSettingsModel = UserSettings.UserSettingsModel;

// TODO Add sync gen session id as string baseConnector. Goal: more easy to debug sync session with start/stop actions?
// TODO Handle errors cases (continue or not the sync...)
// TODO Sync ribbon displayed on startup? Allow user to see the sync log view
/* TODO Handle connector priority?! Consider not syncing all connector
    but allow user to mark a connector as "Primary" which will be synced when starting the app.
	Also allow user to sync connector he wants manually on connectors page
 */

// TODO Forward toolbar sync button to Connectors
// TODO Test in a current sync is running on Service.currentConnector(setter)
// tslint:disable-next-line:max-line-length
// TODO Add unit add with try/catch on StravaConnector.prepareBareActivity() call ?! => 'bareActivity = this.prepareBareActivity(bareActivity);'
// TODO Strava dont give "calories" from "getStravaBareActivityModels" bare activities. Only "kilojoules"! We have to get calories...

@Injectable()
export class DesktopSyncService extends SyncService<ConnectorSyncDateTime[]> implements OnDestroy {
	/**
	 * Dump version threshold at which a "greater or equal" imported backup version is compatible with current code.
	 */
	public static readonly COMPATIBLE_DUMP_VERSION_THRESHOLD: string = "7.0.0-alpha.3";

	constructor(@Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
				public activityService: ActivityService,
				public streamsService: StreamsService,
				public athleteService: AthleteService,
				public userSettingsService: UserSettingsService,
				public ipcMessagesReceiver: IpcMessagesReceiver,
				public ipcMessagesSender: IpcMessagesSender,
				public stravaConnectorInfoService: StravaConnectorInfoService,
				public fileSystemConnectorInfoService: FileSystemConnectorInfoService,
				public logger: LoggerService,
				public connectorSyncDateTimeDao: ConnectorSyncDateTimeDao,
				public appEventsService: AppEventsService,
				@Inject(DataStore) public desktopDataStore: DesktopDataStore<void> /* Injected to create PouchDB dumps & load them */) {
		super(versionsProvider, activityService, streamsService, athleteService, userSettingsService, logger);
		this.syncSubscription = null;
		this.syncEvents$ = new Subject<SyncEvent>(); // Starting new sync // TODO ReplaySubject to get old values?! I think no
		this.currentConnectorType = null;
		this.activityUpsertDetected = false;
	}

	public syncEvents$: Subject<SyncEvent>;
	public syncSubscription: Subscription;
	public currentConnectorType: ConnectorType;
	public activityUpsertDetected: boolean;

	public static transformErrorToSyncException(error: Error | Error[] | string | string[]): SyncException {

		if ((<any> error).name === SyncException.name) {
			return <SyncException> error;
		} else if ((<any> error).name === Error.name) {
			return SyncException.fromError(<Error> error);
		} else if (_.isString(error)) {
			return new SyncException(error);
		} else {
			return new SyncException(JSON.stringify(error));
		}
	}

	public static niceConnectorPrint(fromConnectorType: ConnectorType): string {
		return _.startCase(_.replace(fromConnectorType.toString().toLowerCase(), "_", " "));
	}

	/**
	 *
	 * @param fastSync
	 * @param forceSync
	 * @param connectorType
	 * @return Subject<SyncEvent>
	 */
	public sync(fastSync: boolean = null, forceSync: boolean = null, connectorType: ConnectorType = null): Promise<void> {

		if (!connectorType) {
			throw new SyncException("ConnectorType param must be given");
		}

		this.currentConnectorType = connectorType;

		this.ipcMessagesReceiver.listen();

		const promisedDataToSync: Promise<any>[] = [
			this.athleteService.fetch(),
			this.userSettingsService.fetch(),
			(fastSync) ? this.getConnectorSyncDateTime() : Promise.resolve(null)
		];

		if (this.currentConnectorType === ConnectorType.STRAVA) {
			promisedDataToSync.push(this.stravaConnectorInfoService.fetch());
		} else if (this.currentConnectorType === ConnectorType.FILE_SYSTEM) {
			promisedDataToSync.push(Promise.resolve(this.fileSystemConnectorInfoService.fetch()));
		} else {
			const errorMessage = "Unknown connector type to sync";
			this.logger.error(errorMessage);
			throw new SyncException(errorMessage);
		}

		if (this.syncSubscription) {
			this.syncSubscription.unsubscribe();
		}

		// Subscribe for sync events
		this.syncSubscription = this.ipcMessagesReceiver.syncEvents$.subscribe((syncEvent: SyncEvent) => {
			this.handleSyncEvents(this.syncEvents$, syncEvent);
		});

		return Promise.all(promisedDataToSync).then(result => {

			const athleteModel: AthleteModel = <AthleteModel> result[0];
			const userSettingsModel: UserSettingsModel = <UserSettingsModel> result[1];
			const allConnectorsSyncDateTime: ConnectorSyncDateTime[] = <ConnectorSyncDateTime[]> result[2];

			let startSyncMessage: FlaggedIpcMessage;

			const currentConnectorSyncDateTime = (allConnectorsSyncDateTime)
				? _.find(allConnectorsSyncDateTime, {connectorType: this.currentConnectorType}) : null;

			if (this.currentConnectorType === ConnectorType.STRAVA) {

				const stravaConnectorInfo: StravaConnectorInfo = <StravaConnectorInfo> result[3];

				// Create message to start sync on connector!
				startSyncMessage = new FlaggedIpcMessage(MessageFlag.START_SYNC, ConnectorType.STRAVA, currentConnectorSyncDateTime,
					stravaConnectorInfo, athleteModel, userSettingsModel);

			} else if (this.currentConnectorType === ConnectorType.FILE_SYSTEM) {

				const fileSystemConnectorInfo: FileSystemConnectorInfo = <FileSystemConnectorInfo> result[3];
				startSyncMessage = new FlaggedIpcMessage(MessageFlag.START_SYNC, ConnectorType.FILE_SYSTEM, currentConnectorSyncDateTime,
					fileSystemConnectorInfo, athleteModel, userSettingsModel);
			}

			// Trigger sync start
			return this.ipcMessagesSender.send<string>(startSyncMessage).then((response: string) => {
				this.logger.info("Message received by ipcMain. Response:", response);
				return Promise.resolve();
			}, error => {
				// e.g. Impossible to start a new sync. Another sync is already running on connector ...
				this.logger.error(error);
				return Promise.reject(error);
			});
		});
	}

	public handleSyncEvents(syncEvents$: Subject<SyncEvent>, syncEvent: SyncEvent): void {

		switch (syncEvent.type) {

			case SyncEventType.STARTED:
				this.resetActivityTrackingUpsert();
				syncEvents$.next(syncEvent); // Forward for upward UI use.
				this.logger.info(syncEvent);
				break;

			case SyncEventType.ACTIVITY:
				this.handleActivityUpsert(syncEvents$, <ActivitySyncEvent> syncEvent);
				break;

			case SyncEventType.STOPPED:
				this.resetActivityTrackingUpsert();
				syncEvents$.next(syncEvent); // Forward for upward UI use.
				this.logger.info(syncEvent);
				break;

			case SyncEventType.GENERIC:
				syncEvents$.next(syncEvent); // Forward for upward UI use.
				this.logger.debug(syncEvent);
				break;

			case SyncEventType.STRAVA_CREDENTIALS_UPDATE:
				syncEvents$.next(syncEvent); // Forward for upward UI use.
				this.logger.debug(syncEvent);
				break;

			case SyncEventType.COMPLETE:
				this.handleSyncCompleteEvents(syncEvents$, <CompleteSyncEvent> syncEvent);
				break;

			case SyncEventType.ERROR:
				this.handleErrorSyncEvents(syncEvents$, <ErrorSyncEvent> syncEvent);
				break;

			default:
				const errorMessage = "Unknown sync event type: " + JSON.stringify(syncEvent);
				this.logger.error(errorMessage);
				this.throwSyncError(new SyncException(errorMessage));
		}

	}

	public handleErrorSyncEvents(syncEvents$: Subject<SyncEvent>, errorSyncEvent: ErrorSyncEvent): void {

		this.resetActivityTrackingUpsert();

		this.logger.error(errorSyncEvent);

		if (!errorSyncEvent.code) {
			this.throwSyncError(new SyncException(errorSyncEvent.toString()));
			return;
		}

		if (errorSyncEvent.code === ErrorSyncEvent.SYNC_ERROR_COMPUTE.code
			|| errorSyncEvent.code === ErrorSyncEvent.UNHANDLED_ERROR_SYNC.code
			|| errorSyncEvent.code === ErrorSyncEvent.SYNC_ERROR_UPSERT_ACTIVITY_DATABASE.code
			|| errorSyncEvent.code === ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.code
			|| errorSyncEvent.code === ErrorSyncEvent.STRAVA_API_FORBIDDEN.code
			|| errorSyncEvent.code === ErrorSyncEvent.STRAVA_INSTANT_QUOTA_REACHED.code
			|| errorSyncEvent.code === ErrorSyncEvent.STRAVA_DAILY_QUOTA_REACHED.code
		) {

			syncEvents$.next(errorSyncEvent); // Forward for upward UI use.

			// Stop sync !!
			this.stop().catch(stopError => {
				this.throwSyncError(stopError); // Should be caught by Error Handler
			});

		} else if (errorSyncEvent.code === ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.code
			|| errorSyncEvent.code === ErrorSyncEvent.SYNC_ALREADY_STARTED.code
			|| errorSyncEvent.code === ErrorSyncEvent.STRAVA_API_RESOURCE_NOT_FOUND.code
			|| errorSyncEvent.code === ErrorSyncEvent.STRAVA_API_TIMEOUT.code
		) {
			syncEvents$.next(errorSyncEvent); // Forward for upward UI use.
		} else {
			const syncException = new SyncException("Unknown ErrorSyncEvent", errorSyncEvent);
			this.throwSyncError(syncException);
		}

	}

	public handleSyncCompleteEvents(syncEvents$: Subject<SyncEvent>, completeSyncEvent: CompleteSyncEvent): void {

		let syncState = null;
		this.getSyncState().then(userSyncState => {
			syncState = userSyncState;
			return this.connectorSyncDateTimeDao.getById(this.currentConnectorType);
		}).then((currentConnectorSyncDateTime: ConnectorSyncDateTime) => {

			if (currentConnectorSyncDateTime) {
				currentConnectorSyncDateTime.dateTime = Date.now();
			} else {
				currentConnectorSyncDateTime = new ConnectorSyncDateTime(this.currentConnectorType);
			}
			return this.upsertConnectorsSyncDateTimes([currentConnectorSyncDateTime]);
		}).then(() => {
			this.logger.info(completeSyncEvent);
			(syncState && syncState === SyncState.SYNCED) ? this.appEventsService.onSyncDone.next(this.activityUpsertDetected) : this.reloadApp();
			this.resetActivityTrackingUpsert();
			syncEvents$.next(completeSyncEvent); // Forward for upward UI use.
		});
	}

	public stop(): Promise<void> {

		this.logger.info(`Stop sync requested on connector ${this.currentConnectorType}`);

		return new Promise((resolve, reject) => {

			if (this.currentConnectorType === null) {
				reject();
				return;
			}

			const stopSyncMessage = new FlaggedIpcMessage(MessageFlag.STOP_SYNC, this.currentConnectorType);

			this.ipcMessagesSender.send<string>(stopSyncMessage).then((response: string) => {
				this.logger.info("Sync stopped. Response from main:", response);
				resolve();
			}, error => {
				const errorMessage =
					`Unable to stop sync on connector: ${this.currentConnectorType}. Connector replied with ${JSON.stringify(error)}`;
				this.logger.error(errorMessage);
				reject(errorMessage);
			});
		});
	}

	public handleActivityUpsert(syncEvents$: Subject<SyncEvent>, activitySyncEvent: ActivitySyncEvent): void {

		const errors = [];

		// Insert new activity or update an existing one to database
		this.logger.info(`Trying to upsert activity ${activitySyncEvent.isNew ? "new" : "existing"} "${activitySyncEvent.activity.name}" started on "${activitySyncEvent.activity.start_time}".`);

		this.activityService.put(activitySyncEvent.activity).then((syncedActivityModel: SyncedActivityModel) => {

			this.logger.info(`Activity "${syncedActivityModel.name}" saved`);
			this.trackActivityUpsert();

			const promiseHandlePutStreams: Promise<void | CompressedStreamModel> = (activitySyncEvent.compressedStream) ?
				this.streamsService.put(new CompressedStreamModel(`${activitySyncEvent.activity.id}`, activitySyncEvent.compressedStream))
				: Promise.resolve();

			promiseHandlePutStreams.then(() => {
				syncEvents$.next(activitySyncEvent); // Forward for upward UI use
			});

		}).catch((upsertError: Error) => {

			this.logger.error(upsertError);

			const stopSyncPromise = this.stop();

			syncEvents$.next(ErrorSyncEvent.SYNC_ERROR_UPSERT_ACTIVITY_DATABASE.create(ConnectorType.STRAVA,
				activitySyncEvent.activity, upsertError.stack));

			errors.push(upsertError);

			// Trigger sync stop
			return stopSyncPromise;

		}).then(() => {

			// Stopped properly, throw the upsert error
			if (errors.length > 0) {
				this.throwSyncError(errors); // Should be caught by Error Handler
			}

		}, stopError => {
			this.logger.error(stopError);
			errors.push(stopError);
			this.throwSyncError(errors); // Should be caught by Error Handler
		});

	}

	public throwSyncError(error: Error | Error[] | string | string[]): void {

		if (_.isArray(error)) {

			const syncExceptions = [];
			_.forEach(error, err => {
				const syncException = DesktopSyncService.transformErrorToSyncException(<any> err);
				syncExceptions.push(syncException);
			});

			throw syncExceptions;

		} else {
			throw DesktopSyncService.transformErrorToSyncException(<Error | Error[] | string | string[]> error);
		}

	}

	public export(): Promise<{ filename: string; size: number }> {
		return this.desktopDataStore.createDump().then(blob => {
			return this.versionsProvider.getPackageVersion().then(appVersion => {
				const gzippedFilename = moment().format("Y.MM.DD-H.mm") + "_v" + appVersion + ".elevate";
				this.saveAs(blob, gzippedFilename);
				return Promise.resolve({filename: gzippedFilename, size: blob.size});
			});
		});
	}

	public import(desktopDumpModel: DesktopDumpModel): Promise<void> {
		return this.isDumpCompatible(desktopDumpModel.version, this.getCompatibleBackupVersionThreshold()).then(() => {
			return this.desktopDataStore.loadDump(desktopDumpModel);
		});
	}

	public getCompatibleBackupVersionThreshold(): string {
		return DesktopSyncService.COMPATIBLE_DUMP_VERSION_THRESHOLD;
	}

	public getSyncState(): Promise<SyncState> {

		return Promise.all([

			this.getSyncDateTime(),
			this.activityService.fetch()

		]).then((result: Object[]) => {

			const connectorSyncDateTimes: ConnectorSyncDateTime[] = result[0] as ConnectorSyncDateTime[];
			const syncedActivityModels: SyncedActivityModel[] = result[1] as SyncedActivityModel[];

			const hasASyncDateTime: boolean = (connectorSyncDateTimes.length > 0);
			const hasSyncedActivityModels: boolean = !_.isEmpty(syncedActivityModels);

			let syncState: SyncState = null;
			if (!hasASyncDateTime && !hasSyncedActivityModels) {
				syncState = SyncState.NOT_SYNCED;
			} else if (!hasASyncDateTime && hasSyncedActivityModels) {
				syncState = SyncState.PARTIALLY_SYNCED;
			} else {
				syncState = SyncState.SYNCED;
			}

			return Promise.resolve(syncState);
		});

	}

	public getMostRecentSyncedConnector(): Promise<ConnectorSyncDateTime> {
		return this.getConnectorSyncDateTime().then((connectorSyncDateTimes: ConnectorSyncDateTime[]) => {
			const connectorSyncDateTime = _.last(_.sortBy(connectorSyncDateTimes, "dateTime"));
			return Promise.resolve(connectorSyncDateTime);
		});
	}

	public getSyncDateTimeByConnectorType(connectorType: ConnectorType): Promise<ConnectorSyncDateTime> {
		return <Promise<ConnectorSyncDateTime>> this.connectorSyncDateTimeDao.getById(connectorType);
	}

	public getConnectorSyncDateTime(): Promise<ConnectorSyncDateTime[]> {
		return this.getSyncDateTime();
	}

	public getSyncDateTime(): Promise<ConnectorSyncDateTime[]> {
		return <Promise<ConnectorSyncDateTime[]>> this.connectorSyncDateTimeDao.fetch();
	}

	public upsertConnectorsSyncDateTimes(connectorSyncDateTimes: ConnectorSyncDateTime[]): Promise<ConnectorSyncDateTime[]> {

		if (!_.isArray(connectorSyncDateTimes)) {
			throw new Error("connectorSyncDateTimes param must be an array");
		}

		const putPromises = [];
		_.forEach(connectorSyncDateTimes, (connectorSyncDateTime: ConnectorSyncDateTime) => {
			putPromises.push(this.connectorSyncDateTimeDao.put(connectorSyncDateTime));
		});

		return Promise.all(putPromises).then(() => {
			return <Promise<ConnectorSyncDateTime[]>> this.connectorSyncDateTimeDao.fetch();
		});
	}

	public saveSyncDateTime(connectorSyncDateTimes: ConnectorSyncDateTime[]): Promise<ConnectorSyncDateTime[]> {
		throw new ElevateException("Please use upsertSyncDateTimes() method when using DesktopSyncService");
	}

	public clearSyncTime(): Promise<void> {
		return this.connectorSyncDateTimeDao.clear();
	}

	public trackActivityUpsert(): void {
		this.activityUpsertDetected = true;
	}

	public resetActivityTrackingUpsert(): void {
		this.activityUpsertDetected = false;
	}

	public reloadApp(): void {
		window.location.reload();
	}

	public ngOnDestroy(): void {
		if (this.syncSubscription) {
			this.syncSubscription.unsubscribe();
		}
	}
}
