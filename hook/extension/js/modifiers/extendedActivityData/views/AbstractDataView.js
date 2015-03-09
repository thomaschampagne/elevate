var AbstractDataView = Fiber.extend(function(base) {

    return {

        viewId: null,

        content: '',

        grid: null,

        graph: null,

        graphData: null,

        graphUnits: '',

        table: null,

        init: function() {
            console.log('AbstractDataView::init');
        },

        setViewId: function(id) {
            this.viewId = id;
        },

        render: function() {
            console.log('AbstractDataView::render');
        },

        getContent: function() {
            return this.content;
        },

        generateSectionTitle: function(title) {
            return "<h3>" + title + "</h3>"
        },

        generateCanvasForGraph: function() {
            var graph = '';
            graph += '<div>';
            graph += '<div style="display: inline-block;">';
            graph += '<canvas id="' + this.viewId + '" height="500" width="500"></canvas>';
            graph += '</div>';
            graph += '</div>';
            this.graph = jQuery(graph);

        },

        setupDistributionGraph: function(zones, units, rgbArray) {

            this.graphUnits = units;

            var labelsData = [];
            for (var zone in zones) {
                var label = zones[zone].from.toFixed(1) + " - " + zones[zone].to.toFixed(1) + " " + this.graphUnits;
                labelsData.push(label);
            }

            var distributionArray = [];
            for (var zone in zones) {
                distributionArray.push((zones[zone].s / 60).toFixed(0));
            }

            this.graphData = {
                labels: labelsData,
                datasets: [{
                    label: "Distribution",
                    fillColor: "rgba(" + rgbArray[0] + ", " + rgbArray[1] + ", " + rgbArray[2] + ", 0.5)",
                    strokeColor: "rgba(" + rgbArray[0] + ", " + rgbArray[1] + ", " + rgbArray[2] + ", 0.8)",
                    highlightFill: "rgba(" + rgbArray[0] + ", " + rgbArray[1] + ", " + rgbArray[2] + ", 0.75)",
                    data: distributionArray
                }]
            };
        },

        displayGraph: function() {

            if (!this.viewId) {
                console.error('View Id must exist in ' + typeof this);
                return;
            }

            // Generating the chart
            var chart = new Chart(document.getElementById(this.viewId).getContext("2d")).Bar(this.graphData, { // TODO canvas id must be specific to view
                barShowStroke: false,
                scaleGridLineColor: "rgba(0,0,0,.05)",
                showTooltips: true,
                tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %> Minutes"
            });

        },

        setupDistributionTable: function(zones, units) {

            var table = '';
            table += '<div>';
            table += '<div style="display: inline-block;">';
            table += '<table>';

            // Generate table header
            table += '<tr>'; // Zone
            table += '<td>Zone</td>'; // Zone
            table += '<td>' + units + '</td>'; // bpm
            table += '<td>Time</br>(hh:mm:ss)</td>'; // Time
            table += '<td>% in zone</td>'; // % in zone
            table += '</tr>';

            var zoneId = 1;
            for (var zone in zones) {
                table += '<tr>'; // Zone
                table += '<td>Z' + zoneId + '</td>'; // Zone
                table += '<td>' + zones[zone].from.toFixed(1) + ' ' + units + ' - ' + zones[zone].to.toFixed(1) + ' ' + units + '</th>'; // %HRR
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

        makeGrid: function(columns, rows) {

            var grid = '';
            grid += '<div>';
            grid += '<div style="display: inline-block;">';
            grid += '<table>';

            for (var i = 0; i < rows; i++) {
                grid += '<tr>';
                for (var j = 0; j < columns; j++) {
                    grid += '<td data-column="' + j + '" data-row="' + i + '">';
                    grid += 'data'; // place data here
                    grid += '</td>';
                }
                grid += '</tr>';
            }
            grid += '</table>';
            grid += '</div>';
            grid += '</div>';
            this.grid = jQuery(grid);
        },

        insertContentAtGridPosition: function(columnId, rowId, content) {

            if (this.grid) {
                this.grid.find('[data-column=' + columnId + '][data-row=' + rowId + ']').html(content);
            } else {
                console.error('Grid is not initialized');
            }
        }
    }
});
