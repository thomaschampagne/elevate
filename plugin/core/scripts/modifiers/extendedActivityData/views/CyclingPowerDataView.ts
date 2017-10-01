import * as _ from "lodash";
import {IPowerData} from "../../../../../common/scripts/interfaces/IActivityData";
import {AbstractDataView} from "./AbstractDataView";

export class CyclingPowerDataView extends AbstractDataView {

    protected powerData: IPowerData;

    constructor(powerData: IPowerData, units: string) {
        super(units);
        this.mainColor = [96, 96, 96];
        this.setGraphTitleFromUnits();
        this.powerData = powerData;
        this.setupDistributionGraph(this.powerData.powerZones);
        this.setupDistributionTable(this.powerData.powerZones);
    }

    public render(): void {

        // Add a title
        this.content += this.generateSectionTitle('<img src="' + this.appResources.boltIcon + '" style="vertical-align: baseline; height:20px;"/> POWER <a target="_blank" href="' + this.appResources.settingsLink + '#!/zonesSettings/power" style="float: right;margin-right: 10px;"><img src="' + this.appResources.cogIcon + '" style="vertical-align: baseline; height:20px;"/></a>');

        // Creates a grid
        this.makeGrid(3, 4); // (col, row)

        this.insertDataIntoGrid();
        this.generateCanvasForGraph();

        // Push grid, graph and table to content view
        this.injectToContent();
    }

    protected insertDataIntoGrid(): void {

        this.insertContentAtGridPosition(0, 0, this.powerData.weightedPower.toFixed(0), "Weighted Power", "W", "displayAdvancedPowerData");
        this.insertContentAtGridPosition(1, 0, this.powerData.variabilityIndex.toFixed(2), "Variability Index", "", "displayAdvancedPowerData");

        if (this.powerData.punchFactor) {
            this.insertContentAtGridPosition(2, 0, this.powerData.punchFactor.toFixed(2), "Intensity", "", "displayAdvancedPowerData");
        }

        this.insertContentAtGridPosition(0, 1, this.powerData.lowerQuartileWatts, "25% Quartile Watts", "W", "displayAdvancedPowerData");
        this.insertContentAtGridPosition(1, 1, this.powerData.medianWatts, "50% Quartile Watts", "W", "displayAdvancedPowerData");
        this.insertContentAtGridPosition(2, 1, this.powerData.upperQuartileWatts, "75% Quartile Watts", "W", "displayAdvancedPowerData");

        if (_.isNumber(this.powerData.avgWattsPerKg)) {
            this.insertContentAtGridPosition(0, 2, this.powerData.avgWattsPerKg.toFixed(2), "Avg Watts/Kg", "W/Kg", "displayAdvancedPowerData");
        }

        if (_.isNumber(this.powerData.weightedWattsPerKg)) {
            this.insertContentAtGridPosition(1, 2, this.powerData.weightedWattsPerKg.toFixed(2), "Weighted Watts/Kg", "W/Kg", "displayAdvancedPowerData");
        }

        if (_.isNumber(this.powerData.powerStressScore)) {
            this.insertContentAtGridPosition(0, 3, this.powerData.powerStressScore.toFixed(0), "Power Stress Score", "", "displayAdvancedPowerData");
        }

        if (_.isNumber(this.powerData.powerStressScorePerHour)) {
            this.insertContentAtGridPosition(1, 3, this.powerData.powerStressScorePerHour.toFixed(1), "Power Stress Score / Hour", "", "displayAdvancedPowerData");
        }
    }
}
