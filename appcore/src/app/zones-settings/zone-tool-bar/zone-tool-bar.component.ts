import { Component, EventEmitter, Inject, Input, OnInit, Output } from "@angular/core";
import { ZonesService } from "../shared/zones.service";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ZonesImportExportDialogComponent } from "../zones-import-export-dialog/zones-import-export-dialog.component";
import { ConfirmDialogComponent } from "../../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { ConfirmDialogDataModel } from "../../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ZoneImportExportDataModel } from "../zones-import-export-dialog/zone-import-export-data.model";
import { Mode } from "../zones-import-export-dialog/mode.enum";
import { ZoneDefinitionModel } from "../../shared/models/zone-definition.model";
import { LoggerService } from "../../shared/services/logging/logger.service";

@Component({
  selector: "app-zone-tool-bar",
  templateUrl: "./zone-tool-bar.component.html",
  styleUrls: ["./zone-tool-bar.component.scss"]
})
export class ZoneToolBarComponent implements OnInit {
  @Input()
  public currentZonesLength: number;

  @Input()
  public zoneDefinitions: ZoneDefinitionModel[];

  @Input()
  public zoneDefinitionSelected: ZoneDefinitionModel;

  @Output()
  public zoneDefinitionSelectedChange: EventEmitter<ZoneDefinitionModel> = new EventEmitter<ZoneDefinitionModel>();

  constructor(
    @Inject(ZonesService) public readonly zonesService: ZonesService,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(MatSnackBar) private readonly snackBar: MatSnackBar,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {}

  public ngOnInit(): void {}

  public onZoneDefinitionSelected(): void {
    // Notify parent ZonesSettings component of new zone definition selected
    this.zoneDefinitionSelectedChange.emit(this.zoneDefinitionSelected);
  }

  public onStepChange(): void {
    this.zonesService.notifyStepChange(this.zoneDefinitionSelected.step);
  }

  public onAddLastZone(): void {
    this.zonesService.addLastZone().then(
      message => this.popSnack(message),
      error => {
        this.logger.warn(error);
        this.popSnack(error);
      }
    );
  }

  public onRemoveLastZone(): void {
    this.zonesService.removeLastZone().then(
      message => this.popSnack(message),
      error => {
        this.logger.warn(error);
        this.popSnack(error);
      }
    );
  }

  public onResetZonesToDefault(): void {
    const data: ConfirmDialogDataModel = {
      title: "Reset <" + this.zonesService.zoneDefinition.name + "> zones",
      content: "Are you sure? Previous data will be lost."
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        this.zonesService.resetZonesToDefault().then(
          () => {
            this.popSnack(this.zonesService.zoneDefinition.name + " zones have been set to default");
          },
          error => {
            this.logger.error(error);
            this.popSnack(error);
          }
        );
      }
      afterClosedSubscription.unsubscribe();
    });
  }

  public onImportZones() {
    const importExportData: ZoneImportExportDataModel = {
      zoneDefinition: this.zonesService.zoneDefinition,
      mode: Mode.IMPORT
    };

    this.dialog.open(ZonesImportExportDialogComponent, {
      minWidth: ZonesImportExportDialogComponent.MIN_WIDTH,
      maxWidth: ZonesImportExportDialogComponent.MAX_WIDTH,
      data: importExportData
    });
  }

  public onExportZones() {
    const importExportData: ZoneImportExportDataModel = {
      zoneDefinition: this.zonesService.zoneDefinition,
      zonesData: this.zonesService.currentZones,
      mode: Mode.EXPORT
    };

    this.dialog.open(ZonesImportExportDialogComponent, {
      minWidth: ZonesImportExportDialogComponent.MIN_WIDTH,
      maxWidth: ZonesImportExportDialogComponent.MAX_WIDTH,
      data: importExportData
    });
  }

  private popSnack(message: string): void {
    this.snackBar.open(message, "Close", { duration: 2500 });
  }
}
