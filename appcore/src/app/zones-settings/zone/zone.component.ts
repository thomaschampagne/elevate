import { Component, Inject, Input, OnDestroy, OnInit } from "@angular/core";
import { ZonesService } from "../shared/zones.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import _ from "lodash";
import { ZoneChangeOrderModel } from "../shared/zone-change-order.model";
import { ZoneChangeWhisperModel } from "../shared/zone-change-whisper.model";
import { ZoneChangeTypeModel } from "./zone-change-type.model";
import { ZoneDefinitionModel } from "../../shared/models/zone-definition.model";
import { Subscription } from "rxjs";
import { ZoneModel } from "@elevate/shared/models";
import { LoggerService } from "../../shared/services/logging/logger.service";

@Component({
  selector: "app-zone",
  templateUrl: "./zone.component.html",
  styleUrls: ["./zone.component.scss"]
})
export class ZoneComponent implements OnInit, OnDestroy {
  private static readonly WHITE_LISTED_KEYS = ["ArrowUp", "ArrowDown", "Shift", "Tab"];

  @Input()
  public zone: ZoneModel;

  @Input()
  public zoneId: number;

  @Input()
  public zoneFrom: number;

  @Input()
  public zoneTo: number;

  @Input()
  public prevZoneFrom: number;

  @Input()
  public nextZoneTo: number;

  @Input()
  public isFirstZone: boolean;

  @Input()
  public isLastZone: boolean;

  @Input()
  public currentZones: ZoneModel[];

  @Input()
  public zoneDefinition: ZoneDefinitionModel;

  public zoneChangeOrderSubscription: Subscription;

  public stepUpdatesSubscription: Subscription;

  constructor(
    @Inject(ZonesService) private readonly zonesService: ZonesService,
    @Inject(MatSnackBar) private readonly snackBar: MatSnackBar,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {}

  public ngOnInit(): void {
    this.zoneChangeOrderSubscription = this.zonesService.zoneChangeOrderUpdates.subscribe(
      (change: ZoneChangeOrderModel) => {
        const isChangeOrderForMe = !_.isNull(change) && this.zoneId === change.destinationId;

        if (isChangeOrderForMe) {
          this.applyChangeOrder(change);
        }
      },
      error => {
        this.logger.error(error);
      },
      () => {
        this.logger.info("InstructionListener complete");
      }
    );

    this.stepUpdatesSubscription = this.zonesService.stepUpdates.subscribe((step: number) => {
      this.zoneDefinition.step = step;
    });
  }

  public onZoneChange(changeType: ZoneChangeTypeModel): void {
    this.whisperZoneChange(changeType);
  }

  /**
   * Whisper a ZoneChangeWhisperModel to <ZoneService>
   */
  public whisperZoneChange(changeType: ZoneChangeTypeModel): void {
    if (changeType.from && changeType.to) {
      // Skip notify zone service on first component display
      return;
    }

    if (changeType.from || changeType.to) {
      const zoneChangeWhisper: ZoneChangeWhisperModel = {
        sourceId: this.zoneId,
        from: false,
        to: false,
        value: null
      };

      if (changeType.from) {
        zoneChangeWhisper.from = true;
        zoneChangeWhisper.value = this.zone.from;
      } else if (changeType.to) {
        zoneChangeWhisper.to = true;
        zoneChangeWhisper.value = this.zone.to;
      }

      this.zonesService.whisperZoneChange(zoneChangeWhisper);
    }
  }

  public onRemoveZoneAtIndex(zoneId: number): void {
    this.zonesService.removeZoneAtIndex(zoneId).then(
      message => this.popSnack(message),
      error => this.popSnack(error)
    );
  }

  public ngOnDestroy(): void {
    this.zoneChangeOrderSubscription.unsubscribe();
    this.stepUpdatesSubscription.unsubscribe();
  }

  public onFilterKeys(event: KeyboardEvent): void {
    if (_.indexOf(ZoneComponent.WHITE_LISTED_KEYS, event.key) === -1) {
      event.preventDefault();
    }
  }

  private applyChangeOrder(instruction: ZoneChangeOrderModel): void {
    if (instruction.from) {
      this.zone.from = instruction.value;
    }
    if (instruction.to) {
      this.zone.to = instruction.value;
    }
  }

  private popSnack(message: string): void {
    this.snackBar.open(message, "Close", { duration: 2500 });
  }
}
