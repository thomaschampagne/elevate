var SpeedDataView = AbstractDataView.extend(function(base) {

    return {

        speedData: null,

        mainColor: [9, 123, 219],

        init: function(speedData, units) {

            this.setViewId('SpeedDataView_4smf8s7aG7ss1a');

            base.init.call(this);

            this.units = units;
            this.setGraphTitleFromUnits(this.units);

            this.speedData = speedData;

            this.speedUnitsData = this.getSpeedUnitData();
            var speedUnitFactor = this.speedUnitsData[1];

            this.setupDistributionGraph(this.speedData.speedZones, speedUnitFactor);
            this.setupDistributionTable(this.speedData.speedZones, speedUnitFactor);

        },

        render: function() {

            // Super render () call
            base.render.call(this);

            // Add a title
            this.content += this.generateSectionTitle('<img src="' + this.appResources.tachometerIcon + '" style="vertical-align: baseline; height:20px;"/> SPEED <a target="_blank" href="' + this.appResources.settingsLink + '#/zonesSettings/speed" style="float: right;margin-right: 10px;"><img src="' + this.appResources.cogIcon + '" style="vertical-align: baseline; height:20px;"/></a>');

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

            var speedUnitPerhour = this.speedUnitsData[0];
            var speedUnitFactor = this.speedUnitsData[1];
            var distanceUnits = this.speedUnitsData[2];

            var paceTimePerDistance = Helper.secondsToHHMMSS(this.speedData.avgPace / speedUnitFactor);
            paceTimePerDistance = paceTimePerDistance.replace('00:', '');

            // Quartiles
            this.insertContentAtGridPosition(0, 0, (this.speedData.lowerQuartileSpeed * speedUnitFactor).toFixed(1), '25% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(1, 0, (this.speedData.medianSpeed * speedUnitFactor).toFixed(1), '50% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(2, 0, (this.speedData.upperQuartileSpeed * speedUnitFactor).toFixed(1), '75% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData');

            this.insertContentAtGridPosition(0, 1, (this.speedData.standardDeviationSpeed * speedUnitFactor).toFixed(1), 'Std Deviation &sigma;', speedUnitPerhour, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(1, 1, (this.speedData.genuineAvgSpeed * speedUnitFactor).toFixed(1), 'Average speed', speedUnitPerhour, 'displayAdvancedSpeedData');

            if (!this.isSegmentEffortView) {
                this.insertContentAtGridPosition(2, 1, (this.speedData.totalAvgSpeed * speedUnitFactor).toFixed(1), 'Full time Avg speed', speedUnitPerhour, 'displayAdvancedSpeedData');
            }
        }
    };
});