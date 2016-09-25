abstract class AbstractCadenceDataView extends AbstractDataView {

    protected cadenceData: CadenceData;

    constructor(cadenceData: CadenceData, units: string) {
        super(units);
        this.cadenceData = cadenceData;
        this.mainColor = [213, 0, 195];
        this.setGraphTitleFromUnits();
        this.setupDistributionGraph(this.cadenceData.cadenceZones);
        this.setupDistributionTable(this.cadenceData.cadenceZones);
    }
}
