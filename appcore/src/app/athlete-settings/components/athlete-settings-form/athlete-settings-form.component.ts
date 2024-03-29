import _ from "lodash";
import { Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FitnessService } from "../../../fitness-trend/shared/services/fitness.service";
import { SwimFtpHelperComponent } from "./swim-ftp-helper/swim-ftp-helper.component";
import { AthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/athlete-settings.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { Constant } from "@elevate/shared/constants/constant";

@Component({
  selector: "app-athlete-settings-form",
  templateUrl: "./athlete-settings-form.component.html",
  styleUrls: ["./athlete-settings-form.component.scss"]
})
export class AthleteSettingsFormComponent implements OnInit {
  public static readonly DATED_ATHLETE_SETTING_KEY_WEIGHT: any = "weight";
  public static readonly DATED_ATHLETE_SETTING_KEY_MAX_HR: string = "maxHr";
  public static readonly DATED_ATHLETE_SETTING_KEY_REST_HR: string = "restHr";
  public static readonly DATED_ATHLETE_SETTING_KEY_DEFAULT_LTHR: string = "lthr.default";
  public static readonly DATED_ATHLETE_SETTING_KEY_CYCLING_LTHR: string = "lthr.cycling";
  public static readonly DATED_ATHLETE_SETTING_KEY_RUNNING_LTHR: string = "lthr.running";
  public static readonly DATED_ATHLETE_SETTING_KEY_CYCLING_FTP: string = "cyclingFtp";
  public static readonly DATED_ATHLETE_SETTING_KEY_RUNNING_FTP: string = "runningFtp";
  public static readonly DATED_ATHLETE_SETTING_KEY_SWIMMING_FTP: string = "swimFtp";

  public readonly DEFAULT_LTHR_KARVONEN_HRR_FACTOR: number = FitnessService.DEFAULT_LTHR_KARVONEN_HRR_FACTOR;

  @ViewChild("bottom", { static: true })
  public bottomElement: ElementRef;

  @Input()
  public athleteSettingsModel: AthleteSettings;

  @Output()
  public athleteSettingsModelChange: EventEmitter<AthleteSettings> = new EventEmitter<AthleteSettings>();

  public compliantAthleteSettingsModel: AthleteSettings;

  public swimFtp100m: string;

  public isSwimFtpCalculatorEnabled = false;

  constructor(@Inject(MatSnackBar) private readonly snackBar: MatSnackBar) {}

  public ngOnInit(): void {
    this.markCurrentSettingsAsCompliant();
    this.swimFtp100m = SwimFtpHelperComponent.convertSwimSpeedToPace(this.athleteSettingsModel.swimFtp);
  }

  public isPropertyCompliant(property: string, canBeNull?: boolean): boolean {
    const value = _.get(this.athleteSettingsModel, property);
    if (canBeNull === true && _.isNull(value)) {
      return true;
    }
    return _.isNumber(value) && value >= 0;
  }

  public resetPropertyToLatestCompliant(property: string): void {
    _.set(this.athleteSettingsModel, property, _.get(this.compliantAthleteSettingsModel, property));
  }

  public markCurrentSettingsAsCompliant(): void {
    this.compliantAthleteSettingsModel = _.cloneDeep(this.athleteSettingsModel);
  }

  public onValidateChange(property: string, canBeNull?: boolean): void {
    const isCompliant = this.isPropertyCompliant(property, canBeNull);
    if (isCompliant) {
      this.markCurrentSettingsAsCompliant();
      this.athleteSettingsModelChange.emit(this.athleteSettingsModel);
    } else {
      this.resetPropertyToLatestCompliant(property);
      this.popError();
    }
  }

  public onWeightChanged() {
    this.onValidateChange(AthleteSettingsFormComponent.DATED_ATHLETE_SETTING_KEY_WEIGHT);
  }

  public onMaxHrChanged() {
    const maxHrProperty = AthleteSettingsFormComponent.DATED_ATHLETE_SETTING_KEY_MAX_HR;
    if (this.isPropertyCompliant(maxHrProperty) && this.athleteSettingsModel.maxHr > this.athleteSettingsModel.restHr) {
      this.onValidateChange(maxHrProperty);
    } else {
      this.resetPropertyToLatestCompliant(maxHrProperty);
      this.popError("Max Hr should be higher than Rest Hr");
    }
  }

  public onRestHrChanged() {
    const restHrProperty = AthleteSettingsFormComponent.DATED_ATHLETE_SETTING_KEY_REST_HR;
    if (
      this.isPropertyCompliant(restHrProperty) &&
      this.athleteSettingsModel.restHr < this.athleteSettingsModel.maxHr
    ) {
      this.onValidateChange(restHrProperty);
    } else {
      this.resetPropertyToLatestCompliant(restHrProperty);
      this.popError("Rest Hr should be lower than Max Hr");
    }
  }

  public onLTHRChanged() {
    this.onValidateChange(AthleteSettingsFormComponent.DATED_ATHLETE_SETTING_KEY_DEFAULT_LTHR, true);
  }

  public onCyclingLTHRChanged() {
    this.onValidateChange(AthleteSettingsFormComponent.DATED_ATHLETE_SETTING_KEY_CYCLING_LTHR, true);
  }

  public onRunningLTHRChanged() {
    this.onValidateChange(AthleteSettingsFormComponent.DATED_ATHLETE_SETTING_KEY_RUNNING_LTHR, true);
  }

  public onCyclingFtpChanged() {
    this.onValidateChange(AthleteSettingsFormComponent.DATED_ATHLETE_SETTING_KEY_CYCLING_FTP, true);
  }

  public onRunningFtpChanged() {
    this.onValidateChange(AthleteSettingsFormComponent.DATED_ATHLETE_SETTING_KEY_RUNNING_FTP, true);
  }

  public onSwimFtpCalculatorEnabled(): void {
    _.defer(() => this.bottomElement.nativeElement.scrollIntoView()); // Scroll down to bottom element
  }

  public onSwimFtpChanged(changeFromPaceField?: boolean) {
    if (_.isUndefined(changeFromPaceField) || !changeFromPaceField) {
      // If change is not from "hh:mm:ss / 100m" pace field
      this.swimFtp100m = SwimFtpHelperComponent.convertSwimSpeedToPace(this.athleteSettingsModel.swimFtp); // Update min/100m field
    }
    this.onValidateChange(AthleteSettingsFormComponent.DATED_ATHLETE_SETTING_KEY_SWIMMING_FTP, true);
  }

  public onSwimFtp100mChanged() {
    let hasErrors = false;

    this.swimFtp100m = this.swimFtp100m.trim();

    if (_.isEmpty(this.swimFtp100m) || this.swimFtp100m === "00:00:00") {
      // Ok...
      this.athleteSettingsModel.swimFtp = null;
      this.swimFtp100m = null;
      const changeFromPaceField = true;
      this.onSwimFtpChanged(changeFromPaceField); // Trigger save & swimFtp100m new value
    } else {
      if (this.swimFtp100m.match("^[0-9]+:[0-5]{1}[0-9]{1}:[0-5]{1}[0-9]{1}$")) {
        this.athleteSettingsModel.swimFtp = SwimFtpHelperComponent.convertPaceToSwimSpeed(this.swimFtp100m);

        if (_.isFinite(this.athleteSettingsModel.swimFtp)) {
          const changeFromPaceField = true;
          this.onSwimFtpChanged(changeFromPaceField); // Trigger save & swimFtp100m new value
        } else {
          hasErrors = true;
        }
      } else {
        hasErrors = true;
      }
    }

    if (hasErrors) {
      this.swimFtp100m = SwimFtpHelperComponent.convertSwimSpeedToPace(this.compliantAthleteSettingsModel.swimFtp);
      this.popError();
    }
  }

  public convertToPace(systemUnit: string): string {
    let speedFactor: number;

    if (systemUnit === MeasureSystem.METRIC) {
      speedFactor = 1;
    } else if (systemUnit === MeasureSystem.IMPERIAL) {
      speedFactor = Constant.KM_TO_MILE_FACTOR;
    } else {
      throw new Error("System unit unknown");
    }

    return _.isNumber(this.athleteSettingsModel.runningFtp) && this.athleteSettingsModel.runningFtp > 0
      ? this.secondsToHHMMSS(this.athleteSettingsModel.runningFtp / speedFactor) +
          (systemUnit === MeasureSystem.METRIC ? "/km" : "/mi")
      : null;
  }

  public popError(customMessage?: string) {
    let message = "Invalid value entered. Reset to previous value.";

    if (customMessage) {
      message = customMessage;
    }

    this.snackBar.open(message, "Close", {
      duration: 2500
    });
  }

  private secondsToHHMMSS(secondsParam: number, trimLeadingZeros?: boolean): string {
    const secNum: number = Math.round(secondsParam); // don't forget the second param
    const hours: number = Math.floor(secNum / 3600);
    const minutes: number = Math.floor((secNum - hours * 3600) / 60);
    const seconds: number = secNum - hours * 3600 - minutes * 60;

    let time: string = hours < 10 ? "0" + hours.toFixed(0) : hours.toFixed(0);
    time += ":" + (minutes < 10 ? "0" + minutes.toFixed(0) : minutes.toFixed(0));
    time += ":" + (seconds < 10 ? "0" + seconds.toFixed(0) : seconds.toFixed(0));

    return trimLeadingZeros ? this.trimLeadingZerosHHMMSS(time) : time;
  }

  private trimLeadingZerosHHMMSS(time: string): string {
    const result: string = time.replace(/^(0*:)*/, "").replace(/^0*/, "") || "0";
    if (result.indexOf(":") < 0) {
      return result + "s";
    }
    return result;
  }
}
