import { Inject, Injectable } from "@angular/core";
import { DataStore } from "../data-store";
import { LoggerService } from "../../services/logging/logger.service";
import _ from "lodash";
import { CollectionDef } from "../collection-def";
import { AppUsageDetails } from "../../models/app-usage-details.model";
import { AppUsage } from "../../models/app-usage.model";

class LokiChromeAdapter implements LokiPersistenceAdapter {
  public loadDatabase(dbname: string, callback: (data: any) => void): void {
    this.chromeLocalStorageArea().get(null, chromeDatabase => {
      const error = this.getLastError();

      if (error) {
        throw new Error(error.message);
      } else {
        const collectionsNames = _.keys(chromeDatabase);

        const database: Partial<LokiConstructor> = {
          collections: []
        };

        collectionsNames.forEach(colName => {
          const collection: Collection<any> = chromeDatabase[colName];
          database.collections.push(collection);
        });

        callback(database);
      }
    });
  }

  public saveDatabase(dbname: string, dbString: string | Uint8Array, callback: (err?: Error | null) => void): void {
    const database: LokiConstructor = JSON.parse(dbString as string);

    const chromeDatabase = {};
    database.collections.forEach(collection => {
      chromeDatabase[collection.name] = collection;
    });

    this.chromeLocalStorageArea().set(chromeDatabase, () => {
      const error = this.getLastError();
      error ? callback(new Error(error.message)) : callback();
    });
  }

  public deleteDatabase(dbname: string, callback: (err?: Error | null) => void): void {
    this.chromeLocalStorageArea().clear(callback);
  }

  public chromeLocalStorageArea(): chrome.storage.LocalStorageArea {
    return chrome.storage.local;
  }

  public getLastError(): chrome.runtime.LastError {
    return chrome.runtime.lastError;
  }
}

@Injectable()
export class ExtensionDataStore<T extends {}> extends DataStore<T> {
  constructor(@Inject(LoggerService) protected readonly logger: LoggerService) {
    super(logger);
  }

  public resolveCollection(collectionDef: CollectionDef<T>): Collection<T> {
    const collection = super.resolveCollection(collectionDef);
    collection.flushChanges(); // Flush any changes on collection after retrieve collection
    return collection;
  }

  public getPersistenceAdapter(): LokiPersistenceAdapter {
    return new LokiChromeAdapter();
  }

  public getAppUsageDetails(): Promise<AppUsageDetails> {
    return new Promise<AppUsageDetails>(resolve => {
      chrome.storage.local.getBytesInUse((bytesInUse: number) => {
        const appUsage = new AppUsage(bytesInUse, chrome.storage.local.QUOTA_BYTES);
        const megaBytesInUse = appUsage.bytesInUse / (1024 * 1024);
        const percentUsage = (appUsage.bytesInUse / appUsage.quotaBytes) * 100;
        const appUsageDetails: AppUsageDetails = new AppUsageDetails(appUsage, megaBytesInUse, percentUsage);
        resolve(appUsageDetails);
      });
    });
  }
}
