import { DesktopMigration } from "../desktop-migrations.model";
import { Injector } from "@angular/core";

export class Upgrade_7_0_0$beta_5 extends DesktopMigration {
  public version: string = "7.0.0-beta.5";

  public description: string = "Trigger recalculation for power/Hr new stats & settings lacks detection fix";

  public requiresRecalculation: boolean = true;

  public upgrade(db: LokiConstructor, injector: Injector): Promise<void> {
    return Promise.resolve();
  }
}
