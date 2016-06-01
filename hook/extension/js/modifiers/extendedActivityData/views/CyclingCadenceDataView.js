var CyclingCadenceDataView = AbstractCadenceDataView.extend(function(base) {

    return {

        cadenceData: null,

        mainColor: [213, 0, 195],

        init: function(cadenceData, units) {

            this.setViewId('CyclingCadenceDataView_p8a5d4gl56ds4');

            this.units = units;

            base.init.call(this, cadenceData);
        },

        render: function() {

            var transText = Helper.formatMessage(this.appResources.globalizeInstance, 'extendedStats/cycle_cad_data/section_title');
            this.viewTitle += '<img src="' + this.appResources.circleNotchIcon + '" style="vertical-align: baseline; height:20px;"/> ' + transText + ' <a target="_blank" href="' + this.appResources.settingsLink + '#/zonesSettings?selectZoneValue=cyclingCadence" style="float: right;margin-right: 10px;"><img src="' + this.appResources.cogIcon + '" style="vertical-align: baseline; height:20px;"/></a>';

            base.render.call(this);

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

            this.insertContentAtGridPosition(0, 0, this.cadenceData.cadencePercentageMoving.toFixed(2), 'Cadence % while moving', '%', 'displayCadenceData', 'extendedStats/cycle_cad_data/cad_moving');
            this.insertContentAtGridPosition(1, 0, Helper.secondsToHHMMSS(this.cadenceData.cadenceTimeMoving), 'Cadence Time while moving', '', 'displayCadenceData', 'extendedStats/cycle_cad_data/cad_time_moving');
            this.insertContentAtGridPosition(2, 0, this.cadenceData.crankRevolutions.toFixed(0), 'Crank Revolutions', '', 'displayCadenceData', 'extendedStats/cycle_cad_data/crank_rev');

            this.insertContentAtGridPosition(0, 1, this.cadenceData.lowerQuartileCadence, '25% Quartile Cadence', 'rpm', 'displayCadenceData', 'extendedStats/cycle_cad_data/quartcad', '25%');
            this.insertContentAtGridPosition(1, 1, this.cadenceData.medianCadence, '50% Quartile Cadence', 'rpm', 'displayCadenceData', 'extendedStats/cycle_cad_data/quartcad', '50%');
            this.insertContentAtGridPosition(2, 1, this.cadenceData.upperQuartileCadence, '75% Quartile Cadence', 'rpm', 'displayCadenceData', 'extendedStats/cycle_cad_data/quartcad', '75%');

            this.insertContentAtGridPosition(0, 2, this.cadenceData.standardDeviationCadence, 'Std Deviation &sigma;', 'rpm', 'displayCadenceData', 'extendedStats/speed_data/std_dev');
        }
    }
});
