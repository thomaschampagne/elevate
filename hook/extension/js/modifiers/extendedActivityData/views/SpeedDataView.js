var SpeedDataView = AbstractDataView.extend(function(base) {

    return {

        speedData: null,

        mainColor: [9, 123, 219],

        init: function(speedData, units) {

            console.log('SpeedDataView::init');

            base.init.call(this);

            this.units = units;

            this.speedData = speedData;

            this.setupDistributionGraph(this.speedData.speedZones);

            this.setupDistributionTable(this.speedData.speedZones);

        },

        render: function() {

            console.log('SpeedDataView::render');

            // Super render () call
            base.render.call(this);

            this.setViewId('SpeedDataView_4smf8s7aG7ss1a');

            // Add a title
            this.content += this.generateSectionTitle('Speed stats');

            this.setGraphTitle('Speed distribution over ' + this.speedData.speedZones.length + ' zones');

            // Creates a grid
            this.makeGrid(3, 2); // (col, row)

            this.insertSpeedDataIntoGrid();
            this.generateCanvasForGraph();


            // Push grid, graph and table to content view
            this.content += this.grid.html();
            this.content += this.graph.html();
            this.content += this.table.html();
        },

        insertSpeedDataIntoGrid: function() {

            var speedUnitsData = this.getSpeedUnitData();
            var speedUnitPerhour = speedUnitsData[0];
            var speedUnitFactor = speedUnitsData[1];
            var distanceUnits = speedUnitsData[2];


            var paceTimePerDistance = Helper.secondsToHHMMSS(this.speedData.avgPace / speedUnitFactor);
            paceTimePerDistance = paceTimePerDistance.replace('00:', '');

            // Quartiles
            this.insertContentAtGridPosition(0, 0, (this.speedData.lowerQuartileSpeed * speedUnitFactor).toFixed(1), '25% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(1, 0, (this.speedData.medianSpeed * speedUnitFactor).toFixed(1), '50% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(2, 0, (this.speedData.upperQuartileSpeed * speedUnitFactor).toFixed(1), '75% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData');

            this.insertContentAtGridPosition(0, 1, (this.speedData.standardDeviationSpeed * speedUnitFactor).toFixed(1), 'Std Deviation &sigma;', speedUnitPerhour, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(1, 1, (this.speedData.genuineAvgSpeed * speedUnitFactor).toFixed(1), 'Genuine average speed', speedUnitPerhour, 'displayAdvancedSpeedData'); // DELAYED_FOR_TESTING
            this.insertContentAtGridPosition(2, 1, paceTimePerDistance, 'Genuine average pace', '/' + distanceUnits, 'displayAdvancedSpeedData'); // DELAYED_FOR_TESTING
        }
    }
});
