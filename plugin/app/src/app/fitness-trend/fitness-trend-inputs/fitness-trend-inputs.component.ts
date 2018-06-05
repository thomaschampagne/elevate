import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { LastPeriodModel } from "../shared/models/last-period.model";
import { PeriodModel } from "../shared/models/period.model";
import * as _ from "lodash";
import { GotItDialogDataModel } from "../../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { GotItDialogComponent } from "../../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { MatDialog } from "@angular/material";
import { FitnessTrendComponent } from "../fitness-trend.component";
import { HeartRateImpulseMode } from "../shared/enums/heart-rate-impulse-mode.enum";
import { FitnessUserSettingsModel } from "../shared/models/fitness-user-settings.model";
import { FitnessInfoDialogComponent } from "../fitness-info-dialog/fitness-info-dialog.component";
import { FitnessTrendConfigModel } from "../shared/models/fitness-trend-config.model";
import { FitnessTrendConfigDialogComponent } from "../fitness-trend-config-dialog/fitness-trend-config-dialog.component";

@Component({
	selector: "app-fitness-trend-inputs",
	templateUrl: "./fitness-trend-inputs.component.html",
	styleUrls: ["./fitness-trend-inputs.component.scss"]
})
export class FitnessTrendInputsComponent implements OnInit {

	public readonly HeartRateImpulseMode = HeartRateImpulseMode;

	// Inputs
	@Input("dateMin")
	public dateMin: Date;

	@Input("dateMax")
	public dateMax: Date;

	@Input("lastPeriodViewed")
	public lastPeriodViewed: LastPeriodModel;

	@Input("lastPeriods")
	public lastPeriods: LastPeriodModel[];

	@Input("periodViewed")
	public periodViewed: PeriodModel;

	@Input("fitnessUserSettingsModel")
	public fitnessUserSettingsModel: FitnessUserSettingsModel;

	@Input("fitnessTrendConfigModel")
	public fitnessTrendConfigModel: FitnessTrendConfigModel;

	@Input("isTrainingZonesEnabled")
	public isTrainingZonesEnabled: boolean;

	@Input("isPowerMeterEnabled")
	public isPowerMeterEnabled: boolean;

	@Input("isSwimEnabled")
	public isSwimEnabled: boolean;

	@Input("isEBikeRidesEnabled")
	public isEBikeRidesEnabled: boolean;

	// Outputs
	@Output("periodViewedChange")
	public periodViewedChange: EventEmitter<PeriodModel> = new EventEmitter<PeriodModel>();

	@Output("fitnessTrendConfigChange")
	public fitnessTrendConfigChange: EventEmitter<FitnessTrendConfigModel> = new EventEmitter<FitnessTrendConfigModel>();

	@Output("trainingZonesToggleChange")
	public trainingZonesToggleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Output("powerMeterToggleChange")
	public powerMeterToggleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Output("swimToggleChange")
	public swimToggleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Output("eBikeRidesToggleChange")
	public eBikeRidesToggleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

	constructor(public dialog: MatDialog) {
	}

	public ngOnInit(): void {
	}

	public onLastPeriodSelected(): void {
		localStorage.setItem(FitnessTrendComponent.LS_LAST_PERIOD_VIEWED_KEY, this.lastPeriodViewed.key);
		this.updatePeriodViewedTo(this.lastPeriodViewed);
	}

	public onDateToDateChange(): void {
		this.updatePeriodViewedTo(this.periodViewed);
	}

	public onTrainingZonesToggle(): void {

		if (this.isTrainingZonesEnabled) {
			localStorage.setItem(FitnessTrendComponent.LS_TRAINING_ZONES_ENABLED_KEY, "true");
		} else {
			localStorage.removeItem(FitnessTrendComponent.LS_TRAINING_ZONES_ENABLED_KEY);
		}

		this.trainingZonesToggleChange.emit(this.isTrainingZonesEnabled);
	}

	public onPowerMeterToggle(): void {

		if (!_.isNumber(this.fitnessUserSettingsModel.cyclingFtp)) {

			const data: GotItDialogDataModel = {
				title: "Cycling Functional Threshold Power Empty",
				content: "You cycling functional threshold power (FTP) is not defined. Please set it in athlete settings and go back to this page."
			};

			this.dialog.open(GotItDialogComponent, {
				minWidth: GotItDialogComponent.MIN_WIDTH,
				maxWidth: GotItDialogComponent.MAX_WIDTH,
				data: data
			});

			// Reset toggle to false
			setTimeout(() => {
				this.isPowerMeterEnabled = false;
			});

		} else {

			if (this.isPowerMeterEnabled) {
				localStorage.setItem(FitnessTrendComponent.LS_POWER_METER_ENABLED_KEY, "true");
			} else {
				localStorage.removeItem(FitnessTrendComponent.LS_POWER_METER_ENABLED_KEY);
			}

			this.powerMeterToggleChange.emit(this.isPowerMeterEnabled);
		}

	}

	public onSwimToggle(): void {

		if (!_.isNumber(this.fitnessUserSettingsModel.swimFtp)) {

			const data: GotItDialogDataModel = {
				title: "Swimming Functional Threshold Pace Empty",
				content: "Your swimming functional threshold pace is not defined. Please set it in athlete settings and go back to this page."
			};

			this.dialog.open(GotItDialogComponent, {
				minWidth: GotItDialogComponent.MIN_WIDTH,
				maxWidth: GotItDialogComponent.MAX_WIDTH,
				data: data
			});

			// Reset toggle to false
			setTimeout(() => {
				this.isSwimEnabled = false;
			});

		} else {

			if (this.isSwimEnabled) {
				localStorage.setItem(FitnessTrendComponent.LS_SWIM_ENABLED_KEY, "true");
			} else {
				localStorage.removeItem(FitnessTrendComponent.LS_SWIM_ENABLED_KEY);
			}

			this.swimToggleChange.emit(this.isSwimEnabled);
		}
	}

	public onEBikeRidesEnabledToggle(): void {

		if (this.isEBikeRidesEnabled) {
			localStorage.setItem(FitnessTrendComponent.LS_ELECTRICAL_BIKE_RIDES_ENABLED_KEY, "true");
		} else {
			localStorage.removeItem(FitnessTrendComponent.LS_ELECTRICAL_BIKE_RIDES_ENABLED_KEY);
		}

		this.eBikeRidesToggleChange.emit(this.isEBikeRidesEnabled);

	}

	public onConfigClicked(): void {

		const dialogRef = this.dialog.open(FitnessTrendConfigDialogComponent, {
			minWidth: FitnessTrendConfigDialogComponent.MIN_WIDTH,
			maxWidth: FitnessTrendConfigDialogComponent.MAX_WIDTH,
			data: _.cloneDeep(this.fitnessTrendConfigModel)
		});

		dialogRef.afterClosed().subscribe((fitnessTrendConfigModel: FitnessTrendConfigModel) => {

			if (_.isEmpty(fitnessTrendConfigModel)) {
				return;
			}

			const hasConfigChanged = (this.fitnessTrendConfigModel.heartRateImpulseMode !== Number(fitnessTrendConfigModel.heartRateImpulseMode))
				|| (this.fitnessTrendConfigModel.initializedFitnessTrendModel.ctl !== fitnessTrendConfigModel.initializedFitnessTrendModel.ctl)
				|| (this.fitnessTrendConfigModel.initializedFitnessTrendModel.atl !== fitnessTrendConfigModel.initializedFitnessTrendModel.atl);

			if (hasConfigChanged) {
				this.fitnessTrendConfigModel = fitnessTrendConfigModel;
				localStorage.setItem(FitnessTrendComponent.LS_CONFIG_FITNESS_TREND_KEY, JSON.stringify(this.fitnessTrendConfigModel)); // Save local
				this.fitnessTrendConfigChange.emit(this.fitnessTrendConfigModel);
			}

		});
	}

	public onShowInfo(): void {
		this.dialog.open(FitnessInfoDialogComponent, {
			minWidth: FitnessInfoDialogComponent.MIN_WIDTH,
			maxWidth: FitnessInfoDialogComponent.MAX_WIDTH,
			autoFocus: false
		});
	}

	public updatePeriodViewedTo(periodViewed: PeriodModel): void {
		this.periodViewed = {
			from: periodViewed.from,
			to: periodViewed.to
		};
		this.periodViewedChange.emit(this.periodViewed);
	}

}
