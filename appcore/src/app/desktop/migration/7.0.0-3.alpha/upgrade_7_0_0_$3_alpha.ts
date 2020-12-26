import { DesktopMigration } from "../desktop-migrations.model";

export class Upgrade_7_0_0_$3_alpha extends DesktopMigration {
  public version = "7.0.0-3.alpha";

  public description =
    "Add athlete first name, last name, birth year & sports properties; Rename FILE_SYSTEM connector to FILE enum value";

  public upgrade(db: LokiConstructor): Promise<void> {
    // Add athlete first name, last name, birth year & sports properties
    const athleteCollection = db.getCollection("athlete");

    if (athleteCollection) {
      const athlete = athleteCollection.findOne();
      if (athlete) {
        athlete.firstName = null;
        athlete.lastName = null;
        athlete.birthYear = null;
        athlete.practiceLevel = null;
        athlete.sports = [];
        athleteCollection.update(athlete);
      }
    }

    // Rename FILE_SYSTEM connector to FILE enum value
    const connectorSyncDateTimeCollection = db.getCollection("connectorSyncDateTime");
    if (connectorSyncDateTimeCollection) {
      const existingFileConnector = connectorSyncDateTimeCollection.findOne({ connectorType: "FILE_SYSTEM" });
      if (existingFileConnector) {
        existingFileConnector.connectorType = "FILE";
        connectorSyncDateTimeCollection.update(existingFileConnector);
      }
    }

    // Update activities with wrong sourceConnectorType type FILE_SYSTEM
    const syncedActivitiesCollection = db.getCollection("syncedActivities");
    if (syncedActivitiesCollection) {
      const existingActivities = syncedActivitiesCollection.find();
      if (existingActivities) {
        const toBeUpdatedActivities = existingActivities.filter(activity => {
          if (activity.sourceConnectorType === "FILE_SYSTEM") {
            activity.sourceConnectorType = "FILE";
            return activity;
          }
        });
        syncedActivitiesCollection.update(toBeUpdatedActivities);
      }
    }

    return this.saveDatabase(db);
  }
}
