var HeartRateDataView = AbstractDataView.extend(function(base) {

    return {

        heartRateData: null,

        init: function(heartRateData) {

            console.log('HeartRateDataView::init');

            base.init.call(this);

            this.heartRateData = heartRateData;


        },

        displayGraph: function() {
            console.warn('overidden function');

            // TMP GRAPH
            this.graphData = { // TODO Data are specific to view
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
            var chart = new Chart(document.getElementById(this.viewId).getContext("2d")).Bar(this.graphData, { // TODO canvas id must be specific to view
                barShowStroke: false,
                scaleGridLineColor: "rgba(0,0,0,.05)",
                showTooltips: true,
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
            this.generateGenericDistributionTable();

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
