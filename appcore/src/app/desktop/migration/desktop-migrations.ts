export abstract class DesktopMigration {
  abstract version: string;
  abstract description: string;

  constructor() {}

  public abstract upgrade(db: LokiConstructor): Promise<void>;
}

class SampleMigration extends DesktopMigration {
  public version = "7.0.0-7.alpha";

  public description = "Explain migration purpose here";

  public upgrade(db: LokiConstructor): Promise<void> {
    // ....
    return Promise.resolve();
  }
}

export const DESKTOP_MIGRATIONS: DesktopMigration[] = [new SampleMigration()];
