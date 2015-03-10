var SpeedDataView = AbstractDataView.extend(function(base) {

    return {

        speedData: null,

        mainColor: [9, 123, 219],

        init: function(speedData) {

            console.log('SpeedDataView::init');

            base.init.call(this);

            this.speedData = speedData;

            this.setupDistributionGraph(this.speedData.speedZones, 'kph');

            this.setupDistributionTable(this.speedData.speedZones, 'kph');

        },

        render: function() {

            console.log('SpeedDataView::render');

            // Super render () call
            base.render.call(this);

            this.setViewId('SpeedDataView_4smf8s7aG7ss1a');

            // Add a title
            this.content += this.generateSectionTitle('Speed Data');

            this.setGraphTitle('Speed distributon over ' + this.speedData.speedZones.length + ' zones');

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

            var measurementPreference = currentAthlete.get('measurement_preference');
            var units = (measurementPreference == 'meters') ? 'km' : 'mi';
            var speedUnitPerhour = (measurementPreference == 'meters') ? 'km/h' : 'mi/h';
            var speedUnitFactor = (speedUnitPerhour == 'km/h') ? 1 : 0.62137;


            var paceTimePerDistance = Helper.secondsToHHMMSS(this.speedData.avgPace / speedUnitFactor);
            paceTimePerDistance = paceTimePerDistance.replace('00:', '');

            // Quartiles
            this.insertContentAtGridPosition(0, 0, (this.speedData.lowerQuartileSpeed * speedUnitFactor).toFixed(1), '25% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(1, 0, (this.speedData.medianSpeed * speedUnitFactor).toFixed(1), '50% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(2, 0, (this.speedData.upperQuartileSpeed * speedUnitFactor).toFixed(1), '75% Quartile Speed', speedUnitPerhour, 'displayAdvancedSpeedData');

            // Insert some data inside grid
            this.insertContentAtGridPosition(0, 1, paceTimePerDistance, 'Activity Pace', '/' + units, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(1, 1, (this.speedData.standardDeviationSpeed * speedUnitFactor).toFixed(1), 'Std Deviation &sigma;', speedUnitPerhour, 'displayAdvancedSpeedData');  
        }
    }
});
