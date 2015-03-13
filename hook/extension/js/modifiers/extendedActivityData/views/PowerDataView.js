var PowerDataView = AbstractDataView.extend(function(base) {

    return {

        powerData: null,

        mainColor: [96, 96, 96],

        init: function(powerData, units) {

            console.log('PowerDataView::init');

            base.init.call(this);

            this.units = units;

            this.powerData = powerData;

            this.setupDistributionGraph(this.powerData.powerZones);

            this.setupDistributionTable(this.powerData.powerZones);

        },

        render: function() {

            console.log('PowerDataView::render');

            base.render.call(this);

            this.setViewId('PowerDataView_p8a5d4gl56ds4');

            // Add a title
            this.content += this.generateSectionTitle('Power stats');

            this.setGraphTitle('Watts distribution over ' + this.powerData.powerZones.length + ' zones');

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

            this.insertContentAtGridPosition(0, 0, this.powerData.weightedPower.toFixed(0), 'Weighted Power', 'W', 'displayAdvancedPowerData');
            this.insertContentAtGridPosition(1, 0, this.powerData.variabilityIndex.toFixed(2), 'Variability Index', '', 'displayAdvancedPowerData');

            if (this.powerData.punchFactor) {
                this.insertContentAtGridPosition(2, 0, this.powerData.punchFactor.toFixed(2), 'Punch Factor', '', 'displayAdvancedPowerData');
            }

            this.insertContentAtGridPosition(0, 1, this.powerData.lowerQuartileWatts, '25% Quartile Watts', 'W', 'displayAdvancedPowerData');
            this.insertContentAtGridPosition(1, 1, this.powerData.medianWatts, '50% Quartile Watts', 'W', 'displayAdvancedPowerData');
            this.insertContentAtGridPosition(2, 1, this.powerData.upperQuartileWatts, '75% Quartile Watts', 'W', 'displayAdvancedPowerData');

            this.insertContentAtGridPosition(0, 2, this.powerData.weightedWattsPerKg.toFixed(2), 'Weighted Watts/Kg', 'W/Kg', 'displayAdvancedPowerData');
        }
    }
});
