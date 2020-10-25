import { DataStore, DbEvent } from "../shared/data-store/data-store";
import { filter, take } from "rxjs/operators";
import { Inject } from "@angular/core";

export abstract class AppLoadService {
  protected constructor(@Inject(DataStore) protected readonly dataStore: DataStore<object>) {}

  public loadApp(): Promise<void> {
    return new Promise<void>(resolve => {
      // Listen for every database events from data store
      // Filter all by auto loaded database event
      // Take 1 AUTO_LOADED event => sufficient to load app
      this.dataStore.dbEvent$
        .pipe(
          filter(dbEvent => dbEvent === DbEvent.AUTO_LOADED),
          take(1)
        )
        .subscribe(() => {
          resolve();
        });
    });
  }
}
