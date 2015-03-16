var PaceDataView = AbstractDataView.extend(function(base) {

    return {

        paceData: null,

        mainColor: [9, 123, 219],

        init: function(paceData, units) {

            this.setViewId('PaceDataView_sqfdsf584ds1a');

            base.init.call(this);

            this.units = units;

            this.paceData = paceData;

            this.speedUnitsData = this.getSpeedUnitData();
            var speedUnitFactor = this.speedUnitsData[1];

            this.setupDistributionGraph(this.paceData.paceZones, speedUnitFactor);
            this.setupDistributionTable(this.paceData.paceZones, speedUnitFactor);

        },

        render: function() {

            // Super render () call
            base.render.call(this);

            // Add a title
            this.content += this.generateSectionTitle('Pace stats');

            this.setGraphTitle('Pace distribution over ' + this.paceData.paceZones.length + ' zones');

            // Creates a grid
            this.makeGrid(3, 2); // (col, row)

            this.insertPaceDataIntoGrid();
            this.generateCanvasForGraph();


            // Push grid, graph and table to content view
            this.content += this.grid.html();
            this.content += this.graph.html();
            this.content += this.table.html();
        },

        insertPaceDataIntoGrid: function() {

            var speedUnitPerhour = this.speedUnitsData[0];
            var speedUnitFactor = this.speedUnitsData[1];
            var distanceUnits = this.speedUnitsData[2];

            var paceTimePerDistance = Helper.secondsToHHMMSS(this.paceData.avgPace / speedUnitFactor);
            paceTimePerDistance = paceTimePerDistance.replace('00:', '');

            // Quartiles
            this.insertContentAtGridPosition(0, 0, (this.paceData.lowerQuartileSpeed * speedUnitFactor).toFixed(1), '25% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(1, 0, (this.paceData.medianSpeed * speedUnitFactor).toFixed(1), '50% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(2, 0, (this.paceData.upperQuartileSpeed * speedUnitFactor).toFixed(1), '75% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData');

            this.insertContentAtGridPosition(0, 1, (this.paceData.standardDeviationSpeed * speedUnitFactor).toFixed(1), 'Std Deviation &sigma;', speedUnitPerhour, 'displayAdvancedSpeedData');
            // this.insertContentAtGridPosition(1, 1, (this.paceData.genuineAvgSpeed * speedUnitFactor).toFixed(1), 'Genuine average speed', speedUnitPerhour, 'displayAdvancedSpeedData'); // DELAYED_FOR_TESTING
            // this.insertContentAtGridPosition(2, 1, paceTimePerDistance, 'Genuine average pace', '/' + distanceUnits, 'displayAdvancedSpeedData'); // DELAYED_FOR_TESTING
        }
    }
});
