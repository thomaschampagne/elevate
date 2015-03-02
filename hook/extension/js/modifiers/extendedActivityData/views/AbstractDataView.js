var AbstractDataView = Fiber.extend(function(base) {

    return {

        content: '',

        grid: null,

        graph: null,

        table: null,

        init: function() {
            console.log('AbstractDataView::init');
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

        generateGenericDistributionGraph: function() {
            var graph = '';
            graph += '<div>';
            graph += '<div style="display: inline-block;">';
            graph += '<canvas id="generateGenericDistributionGraph" height="300" width="400"></canvas>';
            graph += '</div>';
            graph += '</div>';
            this.graph = jQuery(graph);

        },

        displayGraph: function() {

            var data = { // TODO Data are specific to view
                labels: ["January", "February", "March", "April", "May", "June", "July"],
                datasets: [{
                    label: "My First dataset",
                    fillColor: "rgba(220,220,220,0.5)",
                    strokeColor: "rgba(220,220,220,0.8)",
                    highlightFill: "rgba(220,220,220,0.75)",
                    highlightStroke: "rgba(220,220,220,1)",
                    data: [65, 59, 80, 81, 56, 55, 40]
                }, {
                    label: "My Second dataset",
                    fillColor: "rgba(151,187,205,0.5)",
                    strokeColor: "rgba(151,187,205,0.8)",
                    highlightFill: "rgba(151,187,205,0.75)",
                    highlightStroke: "rgba(151,187,205,1)",
                    data: [28, 48, 40, 19, 86, 27, 90]
                }]
            };

            // Generating the chart
            var chart = new Chart(document.getElementById("generateGenericDistributionGraph").getContext("2d")).Bar(data, { // TODO canvas id must be specific to view
                barShowStroke: false,
                scaleGridLineColor: "rgba(0,0,0,.05)",
                showTooltips: true,
            });

        },

        generateGenericDistributionTable: function() {
            var table = '';
            table += '<div>';
            table += '<div style="display: inline-block;">';
            table += 'table here';
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
