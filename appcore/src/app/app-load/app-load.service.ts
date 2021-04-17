import { DataStore, DbEvent } from "../shared/data-store/data-store";
import { filter, take } from "rxjs/operators";
import { Inject } from "@angular/core";
import pDefer, { DeferredPromise } from "p-defer";

export abstract class AppLoadService {
  private dbLoadedPromise: DeferredPromise<void>;

  protected constructor(@Inject(DataStore) protected readonly dataStore: DataStore<object>) {
    this.dbLoadedPromise = pDefer();
  }

  public loadApp(): Promise<void> {
    // Listen for every database events from data store
    // Filter all by auto loaded database event
    // Take 1 LOADED event => sufficient to load app
    this.dataStore.dbEvent$
      .pipe(
        filter(dbEvent => dbEvent === DbEvent.LOADED),
        take(1)
      )
      .subscribe(
        () => {
          setTimeout(() => {
            this.dbLoadedPromise.resolve();
          });
        },
        error => {
          this.dbLoadedPromise.reject(error);
        }
      );

    return this.dbLoadedPromise.promise;
  }
}
