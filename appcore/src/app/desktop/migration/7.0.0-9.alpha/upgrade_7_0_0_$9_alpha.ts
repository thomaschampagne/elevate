import { DesktopMigration } from "../desktop-migrations.model";
import { Injector } from "@angular/core";

export class Upgrade_7_0_0_$9_alpha extends DesktopMigration {
  public version = "7.0.0-9.alpha";

  public description = "Switch from athlete birth year to full date";

  public requiresRecalculation = true;

  public upgrade(db: LokiConstructor, injector: Injector): Promise<void> {
    const athleteCollection = db.getCollection("athlete");

    if (athleteCollection) {
      const athlete = athleteCollection.findOne();
      if (athlete) {
        athlete.birthDate = athlete.birthYear ? new Date(`${athlete.birthYear}/01/01`) : null;
        delete athlete.birthYear;
        athleteCollection.update(athlete);
      }
    }
    return this.saveDatabase(db);
  }
}
