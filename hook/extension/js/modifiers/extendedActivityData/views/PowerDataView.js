var PowerDataView = AbstractDataView.extend(function(base) {

    return {

        powerData: null,

        mainColor: [96, 96, 96],

        init: function(powerData, units) {

            this.setViewId('PowerDataView_p8a5d4gl56ds4');

            base.init.call(this);

            this.units = units;
            this.setGraphTitleFromUnits(this.units);

            this.powerData = powerData;

            this.setupDistributionGraph(this.powerData.powerZones);

            this.setupDistributionTable(this.powerData.powerZones);

        },

        render: function() {

            base.render.call(this);

            // Add a title
            this.content += this.generateSectionTitle('<img src="' + this.appResources.boltIcon + '" style="vertical-align: baseline; height:20px;"/> POWER <a target="_blank" href="' + this.appResources.settingsLink + '#/zonesSettings/power" style="float: right;margin-right: 10px;"><img src="' + this.appResources.cogIcon + '" style="vertical-align: baseline; height:20px;"/></a>');

            // Creates a grid
            this.makeGrid(3, 3); // (col, row)

            this.insertPowerDataIntoGrid();
            this.generateCanvasForGraph();

            // Push grid, graph and table to content view
            this.content += this.grid.html();
            this.content += this.graph.html();
            this.content += this.table.html();
        },

        insertPowerDataIntoGrid: function() {

            this.insertContentAtGridPosition(0, 0, this.powerData.weightedPower.toFixed(0), 'Weighted Power', 'W', 'displayAdvancedPowerData');
            this.insertContentAtGridPosition(1, 0, this.powerData.variabilityIndex.toFixed(2), 'Variability Index', '', 'displayAdvancedPowerData');

            if (this.powerData.punchFactor) {
                this.insertContentAtGridPosition(2, 0, this.powerData.punchFactor.toFixed(2), 'Punch Factor', '', 'displayAdvancedPowerData');
            }

            this.insertContentAtGridPosition(0, 1, this.powerData.lowerQuartileWatts, '25% Quartile Watts', 'W', 'displayAdvancedPowerData');
            this.insertContentAtGridPosition(1, 1, this.powerData.medianWatts, '50% Quartile Watts', 'W', 'displayAdvancedPowerData');
            this.insertContentAtGridPosition(2, 1, this.powerData.upperQuartileWatts, '75% Quartile Watts', 'W', 'displayAdvancedPowerData');

            this.insertContentAtGridPosition(0, 2, this.powerData.avgWattsPerKg.toFixed(2), 'Avg Watts/Kg', 'W/Kg', 'displayAdvancedPowerData');
            this.insertContentAtGridPosition(1, 2, this.powerData.weightedWattsPerKg.toFixed(2), 'Weighted Watts/Kg', 'W/Kg', 'displayAdvancedPowerData');
        }
    };
});