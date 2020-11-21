import { DesktopMigration } from "../desktop-migrations.model";

export class Upgrade_7_0_0_$3_alpha extends DesktopMigration {
  public version = "7.0.0-3.alpha";

  public description = "Add athlete first name, last name, birth year & sports properties";

  public upgrade(db: LokiConstructor): Promise<void> {
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

    // ....
    return Promise.resolve();
  }
}
