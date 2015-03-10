var HeartRateDataView = AbstractDataView.extend(function(base) {

    return {

        heartRateData: null,

        mainColor: [255, 43, 66],

        init: function(heartRateData) {

            console.log('HeartRateDataView::init');

            base.init.call(this);

            this.heartRateData = heartRateData;

            this.setupDistributionTable();

        },


        setupDistributionTable: function() {

            console.debug('override setupDistributionTable() function for HeartRate view');

            var table = '';
            table += '<div>';
            table += '<div class="distributionTable">';
            table += '<table>';

            table += '<tr>'; // Zone
            table += '<td><strong>Zone</strong></td>'; // Zone
            table += '<td><strong>%HRR</strong></td>'; // bpm
            table += '<td><strong>BPM</strong></td>'; // bpm
            table += '<td><strong>Time<br/>(hh:mm:ss)</strong></td>'; // Time
            table += '<td><strong>% in zone</strong></td>'; // % in zone
            table += '</tr>';

            var zoneId = 1;
            for (var zone in this.heartRateData.hrrZones) {
                table += '<tr>'; // Zone
                table += '<td>Z' + zoneId + '</td>'; // Zone
                table += '<td>' + this.heartRateData.hrrZones[zone].fromHrr + "% - " + this.heartRateData.hrrZones[zone].toHrr + "%" + '</th>'; // %HRR
                table += '<td>' + this.heartRateData.hrrZones[zone].fromHr + " - " + this.heartRateData.hrrZones[zone].toHr + '</td>'; // bpm%
                table += '<td>' + Helper.secondsToHHMMSS(this.heartRateData.hrrZones[zone].s) + '</td>'; // Time%
                table += '<td>' + this.heartRateData.hrrZones[zone].percentDistrib.toFixed(0) + '%</td>'; // % in zone
                table += '</tr>';
                zoneId++;
            }

            table += '</table>';
            table += '</div>';
            table += '</div>';
            this.table = jQuery(table);

        },

        displayGraph: function() {

            console.debug('override displayGraph() function for HeartRate view');

            var labelsData = [];
            for (var zone in this.heartRateData.hrrZones) {
                var label = "Z" + (parseInt(zone) + 1) + " " + this.heartRateData.hrrZones[zone].fromHrr + "% - " + this.heartRateData.hrrZones[zone].toHrr + "%";
                labelsData.push(label);
            }

            var hrDistributionInMinutesArray = [];
            for (var zone in this.heartRateData.hrrZones) {
                hrDistributionInMinutesArray.push((this.heartRateData.hrrZones[zone].s / 60).toFixed(0));
            }

            this.graphData = {
                labels: labelsData,
                datasets: [{
                    label: "Heart Rate Reserve Distribution",
                    fillColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.5)",
                    strokeColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.8)",
                    highlightFill: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.75)",
                    highlightFill: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 1)",
                    data: hrDistributionInMinutesArray
                }]
            };

            // Generating the chart
            var chart = new Chart(document.getElementById(this.viewId).getContext("2d")).Bar(this.graphData, { // TODO canvas id must be specific to view
                barShowStroke: false,
                scaleGridLineColor: "rgba(0,0,0,.05)",
                showTooltips: true,
                tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %> Minutes"
            });
        },

        render: function() {

            console.log('HeartRateDataView::render');

            base.render.call(this);

            this.setViewId('HeartRateDataView_i79a78d98s9a7g7');

            // Add a title
            this.content += this.generateSectionTitle('HeartRate Data');

            this.setGraphTitle('Heart Rate Reserve distributon over ' + this.heartRateData.hrrZones.length + ' zones / <a target="_blank" href="' + this.appResources.settingsLink + '#/healthSettings">Customize</a>');

            // Creates a grid
            this.makeGrid(3, 2); // (col, row)

            this.insertSpeedDataIntoGrid();
            this.generateCanvasForGraph();
            this.setupDistributionTable();

            // Push grid, graph and table to content view
            this.content += this.grid.html();
            this.content += this.graph.html();
            this.content += this.table.html();
        },

        insertSpeedDataIntoGrid: function() {

            // Insert some data inside grid
            this.insertContentAtGridPosition(0, 0, this.heartRateData.TRIMP.toFixed(0), 'TRaining IMPulse', '', 'displayAdvancedHrData');
            this.insertContentAtGridPosition(1, 0, this.heartRateData.activityHeartRateReserve, '%Heart Rate Reserve Avg', '', 'displayAdvancedHrData');
            
            // Quartiles
            this.insertContentAtGridPosition(0, 1, this.heartRateData.lowerQuartileHeartRate, '25% Quartile HeartRate', 'bpm', 'displayAdvancedHrData');
            this.insertContentAtGridPosition(1, 1, this.heartRateData.medianHeartRate, '50% Quartile HeartRate', 'bpm', 'displayAdvancedHrData');
            this.insertContentAtGridPosition(2, 1, this.heartRateData.upperQuartileHeartRate, '75% Quartile HeartRate', 'bpm', 'displayAdvancedHrData');
        }
    }
});
