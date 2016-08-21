var AscentSpeedDataView = AbstractDataView.extend(function(base) {

    return {

        elevationData: null,

        mainColor: [44, 0, 204],

        init: function(elevationData, units) {

            this.setViewId('AscentSpeedDataView_154dsq48gdsyuj48y');

            base.init.call(this);

            this.units = units; this.setGraphTitleFromUnits(this.units);

            this.elevationData = elevationData;

            this.setupDistributionGraph(this.elevationData.ascentSpeedZones);

            this.setupDistributionTable(this.elevationData.ascentSpeedZones);

        },

        render: function() {

            base.render.call(this);

            // Add a title
            this.content += this.generateSectionTitle('<img src="' + this.appResources.tachometerIcon + '" style="vertical-align: baseline; height:20px;"/> ASCENT SPEED<a target="_blank" href="' + this.appResources.settingsLink + '#/zonesSettings/ascent" style="float: right;margin-right: 10px;"><img src="' + this.appResources.cogIcon + '" style="vertical-align: baseline; height:20px;"/></a>');

            // Creates a grid
            this.makeGrid(3, 2); // (col, row)

            this.insertElevationDataIntoGrid();
            this.generateCanvasForGraph();

            // Push grid, graph and table to content view
            this.content += this.grid.html();
            this.content += this.graph.html();
            this.content += this.table.html();
        },

        insertElevationDataIntoGrid: function() {

            var ascentSpeedAvg = this.elevationData.ascentSpeed.avg;

            if (ascentSpeedAvg) {
                if (ascentSpeedAvg == -1) {
                    ascentSpeedAvg = '&infin;';
                } else {
                    ascentSpeedAvg = ascentSpeedAvg.toFixed(0);
                }
            }

            this.insertContentAtGridPosition(0, 0, ascentSpeedAvg, 'Avg Ascent Speed or VAM', 'Vm/h', 'displayAdvancedElevationData');
            this.insertContentAtGridPosition(0, 1, this.elevationData.ascentSpeed.lowerQuartile, '25% Quartile Ascent Speed', 'Vm/h', 'displayAdvancedElevationData');
            this.insertContentAtGridPosition(1, 1, this.elevationData.ascentSpeed.median, '50% Quartile Ascent Speed', 'Vm/h', 'displayAdvancedElevationData');
            this.insertContentAtGridPosition(2, 1, this.elevationData.ascentSpeed.upperQuartile, '75% Quartile Ascent Speed', 'Vm/h', 'displayAdvancedElevationData');

        }
    };
});
