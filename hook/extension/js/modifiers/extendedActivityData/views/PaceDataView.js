var PaceDataView = AbstractDataView.extend(function(base) {

    return {

        paceData: null,

        mainColor: [9, 123, 219],

        init: function(paceData, units) {

            this.setViewId('PaceDataView_sqfdsf584ds1a');

            base.init.call(this);

            this.units = units;
            this.setGraphTitleFromUnits(this.units);

            this.paceData = paceData;

            this.speedUnitsData = this.getSpeedUnitData();
            var speedUnitFactor = this.speedUnitsData[1];

            // To be overriden..
            this.setupDistributionGraph(this.paceData.paceZones, 1 / speedUnitFactor);
            this.setupDistributionTable(this.paceData.paceZones, 1 / speedUnitFactor);

        },

        render: function() {

            // Super render () call
            base.render.call(this);

            // Add a title
            this.content += this.generateSectionTitle('<img src="' + this.appResources.tachometerIcon + '" style="vertical-align: baseline; height:20px;"/> PACE <a target="_blank" href="' + this.appResources.settingsLink + '#/zonesSettings/pace" style="float: right;margin-right: 10px;"><img src="' + this.appResources.cogIcon + '" style="vertical-align: baseline; height:20px;"/></a>');

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
            this.insertContentAtGridPosition(0, 0, Helper.secondsToHHMMSS((this.paceData.lowerQuartilePace / speedUnitFactor).toFixed(0)).replace('00:', ''), '25% Quartile Pace', this.units, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(1, 0, Helper.secondsToHHMMSS((this.paceData.medianPace / speedUnitFactor).toFixed(0)).replace('00:', ''), '50% Quartile Pace', this.units, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(2, 0, Helper.secondsToHHMMSS((this.paceData.upperQuartilePace / speedUnitFactor).toFixed(0)).replace('00:', ''), '75% Quartile Pace', this.units, 'displayAdvancedSpeedData');

            if (this.isSegmentEffortView) {
                this.insertContentAtGridPosition(0, 1, paceTimePerDistance, 'Average pace', '/' + distanceUnits, 'displayAdvancedSpeedData');
            }
        },

        setupDistributionTable: function(zones, ratio) {

            if (!ratio) {
                ratio = 1;
            }

            if (!this.units) {
                console.error('View must have unit');
                return;
            }

            var table = '';
            table += '<div>';
            table += '<div style="height:500px; overflow:auto;">';
            table += '<table class="distributionTable">';

            // Generate table header
            table += '<tr>'; // Zone
            table += '<td>ZONE</td>'; // Zone
            table += '<td>FROM ' + this.units.toUpperCase() + '</td>'; // bpm
            table += '<td>TO ' + this.units.toUpperCase() + '</td>'; // bpm
            table += '<td>TIME</td>'; // Time
            table += '<td>% ZONE</td>'; // % in zone
            table += '</tr>';

            var zoneId = 1;
            for (var zone in zones) {

                var from = (zones[zone].from === 'infinite') ? '&infin;' : Helper.secondsToHHMMSS((zones[zone].from * ratio).toFixed(0));

                table += '<tr>'; // Zone
                table += '<td>Z' + zoneId + '</td>'; // Zone
                table += '<td>' + from + '</th>'; // %HRR
                table += '<td>' + Helper.secondsToHHMMSS((zones[zone].to * ratio).toFixed(0)) + '</th>'; // %HRR
                table += '<td>' + Helper.secondsToHHMMSS(zones[zone].s) + '</td>'; // Time%
                table += '<td>' + zones[zone].percentDistrib.toFixed(1) + '%</td>'; // % in zone
                table += '</tr>';
                zoneId++;
            }

            table += '</table>';
            table += '</div>';
            table += '</div>';
            this.table = $(table);
        },

        setupDistributionGraph: function(zones, ratio) {

            if (!ratio) {
                ratio = 1;
            }

            var labelsData = [];
            var zone;
            for (zone in zones) {
                var from = (zones[zone].from === 'infinite') ? 'Infinite' : Helper.secondsToHHMMSS((zones[zone].from * ratio).toFixed(0));
                var label = "Z" + (parseInt(zone) + 1) + ": " + from + " - " + Helper.secondsToHHMMSS((zones[zone].to * ratio).toFixed(0)) + " " + this.units;
                labelsData.push(label);
            }

            var distributionArray = [];
            for (zone in zones) {
                distributionArray.push((zones[zone].s / 60).toFixed(2));
            }

            // Update labels
            this.graphData = {
                labels: labelsData,
                datasets: [{
                    label: this.graphTitle,
                    backgroundColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.5)",
                    borderColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 1)",
                    borderWidth: 1,
                    hoverBackgroundColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.8)",
                    hoverBorderColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 1)",
                    data: distributionArray
                }]
            };
        }
    };
});
