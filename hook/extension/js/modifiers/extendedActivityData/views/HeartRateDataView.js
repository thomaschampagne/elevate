var HeartRateDataView = AbstractDataView.extend(function(base) {

    return {

        heartRateData: null,

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
            table += '<div style="display: inline-block;">';
            table += '<table>';

            table += '<tr>'; // Zone
            table += '<td>Zone</td>'; // Zone
            table += '<td>%HRR</td>'; // %HRR
            table += '<td>BPM</td>'; // bpm
            table += '<td>Time</br>(hh:mm:ss)</td>'; // Time
            table += '<td>% in zone</td>'; // % in zone
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
                    fillColor: "rgba(255, 43, 66,0.5)",
                    strokeColor: "rgba(255, 43, 66,0.8)",
                    highlightFill: "rgba(255, 43, 66,0.75)",
                    highlightStroke: "rgba(255, 43, 66,1)",
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

            // Creates a grid
            this.makeGrid(3, 3); // (col, row)

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
            this.insertContentAtGridPosition(0, 0, '29');
            this.insertContentAtGridPosition(1, 0, '243');
            this.insertContentAtGridPosition(2, 0, '776');

            this.insertContentAtGridPosition(0, 1, '29');
            this.insertContentAtGridPosition(1, 1, '100');
            this.insertContentAtGridPosition(2, 1, '300');
        }
    }
});
