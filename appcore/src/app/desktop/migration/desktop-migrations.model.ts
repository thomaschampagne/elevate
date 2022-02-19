import { Injector } from "@angular/core";

export abstract class DesktopMigration {
  abstract version: string;
  abstract description: string;
  abstract requiresRecalculation: boolean;

  constructor() {}

  protected saveDatabase(db: LokiConstructor): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      db.saveDatabase(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public abstract upgrade(db: LokiConstructor, injector: Injector): Promise<void>;
}
