import { DataStore } from "../data-store";
import Loki from "lokijs";
import LokiIndexedAdapter from "lokijs/src/loki-indexed-adapter";
import { DesktopDumpModel } from "../../models/dumps/desktop-dump.model";
import { LoggerService } from "../../services/logging/logger.service";
import { Injectable } from "@angular/core";
import { Gzip } from "@elevate/shared/tools";
import { AppUsageDetails } from "../../models/app-usage-details.model";
import { AppUsage } from "../../models/app-usage.model";

@Injectable()
export class DesktopDataStore<T extends {}> extends DataStore<T> {
  constructor(protected readonly logger: LoggerService) {
    super(logger);
  }

  public getPersistenceAdapter(): LokiPersistenceAdapter {
    const idbAdapter = new LokiIndexedAdapter();
    return new Loki.LokiPartitioningAdapter(idbAdapter, { paging: true });
  }

  public createDump(versionFlag: string): Promise<Blob> {
    const dump: LokiConstructor = JSON.parse(this.db.serialize());

    const cleanedDump = dump.collections.map(collection => {
      collection.data = collection.data.map(doc => DataStore.cleanDbObject(doc));
      return collection;
    });

    const databaseSerialized = JSON.stringify(cleanedDump);

    const desktopDumpModel: DesktopDumpModel = new DesktopDumpModel(versionFlag, Gzip.pack(databaseSerialized));

    const blob = new Blob([desktopDumpModel.serialize()], { type: "application/gzip" });

    return Promise.resolve(blob);
  }

  public loadDump(dump: DesktopDumpModel): Promise<void> {
    this.db.collections.forEach(collection => {
      collection.clear({ removeIndices: true });
    });

    return this.saveDataStore().then(() => {
      const inflatedDatabases = Gzip.unpack(dump.gzipData);
      const dumpedCollections: Collection<any>[] = JSON.parse(inflatedDatabases);

      dumpedCollections.forEach(collectionDump => {
        const collection = this.db.getCollection(collectionDump.name) || this.db.addCollection(collectionDump.name);
        collection.insert(collectionDump.data);
      });

      return this.saveDataStore();
    });
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
