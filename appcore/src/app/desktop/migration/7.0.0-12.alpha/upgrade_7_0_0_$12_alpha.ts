import { DesktopMigration } from "../desktop-migrations.model";
import { Injector } from "@angular/core";
import { ElectronService } from "../../electron/electron.service";
import { MatDialog } from "@angular/material/dialog";
import { AthleteModel } from "@elevate/shared/models";
import { AthleteService } from "../../../shared/services/athlete/athlete.service";
import { GotItDialogComponent } from "../../../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../../../shared/dialogs/got-it-dialog/got-it-dialog-data.model";

export class Upgrade_7_0_0_$12_alpha extends DesktopMigration {
  public version = "7.0.0-12.alpha";

  public description = "Switch indexeddb storage method";

  public requiresRecalculation = true;

  public upgrade(db: LokiConstructor, injector: Injector): Promise<void> {
    const electronService = injector.get(ElectronService);
    const dialog = injector.get(MatDialog);
    const athleteService = injector.get(AthleteService);

    return athleteService.fetch().then((athleteModel: AthleteModel) => {
      const matDialogRef = dialog.open(GotItDialogComponent, {
        data: {
          title: "It happens when it's alpha... App has to be reset!",
          content:
            "Copy your athlete settings backup string before reset (You'll import them back inside athlete settings)<br/><br/><input readonly class='clickable' style='width: 600px' type='text' value='" +
            btoa(JSON.stringify(athleteModel.datedAthleteSettings)) +
            "' onclick=\"this.select();document.execCommand('copy');alert('Copied in clipboard')\"/>"
        } as GotItDialogDataModel
      });

      return matDialogRef
        .afterClosed()
        .toPromise()
        .then(() => {
          electronService.resetApp();
        });
    });
  }
}
