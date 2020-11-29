export abstract class DesktopMigration {
  abstract version: string;
  abstract description: string;

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

  public abstract upgrade(db: LokiConstructor): Promise<void>;
}
