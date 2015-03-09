var SpeedDataView = AbstractDataView.extend(function(base) {

    return {

        speedData: null,

        init: function(speedData) {

            console.log('SpeedDataView::init');

            base.init.call(this);

            this.speedData = speedData;

            this.setupDistributionGraph(this.speedData.speedZones, 'kph', [9, 123, 219]);

            this.setupDistributionTable(this.speedData.speedZones, 'kph');

        },

        render: function() {

            console.log('SpeedDataView::render');

            // Super render () call
            base.render.call(this);

            this.setViewId('SpeedDataView_4smf8s7aG7ss1a');

            // Add a title
            this.content += this.generateSectionTitle('Speed Data');

            // Creates a grid
            this.makeGrid(3, 2); // (col, row)

            this.insertSpeedDataIntoGrid();
            this.generateCanvasForGraph();


            // Push grid, graph and table to content view
            this.content += this.grid.html();
            this.content += this.graph.html();
            this.content += this.table.html();

            console.debug(this.content);
        },


        insertSpeedDataIntoGrid: function() {

            // Quartiles
            this.insertContentAtGridPosition(0, 0, this.speedData.lowerQuartileSpeed, '25% Quartile Speed', 'Kph');
            this.insertContentAtGridPosition(1, 0, this.speedData.medianSpeed, '50% Quartile Speed', 'Kph');
            this.insertContentAtGridPosition(2, 0, this.speedData.upperQuartileSpeed, '75% Quartile Speed', 'Kph');

            // Insert some data inside grid
            this.insertContentAtGridPosition(0, 1, '29', '', ''); // Pace
            this.insertContentAtGridPosition(1, 1, '243', '', ''); // Standard deviation speed
            this.insertContentAtGridPosition(2, 1, '776', '', ''); // Move ratio
        }
    }
});
