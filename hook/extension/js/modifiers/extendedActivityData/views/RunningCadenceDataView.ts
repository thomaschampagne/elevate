class RunningCadenceDataView extends AbstractCadenceDataView {

    protected userSettings: IUserSettings;

    constructor(cadenceData: ICadenceData, units: string, userSettings: IUserSettings) {

        if (userSettings.enableBothLegsCadence) {

            let cadenceDataClone: ICadenceData = $.extend(true, {}, cadenceData); // Create a deep clone in memory to avoid values doubled on each reload

            // Then multiply cadence per 2
            cadenceDataClone.averageCadenceMoving *= 2;
            cadenceDataClone.lowerQuartileCadence *= 2;
            cadenceDataClone.medianCadence *= 2;
            cadenceDataClone.upperQuartileCadence *= 2;

            for (let zone in cadenceDataClone.cadenceZones) {
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
        this.content += this.generateSectionTitle('<img src="' + this.appResources.circleNotchIcon + '" style="vertical-align: baseline; height:20px;"/> CADENCE @ ' + ((this.userSettings.enableBothLegsCadence) ? '2 legs' : '1 leg') + ' <a target="_blank" href="' + this.appResources.settingsLink + '#/zonesSettings/runningCadence" style="float: right;margin-right: 10px;"><img src="' + this.appResources.cogIcon + '" style="vertical-align: baseline; height:20px;"/></a>');

        // Creates a grid
        this.makeGrid(3, 2); // (col, row)

        this.insertDataIntoGrid();
        this.generateCanvasForGraph();

        // Push grid, graph and table to content view
        this.injectToContent();

    }

    protected insertDataIntoGrid(): void {

        this.insertContentAtGridPosition(0, 0, this.cadenceData.averageCadenceMoving.toFixed(1), 'Average Cadence', this.units, 'displayCadenceData');
        this.insertContentAtGridPosition(0, 1, this.cadenceData.lowerQuartileCadence, '25% Quartile Cadence', this.units, 'displayCadenceData');
        this.insertContentAtGridPosition(1, 1, this.cadenceData.medianCadence, '50% Quartile Cadence', this.units, 'displayCadenceData');
        this.insertContentAtGridPosition(2, 1, this.cadenceData.upperQuartileCadence, '75% Quartile Cadence', this.units, 'displayCadenceData');

        // this.insertContentAtGridPosition(0, 1, this.cadenceData.crankRevolutions.toFixed(0), 'Total Stride', '', 'displayCadenceData'); // DELAYED_FOR_TESTING
    }
}
