import * as _ from "lodash";
import { CadenceDataModel } from "../../../../../common/scripts/models/ActivityData";
import { UserSettingsModel } from "../../../../../common/scripts/models/UserSettings";
import { AbstractCadenceDataView } from "./AbstractCadenceDataView";

export class RunningCadenceDataView extends AbstractCadenceDataView {

	protected userSettings: UserSettingsModel;

	constructor(cadenceData: CadenceDataModel, units: string, userSettings: UserSettingsModel) {

		if (userSettings.enableBothLegsCadence) {

			// Create a deep clone in memory to avoid values doubled on each reload
			const cadenceDataClone: CadenceDataModel = _.cloneDeep(cadenceData);

			// Then multiply cadence per 2
			cadenceDataClone.averageCadenceMoving *= 2;
			cadenceDataClone.lowerQuartileCadence *= 2;
			cadenceDataClone.medianCadence *= 2;
			cadenceDataClone.upperQuartileCadence *= 2;

			if (cadenceDataClone.upFlatDownCadencePaceData) {
				cadenceDataClone.upFlatDownCadencePaceData.up *= 2;
				cadenceDataClone.upFlatDownCadencePaceData.flat *= 2;
				cadenceDataClone.upFlatDownCadencePaceData.down *= 2;
			}

			for (const zone in cadenceDataClone.cadenceZones) {
				cadenceDataClone.cadenceZones[zone].from *= 2;
				cadenceDataClone.cadenceZones[zone].to *= 2;
			}
			super(cadenceDataClone, units);

		} else {
			super(cadenceData, units);
		}

		this.userSettings = userSettings;

		this.setGraphTitleFromUnits();
	}

	public render(): void {

		// Add legs cadence type to view title
		this.content += this.generateSectionTitle("<img src=\"" + this.appResources.circleNotchIcon + "\" style=\"vertical-align: baseline; height:20px;\"/> CADENCE @ " + ((this.userSettings.enableBothLegsCadence) ? "2 legs" : "1 leg") + " <a target=\"_blank\" href=\"" + this.appResources.settingsLink + "#/zonesSettings/runningCadence\" style=\"float: right;margin-right: 10px;\"><img src=\"" + this.appResources.cogIcon + "\" style=\"vertical-align: baseline; height:20px;\"/></a>");
		super.render();
	}

	protected insertDataIntoGrid(): void {

		super.insertDataIntoGrid();

		const hasHasPerCadenceOccurrence = _.isNumber(this.cadenceData.averageDistancePerOccurrence) && !_.isNaN(this.cadenceData.averageDistancePerOccurrence);

		// Row 0
		this.insertContentAtGridPosition(0, 0, this.printNumber(this.cadenceData.averageCadenceMoving, 1), "Avg Cadence", this.units, "displayCadenceData");
		if (hasHasPerCadenceOccurrence) {
			this.insertContentAtGridPosition(1, 0, this.printNumber(this.cadenceData.averageDistancePerOccurrence, 2), "Avg Stride length <sup style='color:#FC4C02; font-size:12px;'>NEW</sup>", "M", "displayCadenceData");
		}
		this.insertContentAtGridPosition(2, 0, this.printNumber(this.cadenceData.totalOccurrences, 0), "Total steps <sup style='color:#FC4C02; font-size:12px;'>NEW</sup>", "", "displayCadenceData");


		// Row 1
		if (this.cadenceData.upFlatDownCadencePaceData) {
			this.insertContentAtGridPosition(0, 1, this.printNumber(this.cadenceData.upFlatDownCadencePaceData.up, 0), "Climbing avg cadence", this.units, "displayCadenceData");
			this.insertContentAtGridPosition(1, 1, this.printNumber(this.cadenceData.upFlatDownCadencePaceData.flat, 0), "Flat avg cadence", this.units, "displayCadenceData");
			this.insertContentAtGridPosition(2, 1, this.printNumber(this.cadenceData.upFlatDownCadencePaceData.down, 0), "Downhill avg cadence", this.units, "displayCadenceData");
		}

		// Row 2
		this.insertContentAtGridPosition(0, 2, this.cadenceData.lowerQuartileCadence, "25% Cadence", this.units, "displayCadenceData");
		this.insertContentAtGridPosition(1, 2, this.cadenceData.medianCadence, "50% Cadence", this.units, "displayCadenceData");
		this.insertContentAtGridPosition(2, 2, this.cadenceData.upperQuartileCadence, "75% Cadence", this.units, "displayCadenceData");

		// Row 3
		this.insertContentAtGridPosition(0, 3, this.printNumber(this.cadenceData.lowerQuartileDistancePerOccurrence, 2), "25% Stride Length <sup style='color:#FC4C02; font-size:12px;'>NEW</sup>", "M", "displayCadenceData");
		this.insertContentAtGridPosition(1, 3, this.printNumber(this.cadenceData.medianDistancePerOccurrence, 2), "50% Stride Length <sup style='color:#FC4C02; font-size:12px;'>NEW</sup>", "M", "displayCadenceData");
		this.insertContentAtGridPosition(2, 3, this.printNumber(this.cadenceData.upperQuartileDistancePerOccurrence, 2), "75% Stride Length <sup style='color:#FC4C02; font-size:12px;'>NEW</sup>", "M", "displayCadenceData");

	}
}
