import {IPowerData} from "../../../../../common/scripts/interfaces/IActivityData";
import {AbstractDataView} from "./AbstractDataView";

export class RunningPowerDataView extends AbstractDataView {

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
        this.content += this.generateSectionTitle("<img src=\"" + this.appResources.boltIcon + "\" style=\"vertical-align: baseline; height:20px;\"/> POWER <a target=\"_blank\" href=\"" + this.appResources.settingsLink + "#!/zonesSettings/runningPower\" style=\"float: right;margin-right: 10px;\"><img src=\"" + this.appResources.cogIcon + "\" style=\"vertical-align: baseline; height:20px;\"/></a>");

        // Creates a grid
        this.makeGrid(3, 3); // (col, row)

        this.insertDataIntoGrid();
        this.generateCanvasForGraph();

        // Push grid, graph and table to content view
        this.injectToContent();
    }

    protected insertDataIntoGrid(): void {

        const isRealPower = !(this.powerData.isEstimatedRunningPower === true);
        const printEstimatedWordWhenRealPower = isRealPower ? "" : "Estimated ";
        const printEstimatedTildWhenRealPower = isRealPower ? "" : "<span style='font-size: 14px;'>~</span>";

        this.insertContentAtGridPosition(0, 0, printEstimatedTildWhenRealPower + this.powerData.avgWatts.toFixed(0),
            printEstimatedWordWhenRealPower + "Average Power", "W", isRealPower ? "displayAdvancedPowerData" : "displayRunningPowerEstimation");

        if (isRealPower) {
            this.insertContentAtGridPosition(1, 0, this.powerData.weightedPower.toFixed(0),
                printEstimatedWordWhenRealPower + "Weighted Power", "W", "displayAdvancedPowerData");
            this.insertContentAtGridPosition(2, 0, this.powerData.variabilityIndex.toFixed(2),
                printEstimatedWordWhenRealPower + "Variability Index", "", "displayAdvancedPowerData");
        }

        this.insertContentAtGridPosition(0, 1, printEstimatedTildWhenRealPower + this.powerData.lowerQuartileWatts,
            printEstimatedWordWhenRealPower + "25% Quartile Watts", "W", isRealPower ? "displayAdvancedPowerData" : "displayRunningPowerEstimation");
        this.insertContentAtGridPosition(1, 1, printEstimatedTildWhenRealPower + this.powerData.medianWatts,
            printEstimatedWordWhenRealPower + "50% Quartile Watts", "W", isRealPower ? "displayAdvancedPowerData" : "displayRunningPowerEstimation");
        this.insertContentAtGridPosition(2, 1, printEstimatedTildWhenRealPower + this.powerData.upperQuartileWatts,
            printEstimatedWordWhenRealPower + "75% Quartile Watts", "W", isRealPower ? "displayAdvancedPowerData" : "displayRunningPowerEstimation");

    }
}
