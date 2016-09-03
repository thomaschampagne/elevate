var RunningCadenceDataView = AbstractCadenceDataView.extend(function(base) {

    return {

        mainColor: [213, 0, 195],

        init: function(cadenceData, units, userSettings) {

            this.setViewId('RunningCadenceDataView_dhgfj56ds4');

            this.units = units;
            this.setGraphTitleFromUnits(this.units);

            this.userSettings = userSettings;

            if (this.userSettings.enableBothLegsCadence) {

                var cadenceDataClone = $.extend(true, {}, cadenceData); // Create a deep clone in memory to avoid values doubled on each reload

                // Then multiply cadence per 2
                cadenceDataClone.averageCadenceMoving *= 2;
                cadenceDataClone.lowerQuartileCadence *= 2;
                cadenceDataClone.medianCadence *= 2;
                cadenceDataClone.upperQuartileCadence *= 2;

                for (var zone in cadenceDataClone.cadenceZones) {
                    cadenceDataClone.cadenceZones[zone].from *= 2;
                    cadenceDataClone.cadenceZones[zone].to *= 2;
                }

                base.init.call(this, cadenceDataClone);

            } else {
                base.init.call(this, cadenceData);
            }

        },

        render: function() {

            // Add legs cadence type to view title
            this.viewTitle += '<img src="' + this.appResources.circleNotchIcon + '" style="vertical-align: baseline; height:20px;"/> CADENCE @ ' + ((this.userSettings.enableBothLegsCadence) ? '2 legs' : '1 leg') + ' <a target="_blank" href="' + this.appResources.settingsLink + '#/zonesSettings/runningCadence" style="float: right;margin-right: 10px;"><img src="' + this.appResources.cogIcon + '" style="vertical-align: baseline; height:20px;"/></a>';

            // Call super AbstractCadenceDataView.render()
            base.render.call(this);

            // Creates a grid
            this.makeGrid(3, 2); // (col, row)

            this.insertCadenceDataIntoGrid();
            this.generateCanvasForGraph();

            // Push grid, graph and table to content view
            this.content += this.grid.html();
            this.content += this.graph.html();
            this.content += this.table.html();

        },

        insertCadenceDataIntoGrid: function() {

            this.insertContentAtGridPosition(0, 0, this.cadenceData.averageCadenceMoving.toFixed(1), 'Average Cadence', this.units, 'displayCadenceData');

            this.insertContentAtGridPosition(0, 1, this.cadenceData.lowerQuartileCadence, '25% Quartile Cadence', this.units, 'displayCadenceData');
            this.insertContentAtGridPosition(1, 1, this.cadenceData.medianCadence, '50% Quartile Cadence', this.units, 'displayCadenceData');
            this.insertContentAtGridPosition(2, 1, this.cadenceData.upperQuartileCadence, '75% Quartile Cadence', this.units, 'displayCadenceData');

            // this.insertContentAtGridPosition(0, 1, this.cadenceData.crankRevolutions.toFixed(0), 'Total Stride', '', 'displayCadenceData'); // DELAYED_FOR_TESTING
        }
    };
});
