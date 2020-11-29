import { DesktopMigration } from "../desktop-migrations.model";

export class Upgrade_7_0_0_$3_alpha extends DesktopMigration {
  public version = "7.0.0-3.alpha";

  public description =
    "Add athlete first name, last name, birth year & sports properties; Rename FILE_SYSTEM connector to FILE enum value";

  public upgrade(db: LokiConstructor): Promise<void> {
    // Add athlete first name, last name, birth year & sports properties
    const athleteCollection = db.getCollection("athlete");

    if (athleteCollection) {
      const athleteSaved = athleteCollection.findOne();

      if (athleteSaved) {
        athleteSaved.firstName = null;
        athleteSaved.lastName = null;
        athleteSaved.birthYear = null;
        athleteSaved.practiceLevel = null;
        athleteSaved.sports = [];
      }
    }

    // Rename FILE_SYSTEM connector to FILE enum value
    const connectorSyncDateTimeCollection = db.getCollection("connectorSyncDateTime");
    const existingFileConnector = connectorSyncDateTimeCollection.findOne({ connectorType: "FILE_SYSTEM" });
    if (existingFileConnector) {
      existingFileConnector.connectorType = "FILE";
      connectorSyncDateTimeCollection.update(existingFileConnector);
    }

    return this.saveDatabase(db);
  }
}
