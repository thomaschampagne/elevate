import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { LastPeriodModel } from "../shared/models/last-period.model";
import { PeriodModel } from "../shared/models/period.model";
import { MatDialog } from "@angular/material";
import { HeartRateImpulseMode } from "../shared/enums/heart-rate-impulse-mode.enum";
import { FitnessInfoDialogComponent } from "../fitness-info-dialog/fitness-info-dialog.component";
import { FitnessTrendConfigModel } from "../shared/models/fitness-trend-config.model";

@Component({
	selector: "app-fitness-trend-inputs",
	templateUrl: "./fitness-trend-inputs.component.html",
	styleUrls: ["./fitness-trend-inputs.component.scss"]
})
export class FitnessTrendInputsComponent implements OnInit, OnChanges {

	public readonly HeartRateImpulseMode = HeartRateImpulseMode;

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

	@Input("lastFitnessActiveDate")
	public lastFitnessActiveDate: Date;

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

	@Output("periodViewedChange")
	public periodViewedChange: EventEmitter<PeriodModel> = new EventEmitter<PeriodModel>();

	@Output("openFitnessTrendConfigRequest")
	public openFitnessTrendConfigRequest: EventEmitter<void> = new EventEmitter<void>();

	@Output("trainingZonesToggleChange")
	public trainingZonesToggleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Output("powerMeterToggleChange")
	public powerMeterToggleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Output("swimToggleChange")
	public swimToggleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Output("eBikeRidesToggleChange")
	public eBikeRidesToggleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Output("estimatedPowerStressScoreToggleChange")
	public estimatedPowerStressScoreToggle: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Output("estimatedRunningStressScoreToggleChange")
	public estimatedRunningStressScoreToggle: EventEmitter<boolean> = new EventEmitter<boolean>();

	public isEstimatedPowerStressScoreEnabled: boolean;

	public isEstimatedRunningStressScoreEnabled: boolean;

	constructor(public dialog: MatDialog) {
	}

	public ngOnInit(): void {
		this.loadEstimatedPowerStressScore();
		this.loadEstimatedRunningStressScore();
	}

	public ngOnChanges(changes: SimpleChanges): void {
		if (changes.fitnessTrendConfigModel && !changes.fitnessTrendConfigModel.isFirstChange()) {
			this.loadEstimatedPowerStressScore();
			this.loadEstimatedRunningStressScore();
		}
	}

	public loadEstimatedPowerStressScore(): void {
		this.isEstimatedPowerStressScoreEnabled = this.isPowerMeterEnabled
			&& this.fitnessTrendConfigModel.allowEstimatedPowerStressScore
			&& this.fitnessTrendConfigModel.heartRateImpulseMode === HeartRateImpulseMode.HRSS;
	}

	public loadEstimatedRunningStressScore(): void {
		this.isEstimatedRunningStressScoreEnabled = this.fitnessTrendConfigModel.allowEstimatedRunningStressScore
			&& this.fitnessTrendConfigModel.heartRateImpulseMode === HeartRateImpulseMode.HRSS;
	}

	public onLastPeriodSelected(): void {
		this.updatePeriodViewedTo(new LastPeriodModel(this.lastPeriodViewed.from, this.lastPeriodViewed.to,
			this.lastPeriodViewed.key, this.lastPeriodViewed.label));
	}

	public onDateToDateChange(): void {
		this.updatePeriodViewedTo(new PeriodModel(this.periodViewed.from, this.periodViewed.to));
	}

	public onTrainingZonesToggle(): void {
		this.trainingZonesToggleChange.emit(this.isTrainingZonesEnabled);
	}

	public onPowerMeterToggle(): void {
		this.loadEstimatedPowerStressScore();
		this.powerMeterToggleChange.emit(this.isPowerMeterEnabled);
	}

	public onSwimToggle(): void {
		this.swimToggleChange.emit(this.isSwimEnabled);
	}

	public onEBikeRidesEnabledToggle(): void {
		this.eBikeRidesToggleChange.emit(this.isEBikeRidesEnabled);
	}

	public onEstimatedPowerStressScoreToggle(): void {
		this.estimatedPowerStressScoreToggle.emit(this.isEstimatedPowerStressScoreEnabled);
	}

	public onEstimatedRunningStressScoreToggle(): void {
		this.estimatedRunningStressScoreToggle.emit(this.isEstimatedRunningStressScoreEnabled);
	}

	public onConfigClicked(): void {
		this.openFitnessTrendConfigRequest.emit();
	}

	public onShowInfo(): void {
		this.dialog.open(FitnessInfoDialogComponent, {
			minWidth: FitnessInfoDialogComponent.MIN_WIDTH,
			maxWidth: FitnessInfoDialogComponent.MAX_WIDTH,
			autoFocus: false
		});
	}

	public updatePeriodViewedTo(periodViewed: PeriodModel): void {
		this.periodViewed = periodViewed;
		this.periodViewedChange.emit(periodViewed);
	}

}
