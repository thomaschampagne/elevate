var ElevationDataView = AbstractDataView.extend(function(base) {

    return {

        elevationData: null,

        mainColor: [153, 153, 0],

        init: function(elevationData, units, ascentSpeed) {

            this.setViewId('ElevationDataView_4689m8a21nl6s6ds4' + ascentSpeed);

            base.init.call(this);

            this.ascentSpeed = ascentSpeed;

            this.units = units;

            this.elevationData = elevationData;

            if (this.ascentSpeed) {
                this.setupDistributionGraph(this.elevationData.ascentSpeedZones);
                this.setupDistributionTable(this.elevationData.ascentSpeedZones);
            } else {
                this.setupDistributionGraph(this.elevationData.elevationZones);
                this.setupDistributionTable(this.elevationData.elevationZones);
            }

        },

        render: function() {

            base.render.call(this);

            // Add a title
            if (this.ascentSpeed) {
                this.content += this.generateSectionTitle('Ascent speed stats (grade &gt; 3%)<a style="font-size: 16px;" target="_blank" href="' + this.appResources.settingsLink + '#/zonesSettings">(customize)</a>');
            } else {
                this.content += this.generateSectionTitle('Elevation stats <a style="font-size: 16px;" target="_blank" href="' + this.appResources.settingsLink + '#/zonesSettings">(customize)</a>');
            }

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

            if (this.ascentSpeed) {
                this.insertContentAtGridPosition(0, 0, this.elevationData.ascentSpeed.avg.toFixed(0), 'Avg Ascent Speed or VAM', 'Vm/h', 'displayAdvancedElevationData');

                this.insertContentAtGridPosition(0, 1, this.elevationData.ascentSpeed.lowerQuartile, '25% Quartile Ascent Speed', 'Vm/h', 'displayAdvancedElevationData');
                this.insertContentAtGridPosition(1, 1, this.elevationData.ascentSpeed.median, '50% Quartile Ascent Speed', 'Vm/h', 'displayAdvancedElevationData');
                this.insertContentAtGridPosition(2, 1, this.elevationData.ascentSpeed.upperQuartile, '75% Quartile Ascent Speed', 'Vm/h', 'displayAdvancedElevationData');
            } else {
                this.insertContentAtGridPosition(0, 0, this.elevationData.avgElevation, 'Average Elevation', 'm', 'displayAdvancedElevationData');
                this.insertContentAtGridPosition(1, 0, this.elevationData.accumulatedElevationAscent.toFixed(0), 'Ascent', 'm', 'displayAdvancedElevationData');
                this.insertContentAtGridPosition(2, 0, this.elevationData.accumulatedElevationDescent.toFixed(0), 'Descent', 'm', 'displayAdvancedElevationData');

                this.insertContentAtGridPosition(0, 1, this.elevationData.lowerQuartileElevation, '25% Quartile Elevation', 'm', 'displayAdvancedElevationData');
                this.insertContentAtGridPosition(1, 1, this.elevationData.medianElevation, '50% Quartile Elevation', 'm', 'displayAdvancedElevationData');
                this.insertContentAtGridPosition(2, 1, this.elevationData.upperQuartileElevation, '75% Quartile Elevation', 'm', 'displayAdvancedElevationData');            
            }
        }
    }
});
