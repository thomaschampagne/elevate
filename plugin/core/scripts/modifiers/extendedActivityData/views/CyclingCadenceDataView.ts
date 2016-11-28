class CyclingCadenceDataView extends AbstractCadenceDataView {

    constructor(cadenceData: ICadenceData, units: string) {
        super(cadenceData, units);
    }

    public render(): void {

        this.content += this.generateSectionTitle('<img src="' + this.appResources.circleNotchIcon + '" style="vertical-align: baseline; height:20px;"/> CADENCE <a target="_blank" href="' + this.appResources.settingsLink + '#/zonesSettings/cyclingCadence" style="float: right;margin-right: 10px;"><img src="' + this.appResources.cogIcon + '" style="vertical-align: baseline; height:20px;"/></a>');

        // Creates a grid
        this.makeGrid(3, 3); // (col, row)

        this.insertDataIntoGrid();
        this.generateCanvasForGraph();

        // Push grid, graph and table to content view
        this.injectToContent();
    }

    protected insertDataIntoGrid(): void {

        this.insertContentAtGridPosition(0, 0, this.cadenceData.cadencePercentageMoving.toFixed(2), 'Cadence % while moving', '%', 'displayCadenceData');
        this.insertContentAtGridPosition(1, 0, Helper.secondsToHHMMSS(this.cadenceData.cadenceTimeMoving), 'Cadence Time while moving', '', 'displayCadenceData');
        this.insertContentAtGridPosition(2, 0, this.cadenceData.crankRevolutions.toFixed(0), 'Crank Revolutions', '', 'displayCadenceData');

        this.insertContentAtGridPosition(0, 1, this.cadenceData.lowerQuartileCadence, '25% Quartile Cadence', 'rpm', 'displayCadenceData');
        this.insertContentAtGridPosition(1, 1, this.cadenceData.medianCadence, '50% Quartile Cadence', 'rpm', 'displayCadenceData');
        this.insertContentAtGridPosition(2, 1, this.cadenceData.upperQuartileCadence, '75% Quartile Cadence', 'rpm', 'displayCadenceData');

        this.insertContentAtGridPosition(0, 2, this.cadenceData.standardDeviationCadence, 'Std Deviation &sigma;', 'rpm', 'displayCadenceData');
    }
}
