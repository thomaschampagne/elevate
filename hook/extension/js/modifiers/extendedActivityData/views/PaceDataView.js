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

            // To be overriden..
            this.setupDistributionGraph(this.paceData.paceZones, 1 / speedUnitFactor);
            this.setupDistributionTable(this.paceData.paceZones, 1 / speedUnitFactor);

        },

        render: function() {

            // Super render () call
            base.render.call(this);

            // Add a title
            this.content += this.generateSectionTitle('Pace stats');

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

            // Quartiles
            this.insertContentAtGridPosition(0, 0, Helper.secondsToHHMMSS((this.paceData.lowerQuartilePace / speedUnitFactor).toFixed(0)).replace('00:', ''), '25% Quartile Pace', this.units, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(1, 0, Helper.secondsToHHMMSS((this.paceData.medianPace / speedUnitFactor).toFixed(0)).replace('00:', ''), '50% Quartile Pace', this.units, 'displayAdvancedSpeedData');
            this.insertContentAtGridPosition(2, 0, Helper.secondsToHHMMSS((this.paceData.upperQuartilePace / speedUnitFactor).toFixed(0)).replace('00:', ''), '75% Quartile Pace', this.units, 'displayAdvancedSpeedData');

            var standardDeviationPace;
            if (this.paceData.standardDeviationPace === 'infinite') {
                standardDeviationPace = '&infin;';
            } else {
                standardDeviationPace = Helper.secondsToHHMMSS((this.paceData.standardDeviationPace / speedUnitFactor).toFixed(0)).replace('00:', '')
            }

            this.insertContentAtGridPosition(0, 1, standardDeviationPace, 'Std Deviation &sigma;', this.units, 'displayAdvancedSpeedData');
            // this.insertContentAtGridPosition(1, 1, (this.paceData.genuineAvgSpeed * speedUnitFactor).toFixed(1), 'Genuine average speed', speedUnitPerhour, 'displayAdvancedSpeedData'); // DELAYED_FOR_TESTING
            // this.insertContentAtGridPosition(2, 1, paceTimePerDistance, 'Genuine average pace', '/' + distanceUnits, 'displayAdvancedSpeedData'); // DELAYED_FOR_TESTING

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
            table += '<div>';
            table += '<table class="distributionTable">';

            // Generate table header
            table += '<tr>'; // Zone
            table += '<td><strong>Zone</strong></td>'; // Zone
            table += '<td><strong>From<br/>Time' + this.units.toUpperCase() + '</strong></td>'; // bpm
            table += '<td><strong>To<br/>Time' + this.units.toUpperCase() + '</strong></td>'; // bpm
            table += '<td><strong>Time<br/>(hh:mm:ss)</strong></td>'; // Time
            table += '<td><strong>% in zone</strong></td>'; // % in zone
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
            this.table = jQuery(table);
        },

        setupDistributionGraph: function(zones, ratio) {

            if (!ratio) {
                ratio = 1;
            }

            var labelsData = [];
            for (var zone in zones) {
                var from = (zones[zone].from === 'infinite') ? 'Infinite' : Helper.secondsToHHMMSS((zones[zone].from * ratio).toFixed(0));
                var label = "Z" + (parseInt(zone) + 1) + ": " + from + " - " + Helper.secondsToHHMMSS((zones[zone].to * ratio).toFixed(0)) + " " + this.units;
                labelsData.push(label);
            }

            var distributionArray = [];
            for (var zone in zones) {
                distributionArray.push((zones[zone].s / 60).toFixed(2));
            }

            this.graphData = {
                labels: labelsData,
                datasets: [{
                    label: "Distribution",
                    fillColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.5)",
                    strokeColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.8)",
                    highlightFill: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.75)",
                    data: distributionArray
                }]
            };
        }
    }
});
