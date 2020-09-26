import { DesktopMigration } from "../desktop-migrations.model";

export class Upgrade_7_0_0_$4_alpha extends DesktopMigration {
  public version = "7.0.0-4.alpha";

  public description = "Append defaultMapType property to user settings";

  public requiresRecalculation = true;

  public upgrade(db: LokiConstructor): Promise<void> {
    const userSettingsCollection = db.getCollection("userSettings");

    if (userSettingsCollection) {
      const userSettings = userSettingsCollection.findOne();
      if (userSettings) {
        userSettings.defaultMapType = "thunderforest-atlas";
        userSettingsCollection.update(userSettings);
      }
    }
    return this.saveDatabase(db);
  }
}
