var RunningCadenceDataView = AbstractCadenceDataView.extend(function(base) {

    return {

        cadenceData: null,

        mainColor: [213, 0, 195],

        init: function(cadenceData, units) {

            console.log('RunningCadenceDataView::init');

            this.units = units;

            base.init.call(this, cadenceData);
        },

        render: function() {

            console.log('RunningCadenceDataView::render');

            base.render.call(this);

            this.setViewId('RunningCadenceDataView_dhgfj56ds4');

            this.setGraphTitle('Cadence distribution over ' + this.cadenceData.cadenceZones.length + ' zones');
            
            // DELAYED_FOR_TESTING
            
            // Creates a grid
            this.makeGrid(3, 2); // (col, row)

            this.insertCadenceDataIntoGrid();
            this.generateCanvasForGraph();

            // Push grid, graph and table to content view
            this.content += this.grid.html();
            this.content += this.graph.html();
            this.content += this.table.html();
            
        },

        insertCadenceDataIntoGrid: function() {

            this.insertContentAtGridPosition(0, 0, this.cadenceData.lowerQuartileCadence, '25% Quartile Cadence', this.units, 'displayCadenceData');
            this.insertContentAtGridPosition(1, 0, this.cadenceData.medianCadence, '50% Quartile Cadence', this.units, 'displayCadenceData');
            this.insertContentAtGridPosition(2, 0, this.cadenceData.upperQuartileCadence, '75% Quartile Cadence', this.units, 'displayCadenceData');
            
            this.insertContentAtGridPosition(0, 1, this.cadenceData.crankRevolutions.toFixed(0), 'Total Stride', '', 'displayCadenceData'); // DELAYED_FOR_TESTING       
        }
    }
});
