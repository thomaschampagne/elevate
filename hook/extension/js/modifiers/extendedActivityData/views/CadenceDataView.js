var CadenceDataView = AbstractDataView.extend(function(base) {

    return {

        cadenceData: null,

        mainColor: [213, 0, 195],

        init: function(cadenceData) {

            console.log('CadenceDataView::init');

            base.init.call(this);

            this.cadenceData = cadenceData;

            this.setupDistributionGraph(this.cadenceData.cadenceZones, 'rpm');

            this.setupDistributionTable(this.cadenceData.cadenceZones, 'rpm');

        },

        render: function() {

            console.log('CadenceDataView::render');

            base.render.call(this);

            this.setViewId('CadenceDataView_p8a5d4gl56ds4');

            // Add a title
            this.content += this.generateSectionTitle('Cadence stats');

            this.setGraphTitle('Cadence distribution over ' + this.cadenceData.cadenceZones.length + ' zones');

            // Creates a grid
            this.makeGrid(3, 3); // (col, row)

            this.insertCadenceDataIntoGrid();
            this.generateCanvasForGraph();

            // Push grid, graph and table to content view
            this.content += this.grid.html();
            this.content += this.graph.html();
            this.content += this.table.html();
        },

        insertCadenceDataIntoGrid: function() {

            this.insertContentAtGridPosition(0, 0, this.cadenceData.cadencePercentageMoving.toFixed(2), 'Cadence % while moving', '%', 'displayCadenceData');
            this.insertContentAtGridPosition(1, 0, Helper.secondsToHHMMSS(this.cadenceData.cadenceTimeMoving), 'Cadence Time while moving', '', 'displayCadenceData');
            this.insertContentAtGridPosition(2, 0, this.cadenceData.crankRevolutions.toFixed(0), 'Crank Revolutions', '', 'displayCadenceData');

            this.insertContentAtGridPosition(0, 1, this.cadenceData.lowerQuartileCadence, '25% Quartile Cadence', 'rpm', 'displayCadenceData');
            this.insertContentAtGridPosition(1, 1, this.cadenceData.medianCadence, '50% Quartile Cadence', 'rpm', 'displayCadenceData');
            this.insertContentAtGridPosition(2, 1, this.cadenceData.upperQuartileCadence, '75% Quartile Cadence', 'rpm', 'displayCadenceData');
        }
    }
});
