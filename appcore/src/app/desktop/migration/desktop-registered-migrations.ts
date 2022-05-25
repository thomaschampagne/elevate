import { DesktopMigration } from "./desktop-migrations.model";
import { Upgrade_7_0_0$beta_3 } from "./upgrade_7_0_0-beta.3/upgrade_7_0_0-beta.3";
import { Upgrade_7_0_0$beta_5 } from "./upgrade_7_0_0-beta.5/upgrade_7_0_0-beta.5";

/**
 * Add desktop migrations inside LIST. The LIST is sorted from lowest to high versions
 */
export class DesktopRegisteredMigrations {
  public static readonly LIST: DesktopMigration[] = [
    new Upgrade_7_0_0$beta_3(), // To version 7.0.0-beta.3
    new Upgrade_7_0_0$beta_5() // To version 7.0.0-beta.5
    /* Next Upgrade Here */
  ];
}
