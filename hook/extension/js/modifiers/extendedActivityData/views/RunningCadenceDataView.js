var RunningCadenceDataView = AbstractCadenceDataView.extend(function(base) {

    return {

        cadenceData: null,

        mainColor: [213, 0, 195],

        strideBothLegs: false, // TODO ...

        init: function(cadenceData, units) {

            this.setViewId('RunningCadenceDataView_dhgfj56ds4');

            this.units = units;

            console.warn(cadenceData);

            if (this.strideBothLegs) {

                // Then multiply cadence per 2
                cadenceData.averageCadenceMoving *= 2;
                cadenceData.lowerQuartileCadence *= 2;
                cadenceData.medianCadence *= 2;
                cadenceData.upperQuartileCadence *= 2;

                for (zone in cadenceData.cadenceZones) {
                    cadenceData.cadenceZones[zone].from *= 2;
                    cadenceData.cadenceZones[zone].to *= 2;
                }

            }

            base.init.call(this, cadenceData);
        },

        render: function() {

            base.render.call(this);

            // TODO if this.strideBothLegs then display "(both legs)" in title

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

            this.insertContentAtGridPosition(0, 0, this.cadenceData.averageCadenceMoving.toFixed(1), 'Average Cadence', this.units, 'displayCadenceData');

            this.insertContentAtGridPosition(0, 1, this.cadenceData.lowerQuartileCadence, '25% Quartile Cadence', this.units, 'displayCadenceData');
            this.insertContentAtGridPosition(1, 1, this.cadenceData.medianCadence, '50% Quartile Cadence', this.units, 'displayCadenceData');
            this.insertContentAtGridPosition(2, 1, this.cadenceData.upperQuartileCadence, '75% Quartile Cadence', this.units, 'displayCadenceData');

            // this.insertContentAtGridPosition(0, 1, this.cadenceData.crankRevolutions.toFixed(0), 'Total Stride', '', 'displayCadenceData'); // DELAYED_FOR_TESTING       
        }
    }
});
