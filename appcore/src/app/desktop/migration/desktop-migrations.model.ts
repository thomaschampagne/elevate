export abstract class DesktopMigration {
  abstract version: string;
  abstract description: string;

  constructor() {}

  public abstract upgrade(db: LokiConstructor): Promise<void>;
}
