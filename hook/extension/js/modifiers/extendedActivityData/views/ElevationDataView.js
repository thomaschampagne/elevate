var ElevationDataView = AbstractDataView.extend(function(base) {

    return {

        elevationData: null,

        mainColor: [216, 212, 38],

        init: function(elevationData, units) {

            this.setViewId('ElevationDataView_4689m8a21nl6s6ds4');

            base.init.call(this);

            this.units = units;
            this.setGraphTitleFromUnits(this.units);

            this.elevationData = elevationData;

            this.setupDistributionGraph(this.elevationData.elevationZones);

            this.setupDistributionTable(this.elevationData.elevationZones);
        },

        render: function() {

            base.render.call(this);

            // Add a title
            this.content += this.generateSectionTitle('<img src="' + this.appResources.logArrowUpIcon + '" style="vertical-align: baseline; height:20px;"/> ELEVATION <a target="_blank" href="' + this.appResources.settingsLink + '#/zonesSettings/elevation" style="float: right;margin-right: 10px;"><img src="' + this.appResources.cogIcon + '" style="vertical-align: baseline; height:20px;"/></a>');

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

            this.insertContentAtGridPosition(0, 0, this.elevationData.avgElevation, 'Average Elevation', 'm', 'displayAdvancedElevationData');
            this.insertContentAtGridPosition(1, 0, this.elevationData.accumulatedElevationAscent.toFixed(0), 'Ascent', 'm', 'displayAdvancedElevationData');
            this.insertContentAtGridPosition(2, 0, this.elevationData.accumulatedElevationDescent.toFixed(0), 'Descent', 'm', 'displayAdvancedElevationData');

            this.insertContentAtGridPosition(0, 1, this.elevationData.lowerQuartileElevation, '25% Quartile Elevation', 'm', 'displayAdvancedElevationData');
            this.insertContentAtGridPosition(1, 1, this.elevationData.medianElevation, '50% Quartile Elevation', 'm', 'displayAdvancedElevationData');
            this.insertContentAtGridPosition(2, 1, this.elevationData.upperQuartileElevation, '75% Quartile Elevation', 'm', 'displayAdvancedElevationData');
        }
    };
});
