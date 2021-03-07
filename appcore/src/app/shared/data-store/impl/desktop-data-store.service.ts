import { DataStore } from "../data-store";
import Loki from "lokijs";
import LokiIndexedAdapter from "lokijs/src/loki-indexed-adapter";
import { LoggerService } from "../../services/logging/logger.service";
import { Inject, Injectable } from "@angular/core";
import { AppUsageDetails } from "../../models/app-usage-details.model";
import { AppUsage } from "../../models/app-usage.model";
import { IPC_TUNNEL_SERVICE } from "../../../desktop/ipc/ipc-tunnel-service.token";
import { Channel, IpcChannelSub, IpcMessage, IpcTunnelService } from "@elevate/shared/electron";
import _ from "lodash";
import { BackupChunk, BackupEvent, BackupMetadata, RestoreEvent } from "@elevate/shared/models";
import moment from "moment";
import { Subject } from "rxjs";

@Injectable()
export class DesktopDataStore<T extends {}> extends DataStore<T> {
  public static readonly BACKUP_EXT: string = "elv";
  private static readonly BACKUP_CHUNK_SIZE: number = 10;

  private static formatBackupFilename(appVersion: string): string {
    return `${moment().format("Y.MM.DD-H.mm")}-v${appVersion}.${DesktopDataStore.BACKUP_EXT}`;
  }

  constructor(
    @Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService,
    @Inject(LoggerService) protected readonly logger: LoggerService
  ) {
    super(logger);
  }

  public getPersistenceAdapter(): LokiPersistenceAdapter {
    const idbAdapter = new LokiIndexedAdapter();
    return new Loki.LokiPartitioningAdapter(idbAdapter, { paging: true });
  }

  public backup(outputDirectory: string, appVersion: string): Subject<BackupEvent> {
    const backupStartTime = performance.now();
    const targetArchivePath = `${outputDirectory}/${DesktopDataStore.formatBackupFilename(appVersion)}`;

    // Backup collection with data only
    let savedDocs = 0;
    let totalDocs = 0;
    const collections = this.db.collections.filter(collection => {
      const docsInCol = collection.data.length;
      totalDocs += docsInCol;
      return docsInCol > 0;
    });

    const backupProgress$ = new Subject<BackupEvent>();

    this.logger.debug(
      `Start backup of ${totalDocs} documents across ${collections.length} non-empty collections. Destination file "${targetArchivePath}"`
    );

    // Send first progress event
    backupProgress$.next({ file: null, savedDocs: 0, totalDocs: totalDocs });

    // Trigger backup init. End is detected when all objects have been written and acknowledged by backup file
    // TODO Use intermediate sender?
    this.ipcTunnelService.send<IpcMessage, string>(new IpcMessage(Channel.backupInit, targetArchivePath)).then(() => {
      // Append metadata header as first object of the file
      const metadata: BackupMetadata = { version: appVersion, totalDocs: totalDocs };
      const writeMetadataPromise = this.writeObject(metadata, false);

      // Once metadata header wrote, start sending collection using chunks
      writeMetadataPromise.then(() => {
        // Reduce each collection
        collections
          .reduce((prevCollectionPromise: Promise<void>, collection: Collection<any>, colIndex: number) => {
            return prevCollectionPromise.then(() => {
              // Cut collection in chunks
              const chunks = _.chunk(collection.data, DesktopDataStore.BACKUP_CHUNK_SIZE);

              this.logger.debug(`Backup "${collection.name}" collection using ${chunks.length} chunk(s)`);

              // Reduce each chunk and send them in tunnel for backup
              return chunks.reduce((previousPromise: Promise<void>, chunk: LokiObj[], chunkIndex: number) => {
                return previousPromise.then(() => {
                  const isLastChunk = collections.length === colIndex + 1 && chunks.length === chunkIndex + 1;

                  // Cleanup chunk before sending
                  chunk = chunk.map(doc => DataStore.cleanDbObject(_.cloneDeep(doc)));

                  // Create the chunk with the target collection to be used on restore
                  const bkpChunk: BackupChunk = { colName: collection.name, chk: chunk };

                  // Send chuck and notify UI!
                  return this.sendChunk(bkpChunk, isLastChunk).then(() => {
                    // When chuck saved update saved docs count
                    savedDocs += bkpChunk.chk.length;

                    // And send backup progress event
                    backupProgress$.next({
                      file: null,
                      savedDocs: savedDocs,
                      totalDocs: totalDocs
                    });
                    return Promise.resolve();
                  });
                });
              }, Promise.resolve());
            });
          }, Promise.resolve())
          .then(() => {
            this.logger.debug(`${totalDocs} documents have been sent and acknowledged for backup`);

            // Backup is finished. Send last event and complete
            backupProgress$.next({
              file: targetArchivePath,
              savedDocs: savedDocs,
              totalDocs: totalDocs
            });
            backupProgress$.complete();

            this.logger.debug(`Backup done in ${Math.round(performance.now() - backupStartTime)}ms`);
          });
      });
    });

    return backupProgress$;
  }

  public sendChunk(bkpChunk: BackupChunk, isLastChunk: boolean): Promise<void> {
    return this.writeObject(bkpChunk, isLastChunk);
  }

  public writeObject(obj: object, isLastObj: boolean): Promise<void> {
    const ipcMessage = new IpcMessage(Channel.backupWriteObj, obj, isLastObj);
    return this.ipcTunnelService.send<IpcMessage, void>(ipcMessage); // TODO Use intermediate sender?
  }

  public restore(path: string): Subject<RestoreEvent> {
    const stopReading = (errorMessage: string, subscription: IpcChannelSub): Promise<never> => {
      subscription.unsubscribe();
      restoreProgress$.error(errorMessage);
      return Promise.reject(errorMessage);
    };

    const restoreStartTime = Date.now();

    const restoreProgress$ = new Subject<RestoreEvent>();

    let metadata: BackupMetadata = null;
    let wipedCollections = false;

    // Track the number of documents restored
    let restoredDocs = 0;

    // TODO Use intermediate listener?
    const channelSubscription = this.ipcTunnelService.on<[BackupMetadata | BackupChunk, number, Error, boolean], void>(
      Channel.restoreReadObj,
      (payload: [BackupMetadata | BackupChunk, number, Error, boolean]) => {
        const [obj, index, err, ended] = payload;

        // Error from the reader?
        if (err) {
          // Notify UI from error
          restoreProgress$.error(err);

          // Acknowledge the reader we well handled the error
          return Promise.resolve();
        }

        // Try to read backup metadata
        if (index === 0) {
          // Verify backup metadata consistency
          const potentialMetadata = obj as BackupMetadata;

          if (potentialMetadata.version && potentialMetadata.totalDocs) {
            // Store header
            metadata = potentialMetadata;

            // Check if backup is compatible with current version installed
            if (!DataStore.isBackupCompatible(metadata.version)) {
              const errorMessage = `Imported backup version ${metadata.version} is not compatible with current installed version.`;
              return stopReading(errorMessage, channelSubscription);
            }
          } else {
            const errorMessage = "Unable to read backup meta data";
            return stopReading(errorMessage, channelSubscription);
          }

          this.logger.debug("Found metadata", metadata);

          // Inform reader to send us next object
          return Promise.resolve();
        }

        // Is read end event from reader?
        if (ended) {
          // Acknowledge the reader we well handled the reading end
          return Promise.resolve();
        }

        // If we are here then we got header metadata (= first object has been received and it was metadata)
        const backupChunk: BackupChunk = obj as BackupChunk;

        // We should have backup chunk every time. If not, stop reading and exit!
        if (!backupChunk) {
          const errorMessage = "Expected a backup chunk but got nothing";
          return stopReading(errorMessage, channelSubscription);
        }

        // Wipe all collections if not done before restoring anything
        if (!wipedCollections) {
          this.db.collections.forEach(col => col.clear({ removeIndices: true }));
          wipedCollections = true;
        }

        // Now start reading chunks one by one and insert them in proper collections
        const collection = this.db.getCollection(backupChunk.colName) || this.db.addCollection(backupChunk.colName);
        const insertedDocs = collection.insert(backupChunk.chk);

        if (insertedDocs) {
          // Count inserted docs on current chunk. If no length, then it's a single doc
          const insertedDocsCount = insertedDocs.length || 1;

          // Accumulate insert docs
          restoredDocs += insertedDocsCount;

          // And notify of the progress
          restoreProgress$.next({ restoredDocs: restoredDocs, totalDocs: metadata.totalDocs } as RestoreEvent);

          this.logger.info(`${insertedDocsCount} doc(s) restored in "${backupChunk.colName}" collection.`);

          // Do we restored all the docs?
          if (restoredDocs === metadata.totalDocs) {
            // Yes restore is complete: all docs inserted.
            // Save data store and complete :)
            return this.saveDataStore().then(() => {
              restoreProgress$.complete();
              channelSubscription.unsubscribe();
              this.logger.info(`Restored in ${Math.round(Date.now() - restoreStartTime)}ms`);
              return Promise.resolve();
            });
          }
        }

        // Inform to read next object
        return Promise.resolve();
      }
    );

    // Trigger restore init
    this.ipcTunnelService.send<IpcMessage, string>(new IpcMessage(Channel.restoreInit, path)).then(() => {
      this.logger.debug("Restore initiated");
    });

    return restoreProgress$;
  }

  public getAppUsageDetails(): Promise<AppUsageDetails> {
    return navigator.storage.estimate().then((storageEstimate: StorageEstimate) => {
      const appUsage = new AppUsage(new Blob([this.db.serialize()]).size, storageEstimate.quota);
      const megaBytesInUse = appUsage.bytesInUse / (1024 * 1024);
      const percentUsage = (appUsage.bytesInUse / appUsage.quotaBytes) * 100;
      const appUsageDetails = new AppUsageDetails(appUsage, megaBytesInUse, percentUsage);
      return Promise.resolve(appUsageDetails);
    });
  }
}
